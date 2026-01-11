import React, { useEffect, useRef, useState, useMemo } from "react";
import styled, { keyframes, css } from "styled-components";
import { m, AnimatePresence } from "framer-motion";
import { LOUNGE_COLORS } from "@/constants/lounge";
import {
  findAllHighlightPositions,
  mergeOverlappingPositions,
} from "./textAnchor";
import { Id } from "@/convex/_generated/dataModel";

// Emoji mapping for reaction types
const REACTION_EMOJI: Record<string, string> = {
  fire: "🔥",
  heart: "❤️",
  plus1: "👍",
  eyes: "👀",
  question: "❓",
};

interface ReactionData {
  counts: Record<string, number>;
  total: number;
}

interface Highlight {
  _id: Id<"contentHighlights">;
  highlightedText: string;
  prefix: string;
  suffix: string;
  userId: Id<"users">;
  isReactionOnly?: boolean;
  user?: {
    _id: Id<"users">;
    displayName: string;
    avatarUrl?: string;
  } | null;
}

interface HighlightOverlayProps {
  containerRef: React.RefObject<HTMLElement>;
  highlights: Highlight[];
  currentUserId?: string;
  newHighlightIds?: Set<string>;
  onHighlightClick?: (highlightId: string) => void;
  commentCounts?: Record<string, number>;
  reactionsByHighlight?: Record<string, ReactionData>;
}

const EMPTY_SET = new Set<string>();
const EMPTY_COUNTS: Record<string, number> = {};
const EMPTY_REACTIONS: Record<string, ReactionData> = {};

interface MarkPosition {
  id: string;
  ids: string[];
  top: number;
  left: number;
  width: number;
  height: number;
  isOwn: boolean;
  isNew: boolean;
  commentCount: number;
  isLastMark: boolean;
}

interface ReactionPosition {
  id: string;
  top: number; // container-relative
}

