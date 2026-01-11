import { AnimatePresence, m } from "framer-motion";
import { ChevronDown, ChevronRight, Highlighter, Trash2, X } from "lucide-react";
import React, { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { LOUNGE_COLORS } from "@/constants/lounge";
import type { Id } from "@/convex/_generated/dataModel";

interface HighlightWithUser {
  _id: Id<"contentHighlights">;
  highlightedText: string;
  prefix: string;
  suffix: string;
  createdAt: number;
  user: {
    _id: Id<"users">;
    displayName: string;
    username?: string;
    avatarUrl?: string;
  } | null;
}

interface GroupedHighlights {
  user: {
    _id: Id<"users">;
    displayName: string;
    username?: string;
    avatarUrl?: string;
  };
  highlights: HighlightWithUser[];
}

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

interface HighlightModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Highlights grouped by user */
  highlightsByUser: GroupedHighlights[];
  /** Total highlight count */
  totalCount: number;
  /** Called when user clicks to scroll to a highlight */
  onScrollToHighlight: (highlightId: string) => void;
  /** Current user ID (for showing delete buttons) */
  currentUserId?: string;
  /** Called when user deletes a highlight */
  onDelete?: (highlightId: string) => void;
  /** Reactions by highlight ID */
  reactionsByHighlight?: Record<string, ReactionData>;
}

export function HighlightModal({
  isOpen,
  onClose,
  highlightsByUser,
  totalCount,
  onScrollToHighlight,
  currentUserId,
  onDelete,
  reactionsByHighlight = {},
}: HighlightModalProps) {
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = React.useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Expand all users by default when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setExpandedUsers(new Set(highlightsByUser.map((g) => g.user._id.toString())));
    }
  }, [isOpen, highlightsByUser]);

  const toggleUser = useCallback((userId: string) => {
    setExpandedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }, []);

  const handleScrollTo = useCallback(
    (highlightId: string) => {
      onScrollToHighlight(highlightId);
      onClose();
    },
    [onScrollToHighlight, onClose],
  );

  const handleDelete = useCallback(
    async (e: React.MouseEvent, highlightId: string) => {
      e.stopPropagation(); // Don't trigger scroll
      if (!onDelete) return;

      // Optimistic update - mark as deleting
      setDeletingIds((prev) => new Set([...prev, highlightId]));

      try {
        await onDelete(highlightId);
      } catch (error) {
        // Revert optimistic update on error
        setDeletingIds((prev) => {
          const next = new Set(prev);
          next.delete(highlightId);
          return next;
        });
        console.error("Failed to delete highlight:", error);
      }
    },
    [onDelete],
  );

  // Handle escape key
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <Overlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <ModalWrapper onClick={onClose}>
            <ModalContainer
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ModalHeader>
                <HeaderTitle>
                  <Highlighter size={18} />
                  <span>
                    {totalCount} Highlight{totalCount !== 1 ? "s" : ""}
                  </span>
                </HeaderTitle>
                <CloseButton onClick={onClose}>
                  <X size={18} />
                </CloseButton>
              </ModalHeader>

              <ModalContent>
                {highlightsByUser.length === 0 ? (
                  <EmptyState>No highlights yet</EmptyState>
                ) : (
                  highlightsByUser.map((group) => {
                    const userId = group.user._id.toString();
                    const isExpanded = expandedUsers.has(userId);

                    return (
                      <UserGroup key={userId}>
                        <UserHeader onClick={() => toggleUser(userId)}>
                          <UserInfo>
                            <Avatar
                              src={group.user.avatarUrl || "/default-avatar.png"}
                              alt={group.user.displayName}
                            />
                            <UserName>
                              {group.user.displayName}
                              <HighlightCountLabel>({group.highlights.length})</HighlightCountLabel>
                            </UserName>
                          </UserInfo>
                          <ExpandIcon $isExpanded={isExpanded}>
                            <ChevronDown size={16} />
                          </ExpandIcon>
                        </UserHeader>

                        <AnimatePresence>
                          {isExpanded && (
                            <HighlightsList
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.15 }}
                            >
                              {group.highlights
                                .filter((h) => !deletingIds.has(h._id.toString()))
                                .map((highlight) => {
                                  const isOwn = currentUserId === group.user._id.toString();
                                  const highlightId = highlight._id.toString();
                                  const reactions = reactionsByHighlight[highlightId];

                                  // Get top emojis for this highlight
                                  const topEmojis = reactions
                                    ? Object.entries(reactions.counts)
                                        .filter(([, count]) => count > 0)
                                        .sort((a, b) => b[1] - a[1])
                                        .slice(0, 3)
                                        .map(([type]) => REACTION_EMOJI[type])
                                    : [];

                                  return (
                                    <HighlightItem
                                      key={highlightId}
                                      onClick={() => handleScrollTo(highlightId)}
                                      whileHover={{ x: 4 }}
                                    >
                                      <HighlightText>
                                        "{highlight.highlightedText.slice(0, 80)}
                                        {highlight.highlightedText.length > 80 ? "..." : ""}"
                                      </HighlightText>
                                      <HighlightActions>
                                        {topEmojis.length > 0 && (
                                          <ReactionBadges>
                                            {topEmojis.map((emoji, i) => (
                                              <span key={i}>{emoji}</span>
                                            ))}
                                          </ReactionBadges>
                                        )}
                                        {isOwn && onDelete && (
                                          <DeleteButton
                                            onClick={(e) => handleDelete(e, highlightId)}
                                            title="Delete highlight"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                          >
                                            <Trash2 size={12} />
                                          </DeleteButton>
                                        )}
                                        <ScrollIcon>
                                          <ChevronRight size={14} />
                                        </ScrollIcon>
                                      </HighlightActions>
                                    </HighlightItem>
                                  );
                                })}
                            </HighlightsList>
                          )}
                        </AnimatePresence>
                      </UserGroup>
                    );
                  })
                )}
              </ModalContent>
            </ModalContainer>
          </ModalWrapper>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

