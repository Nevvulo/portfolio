import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, m } from "framer-motion";
import { MessageSquare, Send, X } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { UserPopoutTrigger } from "@/components/shared/UserPopout";
import { LOUNGE_COLORS } from "@/constants/theme";

interface Comment {
  id: string;
  content: string;
  createdAt: number;
  isEdited: boolean;
  author: {
    id: string;
    displayName: string;
    username?: string;
    avatarUrl?: string;
    tier: string;
    isCreator: boolean;
  } | null;
  replies?: Comment[];
}

interface HighlightAuthor {
  id: string;
  displayName: string;
  username?: string;
  avatarUrl?: string;
}

interface InlineCommentBubbleProps {
  /** The highlight this bubble is for */
  highlightId: string;
  /** The highlighted text to quote */
  highlightedText: string;
  /** Bounding rect of the highlight element */
  rect: DOMRect | null;
  /** Whether the bubble is expanded */
  isExpanded: boolean;
  /** Comments on this highlight */
  comments: Comment[];
  /** Whether user is signed in */
  isSignedIn: boolean;
  /** Toggle expanded state */
  onToggle: () => void;
  /** Submit a new comment */
  onSubmit: (content: string) => void;
  /** Close the bubble */
  onClose: () => void;
  /** Is submitting */
  isSubmitting?: boolean;
  /** Whether this is a reaction-only highlight (no comments allowed) */
  isReactionOnly?: boolean;
  /** Author of the highlight */
  highlightAuthor?: HighlightAuthor | null;
}

export function InlineCommentBubble({
  highlightId: _highlightId,
  highlightedText: _highlightedText,
  rect,
  isExpanded,
  comments,
  isSignedIn,
  onToggle,
  onSubmit,
  onClose,
  isSubmitting = false,
  isReactionOnly = false,
  highlightAuthor,
}: InlineCommentBubbleProps) {
  const [inputValue, setInputValue] = useState("");
  const [mounted, setMounted] = useState(false);
  const [bubbleWidth, setBubbleWidth] = useState(320);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Measure actual bubble width after render
  useEffect(() => {
    if (bubbleRef.current && isExpanded) {
      const width = bubbleRef.current.offsetWidth;
      if (width > 0 && width !== bubbleWidth) {
        setBubbleWidth(width);
      }
    }
  }, [isExpanded, bubbleWidth]);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isExpanded]);

  // Handle click outside
  useEffect(() => {
    if (!isExpanded) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (bubbleRef.current && !bubbleRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isExpanded, onClose]);

  const handleSubmit = useCallback(() => {
    if (!inputValue.trim() || isSubmitting) return;
    onSubmit(inputValue.trim());
    setInputValue("");
  }, [inputValue, isSubmitting, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
      if (e.key === "Escape") {
        onClose();
      }
    },
    [handleSubmit, onClose],
  );

  // Calculate position (viewport coordinates for fixed positioning)
  // Returns LEFT EDGE position - no transform used
  const getPosition = useCallback(() => {
    if (!rect) return { top: 0, left: 0, showBelow: false };

    const BUBBLE_HEIGHT = 200;
    const PADDING = 8;
    const GAP = 12;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate ideal center point
    const highlightCenter = rect.left + rect.width / 2;

    // Calculate left edge if centered
    let leftEdge = highlightCenter - bubbleWidth / 2;

    // Clamp: left edge can't go below PADDING
    if (leftEdge < PADDING) {
      leftEdge = PADDING;
    }

    // Clamp: right edge can't exceed viewport - PADDING
    const rightEdge = leftEdge + bubbleWidth;
    if (rightEdge > viewportWidth - PADDING) {
      leftEdge = viewportWidth - PADDING - bubbleWidth;
    }

    // Final safety: ensure left edge is never negative
    if (leftEdge < PADDING) {
      leftEdge = PADDING;
    }

    // Position above the highlight by default
    let top = rect.top - BUBBLE_HEIGHT - GAP;
    let showBelow = false;

    // If would go above viewport, show below the highlight
    if (top < PADDING) {
      top = rect.bottom + GAP;
      showBelow = true;
    }

    // Ensure doesn't go below viewport
    if (top + BUBBLE_HEIGHT > viewportHeight - PADDING) {
      top = viewportHeight - BUBBLE_HEIGHT - PADDING;
    }

    // Ensure doesn't go above viewport
    if (top < PADDING) {
      top = PADDING;
    }

    return { top, left: leftEdge, showBelow };
  }, [rect, bubbleWidth]);

  if (!mounted || !rect) return null;

  const position = getPosition();

  // Collapsed state - just show count badge (in portal with fixed positioning)
  if (!isExpanded) {
    return createPortal(
      <CollapsedBubble
        style={{
          top: position.top,
          left: position.left,
        }}
        onClick={onToggle}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title={`${comments.length} comment${comments.length !== 1 ? "s" : ""}`}
      >
        <MessageSquare size={12} />
        {comments.length > 0 && <Count>{comments.length}</Count>}
      </CollapsedBubble>,
      document.body,
    );
  }

  // Expanded bubble with comments and input
  return createPortal(
    <AnimatePresence>
      <BubbleContainer
        ref={bubbleRef}
        initial={{ opacity: 0, scale: 0.95, y: position.showBelow ? -10 : 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: position.showBelow ? -10 : 10 }}
        transition={{ duration: 0.15 }}
        style={{
          top: position.top,
          left: position.left,
        }}
      >
        <BubbleHeader>
          {highlightAuthor && (
            <HighlightAuthorSection>
              <UserPopoutTrigger userId={highlightAuthor.id}>
                <HighlightAuthorAvatar
                  src={highlightAuthor.avatarUrl || "/default-avatar.png"}
                  alt={highlightAuthor.displayName}
                />
              </UserPopoutTrigger>
              <UserPopoutTrigger userId={highlightAuthor.id}>
                <HighlightAuthorInfo>
                  <HighlightAuthorName>{highlightAuthor.displayName}</HighlightAuthorName>
                  <HighlightedLabel>highlighted</HighlightedLabel>
                </HighlightAuthorInfo>
              </UserPopoutTrigger>
            </HighlightAuthorSection>
          )}
          <CloseButton onClick={onClose}>
            <X size={14} />
          </CloseButton>
        </BubbleHeader>

        {comments.length > 0 && (
          <CommentsList>
            {comments.map((comment) => (
              <CommentItem key={comment.id.toString()}>
                {comment.author ? (
                  <UserPopoutTrigger userId={comment.author.id}>
                    <CommentAvatar
                      src={comment.author.avatarUrl || "/default-avatar.png"}
                      alt={comment.author.displayName}
                    />
                  </UserPopoutTrigger>
                ) : (
                  <CommentAvatar src="/default-avatar.png" alt="User" />
                )}
                <CommentContent>
                  <CommentHeader>
                    {comment.author ? (
                      <UserPopoutTrigger userId={comment.author.id}>
                        <AuthorName $isCreator={comment.author.isCreator}>
                          {comment.author.displayName}
                        </AuthorName>
                      </UserPopoutTrigger>
                    ) : (
                      <AuthorName>Unknown</AuthorName>
                    )}
                    <CommentTime>
                      {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                      {comment.isEdited && " (edited)"}
                    </CommentTime>
                  </CommentHeader>
                  <CommentText>{comment.content}</CommentText>
                </CommentContent>
              </CommentItem>
            ))}
          </CommentsList>
        )}

        {!isReactionOnly &&
          (isSignedIn ? (
            <InputWrapper>
              <CommentInput
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add a comment..."
                rows={1}
                maxLength={2000}
                disabled={isSubmitting}
              />
              <SubmitButton
                onClick={handleSubmit}
                disabled={!inputValue.trim() || isSubmitting}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Send size={14} />
              </SubmitButton>
            </InputWrapper>
          ) : (
            <SignInPrompt>Sign in to comment</SignInPrompt>
          ))}
      </BubbleContainer>
    </AnimatePresence>,
    document.body,
  );
}

const CollapsedBubble = styled(m.button)`
  position: fixed;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  border: none;
  background: rgba(16, 13, 27, 0.9);
  backdrop-filter: blur(8px);
  color: rgba(255, 255, 255, 0.7);
  font-size: 11px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  z-index: 1001;

  &:hover {
    background: rgba(144, 116, 242, 0.3);
    color: white;
  }
`;

const Count = styled.span`
  font-weight: 600;
`;

const BubbleContainer = styled(m.div)`
  position: fixed;
  width: 320px;
  max-height: 400px;
  border-radius: 12px;
  background: rgba(16, 13, 27, 0.95);
  backdrop-filter: blur(16px);
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  z-index: 1002;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const BubbleHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  gap: 8px;
`;

const HighlightAuthorSection = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
`;

const HighlightAuthorAvatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  transition: opacity 0.15s ease;

  &:hover {
    opacity: 0.8;
  }
`;

const HighlightAuthorInfo = styled.div`
  display: flex;
  align-items: baseline;
  gap: 6px;
  cursor: pointer;
`;

const HighlightAuthorName = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);

  &:hover {
    color: ${LOUNGE_COLORS.tier1};
  }