export function HighlightOverlay({
  containerRef,
  highlights,
  currentUserId,
  newHighlightIds = EMPTY_SET,
  onHighlightClick,
  commentCounts = EMPTY_COUNTS,
  reactionsByHighlight = EMPTY_REACTIONS,
}: HighlightOverlayProps) {
  const [marks, setMarks] = useState<MarkPosition[]>([]);
  const [reactionPositions, setReactionPositions] = useState<ReactionPosition[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const rafRef = useRef<number | null>(null);
  const calculationRef = useRef<number>(0);

  const highlightsRef = useRef(highlights);
  const newHighlightIdsRef = useRef(newHighlightIds);
  const commentCountsRef = useRef(commentCounts);
  const currentUserIdRef = useRef(currentUserId);
  const reactionsByHighlightRef = useRef(reactionsByHighlight);

  highlightsRef.current = highlights;
  newHighlightIdsRef.current = newHighlightIds;
  commentCountsRef.current = commentCounts;
  currentUserIdRef.current = currentUserId;
  reactionsByHighlightRef.current = reactionsByHighlight;

  const highlightKey = useMemo(
    () => highlights.map((h) => h._id.toString()).join(","),
    [highlights]
  );

  const newHighlightIdsKey = useMemo(
    () => Array.from(newHighlightIds).sort().join(","),
    [newHighlightIds]
  );

  const commentCountsKey = useMemo(
    () => JSON.stringify(commentCounts),
    [commentCounts]
  );

  const reactionsKey = useMemo(
    () => JSON.stringify(reactionsByHighlight),
    [reactionsByHighlight]
  );

  useEffect(() => {
    const container = containerRef.current;
    const allHighlights = highlightsRef.current;
    const visibleHighlights = allHighlights.filter((h) => !h.isReactionOnly);

    if (!container || allHighlights.length === 0) {
      setMarks([]);
      setReactionPositions([]);
      return;
    }

    const calculatePositions = () => {
      const allLatestHighlights = highlightsRef.current;
      const latestVisibleHighlights = allLatestHighlights.filter((h) => !h.isReactionOnly);
      const latestNewIds = newHighlightIdsRef.current;
      const latestCommentCounts = commentCountsRef.current;
      const latestUserId = currentUserIdRef.current;
      const latestReactions = reactionsByHighlightRef.current;

      const fullText = container.textContent || "";
      const containerRect = container.getBoundingClientRect();

      const allPositions = findAllHighlightPositions(
        fullText,
        allLatestHighlights.map((h) => ({
          _id: h._id.toString(),
          highlightedText: h.highlightedText,
          prefix: h.prefix,
          suffix: h.suffix,
        }))
      );

      const newReactionPositions: ReactionPosition[] = [];

      const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        null
      );

      const textNodes: Array<{ node: Text; start: number; end: number }> = [];
      let currentPos = 0;

      let node: Text | null;
      while ((node = walker.nextNode() as Text | null)) {
        const length = node.textContent?.length || 0;
        textNodes.push({
          node,
          start: currentPos,
          end: currentPos + length,
        });
        currentPos += length;
      }

      for (const [highlightId, pos] of allPositions) {
        const reactions = latestReactions[highlightId];
        if (!reactions || reactions.total === 0) continue;

        const relevantNodes = textNodes.filter(
          (tn) => tn.end > pos.start && tn.start < pos.end
        );

        if (relevantNodes.length === 0) continue;

        const range = document.createRange();
        const startNode = relevantNodes[0].node;
        const startOffset = Math.max(0, pos.start - relevantNodes[0].start);
        const endNode = relevantNodes[relevantNodes.length - 1].node;
        const endOffset = Math.min(
          endNode.textContent?.length || 0,
          pos.end - relevantNodes[relevantNodes.length - 1].start
        );

        try {
          range.setStart(startNode, startOffset);
          range.setEnd(endNode, endOffset);
        } catch {
          continue;
        }

        const rects = range.getClientRects();
        if (rects.length > 0) {
          const lastRect = rects[rects.length - 1];
          // Container-relative position (scrolls with page)
          newReactionPositions.push({
            id: highlightId,
            top: lastRect.top - containerRect.top + lastRect.height / 2,
          });
        }
      }

      setReactionPositions(newReactionPositions);

      const visiblePositions = findAllHighlightPositions(
        fullText,
        latestVisibleHighlights.map((h) => ({
          _id: h._id.toString(),
          highlightedText: h.highlightedText,
          prefix: h.prefix,
          suffix: h.suffix,
        }))
      );

      if (visiblePositions.size === 0) {
        setMarks([]);
        return;
      }

      const positionsArray = Array.from(visiblePositions.entries()).map(
        ([id, pos]) => ({ id, position: pos })
      );
      const merged = mergeOverlappingPositions(positionsArray);

      const newMarks: MarkPosition[] = [];

      for (const segment of merged) {
        const { ids, start, end } = segment;

        const segmentNodes = textNodes.filter(
          (tn) => tn.end > start && tn.start < end
        );

        if (segmentNodes.length === 0) continue;

        const markRange = document.createRange();

        const markStartNode = segmentNodes[0].node;
        const markStartOffset = Math.max(0, start - segmentNodes[0].start);

        const markEndNode = segmentNodes[segmentNodes.length - 1].node;
        const markEndOffset = Math.min(
          markEndNode.textContent?.length || 0,
          end - segmentNodes[segmentNodes.length - 1].start
        );

        try {
          markRange.setStart(markStartNode, markStartOffset);
          markRange.setEnd(markEndNode, markEndOffset);
        } catch {
          continue;
        }

        const markRects = markRange.getClientRects();

        const validRects: DOMRect[] = [];
        for (let i = 0; i < markRects.length; i++) {
          const rect = markRects[i];
          if (rect.width >= 2 && rect.height >= 2) {
            validRects.push(rect);
          }
        }

        for (let i = 0; i < validRects.length; i++) {
          const rect = validRects[i];
          const isLastMark = i === validRects.length - 1;

          const isOwn = ids.some((id) => {
            const highlight = latestVisibleHighlights.find((h) => h._id.toString() === id);
            return highlight?.userId.toString() === latestUserId;
          });

          const isNew = ids.some((id) => latestNewIds.has(id));

          const commentCount = ids.reduce(
            (sum, id) => sum + (latestCommentCounts[id] || 0),
            0
          );

          newMarks.push({
            id: `${ids.join("-")}-${i}`,
            ids,
            top: rect.top - containerRect.top,
            left: rect.left - containerRect.left,
            width: rect.width,
            height: rect.height,
            isOwn,
            isNew,
            commentCount,
            isLastMark,
          });
        }
      }

      setMarks(newMarks);
    };

    calculationRef.current++;
    const currentCalculation = calculationRef.current;

    const initialTimeout = setTimeout(() => {
      if (currentCalculation === calculationRef.current) {
        calculatePositions();
      }
    }, 100);

    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(calculatePositions, 100);
    };

    window.addEventListener("resize", handleResize);
    // NOTE: We intentionally do NOT listen to scroll events here.
    // Highlight positions are calculated relative to the container, and since
    // the overlay is positioned absolutely within the container, positions
    // don't need to change on scroll - they scroll together naturally.
    // A previous scroll handler here was causing severe performance issues
    // by recalculating all positions on every scroll event.

    document.fonts.ready.then(() => {
      if (currentCalculation === calculationRef.current) {
        calculatePositions();
      }
    });

    // NOTE: We do NOT use a MutationObserver here.
    // The MDX content is static after initial render, and watching for mutations
    // caused an infinite loop: our overlay marks would trigger the observer,
    // which recalculated positions, which updated marks, triggering the observer again.
    // Positions are recalculated on: mount, resize, font load, and when highlight data changes.

    return () => {
      clearTimeout(initialTimeout);
      clearTimeout(resizeTimeout);
      window.removeEventListener("resize", handleResize);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [highlightKey, newHighlightIdsKey, commentCountsKey, reactionsKey, containerRef]);

  // Process reaction positions: offset overlapping ones HORIZONTALLY (to the right)
  const processedReactionPositions = useMemo(() => {
    const withReactions = reactionPositions.filter((pos) => {
      const reactions = reactionsByHighlight[pos.id];
      return reactions && reactions.total > 0;
    });

    // Sort by top position
    const sorted = [...withReactions].sort((a, b) => a.top - b.top);

    // Offset overlapping reactions HORIZONTALLY (within 30px vertically)
    const result: Array<ReactionPosition & { horizontalOffset: number }> = [];
    for (const pos of sorted) {
      // Find how many previous reactions are within 30px vertically
      let horizontalOffset = 0;
      for (const prev of result) {
        if (Math.abs(prev.top - pos.top) < 30) {
          horizontalOffset = Math.max(horizontalOffset, prev.horizontalOffset + 50);
        }
      }
      result.push({ ...pos, horizontalOffset });
    }

    return result;
  }, [reactionPositions, reactionsByHighlight]);

  if (marks.length === 0 && processedReactionPositions.length === 0) return null;

  return (
    <OverlayContainer>
      {/* Highlight marks */}
      {marks.map((mark) => (
        <HighlightMark
          key={mark.id}
          data-highlight-id={mark.ids[0]}
          data-highlight-ids={mark.ids.join(",")}
          style={{
            top: mark.top,
            left: mark.left,
            width: mark.width,
            height: mark.height,
          }}
          $isOwn={mark.isOwn}
          $isNew={mark.isNew}
          $isHovered={mark.ids.some((id) => id === hoveredId)}
          onMouseEnter={() => setHoveredId(mark.ids[0])}
          onMouseLeave={() => setHoveredId(null)}
          onClick={() => onHighlightClick?.(mark.ids[0])}
        >
          {mark.commentCount > 0 && mark.isLastMark && mark.ids[0] === hoveredId && (
            <CommentBadge>{mark.commentCount}</CommentBadge>
          )}
        </HighlightMark>
      ))}

      {/* Reaction gutter - absolute positioned, scrolls with content */}
      <GutterContainer>
        <AnimatePresence>
          {processedReactionPositions.map((pos) => {
            const reactions = reactionsByHighlight[pos.id];
            if (!reactions) return null;

            // Get top 5 emojis
            const topEmojis = Object.entries(reactions.counts)
              .filter(([, count]) => count > 0)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([type]) => type);

            return (
              <ReactionCluster
                key={pos.id}
                style={{
                  top: pos.top,
                  left: pos.horizontalOffset, // Offset to the RIGHT if overlapping
                }}
                onClick={() => onHighlightClick?.(pos.id)}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                whileTap={{ scale: 0.95 }}
                title={`${reactions.total} reaction${reactions.total !== 1 ? "s" : ""}`}
              >
                <EmojiStack>
                  {topEmojis.map((type, index) => (
                    <Emoji key={type} data-index={index}>
                      {REACTION_EMOJI[type]}
                    </Emoji>
                  ))}
                </EmojiStack>
              </ReactionCluster>
            );
          })}
        </AnimatePresence>
      </GutterContainer>
    </OverlayContainer>
  );
}

const OverlayContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
  overflow: visible;
`;

const highlightPulse = keyframes`
  0% { background-color: rgba(144, 116, 242, 0.5); }
  100% { background-color: rgba(144, 116, 242, 0.2); }
`;

const highlightFlash = keyframes`
  0%, 100% { background-color: rgba(144, 116, 242, 0.25); }
  25% { background-color: rgba(144, 116, 242, 0.7); box-shadow: 0 0 12px rgba(144, 116, 242, 0.5); }
  50% { background-color: rgba(144, 116, 242, 0.4); }
  75% { background-color: rgba(144, 116, 242, 0.6); box-shadow: 0 0 8px rgba(144, 116, 242, 0.4); }
`;

const HighlightMark = styled.div<{
  $isOwn: boolean;
  $isNew: boolean;
  $isHovered: boolean;
}>`
  position: absolute;
  pointer-events: auto;
  cursor: pointer;
  border-radius: 2px;
  transition: background-color 0.15s ease;

  background-color: ${(props) => {
    if (props.$isHovered) return "rgba(144, 116, 242, 0.35)";
    if (props.$isOwn) return "rgba(144, 116, 242, 0.25)";
    return "rgba(144, 116, 242, 0.15)";
  }};

  ${(props) =>
    props.$isNew &&
    css`
      animation: ${highlightPulse} 0.6s ease-out;
    `}

  &:hover {
    background-color: rgba(144, 116, 242, 0.35);
  }

  &.highlight-flash {
    animation: ${highlightFlash} 1.5s ease-in-out;
  }
