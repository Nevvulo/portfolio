import React from "react";
import styled from "styled-components";
import { m } from "framer-motion";
import { Highlighter } from "lucide-react";
import { LOUNGE_COLORS } from "@/constants/lounge";

interface HighlightCountProps {
  /** Total number of highlights */
  count: number;
  /** Number of unique users who highlighted */
  uniqueUsers?: number;
  /** Click handler to open modal */
  onClick: () => void;
  /** Whether to show in compact mode */
  compact?: boolean;
}

/**
 * Badge showing highlight count, displayed in the hero section
 * next to the ReactionBar. iOS 26 Liquid Glass styling.
 */
export function HighlightCount({
  count,
  uniqueUsers,
  onClick,
  compact = false,
}: HighlightCountProps) {
  if (count === 0) return null;

  return (
    <GlassButton
      onClick={onClick}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      title={`${count} highlight${count !== 1 ? "s" : ""} from ${uniqueUsers || count} reader${(uniqueUsers || count) !== 1 ? "s" : ""}`}
    >
      <IconCircle
        $compact={compact}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      >
        <Highlighter size={compact ? 16 : 20} />
      </IconCircle>
      <Count>{count}</Count>
    </GlassButton>
  );
}

const GlassButton = styled(m.button)`
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
`;

const IconCircle = styled(m.div)<{ $compact?: boolean }>`
  width: ${(props) => (props.$compact ? "40px" : "48px")};
  height: ${(props) => (props.$compact ? "40px" : "48px")};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  /* iOS 26 Liquid Glass */
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);

  transition: all 0.2s ease;
  color: rgba(255, 255, 255, 0.7);

  /* Hover glow - purple for highlights */
  ${GlassButton}:hover & {
    background: rgba(255, 255, 255, 0.12);
    box-shadow:
      0 4px 20px rgba(0, 0, 0, 0.15),
      0 0 20px ${LOUNGE_COLORS.tier1}30,
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
    border-color: ${LOUNGE_COLORS.tier1}50;
    color: ${LOUNGE_COLORS.tier1};
  }

  /* Active/pressed glow */
  ${GlassButton}:active & {
    background: rgba(255, 255, 255, 0.15);
    box-shadow:
      0 2px 12px rgba(0, 0, 0, 0.1),
      0 0 28px ${LOUNGE_COLORS.tier1}40,
      inset 0 1px 0 rgba(255, 255, 255, 0.25);
  }
`;

const Count = styled.span`
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 600;
  min-width: 16px;
  color: rgba(255, 255, 255, 0.6);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: color 0.2s ease;

  ${GlassButton}:hover & {
    color: ${LOUNGE_COLORS.tier1};
  }
`;

export default HighlightCount;
