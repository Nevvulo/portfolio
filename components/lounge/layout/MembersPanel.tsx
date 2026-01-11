import { useQuery } from "convex/react";
import { Circle, Crown, Star, User } from "lucide-react";
import styled, { keyframes } from "styled-components";
import { LOUNGE_COLORS, TIER_INFO } from "../../../constants/lounge";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useUserPopout } from "../../../hooks/lounge/useUserPopout";
import type { Tier } from "../../../types/lounge";

interface OnlineMember {
  _id: Id<"users">;
  displayName: string;
  avatarUrl?: string;
  tier: Tier;
  isCreator: boolean;
  status: "online" | "offline" | "away";
  discordHighestRole?: {
    id: string;
    name: string;
    color: number;
    position: number;
  };
  discordBooster?: boolean;
}

export function MembersPanel() {
  const onlineMembers = useQuery(api.users.getOnlineMembers) as OnlineMember[] | undefined;
  const { open: openPopout } = useUserPopout();

  // Group members by tier
  const tier2Members = onlineMembers?.filter((m) => m.tier === "tier2") ?? [];
  const tier1Members = onlineMembers?.filter((m) => m.tier === "tier1") ?? [];
  const freeMembers = onlineMembers?.filter((m) => m.tier === "free") ?? [];

  const handleMemberClick = (member: OnlineMember, e: React.MouseEvent<HTMLDivElement>) => {
    openPopout(member._id, e.currentTarget);
  };

  return (
    <PanelContainer>
      <PanelHeader>Members</PanelHeader>

      {/* Super Legend II Members */}
      {tier2Members.length > 0 && (
        <MemberGroup>
          <GroupHeader>
            <Crown size={12} />
            <span>SUPER LEGEND II — {tier2Members.length}</span>
          </GroupHeader>
          {tier2Members.map((member) => (
            <MemberItem key={member._id} onClick={(e) => handleMemberClick(member, e)}>
              <AvatarWrapper>
                <Avatar src={member.avatarUrl} alt={member.displayName} />
                <StatusIndicator $status={member.status} />
              </AvatarWrapper>
              <MemberInfo>
                <MemberName $tier="tier2">{member.displayName}</MemberName>
              </MemberInfo>
            </MemberItem>
          ))}
        </MemberGroup>
      )}

      {/* Super Legend I Members */}
      {tier1Members.length > 0 && (
        <MemberGroup>
          <GroupHeader>
            <Star size={12} />
            <span>SUPER LEGEND I — {tier1Members.length}</span>
          </GroupHeader>
          {tier1Members.map((member) => (
            <MemberItem key={member._id} onClick={(e) => handleMemberClick(member, e)}>
              <AvatarWrapper>
                <Avatar src={member.avatarUrl} alt={member.displayName} />
                <StatusIndicator $status={member.status} />
              </AvatarWrapper>
              <MemberInfo>
                <MemberName $tier="tier1">{member.displayName}</MemberName>
              </MemberInfo>
            </MemberItem>
          ))}
        </MemberGroup>
      )}

      {/* Free Members */}
      {freeMembers.length > 0 && (
        <MemberGroup>
          <GroupHeader>
            <User size={12} />
            <span>MEMBERS — {freeMembers.length}</span>
          </GroupHeader>
          {freeMembers.map((member) => {
            // Free members get their Discord role color if they have one, otherwise grey
            const customColor =
              member.discordHighestRole?.color && member.discordHighestRole.color !== 0
                ? `#${member.discordHighestRole.color.toString(16).padStart(6, "0")}`
                : undefined;
            return (
              <MemberItem key={member._id} onClick={(e) => handleMemberClick(member, e)}>
                <AvatarWrapper>
                  <Avatar src={member.avatarUrl} alt={member.displayName} />
                  <StatusIndicator $status={member.status} />
                </AvatarWrapper>
                <MemberInfo>
                  <MemberName $tier="free" $customColor={customColor}>
                    {member.displayName}
                  </MemberName>
                </MemberInfo>
              </MemberItem>
            );
          })}
        </MemberGroup>
      )}

      {/* Loading skeleton */}
      {onlineMembers === undefined && (
        <MemberGroup>
          <GroupHeader>
            <SkeletonBox style={{ width: 60, height: 12 }} />
          </GroupHeader>
          {[1, 2, 3].map((i) => (
            <MemberItem key={i} as="div" style={{ cursor: "default" }}>
              <SkeletonAvatar />
              <MemberInfo>
                <SkeletonBox style={{ width: `${50 + i * 15}%`, height: 14 }} />
              </MemberInfo>
            </MemberItem>
          ))}
        </MemberGroup>
      )}

      {/* Empty state - only show after loading */}
      {onlineMembers !== undefined && onlineMembers.length === 0 && (
        <EmptyState>
          <Circle size={24} />
          <span>No members online</span>
        </EmptyState>
      )}
    </PanelContainer>
  );
}

// Styled Components
const PanelContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0;
  overflow-y: auto;
`;

const PanelHeader = styled.div`
  padding: 1rem;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${(props) => (props.theme.background === "#fff" ? "rgba(0,0,0,0.6)" : "rgba(255, 255, 255, 0.6)")};
  border-bottom: 1px solid ${(props) => (props.theme.background === "#fff" ? "rgba(0,0,0,0.08)" : LOUNGE_COLORS.glassBorder)};
`;

const MemberGroup = styled.div`
  padding: 0.5rem;
`;

const GroupHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${(props) => (props.theme.background === "#fff" ? "rgba(0,0,0,0.5)" : "rgba(255, 255, 255, 0.5)")};
`;

const MemberItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: ${(props) => (props.theme.background === "#fff" ? "rgba(0,0,0,0.04)" : LOUNGE_COLORS.channelHover)};
  }
`;

const AvatarWrapper = styled.div`
  position: relative;
  width: 32px;
  height: 32px;
`;

const Avatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  background: ${LOUNGE_COLORS.glassBorder};
`;

const StatusIndicator = styled.div<{ $status: "online" | "offline" | "away" }>`
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${(props) => {
    switch (props.$status) {
      case "online":
        return LOUNGE_COLORS.online;
      case "away":
        return LOUNGE_COLORS.away;
      case "offline":
      default:
        return LOUNGE_COLORS.offline;
    }
  }};
  border: 2px solid ${(props) => (props.theme.background === "#fff" ? "#f5f3fa" : LOUNGE_COLORS.glassBackground)};
`;

const MemberInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const MemberName = styled.div<{ $tier: Tier; $customColor?: string }>`
  font-size: 0.9rem;
  font-weight: 500;
  color: ${(props) => {
    if (props.$customColor) return props.$customColor;
    return TIER_INFO[props.$tier]?.color || "#9CA3AF";
  }};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  color: ${(props) => (props.theme.background === "#fff" ? "rgba(0,0,0,0.4)" : "rgba(255, 255, 255, 0.4)")};
  font-size: 0.85rem;
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const SkeletonBox = styled.div`
  background: linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s ease-in-out infinite;
  border-radius: 4px;
`;

const SkeletonAvatar = styled(SkeletonBox)`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
`;