const Overlay = styled(m.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 1100;
`;

const ModalWrapper = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1101;
  padding: 20px;
`;

const ModalContainer = styled(m.div)`
  width: 100%;
  max-width: 480px;
  max-height: 80vh;
  border-radius: 16px;
  background: rgba(16, 13, 27, 0.98);
  backdrop-filter: blur(20px);
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`;

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-display);
  font-size: 0.75rem;
  letter-spacing: 0.02em;
  color: white;

  svg {
    color: ${LOUNGE_COLORS.tier1};
  }
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
`;

const ModalContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
`;

const EmptyState = styled.p`
  padding: 32px;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
`;

const UserGroup = styled.div`
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  &:last-child {
    border-bottom: none;
  }
`;

const UserHeader = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.03);
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Avatar = styled.img`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
`;

const UserName = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  gap: 6px;
`;

const HighlightCountLabel = styled.span`
  font-weight: 400;
  color: rgba(255, 255, 255, 0.5);
`;

const ExpandIcon = styled.span<{ $isExpanded: boolean }>`
  display: flex;
  color: rgba(255, 255, 255, 0.4);
  transition: transform 0.15s ease;
  transform: rotate(${(props) => (props.$isExpanded ? "0deg" : "-90deg")});
`;

const HighlightsList = styled(m.div)`
  overflow: hidden;
`;

const HighlightItem = styled(m.button)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 20px 10px 58px;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  gap: 12px;

  &:hover {
    background: rgba(144, 116, 242, 0.1);
  }
`;

const HighlightText = styled.span`
  flex: 1;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.4;
  font-style: italic;
`;

const HighlightActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

const ReactionBadges = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
`;

const DeleteButton = styled(m.button)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s ease, background 0.15s ease;

  ${HighlightItem}:hover & {
    opacity: 1;
  }

  &:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }
`;

const ScrollIcon = styled.span`
  display: flex;
  color: ${LOUNGE_COLORS.tier1};
  opacity: 0.7;
  flex-shrink: 0;
`;

export default HighlightModal;
