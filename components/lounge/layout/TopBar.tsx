import styled from "styled-components";
import { Hash, Megaphone, Sparkles, Users, type LucideIcon } from "lucide-react";
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
        <Icon style={{ marginLeft: '8px', marginRight: '2px' }} size={14} />
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
  background: ${LOUNGE_COLORS.glassBackground};
  border-bottom: 1px solid ${LOUNGE_COLORS.glassBorder};

  @media (max-width: ${LOUNGE_LAYOUT.mobileBreakpoint}px) {
    padding-left: 3.5rem; /* Make room for mobile menu button */
  }
`;

const ChannelInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #fff;
`;

const ChannelName = styled.h1`
  font-family: 'Fira Code', monospace;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: -0.05em;
  margin: 0;
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
    props.$isActive ? LOUNGE_COLORS.channelActive : "transparent"};
  border: none;
  border-radius: 6px;
  color: ${(props) =>
    props.$isActive ? LOUNGE_COLORS.tier1 : "rgba(255, 255, 255, 0.6)"};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${LOUNGE_COLORS.channelHover};
    color: #fff;
  }
`;
