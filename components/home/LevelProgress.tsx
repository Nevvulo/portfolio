import { useQuery as useRQ } from "@tanstack/react-query";
import { ArrowUp } from "lucide-react";
import styled from "styled-components";
import { getMyExperience } from "@/src/db/actions/experience";
import { SupporterBadges } from "../badges/supporter-badges";

// Level color tiers
function getLevelColor(level: number): string {
  if (level <= 5) return "#b0b0b0";       // light grey
  if (level <= 15) return "#5b8def";       // blue
  if (level <= 25) return "#9074f2";       // purple
  if (level <= 35) return "#f5c842";       // yellow
  if (level <= 45) return "#f87171";       // light red
  return "#f9a8d4";                         // light pink
}

interface LevelProgressProps {
  displayName?: string;
  compact?: boolean;
  showBadges?: boolean;
  /** Override level for testing */
  mockLevel?: number;
}

export function LevelProgress({ displayName, compact, showBadges, mockLevel }: LevelProgressProps) {
  const { data: experience } = useRQ({
    queryKey: ["myExperience"],
    queryFn: () => getMyExperience(),
    staleTime: 30_000,
  });

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

  const level = mockLevel ?? experience.level;
  const levelColor = getLevelColor(level);
  const isShimmering = level > 45;

  if (compact) {
    return (
      <CompactWrapper>
        <CompactLevelBadge $color={levelColor}>
          <ArrowUp size={12} />
          {isShimmering ? (
            <ShimmerText $color={levelColor}>Level {level}</ShimmerText>
          ) : (
            <span>Level {level}</span>
          )}
        </CompactLevelBadge>
        <CompactXp>{experience.currentXp} / {experience.xpForNextLevel} XP</CompactXp>
        <CompactProgressBar>
          <CompactProgressFill $percent={experience.progressPercent} $color={levelColor} />
        </CompactProgressBar>
        {showBadges && <SupporterBadges size="small" showLabels />}
      </CompactWrapper>
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
        <LevelBadge $color={levelColor}>
          <ArrowUp size={14} />
          {isShimmering ? (
            <ShimmerText $color={levelColor}>Level {level}</ShimmerText>
          ) : (
            <span>Level {level}</span>
          )}
        </LevelBadge>
        <XpText>
          {experience.currentXp} / {experience.xpForNextLevel} XP
        </XpText>
      </LevelRow>
      <ProgressBarContainer>
        <ProgressBarFill $percent={experience.progressPercent} $color={levelColor} />
      </ProgressBarContainer>
    </Container>
  );
}

const ShimmerText = styled.span<{ $color: string }>`
  background: linear-gradient(
    90deg,
    ${(p) => p.$color} 0%,
    rgba(255, 255, 255, 0.9) 45%,
    rgba(255, 255, 255, 0.9) 55%,
    ${(p) => p.$color} 100%
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: textShimmer 2.5s ease-in-out infinite;

  @keyframes textShimmer {
    0% { background-position: 100% 0; }
    100% { background-position: -100% 0; }
  }
`;

const CompactWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  row-gap: 6px;
  min-height: 26px;
`;

const CompactLevelBadge = styled.div<{ $color: string }>`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 700;
  color: ${(p) => p.$color};
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

const CompactProgressFill = styled.div<{ $percent: number; $color: string }>`
  height: 100%;
  width: ${(props) => props.$percent}%;
  background: ${(p) => p.$color};
  border-radius: 2px;
  transition: width 0.5s ease;
`;

const CompactSkeleton = styled.div`
  width: 280px;
  height: 26px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 6px;
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

const LevelBadge = styled.div<{ $color: string }>`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: ${(p) => p.$color};
  background: ${(p) => p.$color}15;
  padding: 4px 10px;
  border-radius: 6px;
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

const ProgressBarFill = styled.div<{ $percent: number; $color: string }>`
  height: 100%;
  width: ${(props) => props.$percent}%;
  background: linear-gradient(
    90deg,
    ${(p) => p.$color} 0%,
    ${(p) => p.$color}cc 100%
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
