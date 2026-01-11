import { AnimatePresence, m } from "framer-motion";
import { useMemo, useState } from "react";
import styled from "styled-components";

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

interface HighlightPosition {
  id: string;
  top: number;
}

interface Cluster {
  top: number;
  highlights: Array<{
    id: string;
    reactions: ReactionData;
  }>;
}

interface InlineReactionsGutterProps {
  /** Reactions by highlight ID */
  reactionsByHighlight: Record<string, ReactionData>;
  /** Positions of highlights relative to container */
  highlightPositions: HighlightPosition[];
  /** Called when a reaction cluster is clicked */
  onReactionClick?: (highlightId: string) => void;
}

// Minimum distance between clusters before merging
const CLUSTER_THRESHOLD = 40;

/**
 * Displays inline reactions in the right gutter of the content.
 * Groups reactions by highlight and shows emoji clusters at the
 * corresponding vertical position. Clusters nearby highlights together.
 */
export function InlineReactionsGutter({
  reactionsByHighlight,
  highlightPositions,
  onReactionClick,
}: InlineReactionsGutterProps) {
  const [hoveredClusterIndex, setHoveredClusterIndex] = useState<number | null>(null);

  // Filter to only positions with reactions and sort by top position
  const positionsWithReactions = useMemo(() => {
    return highlightPositions
      .filter((pos) => {
        const reactions = reactionsByHighlight[pos.id];
        return reactions && reactions.total > 0;
      })
      .sort((a, b) => a.top - b.top);
  }, [highlightPositions, reactionsByHighlight]);

  // Cluster nearby highlights together to avoid overlap
  const clusters = useMemo((): Cluster[] => {
    if (positionsWithReactions.length === 0) return [];

    const result: Cluster[] = [];

    for (const pos of positionsWithReactions) {
      const reactions = reactionsByHighlight[pos.id];
      if (!reactions) continue;

      const lastCluster = result[result.length - 1];

      // Check if this highlight is close enough to merge into the last cluster
      if (lastCluster && pos.top - lastCluster.top < CLUSTER_THRESHOLD) {
        lastCluster.highlights.push({ id: pos.id, reactions });
      } else {
        // Start a new cluster
        result.push({
          top: pos.top,
          highlights: [{ id: pos.id, reactions }],
        });
      }
    }

    return result;
  }, [positionsWithReactions, reactionsByHighlight]);

  if (clusters.length === 0) return null;

  return (
    <GutterContainer>
      <AnimatePresence>
        {clusters.map((cluster, clusterIndex) => {
          // Merge all reactions from highlights in this cluster
          const mergedCounts: Record<string, number> = {};
          let totalReactions = 0;

          for (const highlight of cluster.highlights) {
            for (const [type, count] of Object.entries(highlight.reactions.counts)) {
              mergedCounts[type] = (mergedCounts[type] || 0) + count;
              totalReactions += count;
            }
          }

          // Get top emojis sorted by count (up to 5 for hover, 3 normally)
          const allEmojis = Object.entries(mergedCounts)
            .filter(([, count]) => count > 0)
            .sort((a, b) => b[1] - a[1])
            .map(([type]) => type);

          const isHovered = hoveredClusterIndex === clusterIndex;
          const displayEmojis = allEmojis.slice(0, isHovered ? 5 : 3);

          return (
            <ClusterWrapper
              key={clusterIndex}
              style={{ top: cluster.top }}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onMouseEnter={() => setHoveredClusterIndex(clusterIndex)}
              onMouseLeave={() => setHoveredClusterIndex(null)}
              onClick={() => {
                // Click the first highlight in the cluster
                const firstHighlight = cluster.highlights[0];
                if (onReactionClick && firstHighlight) {
                  onReactionClick(firstHighlight.id);
                }
              }}
              title={`${totalReactions} reaction${totalReactions !== 1 ? "s" : ""}`}
            >
              <EmojiStack $isHovered={isHovered} $count={displayEmojis.length}>
                {displayEmojis.map((type, index) => {
                  const count = mergedCounts[type] ?? 0;
                  return (
                    <EmojiCard
                      key={type}
                      $index={index}
                      $total={displayEmojis.length}
                      $isHovered={isHovered}
                    >
                      {REACTION_EMOJI[type]}
                      {isHovered && count > 1 && <EmojiCount>{count}</EmojiCount>}
                    </EmojiCard>
                  );
                })}
              </EmojiStack>
              {!isHovered && totalReactions > 1 && <TotalCount>{totalReactions}</TotalCount>}
            </ClusterWrapper>
          );
        })}
      </AnimatePresence>
    </GutterContainer>
  );
}

const GutterContainer = styled.div`
  position: relative;
  right: -70px;
  bottom: 0;
  width: 60px;

  /* Hide on narrow screens */
  @media (max-width: 1100px) {
    display: none;
  }
`;

const ClusterWrapper = styled(m.div)`
  position: absolute;
  right: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(4px);
  transform: translateY(-50%);
  cursor: pointer;
  pointer-events: auto;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const EmojiStack = styled.div<{ $isHovered: boolean; $count: number }>`
  position: relative;
  display: flex;
  align-items: center;
  height: 24px;
  /* Adjust width based on splay state */
  width: ${({ $isHovered, $count }) =>
    $isHovered
      ? `${Math.max(24, ($count - 1) * 20 + 24)}px`
      : `${Math.max(24, ($count - 1) * -4 + 24)}px`};
  transition: width 0.2s ease;
`;

const EmojiCard = styled.span<{
  $index: number;
  $total: number;
  $isHovered: boolean;
}>`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  font-size: 14px;
  line-height: 1;
  background: rgba(30, 27, 45, 0.95);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  /* Stacking order: first emoji on top */
  z-index: ${({ $total, $index }) => $total - $index};

  /* Position based on hover state */
  transform: ${({ $index, $isHovered }) => {
    if ($isHovered) {
      // Splay out horizontally with slight fan rotation
      const rotation = ($index - 2) * 3;
      return `translateX(${$index * 20}px) rotate(${rotation}deg)`;
    }
    // Stack with overlap - each card slightly offset
    return `translateX(${$index * -4}px) translateY(${$index * 1}px)`;
  }};

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }
`;

const EmojiCount = styled.span`
  position: absolute;
  bottom: -4px;
  right: -4px;
  min-width: 14px;
  height: 14px;
  padding: 0 3px;
  font-size: 9px;
  font-weight: 600;
  color: white;
  background: rgba(144, 116, 242, 0.9);
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(0, 0, 0, 0.3);
`;

const TotalCount = styled.span`
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  margin-left: 2px;
`;

export default InlineReactionsGutter;
