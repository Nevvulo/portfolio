import { useQuery } from "convex/react";
import { Calendar, Radio } from "lucide-react";
import styled from "styled-components";
import { api } from "../../../convex/_generated/api";
import { WidgetContainer } from "./WidgetContainer";

export function StreamOMeterWidget() {
  const streamSettings = useQuery(api.stream.getStreamSettings);
  const upcomingEvents = useQuery(api.stream.getUpcomingEvents);

  const streamChance = streamSettings?.streamChance ?? 0;
  const message = streamSettings?.streamChanceMessage || "Check back later for updates";

  // Determine gauge color based on percentage
  const getGaugeColor = (percent: number) => {
    if (percent >= 70) return "#22c55e"; // Green - likely
    if (percent >= 40) return "#eab308"; // Yellow - maybe
    return "#6b7280"; // Grey - unlikely
  };

  const gaugeColor = getGaugeColor(streamChance);

  return (
    <WidgetContainer title="Stream-o-Meter" icon={<Radio size={16} />} variant="accent">
      <GaugeSection>
        <GaugeContainer>
          <GaugeBg />
          <GaugeFill $percent={streamChance} $color={gaugeColor} />
          <GaugeText>
            <GaugePercent $color={gaugeColor}>{streamChance}%</GaugePercent>
            <GaugeLabel>chance of stream</GaugeLabel>
          </GaugeText>
        </GaugeContainer>
        <Message>{message}</Message>
      </GaugeSection>

      {upcomingEvents && upcomingEvents.length > 0 && (
        <EventsSection>
          <EventsHeader>
            <Calendar size={14} />
            <span>Upcoming</span>
          </EventsHeader>
          <EventsList>
            {upcomingEvents.slice(0, 2).map((event) => (
              <EventItem key={event.eventId}>
                <EventName>{event.name}</EventName>
                <EventTime>
                  {new Date(event.scheduledStartTime).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </EventTime>
              </EventItem>
            ))}
          </EventsList>
        </EventsSection>
      )}

    </WidgetContainer>
  );
}

const GaugeSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const GaugeContainer = styled.div`
  position: relative;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
`;

const GaugeBg = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
`;

const GaugeFill = styled.div<{ $percent: number; $color: string }>`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: ${(props) => props.$percent}%;
  background: ${(props) => props.$color};
  border-radius: 4px;
  transition: width 0.5s ease, background 0.3s ease;
`;

const GaugeText = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
`;

const GaugePercent = styled.span<{ $color: string }>`
  font-size: 18px;
  font-weight: 700;
  color: ${(props) => props.$color};
  font-family: var(--font-mono);
`;

const GaugeLabel = styled.span`
  font-size: 13px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.6;
`;

const Message = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.8;
  line-height: 1.4;
`;

const EventsSection = styled.div`
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
`;

const EventsHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: ${(props) => props.theme.textColor};
  opacity: 0.6;
  margin-bottom: 10px;

  svg {
    opacity: 0.7;
  }
`;

const EventsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const EventItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const EventName = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${(props) => props.theme.contrast};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const EventTime = styled.span`
  font-size: 11px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.5;
  white-space: nowrap;
`;

