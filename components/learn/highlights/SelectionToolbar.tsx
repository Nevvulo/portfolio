import { AnimatePresence, m } from "framer-motion";
import { ChevronDown, Highlighter, MessageSquare, Smile } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { LOUNGE_COLORS } from "@/constants/lounge";
import type { TextAnchor } from "./textAnchor";

// Reaction emojis for inline reactions
const REACTION_EMOJIS = [
  { type: "fire", emoji: "🔥", label: "Fire" },
  { type: "heart", emoji: "❤️", label: "Love" },
  { type: "plus1", emoji: "👍", label: "+1" },
  { type: "eyes", emoji: "👀", label: "Interesting" },
  { type: "question", emoji: "❓", label: "Question" },
] as const;

const TOOLBAR_HEIGHT = 44;
const TOOLBAR_WIDTH = 450; // Conservative estimate to ensure viewport respect

interface SelectionToolbarProps {
  /** Whether the toolbar is visible */
  isVisible: boolean;
  /** Bounding rect of the selection */
  rect: DOMRect | null;
  /** Text anchor data */
  anchor: TextAnchor | null;
  /** Whether the user is signed in */
  isSignedIn: boolean;
  /** Called when user clicks highlight */
  onHighlight: (anchor: TextAnchor) => void;
  /** Called when user clicks comment */
  onComment: (anchor: TextAnchor) => void;
  /** Called when user clicks a reaction */
  onReact: (anchor: TextAnchor, type: string) => void;
  /** Called when toolbar is dismissed */
  onDismiss?: () => void;
  /** Whether highlight is in progress */
  isHighlighting?: boolean;
}

export function SelectionToolbar({
  isVisible,
  rect,
  anchor,
  isSignedIn,
  onHighlight,
  onComment,
  onReact,
  onDismiss: _onDismiss,
  isHighlighting = false,
}: SelectionToolbarProps) {
  const [showReactions, setShowReactions] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [toolbarWidth, setToolbarWidth] = useState(TOOLBAR_WIDTH);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Only render portal on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Measure actual toolbar width after render
  useEffect(() => {
    if (toolbarRef.current && isVisible) {
      const width = toolbarRef.current.offsetWidth;
      if (width > 0 && width !== toolbarWidth) {
        setToolbarWidth(width);
      }
    }
  }, [isVisible, isSignedIn, toolbarWidth]);

  // Reset reactions dropdown when toolbar hides
  useEffect(() => {
    if (!isVisible) {
      setShowReactions(false);
    }
  }, [isVisible]);

  const handleHighlight = useCallback(() => {
    if (!anchor || !isSignedIn) return;
    onHighlight(anchor);
  }, [anchor, isSignedIn, onHighlight]);

  const handleComment = useCallback(() => {
    if (!anchor || !isSignedIn) return;
    onComment(anchor);
  }, [anchor, isSignedIn, onComment]);

  const handleReact = useCallback(
    (type: string) => {
      if (!anchor || !isSignedIn) return;
      onReact(anchor, type);
      setShowReactions(false);
    },
    [anchor, isSignedIn, onReact],
  );

  // Calculate position (viewport coordinates for fixed positioning)
  // Returns LEFT EDGE position (not center) - no transform used
  const getPosition = useCallback(() => {
    if (!rect) return { top: 0, left: 0 };

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const PADDING = 8;
    const GAP = 12;

    // Calculate ideal center point
    const selectionCenter = rect.left + rect.width / 2;

    // Calculate left edge if centered
    let leftEdge = selectionCenter - toolbarWidth / 2;

    // Clamp: left edge can't go below PADDING
    if (leftEdge < PADDING) {
      leftEdge = PADDING;
    }

    // Clamp: right edge can't exceed viewport - PADDING
    const rightEdge = leftEdge + toolbarWidth;
    if (rightEdge > viewportWidth - PADDING) {
      leftEdge = viewportWidth - PADDING - toolbarWidth;
    }

    // Final safety: ensure left edge is never negative
    if (leftEdge < PADDING) {
      leftEdge = PADDING;
    }

    // Position above selection
    let top = rect.top - TOOLBAR_HEIGHT - GAP;

    // If would go above viewport, show below
    if (top < PADDING) {
      top = rect.bottom + GAP;
    }

    // Ensure doesn't go below viewport
    if (top + TOOLBAR_HEIGHT > viewportHeight - PADDING) {
      top = viewportHeight - TOOLBAR_HEIGHT - PADDING;
    }

    return { top, left: leftEdge };
  }, [rect, toolbarWidth]);

  if (!mounted || !isVisible || !rect || !anchor) return null;

  const position = getPosition();

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <ToolbarContainer
          ref={toolbarRef}
          data-selection-toolbar
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          style={{
            top: position.top,
            left: position.left,
          }}
        >
          {!isSignedIn ? (
            <SignInHint>Sign in to highlight</SignInHint>
          ) : (
            <>
              <ToolbarButton
                onClick={handleComment}
                title="Add a comment"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <MessageSquare size={14} />
                <span>comment</span>
              </ToolbarButton>

              <Divider />

              <ToolbarButton
                onClick={handleHighlight}
                title="highlight"
                $isHighlighting={isHighlighting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isHighlighting}
              >
                <Highlighter size={14} />
                <span>{isHighlighting ? "..." : "highlight"}</span>
              </ToolbarButton>

              <Divider />

              <ReactionWrapper>
                <ToolbarButton
                  onClick={() => setShowReactions(!showReactions)}
                  title="React"
                  $isActive={showReactions}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Smile size={14} />
                  <DropdownArrow $isOpen={showReactions}>
                    <ChevronDown size={14} />
                  </DropdownArrow>
                </ToolbarButton>

                <AnimatePresence>
                  {showReactions && (
                    <ReactionDropdown
                      initial={{ opacity: 0, y: -4, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.95 }}
                      transition={{ duration: 0.1 }}
                    >
                      {REACTION_EMOJIS.map((reaction) => (
                        <ReactionButton
                          key={reaction.type}
                          onClick={() => handleReact(reaction.type)}
                          title={reaction.label}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {reaction.emoji}
                        </ReactionButton>
                      ))}
                    </ReactionDropdown>
                  )}
                </AnimatePresence>
              </ReactionWrapper>
            </>
          )}
        </ToolbarContainer>
      )}
    </AnimatePresence>,
    document.body,
  );
}

