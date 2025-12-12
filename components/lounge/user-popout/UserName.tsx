import styled from "styled-components";
import { LOUNGE_COLORS, TIER_INFO } from "../../../constants/lounge";
import type { Tier } from "../../../types/lounge";

interface UserNameProps {
  displayName: string;
  tier: Tier;
  isCreator?: boolean;
  customColor?: string; // For free users with Discord role colors
}

/**
 * User display name with tier-based gradient styling
 */
export function UserName({ displayName, tier, isCreator, customColor }: UserNameProps) {
  return (
    <NameContainer>
      <Name $tier={tier} $isCreator={isCreator} $customColor={customColor}>
        {displayName}
      </Name>
      {isCreator && <CreatorBadge>Creator</CreatorBadge>}
    </NameContainer>
  );
}

const NameContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const Name = styled.h3<{ $tier: Tier; $isCreator?: boolean; $customColor?: string }>`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.2;

  /* Gradient text for Super Legend tiers */
  ${(p) => {
    if (p.$isCreator) {
      // Special rainbow gradient for creator
      return `
        background: linear-gradient(
          90deg,
          ${LOUNGE_COLORS.tier2} 0%,
          ${LOUNGE_COLORS.tier1} 50%,
          ${LOUNGE_COLORS.tier2} 100%
        );
        background-size: 200% auto;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: shimmer 3s linear infinite;

        @keyframes shimmer {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
      `;
    }

    if (p.$tier === "tier2") {
      // Gold gradient for tier 2
      return `
        background: linear-gradient(
          135deg,
          ${LOUNGE_COLORS.tier2} 0%,
          #fcd34d 50%,
          ${LOUNGE_COLORS.tier2} 100%
        );
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      `;
    }

    if (p.$tier === "tier1") {
      // Purple gradient for tier 1
      return `
        background: linear-gradient(
          135deg,
          ${LOUNGE_COLORS.tier1} 0%,
          #a78bfa 50%,
          ${LOUNGE_COLORS.tier1} 100%
        );
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      `;
    }

    // Free tier - use custom color (Discord role) or grey
    if (p.$customColor) {
      return `color: ${p.$customColor};`;
    }
    return `color: ${TIER_INFO.free.color};`;
  }}
`;

const CreatorBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${LOUNGE_COLORS.tier2};
  background: ${LOUNGE_COLORS.tier2Background};
  border: 1px solid ${LOUNGE_COLORS.tier2};
  border-radius: 4px;
`;

export default UserName;
