import { AnimatePresence, m } from "framer-motion";
import { Send, X } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { LOUNGE_COLORS } from "@/constants/lounge";

interface SelectionCommentInputProps {
  /** Whether the input is visible */
  isVisible: boolean;
  /** Position to render at */
  position: { top: number; left: number } | null;
  /** The selected text being commented on */
  selectedText: string;
  /** Submit handler - returns the comment content */
  onSubmit: (content: string) => void;
  /** Cancel handler */
  onCancel: () => void;
  /** Whether submitting */
  isSubmitting?: boolean;
}

/**
 * Floating comment input that appears when user clicks "Comment" on selected text.
 * Shows the quoted text and an input field to add a comment.
 */
export function SelectionCommentInput({
  isVisible,
  position,
  selectedText,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: SelectionCommentInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Focus input when visible
  useEffect(() => {
    if (isVisible && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isVisible]);

  // Reset input when hidden
  useEffect(() => {
    if (!isVisible) {
      setInputValue("");
    }
  }, [isVisible]);

  // Handle click outside
  useEffect(() => {
    if (!isVisible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onCancel();
      }
    };

    // Use setTimeout to avoid catching the click that opened this
    const timeout = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isVisible, onCancel]);

  const handleSubmit = useCallback(() => {
    if (!inputValue.trim() || isSubmitting) return;
    onSubmit(inputValue.trim());
  }, [inputValue, isSubmitting, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
      if (e.key === "Escape") {
        onCancel();
      }
    },
    [handleSubmit, onCancel],
  );

  if (!mounted || !isVisible || !position) return null;

  // Calculate viewport-safe position
  const CONTAINER_WIDTH = 320;
  const CONTAINER_HEIGHT = 200; // Approximate height
  const PADDING = 16;

  const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 800;
  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
  const scrollY = typeof window !== "undefined" ? window.scrollY : 0;

  // Calculate safe top (convert to viewport-relative for bounds check)
  let safeTop = position.top;
  const viewportTop = safeTop - scrollY;

  // If would go off bottom, position above the selection instead
  if (viewportTop + CONTAINER_HEIGHT > viewportHeight - PADDING) {
    // Try to fit it - clamp to viewport
    safeTop = scrollY + viewportHeight - CONTAINER_HEIGHT - PADDING;
  }

  // Ensure doesn't go above viewport
  if (safeTop < scrollY + PADDING) {
    safeTop = scrollY + PADDING;
  }

  // Calculate safe left (centered, but clamped to viewport)
  let safeLeft = position.left;
  const halfWidth = CONTAINER_WIDTH / 2;

  // Ensure doesn't go off right edge
  if (safeLeft + halfWidth > viewportWidth - PADDING) {
    safeLeft = viewportWidth - halfWidth - PADDING;
  }

  // Ensure doesn't go off left edge
  if (safeLeft - halfWidth < PADDING) {
    safeLeft = halfWidth + PADDING;
  }

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <Container
          ref={containerRef}
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.15 }}
          style={{
            top: safeTop,
            left: safeLeft,
          }}
        >
          <Header>
            <QuotedText>
              "{selectedText.slice(0, 80)}
              {selectedText.length > 80 ? "..." : ""}"
            </QuotedText>
            <CloseButton onClick={onCancel}>
              <X size={14} />
            </CloseButton>
          </Header>

          <InputWrapper>
            <CommentInput
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add your comment..."
              rows={2}
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

          <Hint>Press Enter to submit, Esc to cancel</Hint>
        </Container>
      )}
    </AnimatePresence>,
    document.body,
  );
}

const Container = styled(m.div)`
  position: absolute;
  z-index: 1002;
  width: 320px;
  border-radius: 12px;
  transform: translateX(-50%);

  /* Glass effect */
  background: rgba(16, 13, 27, 0.95);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 12px 12px 8px;
  gap: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`;

const QuotedText = styled.p`
  flex: 1;
  margin: 0;
  font-size: 12px;
  font-style: italic;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.4;
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

const InputWrapper = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 12px;
`;

const CommentInput = styled.textarea`
  flex: 1;
  min-height: 60px;
  max-height: 120px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.3);
  color: white;
  font-size: 14px;
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
  width: 40px;
  height: 40px;
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

const Hint = styled.p`
  margin: 0;
  padding: 8px 12px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
`;

export default SelectionCommentInput;