const ToolbarContainer = styled(m.div)`
  position: fixed;
  z-index: 1001;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 6px 8px;
  border-radius: 10px;

  /* Glass effect */
  background: rgba(16, 13, 27, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05);

  /* Subtle inner glow */
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 10px;
    padding: 1px;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.1) 0%,
      transparent 50%
    );
    -webkit-mask: linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }
`;

const ToolbarButton = styled(m.button)<{
  $isActive?: boolean;
  $isHighlighting?: boolean;
}>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 6px;
  border: none;
  background: ${(props) => (props.$isActive ? "rgba(144, 116, 242, 0.2)" : "transparent")};
  color: ${(props) =>
    props.$isActive || props.$isHighlighting ? LOUNGE_COLORS.tier1 : "rgba(255, 255, 255, 0.85)"};
  font-family: var(--font-display);
  font-size: 0.6rem;
  letter-spacing: 0.02em;
  cursor: ${(props) => (props.$isHighlighting ? "wait" : "pointer")};
  transition: all 0.15s ease;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: rgba(144, 116, 242, 0.2);
    color: ${LOUNGE_COLORS.tier1};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  svg {
    flex-shrink: 0;
  }
`;

const Divider = styled.div`
  width: 1px;
  height: 20px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 2px;
`;

const ReactionWrapper = styled.div`
  position: relative;
`;

const DropdownArrow = styled.span<{ $isOpen: boolean }>`
  display: flex;
  align-items: center;
  transition: transform 0.15s ease;
  transform: ${(props) => (props.$isOpen ? "rotate(180deg)" : "rotate(0)")};
  margin-left: 2px;
`;

const ReactionDropdown = styled(m.div)`
  position: absolute;
  bottom: calc(100% + 8px);
  right: 0;
  display: flex;
  gap: 4px;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(16, 13, 27, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
`;

const ReactionButton = styled(m.button)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const SignInHint = styled.span`
  padding: 8px 16px;
  color: rgba(255, 255, 255, 0.6);
  font-family: var(--font-display);
  font-size: 0.55rem;
  letter-spacing: 0.02em;
`;

export default SelectionToolbar;
