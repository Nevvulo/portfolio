import { useQuery } from "convex/react";
import { Star } from "lucide-react";
import styled from "styled-components";
import { api } from "../../convex/_generated/api";
import { BadgeType } from "../../constants/badges";
import { LOUNGE_COLORS } from "../../constants/theme";
import type { Tier } from "../../types/tiers";
import { SupporterBadge } from "../badges/supporter-badge";

interface LevelProgressProps {
  displayName?: string;
  compact?: boolean;
  tier?: Tier;
}

export function LevelProgress({ displayName, compact, tier }: LevelProgressProps) {
  const isSuperLegend = tier === "tier1" || tier === "tier2";
  const experience = useQuery(api.experience.getMyExperience);

  if (!experience) {
    if (compact) {
      return <CompactSkeleton />;
    }
    return (
      <Container>
        <WelcomeRow>
          <WelcomeText>Welcome back{displayName ? `, ${displayName.split(" ")[0]}` : ""}!</WelcomeText>
        </WelcomeRow>
        <SkeletonBar />
      </Container>
    );
  }

  if (compact) {
    return (
      <CompactContainer>
        {isSuperLegend && (
          <SupporterBadge
            type={tier === "tier2" ? BadgeType.SUPER_LEGEND_2 : BadgeType.SUPER_LEGEND}
            size="small"
            showLabel
          />
        )}
        <CompactLevelBadge>
          <Star size={12} />
          <span>Level {experience.level}</span>
        </CompactLevelBadge>
        <CompactXp>{experience.currentXp} / {experience.xpForNextLevel} XP</CompactXp>
        <CompactProgressBar>
          <CompactProgressFill $percent={experience.progressPercent} />
        </CompactProgressBar>
      </CompactContainer>
    );
  }

  return (
    <Container>
      <WelcomeRow>
        <WelcomeText>
          Welcome back{displayName ? `, ${displayName.split(" ")[0]}` : ""}!
        </WelcomeText>
      </WelcomeRow>
      <LevelRow>
        <LevelBadge>
          <Star size={14} />
          <span>Level {experience.level}</span>
        </LevelBadge>
        <XpText>
          {experience.currentXp} / {experience.xpForNextLevel} XP
        </XpText>
      </LevelRow>
      <ProgressBarContainer>
        <ProgressBarFill $percent={experience.progressPercent} />
      </ProgressBarContainer>
    </Container>
  );
}

// Compact styles for inline header display
const CompactContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const CompactLevelBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: ${LOUNGE_COLORS.tier1};

  svg {
    fill: ${LOUNGE_COLORS.tier1};
  }
`;

const CompactXp = styled.span`
  font-size: 12px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.6;
  font-family: var(--font-mono);
`;

const CompactProgressBar = styled.div`
  width: 100px;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;

  @media (max-width: 480px) {
    display: none;
  }
`;

const CompactProgressFill = styled.div<{ $percent: number }>`
  height: 100%;
  width: ${(props) => props.$percent}%;
  background: ${LOUNGE_COLORS.tier1};
  border-radius: 2px;
  transition: width 0.5s ease;
`;

const CompactSkeleton = styled.div`
  width: 120px;
  height: 16px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  animation: pulse 1.5s ease-in-out infinite;

  @keyframes pulse {
    0%,
    100% {
      opacity: 0.6;
    }
    50% {
      opacity: 1;
    }
  }
`;

// Full styles for standalone display
const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.06);
`;

const WelcomeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const WelcomeText = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: white;
  font-family: var(--font-sans);
`;

const LevelRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const LevelBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: ${LOUNGE_COLORS.tier1};
  background: ${LOUNGE_COLORS.tier1}15;
  padding: 4px 10px;
  border-radius: 6px;

  svg {
    fill: ${LOUNGE_COLORS.tier1};
  }
`;

const XpText = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
  font-family: var(--font-mono);
`;

const ProgressBarContainer = styled.div`
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  overflow: hidden;
`;

const ProgressBarFill = styled.div<{ $percent: number }>`
  height: 100%;
  width: ${(props) => props.$percent}%;
  background: linear-gradient(
    90deg,
    ${LOUNGE_COLORS.tier1} 0%,
    ${LOUNGE_COLORS.tier1}cc 100%
  );
  border-radius: 3px;
  transition: width 0.5s ease;
`;

const SkeletonBar = styled.div`
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  animation: pulse 1.5s ease-in-out infinite;

  @keyframes pulse {
    0%,
    100% {
      opacity: 0.6;
    }
    50% {
      opacity: 1;
    }
  }
`;
