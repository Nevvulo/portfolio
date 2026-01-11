import { Hash, type LucideIcon, Megaphone, Sparkles, Users } from "lucide-react";
import styled from "styled-components";
import { LOUNGE_COLORS, LOUNGE_LAYOUT } from "../../../constants/lounge";

interface TopBarProps {
  channelName?: string;
  channelType?: "chat" | "announcements" | "content";
  customIcon?: LucideIcon;
  onToggleMembers: () => void;
  isMembersPanelOpen: boolean;
}

const TYPE_ICONS = {
  chat: Hash,
  announcements: Megaphone,
  content: Sparkles,
};

export function TopBar({
  channelName,
  channelType = "chat",
  customIcon,
  onToggleMembers,
  isMembersPanelOpen,
}: TopBarProps) {
  const Icon = customIcon || TYPE_ICONS[channelType];

  return (
    <TopBarContainer>
      <ChannelInfo>
        <Icon style={{ marginLeft: "8px", marginRight: "2px" }} size={14} />
        <ChannelName>{channelName || "\u00A0"}</ChannelName>
      </ChannelInfo>

      <TopBarActions>
        <TopBarButton
          onClick={onToggleMembers}
          $isActive={isMembersPanelOpen}
          title="Toggle members panel"
        >
          <Users size={18} />
        </TopBarButton>
      </TopBarActions>
    </TopBarContainer>
  );
}

// Styled Components
const TopBarContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: ${LOUNGE_LAYOUT.headerHeight};
  min-height: ${LOUNGE_LAYOUT.headerHeight};
  padding: 0 1rem;
  background: ${(props) => (props.theme.background === "#fff" ? "#f5f3fa" : LOUNGE_COLORS.glassBackground)};
  border-bottom: 1px solid ${(props) => (props.theme.background === "#fff" ? "rgba(0,0,0,0.08)" : LOUNGE_COLORS.glassBorder)};
  flex-shrink: 0;

  @media (max-width: ${LOUNGE_LAYOUT.mobileBreakpoint}px) {
    padding-left: 3.5rem; /* Make room for mobile menu button */
    position: sticky;
    top: 0;
    z-index: 50;
  }
`;

const ChannelInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${(props) => props.theme.foreground};
  min-width: 0; /* Allow text truncation */
  flex: 1;
`;

const ChannelName = styled.h1`
  font-family: var(--font-mono);
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: -0.05em;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

const TopBarActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const TopBarButton = styled.button<{ $isActive?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  background: ${(props) =>
    props.$isActive
      ? (
          props.theme.background === "#fff"
            ? "rgba(144, 116, 242, 0.12)"
            : LOUNGE_COLORS.channelActive
        )
      : "transparent"};
  border: none;
  border-radius: 6px;
  color: ${(props) =>
    props.$isActive
      ? LOUNGE_COLORS.tier1
      : (props.theme.background === "#fff" ? "rgba(0,0,0,0.5)" : "rgba(255, 255, 255, 0.6)")};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${(props) => (props.theme.background === "#fff" ? "rgba(0,0,0,0.06)" : LOUNGE_COLORS.channelHover)};
    color: ${(props) => props.theme.foreground};
  }
`;
