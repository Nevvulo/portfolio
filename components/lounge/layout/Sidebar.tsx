import Link from "next/link";
import Image from "next/image";
import styled, { keyframes } from "styled-components";
import {
  Megaphone,
  MessageCircle,
  Sparkles,
  Crown,
  Star,
  Hash,
  Settings,
  Gift,
  BellIcon,
  HelpCircle,
  TreePalm,
  ChevronDown,
} from "lucide-react";
import { useQuery } from "convex/react";
import { useClerk } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import { LOUNGE_COLORS, TIER_INFO } from "../../../constants/lounge";
import type { Tier, ChannelWithAccess } from "../../../types/lounge";
import { SupporterBadges } from "../../badges/supporter-badges";
import { Tooltip } from "../ui/Tooltip";
import { useSidebarStore } from "../../../hooks/lounge/useSidebarStore";
import NevuloLogo from "../../../assets/svg/nevulo-huge-bold-svg.svg";

interface SidebarProps {
  currentChannelSlug?: string;
  onChannelSelect?: () => void;
  userTier: Tier | null;
  isCreator: boolean;
  displayName: string;
  avatarUrl?: string;
}

// Icon mapping - using LucideIcon type
const CHANNEL_ICONS: Record<string, typeof Hash> = {
  megaphone: Megaphone,
  "message-circle": MessageCircle,
  sparkles: Sparkles,
  crown: Crown,
  star: Star,
  hash: Hash,
};

// Unread counts type
type UnreadCounts = Record<string, { messages: number; mentions: number }>;

export function Sidebar({
  currentChannelSlug,
  onChannelSelect,
  userTier,
  isCreator,
  displayName,
  avatarUrl,
}: SidebarProps) {
  const { openUserProfile } = useClerk();
  const channels = useQuery(api.channels.list) as ChannelWithAccess[] | undefined;
  const unreadCounts = useQuery(api.messages.getUnreadCounts) as UnreadCounts | undefined;
  const { toggleCategory, isCollapsed } = useSidebarStore();

  // Sort all channels by order (from DB)
  const allChannels = [...(channels ?? [])].sort((a, b) => a.order - b.order);

  // Helper to get unread data for a channel
  const getUnreadData = (channelId: string) => {
    return unreadCounts?.[channelId] ?? { messages: 0, mentions: 0 };
  };

  const handleChannelClick = (channel: ChannelWithAccess) => {
    if (channel.hasAccess) {
      onChannelSelect?.();
    }
  };

  return (
    <SidebarContainer>
      {/* Header */}
      <SidebarHeader>
        <LogoImage>
          <Image
            src={NevuloLogo}
            alt="Nevulo Logo"
            width={16}
            height={16}
          />
        </LogoImage>
        <LogoText>nevulounge</LogoText>
        <LogoText style={{ color: '#d8bfff' }}>beta</LogoText>
      </SidebarHeader>

      {/* Channel List */}
      <ChannelList>
        <ChannelGroup>
          <ChannelGroupHeader
            onClick={() => toggleCategory("channels")}
            $isCollapsible
          >
            <CollapseIcon $isCollapsed={isCollapsed("channels")}>
              <ChevronDown size={12} />
            </CollapseIcon>
            Channels
          </ChannelGroupHeader>
          <ChannelGroupContent $isCollapsed={isCollapsed("channels")}>
            {/* Loading skeleton */}
            {channels === undefined && (
              <>
                {[1, 2, 3, 4, 5].map((i) => (
                  <SkeletonChannel key={i}>
                    <SkeletonIcon />
                    <SkeletonText style={{ width: `${40 + i * 10}%` }} />
                  </SkeletonChannel>
                ))}
              </>
            )}
            {allChannels.map((channel) => {
              const unread = getUnreadData(channel._id);
              const isActive = currentChannelSlug === channel.slug;
              const hasUnread = !isActive && !channel.isLocked && unread.messages > 0;
              const hasMentions = !isActive && !channel.isLocked && unread.mentions > 0;

              return (
                <ChannelItem
                  key={channel._id}
                  $isActive={isActive}
                  $isLocked={channel.isLocked}
                  $hasUnread={hasUnread}
                  onClick={() => handleChannelClick(channel)}
                >
                  {hasUnread && <UnreadPill />}
                  {channel.isLocked ? (
                    <LockedChannelContent>
                      <ChannelIcon channel={channel} />
                      <ChannelName $hasUnread={false}>{channel.name}</ChannelName>
                      <TierBadge $tier={channel.requiredTier}>
                        {channel.requiredTier === "tier2" ? <Crown size={10} /> : <Star size={10} />}
                      </TierBadge>
                    </LockedChannelContent>
                  ) : (
                    <ChannelLinkWrapper href={`/lounge/${channel.slug}`}>
                      <ChannelIcon channel={channel} />
                      <ChannelName $hasUnread={hasUnread}>{channel.name}</ChannelName>
                      {hasMentions && (
                        <MentionBadge>{unread.mentions}</MentionBadge>
                      )}
                    </ChannelLinkWrapper>
                  )}
                </ChannelItem>
              );
            })}
          </ChannelGroupContent>
        </ChannelGroup>
      </ChannelList>

      {/* Quick Actions */}
      <QuickActions>
        <Tooltip content="Rewards" position="top">
          <QuickActionButton href="/lounge/rewards">
            <Gift size={16} />
          </QuickActionButton>
        </Tooltip>
        <Tooltip content="Notifications" position="top">
          <QuickActionButton href="/lounge/notifications">
            <BellIcon size={16} />
          </QuickActionButton>
        </Tooltip>
        <Tooltip content="Help" position="top">
          <QuickActionButton href="/lounge/help">
            <HelpCircle size={16} />
          </QuickActionButton>
        </Tooltip>
        <Tooltip content="Jungle" position="top">
          <QuickActionButton href="/lounge/jungle">
            <TreePalm size={16} />
          </QuickActionButton>
        </Tooltip>
{/* Events - hidden for now
        <Tooltip content="Events" position="top">
          <QuickActionButton href="/lounge/events">
            <Calendar1Icon size={16} />
          </QuickActionButton>
        </Tooltip>
*/}
        {isCreator && (
          <Tooltip content="Admin" position="top">
            <QuickActionButton href="/lounge/admin">
              <Settings size={16} />
            </QuickActionButton>
          </Tooltip>
        )}
      </QuickActions>

      {/* User Info */}
      <UserSection onClick={() => openUserProfile()}>
        <UserAvatar src={avatarUrl} alt={displayName} />
        <UserInfo>
          <UserNameRow>
            <UserName>{displayName}</UserName>
            <SupporterBadges size="small" />
          </UserNameRow>
          <UserTier $tier={userTier ?? "tier1"}>
            {TIER_INFO[userTier ?? "tier1"].name}
          </UserTier>
        </UserInfo>
      </UserSection>
    </SidebarContainer>
  );
}

