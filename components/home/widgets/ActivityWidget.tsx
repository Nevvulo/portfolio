import { useQuery as useRQ } from "@tanstack/react-query";
import { Flame, TrendingUp } from "lucide-react";
import styled from "styled-components";
import { getMyExperience } from "@/src/db/actions/experience";
import { getTodayXpBreakdownAction } from "@/src/db/actions/dashboard";
import { LOUNGE_COLORS } from "../../../constants/theme";
import { WidgetContainer } from "./WidgetContainer";

export function ActivityWidget() {
  const { data: experience } = useRQ({
    queryKey: ["myExperience"],
    queryFn: () => getMyExperience(),
    staleTime: 30_000,
  });
  const { data: todayBreakdown } = useRQ({
    queryKey: ["todayXpBreakdown"],
    queryFn: () => getTodayXpBreakdownAction(),
    staleTime: 30_000,
  });

  const todayXp = todayBreakdown?.total ?? 0;
  const level = experience?.level ?? 1;
  const currentXp = experience?.currentXp ?? 0;
  const xpForNext = experience?.xpForNextLevel ?? 10;
  const progressPercent = experience?.progressPercent ?? 0;
  const xpRemaining = xpForNext - currentXp;

  return (
    <WidgetContainer title="Activity" icon={<TrendingUp size={16} />} variant={todayXp > 0 ? "accent" : "default"}>
      <LevelBox>
        <LevelLeft>
          <LevelXpMain>{currentXp} / {xpForNext} XP</LevelXpMain>
          {todayXp > 0 && <TodayXp>+{todayXp} today</TodayXp>}
        </LevelLeft>
        <LevelRight>
          <LevelLabel>LVL</LevelLabel>
          <LevelNumber>{level}</LevelNumber>
        </LevelRight>
      </LevelBox>

      <ProgressSection>
        <ProgressHeader>
          <ProgressLabel>Progress</ProgressLabel>
          <ProgressRemaining>{xpRemaining} to next level</ProgressRemaining>
          <ProgressPercent>{progressPercent}%</ProgressPercent>
        </ProgressHeader>
        <ProgressBar>
          <ProgressFill $percent={progressPercent} />
        </ProgressBar>
      </ProgressSection>

      {todayBreakdown && todayXp > 0 && (
        <BreakdownSection>
          <BreakdownHeader>Today's breakdown</BreakdownHeader>
          <BreakdownList>
            {todayBreakdown.post_view > 0 && (
              <BreakdownItem>
                <BreakdownName>Reading</BreakdownName>
                <BreakdownValue>+{todayBreakdown.post_view} XP</BreakdownValue>
              </BreakdownItem>
            )}
            {todayBreakdown.reaction > 0 && (
              <BreakdownItem>
                <BreakdownName>Reactions</BreakdownName>
                <BreakdownValue>+{todayBreakdown.reaction} XP</BreakdownValue>
              </BreakdownItem>
            )}
            {todayBreakdown.comment > 0 && (
              <BreakdownItem>
                <BreakdownName>Comments</BreakdownName>
                <BreakdownValue>+{todayBreakdown.comment} XP</BreakdownValue>
              </BreakdownItem>
            )}
            {todayBreakdown.time_on_site > 0 && (
              <BreakdownItem>
                <BreakdownName>Time spent</BreakdownName>
                <BreakdownValue>+{todayBreakdown.time_on_site} XP</BreakdownValue>
              </BreakdownItem>
            )}
          </BreakdownList>
        </BreakdownSection>
      )}

      {todayXp === 0 && (
        <EmptyState>
          <Flame size={20} />
          <EmptyText>Start earning XP by exploring content!</EmptyText>
        </EmptyState>
      )}
    </WidgetContainer>
  );
}

const LevelBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
`;

const LevelLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const LevelXpMain = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: ${(p) => p.theme.contrast};
  font-family: var(--font-mono);
`;

const LevelRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
`;

const LevelLabel = styled.span`
  font-size: 10px;
  font-weight: 800;
  color: ${LOUNGE_COLORS.tier1};
  text-transform: uppercase;
  letter-spacing: 1.5px;
  line-height: 1;
`;

const LevelNumber = styled.span`
  font-size: 28px;
  font-weight: 800;
  color: ${(p) => p.theme.contrast};
  font-family: var(--font-mono);
  line-height: 1;
  margin-top: 1px;
`;

const TodayXp = styled.span`
  font-size: 11px;
  font-weight: 500;
  color: ${LOUNGE_COLORS.online};
`;

const ProgressSection = styled.div`
  margin-top: 14px;
`;

const ProgressHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  gap: 8px;
`;

const ProgressLabel = styled.span`
  font-size: 12px;
  color: ${(p) => p.theme.textColor};
  opacity: 0.6;
`;

const ProgressRemaining = styled.span`
  font-size: 11px;
  color: ${(p) => p.theme.textColor};
  opacity: 0.4;
  flex: 1;
  text-align: center;
`;

const ProgressPercent = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${LOUNGE_COLORS.tier1};
  font-family: var(--font-mono);
`;

const ProgressBar = styled.div`
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $percent: number }>`
  height: 100%;
  width: ${(p) => p.$percent}%;
  background: linear-gradient(90deg, ${LOUNGE_COLORS.tier1}, ${LOUNGE_COLORS.tier1}bb);
  border-radius: 3px;
  transition: width 0.5s ease;
`;

const BreakdownSection = styled.div`
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
`;

const BreakdownHeader = styled.span`
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: ${(p) => p.theme.textColor};
  opacity: 0.5;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
`;

const BreakdownList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const BreakdownItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const BreakdownName = styled.span`
  font-size: 12px;
  color: ${(p) => p.theme.textColor};
  opacity: 0.7;
`;

const BreakdownValue = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: ${LOUNGE_COLORS.online};
  font-family: var(--font-mono);
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 10px;
  text-align: center;

  svg {
    color: ${(p) => p.theme.textColor};
    opacity: 0.3;
  }
`;

const EmptyText = styled.span`
  font-size: 12px;
  color: ${(p) => p.theme.textColor};
  opacity: 0.5;
`;
