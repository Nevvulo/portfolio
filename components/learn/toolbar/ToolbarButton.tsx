import { m } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import styled from "styled-components";
import { LOUNGE_COLORS } from "@/constants/lounge";

interface ToolbarButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  variant?: "default" | "danger";
  badge?: number;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  isActive = false,
  disabled = false,
  variant = "default",
  badge,
  onMouseEnter,
  onMouseLeave,
}: ToolbarButtonProps) {
  return (
    <ButtonContainer
      onClick={disabled ? undefined : onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      $isActive={isActive}
      $disabled={disabled}
      $variant={variant}
      whileHover={disabled ? undefined : { scale: 1.08 }}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      title={label}
      aria-label={label}
      aria-disabled={disabled}
    >
      <Icon size={18} />
      {badge !== undefined && badge > 0 && <Badge>{badge > 99 ? "99+" : badge}</Badge>}
    </ButtonContainer>
  );
}

const ButtonContainer = styled(m.button)<{
  $isActive: boolean;
  $disabled: boolean;
  $variant: "default" | "danger";
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 10px;
  cursor: ${(props) => (props.$disabled ? "not-allowed" : "pointer")};
  transition: all 0.15s ease;

  background: ${(props) => {
    if (props.$disabled) return "rgba(16, 13, 27, 0.6)";
    if (props.$isActive) {
      return props.$variant === "danger" ? "rgba(239, 68, 68, 0.2)" : `rgba(144, 116, 242, 0.2)`;
    }
    return "rgba(16, 13, 27, 0.92)";
  }};

  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  border: 1px solid
    ${(props) => {
      if (props.$isActive) {
        return props.$variant === "danger" ? "rgba(239, 68, 68, 0.4)" : "rgba(144, 116, 242, 0.4)";
      }
      return LOUNGE_COLORS.glassBorder;
    }};

  color: ${(props) => {
    if (props.$disabled) return "rgba(255, 255, 255, 0.3)";
    if (props.$isActive) {
      return props.$variant === "danger" ? "#ef4444" : LOUNGE_COLORS.tier1;
    }
    return "rgba(255, 255, 255, 0.7)";
  }};

  &:hover:not([aria-disabled="true"]) {
    background: ${(props) =>
      props.$variant === "danger" ? "rgba(239, 68, 68, 0.15)" : "rgba(144, 116, 242, 0.15)"};
    border-color: ${(props) =>
      props.$variant === "danger" ? "rgba(239, 68, 68, 0.3)" : "rgba(144, 116, 242, 0.3)"};
    color: ${(props) => (props.$variant === "danger" ? "#ef4444" : LOUNGE_COLORS.tier1)};
  }
`;

const Badge = styled.span`
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: ${LOUNGE_COLORS.tier1};
  border-radius: 9px;
  font-size: 10px;
  font-weight: 600;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
`;