// Channel Icon component
function ChannelIcon({ channel }: { channel: ChannelWithAccess }) {
  const IconComponent = CHANNEL_ICONS[channel.icon ?? "hash"] ?? Hash;
  return <IconComponent size={18} />;
}

// Styled Components
const SidebarContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0;
`;

const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid ${(props) => props.theme.background === "#fff" ? "rgba(0,0,0,0.08)" : LOUNGE_COLORS.glassBorder};
`;

const LogoImage = styled.div`
  margin-right: 8px;
  display: flex;
  align-items: center;
  filter: ${(props) => props.theme.background === "#fff" ? "invert(1)" : "none"};
`;

const LogoText = styled.h2`
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 400;
  color: ${(props) => props.theme.background === "#fff" ? "rgba(0,0,0,0.6)" : "rgba(255, 255, 255, 0.6)"};
  margin: 0;
  letter-spacing: -0.5px;
`;

const ChannelList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
`;

const ChannelGroup = styled.div`
  margin-bottom: 1rem;
`;

const ChannelGroupHeader = styled.div<{ $isCollapsible?: boolean }>`
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${(props) => props.theme.background === "#fff" ? "rgba(0,0,0,0.5)" : "rgba(255, 255, 255, 0.5)"};
  cursor: ${(props) => (props.$isCollapsible ? "pointer" : "default")};
  user-select: none;
  border-radius: 4px;
  transition: background 0.15s ease;

  &:hover {
    background: ${(props) =>
      props.$isCollapsible ? (props.theme.background === "#fff" ? "rgba(0,0,0,0.04)" : "rgba(255, 255, 255, 0.05)") : "transparent"};
  }
`;

const CollapseIcon = styled.span<{ $isCollapsed: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 4px;
  transition: transform 0.2s ease;
  transform: ${(props) => (props.$isCollapsed ? "rotate(-90deg)" : "rotate(0)")};
`;

const ChannelGroupContent = styled.div<{ $isCollapsed: boolean }>`
  overflow: hidden;
  max-height: ${(props) => (props.$isCollapsed ? "0" : "500px")};
  opacity: ${(props) => (props.$isCollapsed ? 0 : 1)};
  transition: max-height 0.2s ease, opacity 0.15s ease;
`;

