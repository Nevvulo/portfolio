import styled from "styled-components";
import { LOUNGE_COLORS } from "../../../constants/lounge";
import type { PresenceStatus } from "../../../types/lounge";

interface UserAvatarProps {
  avatarUrl?: string;
  displayName: string;
  status: PresenceStatus;
  size?: number;
  showPresence?: boolean;
}

/**
 * User avatar with presence indicator
 */
export function UserAvatar({
  avatarUrl,
  displayName,
  status,
  size = 64,
  showPresence = true,
}: UserAvatarProps) {
  // Generate initials from display name
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <AvatarContainer $size={size}>
      {avatarUrl ? (
        <AvatarImage src={avatarUrl} alt={displayName} $size={size} />
      ) : (
        <AvatarFallback $size={size}>{initials}</AvatarFallback>
      )}
      {showPresence && <PresenceIndicator $status={status} $size={size} />}
    </AvatarContainer>
  );
}

const AvatarContainer = styled.div<{ $size: number }>`
  position: relative;
  width: ${(p) => p.$size}px;
  height: ${(p) => p.$size}px;
  flex-shrink: 0;
`;

const AvatarImage = styled.img<{ $size: number }>`
  width: ${(p) => p.$size}px;
  height: ${(p) => p.$size}px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid ${LOUNGE_COLORS.glassBackground};
  background: ${LOUNGE_COLORS.glassBorder};
`;

const AvatarFallback = styled.div<{ $size: number }>`
  width: ${(p) => p.$size}px;
  height: ${(p) => p.$size}px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${LOUNGE_COLORS.tier1}, ${LOUNGE_COLORS.tier2});
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: ${(p) => p.$size * 0.35}px;
  color: #fff;
  border: 3px solid ${LOUNGE_COLORS.glassBackground};
`;

const PresenceIndicator = styled.div<{ $status: PresenceStatus; $size: number }>`
  position: absolute;
  bottom: ${(p) => p.$size * 0.03}px;
  right: ${(p) => p.$size * 0.03}px;
  width: ${(p) => Math.max(10, p.$size * 0.2)}px;
  height: ${(p) => Math.max(10, p.$size * 0.2)}px;
  border-radius: 50%;
  background-color: ${(p) => {
    switch (p.$status) {
      case "online":
        return LOUNGE_COLORS.online;
      case "away":
        return LOUNGE_COLORS.away;
      case "offline":
      default:
        return LOUNGE_COLORS.offline;
    }
  }};
  border: 2px solid ${LOUNGE_COLORS.glassBackground};
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
`;

export default UserAvatar;