`;

const CommentBadge = styled.span`
  position: absolute;
  top: -8px;
  right: -8px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: ${LOUNGE_COLORS.tier1};
  color: white;
  font-size: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

// Gutter positioned to the right of content
const GutterContainer = styled.div`
  position: absolute;
  top: -16px;
  bottom: 0;
  left: 100%;
  width: 120px;
  margin-left: 20px;
  pointer-events: none;

  @media (max-width: 1100px) {
    display: none;
  }
`;

const EmojiStack = styled.div`
  display: flex;
  align-items: center;
  flex-direction: row;
`;

const Emoji = styled.span`
  font-size: 18px;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(30, 27, 45, 0.9);
  border: 2px solid rgba(144, 116, 242, 0.3);
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);

  /* Overlap: each emoji shifts left over the previous */
  &[data-index="1"] { margin-left: -12px; }
  &[data-index="2"] { margin-left: -14px; }
  &[data-index="3"] { margin-left: -16px; opacity: 0; pointer-events: none; }
  &[data-index="4"] { margin-left: -18px; opacity: 0; pointer-events: none; }
`;

const ReactionCluster = styled(m.button)`
  position: absolute;
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  pointer-events: auto;
  transform: translateY(-50%);

  &:hover {
    /* Fan out on hover - show all 5 with even spacing */
    ${Emoji} {
      margin-left: 4px;
      opacity: 1;
      pointer-events: auto;

      &[data-index="0"] { margin-left: 0; }
    }
  }
`;

export default HighlightOverlay;