const ChannelItem = styled.div<{ $isActive: boolean; $isLocked: boolean; $hasUnread?: boolean }>`
  position: relative;
  border-radius: 6px;
  margin-bottom: 2px;
  background: ${(props) =>
    props.$isActive ? (props.theme.background === "#fff" ? "rgba(144, 116, 242, 0.12)" : LOUNGE_COLORS.channelActive) : "transparent"};
  opacity: ${(props) => (props.$isLocked ? 0.5 : 1)};
  cursor: ${(props) => (props.$isLocked ? "not-allowed" : "pointer")};
  transition: all 0.15s ease;

  &:hover {
    background: ${(props) =>
      props.$isLocked
        ? LOUNGE_COLORS.channelLocked
        : props.$isActive
          ? (props.theme.background === "#fff" ? "rgba(144, 116, 242, 0.12)" : LOUNGE_COLORS.channelActive)
          : (props.theme.background === "#fff" ? "rgba(0,0,0,0.04)" : LOUNGE_COLORS.channelHover)};
  }
`;

const UnreadPill = styled.div`
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 8px;
  background: #fff;
  border-radius: 0 4px 4px 0;
`;

const ChannelLinkWrapper = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  color: ${(props) => props.theme.background === "#fff" ? "rgba(0,0,0,0.7)" : "rgba(255, 255, 255, 0.8)"};
  text-decoration: none;

  &:hover {
    color: ${(props) => props.theme.foreground};
  }
`;

const LockedChannelContent = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  color: ${(props) => props.theme.background === "#fff" ? "rgba(0,0,0,0.4)" : "rgba(255, 255, 255, 0.4)"};
`;

const ChannelName = styled.span<{ $hasUnread?: boolean }>`
  font-family: var(--font-mono);
  font-size: 0.85rem;
  font-weight: ${(props) => (props.$hasUnread ? 600 : 300)};
  letter-spacing: -0.065em;
  flex: 1;
  color: ${(props) => (props.$hasUnread ? (props.theme.background === "#fff" ? "#1a1625" : "#fff") : "inherit")};
`;

const MentionBadge = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: #ed4245;
  border-radius: 9px;
  font-size: 0.7rem;
  font-weight: 700;
  color: #fff;
  margin-left: auto;
`;

const TierBadge = styled.div<{ $tier: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px 6px;
  border-radius: 4px;
  background: ${(props) =>
    props.$tier === "tier2"
      ? `${LOUNGE_COLORS.tier2}20`
      : `${LOUNGE_COLORS.tier1}20`};
  color: ${(props) =>
    props.$tier === "tier2" ? LOUNGE_COLORS.tier2 : LOUNGE_COLORS.tier1};
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-left: auto;
`;

const QuickActions = styled.div`
  display: flex;
  align-self: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-top: 1px solid ${(props) => props.theme.background === "#fff" ? "rgba(0,0,0,0.08)" : LOUNGE_COLORS.glassBorder};
`;

const QuickActionButton = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 0;
  padding: 0.5rem;
  background: ${(props) => props.theme.background === "#fff" ? "rgba(144, 116, 242, 0.06)" : LOUNGE_COLORS.glassHighlight};
  border: 1px solid ${(props) => props.theme.background === "#fff" ? "rgba(0,0,0,0.08)" : LOUNGE_COLORS.glassBorder};
  border-radius: 6px;
  color: ${(props) => props.theme.background === "#fff" ? "rgba(0,0,0,0.6)" : "rgba(255, 255, 255, 0.7)"};
  font-size: 0.8rem;
  text-decoration: none;
  transition: all 0.15s ease;

  &:hover {
    background: ${(props) => props.theme.background === "#fff" ? "rgba(144, 116, 242, 0.12)" : LOUNGE_COLORS.channelHover};
    color: ${(props) => props.theme.foreground};
  }
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid ${(props) => props.theme.background === "#fff" ? "rgba(0,0,0,0.08)" : LOUNGE_COLORS.glassBorder};
  background: ${(props) => props.theme.background === "#fff" ? "rgba(0,0,0,0.03)" : "rgba(0, 0, 0, 0.2)"};
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: ${(props) => props.theme.background === "#fff" ? "rgba(0,0,0,0.06)" : "rgba(0, 0, 0, 0.35)"};
  }
`;

const UserAvatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  background: ${LOUNGE_COLORS.glassBorder};
`;

const UserInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const UserNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const UserName = styled.div`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${(props) => props.theme.foreground};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UserTier = styled.div<{ $tier: Tier }>`
  font-size: 0.7rem;
  color: ${(props) => TIER_INFO[props.$tier]?.color || "#9CA3AF"};
`;

// Skeleton loading components
const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const SkeletonChannel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  margin: 0 0.5rem;
`;

const SkeletonIcon = styled.div`
  width: 18px;
  height: 18px;
  border-radius: 4px;
  background: linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s ease-in-out infinite;
`;

const SkeletonText = styled.div`
  height: 14px;
  border-radius: 4px;
  background: linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s ease-in-out infinite;
`;