`;

const HighlightedLabel = styled.span`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  flex-shrink: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
`;

const CommentsList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
  max-height: 240px;
`;

const CommentItem = styled.div`
  display: flex;
  gap: 8px;
  padding: 8px 12px;

  &:hover {
    background: rgba(255, 255, 255, 0.03);
  }
`;

const CommentAvatar = styled.img`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  cursor: pointer;
  transition: opacity 0.15s ease;

  &:hover {
    opacity: 0.8;
  }
`;

const CommentContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const CommentHeader = styled.div`
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 2px;
`;

const AuthorName = styled.span<{ $isCreator?: boolean }>`
  font-size: 12px;
  font-weight: 600;
  color: ${(props) => (props.$isCreator ? LOUNGE_COLORS.tier2 : "rgba(255, 255, 255, 0.9)")};
  cursor: pointer;

  &:hover {
    color: ${LOUNGE_COLORS.tier1};
  }
`;

const CommentTime = styled.span`
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
`;

const CommentText = styled.p`
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.4;
  word-break: break-word;
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
`;

const CommentInput = styled.textarea`
  flex: 1;
  min-height: 36px;
  max-height: 100px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.3);
  color: white;
  font-size: 13px;
  font-family: inherit;
  resize: none;
  outline: none;

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }

  &:focus {
    border-color: ${LOUNGE_COLORS.tier1};
  }

  &:disabled {
    opacity: 0.6;
  }
`;

const SubmitButton = styled(m.button)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: ${LOUNGE_COLORS.tier1};
  color: white;
  cursor: pointer;
  flex-shrink: 0;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SignInPrompt = styled.p`
  margin: 0;
  padding: 12px;
  text-align: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
`;

export default InlineCommentBubble;
