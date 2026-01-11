import { AnimatePresence, m } from "framer-motion";
import { type RefObject, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";

const TOAST_HEIGHT = 60;
const TOAST_WIDTH = 280;
const PADDING = 12;
const GAP = 8;

interface ReactionToastProps {
  show: boolean;
  onHide: () => void;
  title: string;
  subtitle: string;
  /** Optional anchor element to position relative to */
  anchorRef?: RefObject<HTMLElement>;
}

export function ReactionToast({ show, onHide, title, subtitle, anchorRef }: ReactionToastProps) {
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate position relative to anchor, ensuring viewport fit
  const calculatePosition = useCallback(() => {
    if (!anchorRef?.current) {
      // Fallback: center bottom of viewport
      return {
        top: window.innerHeight - TOAST_HEIGHT - PADDING * 2,
        left: (window.innerWidth - TOAST_WIDTH) / 2,
      };
    }

    const rect = anchorRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Position below the anchor, centered horizontally
    let top = rect.bottom + GAP;
    let left = rect.left + rect.width / 2 - TOAST_WIDTH / 2;

    // Clamp left edge
    if (left < PADDING) {
      left = PADDING;
    }
    // Clamp right edge
    if (left + TOAST_WIDTH > viewportWidth - PADDING) {
      left = viewportWidth - PADDING - TOAST_WIDTH;
    }

    // If below would overflow viewport, show above instead
    if (top + TOAST_HEIGHT > viewportHeight - PADDING) {
      top = rect.top - TOAST_HEIGHT - GAP;
    }

    // If still overflows (above viewport), clamp to bottom
    if (top < PADDING) {
      top = viewportHeight - TOAST_HEIGHT - PADDING;
    }

    return { top, left };
  }, [anchorRef]);

  // Update position when showing
  useEffect(() => {
    if (show) {
      setPosition(calculatePosition());
    }
  }, [show, calculatePosition]);

  useEffect(() => {
    if (show) {
      const timer = setTimeout(onHide, 3500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [show, onHide]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {show && position && (
        <ToastContainer
          initial={{ opacity: 0, y: -8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 400,
          }}
          style={{
            top: position.top,
            left: position.left,
          }}
        >
          <ToastPill>
            <ToastIcon>✨</ToastIcon>
            <ToastContent>
              <ToastTitle>{title}</ToastTitle>
              <ToastSubtitle>{subtitle}</ToastSubtitle>
            </ToastContent>
          </ToastPill>
        </ToastContainer>
      )}
    </AnimatePresence>,
    document.body,
  );
}

const ToastContainer = styled(m.div)`
  position: fixed;
  z-index: 10000;
  pointer-events: none;
  width: ${TOAST_WIDTH}px;
`;

const ToastPill = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px 12px 16px;
  background: linear-gradient(
    135deg,
    rgba(30, 30, 35, 0.95) 0%,
    rgba(40, 40, 50, 0.95) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50px;
  backdrop-filter: blur(20px);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset;
`;

const ToastIcon = styled.span`
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ToastContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ToastTitle = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: -0.2px;
`;

const ToastSubtitle = styled.span`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: -0.1px;
`;

export default ReactionToast;
