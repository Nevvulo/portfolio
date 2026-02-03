import { useQuery } from "convex/react";
import { Calendar, ChevronLeft, ChevronRight, Radio } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import { api } from "../../../convex/_generated/api";
import { LOUNGE_COLORS } from "../../../constants/theme";
import { WidgetContainer } from "./WidgetContainer";

interface TwitchVod {
  id: string;
  title: string;
  url: string;
  thumbnail_url: string;
  duration: string;
  created_at: string;
  view_count: number;
}

interface LiveWidgetProps {
  isLive: boolean;
}

export function LiveWidget({ isLive }: LiveWidgetProps) {
  const streamSettings = useQuery(api.stream.getStreamSettings);
  const upcomingEvents = useQuery(api.stream.getUpcomingEvents);
  const [vods, setVods] = useState<TwitchVod[]>([]);
  const [vodIndex, setVodIndex] = useState(0);

  const streamChance = streamSettings?.streamChance ?? 0;
  const message = streamSettings?.streamChanceMessage || "Check back later for updates";

  useEffect(() => {
    fetch("/api/twitch/vods")
      .then((r) => r.json())
      .then((data) => setVods(data.vods || []))
      .catch(() => {});
  }, []);

  const getGaugeColor = (percent: number) => {
    if (percent >= 70) return "#22c55e";
    if (percent >= 40) return "#eab308";
    return "#6b7280";
  };

  const gaugeColor = getGaugeColor(streamChance);
  const visibleVods = vods.slice(vodIndex, vodIndex + 2);
  const canPrev = vodIndex > 0;
  const canNext = vodIndex + 2 < vods.length;

  const prevVods = useCallback(() => setVodIndex((i) => Math.max(0, i - 2)), []);
  const nextVods = useCallback(() => setVodIndex((i) => Math.min(vods.length - 2, i + 2)), [vods.length]);

  const formatDuration = (duration: string) => {
    const match = duration.match(/(\d+)h(\d+)m|(\d+)m(\d+)s|(\d+)h/);
    if (!match) return duration;
    if (match[1] && match[2]) return `${match[1]}h ${match[2]}m`;
    if (match[3] && match[4]) return `${match[3]}m`;
    if (match[5]) return `${match[5]}h`;
    return duration;
  };

  if (isLive) {
    return (
      <WidgetContainer variant="live" noPadding>
        <LiveLink href="https://twitch.tv/nevvulo" target="_blank" rel="noopener noreferrer">
          <LiveThumbnail>
            <Image
              src="https://static-cdn.jtvnw.net/previews-ttv/live_user_nevulo-440x248.jpg"
              alt="Live stream preview"
              fill
              style={{ objectFit: "cover" }}
              unoptimized
            />
            <LiveOverlay />
            <LiveBadge>
              <PulsingDot />
              <span>LIVE</span>
            </LiveBadge>
          </LiveThumbnail>
          <LiveContent>
            <LiveTitle>Nevulo is live!</LiveTitle>
            <LiveSubtitle>Streaming now on Twitch</LiveSubtitle>
            <WatchButton>
              <Radio size={14} />
              <span>Watch Now</span>
            </WatchButton>
          </LiveContent>
        </LiveLink>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer title="Live" icon={<Radio size={16} />} variant="accent" headerAction={<a href="https://twitch.tv/nevvulo" target="_blank" rel="noopener noreferrer">Watch on Twitch</a>}>
      {/* Status line */}
      <StatusRowTop>
        <OfflineDot />
        <StatusText>Nevulo is offline</StatusText>
      </StatusRowTop>

      {/* Gauge */}
      <GaugeSection>
        <GaugeContainer>
          <GaugeBg />
          <GaugeFill $percent={streamChance} $color={gaugeColor} />
        </GaugeContainer>
        <GaugeText>
          <GaugePercent $color={gaugeColor}>{streamChance}%</GaugePercent>
          <GaugeLabel>chance of stream</GaugeLabel>
        </GaugeText>
        <Message>{message}</Message>
      </GaugeSection>

      {/* Upcoming events */}
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

      {/* VOD carousel */}
      {visibleVods.length > 0 && (
        <VodsSection>
          <VodsHeader>
            <span>Recent VODs</span>
            <VodNav>
              <NavButton onClick={prevVods} disabled={!canPrev}><ChevronLeft size={14} /></NavButton>
              <NavButton onClick={nextVods} disabled={!canNext}><ChevronRight size={14} /></NavButton>
            </VodNav>
          </VodsHeader>
          <VodsGrid>
            {visibleVods.map((vod) => (
              <VodCard key={vod.id} href={vod.url} target="_blank" rel="noopener noreferrer">
                <VodThumb>
                  <img src={vod.thumbnail_url} alt={vod.title} />
                  <DurationBadge>{formatDuration(vod.duration)}</DurationBadge>
                </VodThumb>
                <VodTitle>{vod.title}</VodTitle>
              </VodCard>
            ))}
          </VodsGrid>
        </VodsSection>
      )}

    </WidgetContainer>
  );
}

const pulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
`;

/* Live state styles */
const LiveLink = styled.a`
  display: block;
  text-decoration: none;
  color: inherit;
`;

const LiveThumbnail = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
`;

const LiveOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent 40%, rgba(0, 0, 0, 0.7) 100%);
`;

const LiveBadge = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  background: #ef4444;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  z-index: 2;
`;

const PulsingDot = styled.div`
  width: 6px;
  height: 6px;
  background: white;
  border-radius: 50%;
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

const LiveContent = styled.div`
  padding: 12px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const LiveTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
`;

const LiveSubtitle = styled.p`
  margin: 0;
  font-size: 12px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.6;
`;

const WatchButton = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 7px 14px;
  background: ${LOUNGE_COLORS.tier1};
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  color: white;
  width: fit-content;
  transition: background 0.2s ease;
`;

/* Offline state styles */
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
  margin-top: 4px;
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

const StatusRowTop = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`;

const OfflineDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #6b7280;
`;

const StatusText = styled.span`
  font-size: 13px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.6;
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
  svg { opacity: 0.7; }
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

const VodsSection = styled.div`
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
`;

const VodsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
  color: ${(props) => props.theme.textColor};
  opacity: 0.6;
  margin-bottom: 10px;
`;

const VodNav = styled.div`
  display: flex;
  gap: 4px;
`;

const NavButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  color: ${(props) => props.theme.textColor};
  cursor: pointer;
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.15);
  }

  &:disabled {
    opacity: 0.3;
    cursor: default;
  }
`;

const VodsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

const VodCard = styled.a`
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-decoration: none;
  border-radius: 6px;
  overflow: hidden;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.85;
  }
`;

const VodThumb = styled.div`
  position: relative;
  aspect-ratio: 16 / 9;
  border-radius: 6px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const DurationBadge = styled.span`
  position: absolute;
  bottom: 4px;
  right: 4px;
  padding: 2px 5px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
  color: white;
  font-family: var(--font-mono);
`;

const VodTitle = styled.span`
  font-size: 11px;
  font-weight: 500;
  color: ${(props) => props.theme.contrast};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.3;
`;

