import { useState, useRef, useCallback } from "react";
import styled, { keyframes } from "styled-components";
import { createPortal } from "react-dom";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
}

export function Tooltip({
  content,
  children,
  position = "top",
  delay = 400,
}: TooltipProps) {
  const [state, setState] = useState<TooltipState>({ visible: false, x: 0, y: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const showTooltip = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();

        let x = 0;
        let y = 0;

        switch (position) {
          case "top":
            x = rect.left + rect.width / 2;
            y = rect.top - 8;
            break;
          case "bottom":
            x = rect.left + rect.width / 2;
            y = rect.bottom + 8;
            break;
          case "left":
            x = rect.left - 8;
            y = rect.top + rect.height / 2;
            break;
          case "right":
            x = rect.right + 8;
            y = rect.top + rect.height / 2;
            break;
        }

        // Single state update to avoid render between coord and visibility changes
        setState({ visible: true, x, y });
      }
    }, delay);
  }, [delay, position]);

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setState(s => ({ ...s, visible: false }));
  }, []);

  return (
    <>
      <TooltipTrigger
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        {children}
      </TooltipTrigger>
      {state.visible &&
        typeof document !== "undefined" &&
        createPortal(
          <TooltipContent $position={position} $x={state.x} $y={state.y}>
            {content}
            <TooltipArrow $position={position} />
          </TooltipContent>,
          document.body
        )}
    </>
  );
}

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const TooltipTrigger = styled.div`
  display: inline-flex;
`;

const TooltipContent = styled.div<{
  $position: "top" | "bottom" | "left" | "right";
  $x: number;
  $y: number;
}>`
  position: fixed;
  z-index: 10000;
  padding: 8px 12px;
  background: #18191c;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  color: #e3e5e8;
  white-space: nowrap;
  pointer-events: none;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.24);
  animation: ${fadeIn} 0.1s ease-out;

  ${({ $position, $x, $y }) => {
    switch ($position) {
      case "top":
        return `
          left: ${$x}px;
          top: ${$y}px;
          transform: translate(-50%, -100%);
        `;
      case "bottom":
        return `
          left: ${$x}px;
          top: ${$y}px;
          transform: translate(-50%, 0);
        `;
      case "left":
        return `
          left: ${$x}px;
          top: ${$y}px;
          transform: translate(-100%, -50%);
        `;
      case "right":
        return `
          left: ${$x}px;
          top: ${$y}px;
          transform: translate(0, -50%);
        `;
    }
  }}
`;

const TooltipArrow = styled.div<{
  $position: "top" | "bottom" | "left" | "right";
}>`
  position: absolute;
  width: 0;
  height: 0;
  border: 5px solid transparent;

  ${({ $position }) => {
    switch ($position) {
      case "top":
        return `
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          border-top-color: #18191c;
        `;
      case "bottom":
        return `
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          border-bottom-color: #18191c;
        `;
      case "left":
        return `
          right: -10px;
          top: 50%;
          transform: translateY(-50%);
          border-left-color: #18191c;
        `;
      case "right":
        return `
          left: -10px;
          top: 50%;
          transform: translateY(-50%);
          border-right-color: #18191c;
        `;
    }
  }}
`;
