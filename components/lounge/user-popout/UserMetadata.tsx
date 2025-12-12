import styled from "styled-components";
import { Calendar } from "lucide-react";
import type { DiscordRole } from "../../../types/supporter";

interface UserMetadataProps {
  createdAt: number;
  discordHighestRole?: DiscordRole | null;
}

/**
 * Format a timestamp to a readable date
 */
function formatJoinDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Convert Discord integer color to hex string
 */
function discordColorToHex(color: number): string {
  if (color === 0) return "#99AAB5"; // Default Discord gray
  return `#${color.toString(16).padStart(6, "0")}`;
}

/**
 * Display user metadata (join date, Discord role)
 */
export function UserMetadata({
  createdAt,
  discordHighestRole,
}: UserMetadataProps) {
  return (
    <MetadataContainer>
      {/* Join date */}
      <MetadataItem>
        <MetadataIcon>
          <Calendar size={12} />
        </MetadataIcon>
        <MetadataText>
          Member since {formatJoinDate(createdAt)}
        </MetadataText>
      </MetadataItem>

      {/* Discord role */}
      {discordHighestRole && (
        <MetadataItem>
          <RoleDot $color={discordColorToHex(discordHighestRole.color)} />
          <MetadataText>{discordHighestRole.name}</MetadataText>
        </MetadataItem>
      )}
    </MetadataContainer>
  );
}

const MetadataContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const MetadataItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const MetadataIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.4);
`;

const MetadataText = styled.span`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
`;

const RoleDot = styled.div<{ $color: string }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${(p) => p.$color};
  flex-shrink: 0;
`;

export default UserMetadata;
