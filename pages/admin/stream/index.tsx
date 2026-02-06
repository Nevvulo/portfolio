import { useQuery as useRQ, useMutation } from "@tanstack/react-query";
import { Calendar, Radio, RefreshCw, Zap } from "lucide-react";
import Head from "next/head";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { BlogView } from "../../../components/layout/blog";
import { SimpleNavbar } from "../../../components/navbar/simple";
import { getMe } from "@/src/db/client/me";
import {
  getStreamSettings,
  updateStreamChance,
  getUpcomingEvents,
} from "@/src/db/client/admin";

export const getServerSideProps = () => ({ props: {} });

export default function AdminStreamPage() {
  const [mounted, setMounted] = useState(false);
  const { data: me, isLoading } = useRQ({
    queryKey: ["me"],
    queryFn: () => getMe(),
    staleTime: 30_000,
  });
  const isCreator = me?.isCreator ?? false;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return (
      <BlogView>
        <SimpleNavbar title="Stream Settings" />
        <Container>
          <p>Loading...</p>
        </Container>
      </BlogView>
    );
  }

  if (!isCreator) {
    return (
      <>
        <Head>
          <title>Access Denied | Stream Settings</title>
        </Head>
        <BlogView>
          <SimpleNavbar title="Stream Settings" />
          <Container>
            <Title>Access Denied</Title>
            <Text>You don't have permission to access stream settings.</Text>
          </Container>
        </BlogView>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Stream Settings | Nevulo</title>
      </Head>
      <BlogView>
        <SimpleNavbar title="Stream Settings" />
        <AdminContainer>
          <Header>
            <Title>
              <Radio size={28} /> Stream Settings
            </Title>
            <Text>Control your stream-o-meter and manage events</Text>
          </Header>

          <StreamOMeterSection />
          <DiscordEventsSection />
        </AdminContainer>
      </BlogView>
    </>
  );
}

function StreamOMeterSection() {
  const { data: streamSettings } = useRQ({
    queryKey: ["admin", "streamSettings"],
    queryFn: () => getStreamSettings(),
  });
  const updateChanceMutation = useMutation({
    mutationFn: (data: { streamChance: number; streamChanceMessage?: string }) =>
      updateStreamChance(data),
  });

  const [chance, setChance] = useState(0);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (streamSettings) {
      setChance(streamSettings.streamChance ?? 0);
      setMessage(streamSettings.streamChanceMessage ?? "");
    }
  }, [streamSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateChanceMutation.mutateAsync({
        streamChance: chance,
        streamChanceMessage: message || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setSaving(false);
    }
  };

  const getChanceColor = () => {
    if (chance >= 80) return "#22c55e";
    if (chance >= 50) return "#eab308";
    if (chance >= 20) return "#f97316";
    return "#ef4444";
  };

  const getChanceLabel = () => {
    if (chance >= 90) return "Almost certain!";
    if (chance >= 70) return "Very likely";
    if (chance >= 50) return "Good chance";
    if (chance >= 30) return "Maybe";
    if (chance >= 10) return "Unlikely";
    return "Not streaming";
  };

  return (
    <Section>
      <SectionTitle>
        <Zap size={20} /> Stream-O-Meter
      </SectionTitle>
      <SectionDesc>
        Set the likelihood of streaming today. This shows live on the homepage.
      </SectionDesc>

      <MeterContainer>
        <MeterHeader>
          <MeterLabel>Chance of streaming today</MeterLabel>
          <MeterValue $color={getChanceColor()}>{chance}%</MeterValue>
        </MeterHeader>

        <SliderContainer>
          <SliderTrack $color={getChanceColor()} $value={chance} />
          <Slider
            type="range"
            min="0"
            max="100"
            value={chance}
            onChange={(e) => setChance(Number(e.target.value))}
          />
        </SliderContainer>

        <QuickButtons>
          <QuickButton onClick={() => setChance(0)} $active={chance === 0}>
            0%
          </QuickButton>
          <QuickButton onClick={() => setChance(25)} $active={chance === 25}>
            25%
          </QuickButton>
          <QuickButton onClick={() => setChance(50)} $active={chance === 50}>
            50%
          </QuickButton>
          <QuickButton onClick={() => setChance(75)} $active={chance === 75}>
            75%
          </QuickButton>
          <QuickButton onClick={() => setChance(100)} $active={chance === 100}>
            100%
          </QuickButton>
        </QuickButtons>

        <ChanceLabel $color={getChanceColor()}>{getChanceLabel()}</ChanceLabel>

        <MessageInput
          placeholder="Optional message (e.g. 'Working on Golfquest!')"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <SaveButton onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : saved ? "Saved!" : "Update Stream-O-Meter"}
        </SaveButton>
      </MeterContainer>

      {streamSettings?.lastUpdated && (
        <LastUpdated>
          Last updated: {new Date(streamSettings.lastUpdated).toLocaleString()}
        </LastUpdated>
      )}
    </Section>
  );
}

function DiscordEventsSection() {
  const { data: events } = useRQ({
    queryKey: ["admin", "upcomingEvents"],
    queryFn: () => getUpcomingEvents(),
  });
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);

    try {
      const res = await fetch("/api/discord/events", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        setSyncResult(`Synced ${data.eventCount} events`);
      } else {
        setSyncResult(`Error: ${data.error}`);
      }
    } catch (error) {
      setSyncResult(`Failed to sync: ${error}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Section>
      <SectionTitle>
        <Calendar size={20} /> Discord Events
      </SectionTitle>
      <SectionDesc>Upcoming events synced from Discord. Events auto-sync hourly.</SectionDesc>

      <SyncButton onClick={handleSync} disabled={syncing}>
        <RefreshCw size={16} className={syncing ? "spin" : ""} />
        {syncing ? "Syncing..." : "Sync Events Now"}
      </SyncButton>

      {syncResult && <SyncResult>{syncResult}</SyncResult>}

      <EventsList>
        {!events || events.length === 0 ? (
          <EmptyState>No upcoming events scheduled</EmptyState>
        ) : (
          events.map((event) => (
            <EventCard key={event.id}>
              <EventName>{event.name}</EventName>
              <EventTime>
                {new Date(event.scheduledStartTime).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}{" "}
                at{" "}
                {new Date(event.scheduledStartTime).toLocaleTimeString(undefined, {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </EventTime>
              {event.description && <EventDesc>{event.description}</EventDesc>}
              {event.userCount !== undefined && (
                <EventAttendees>{event.userCount} interested</EventAttendees>
              )}
            </EventCard>
          ))
        )}
      </EventsList>
    </Section>
  );
}

// Styled components
const Container = styled.div`
  padding: 2rem;
`;

const AdminContainer = styled.div`
  max-width: 700px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.75rem;
  font-weight: 700;
  color: ${(props) => props.theme.contrast};
  margin: 0 0 0.5rem 0;
`;

const Text = styled.p`
  color: ${(props) => props.theme.contrast}80;
  margin: 0;
`;

const Section = styled.section`
  background: ${(props) => props.theme.contrast}05;
  border: 1px solid ${(props) => props.theme.contrast}10;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
  margin: 0 0 0.25rem 0;
`;

const SectionDesc = styled.p`
  font-size: 0.875rem;
  color: ${(props) => props.theme.contrast}60;
  margin: 0 0 1.25rem 0;
`;

const MeterContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const MeterHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const MeterLabel = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${(props) => props.theme.contrast}90;
`;

const MeterValue = styled.span<{ $color: string }>`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${(props) => props.$color};
  font-family: var(--font-mono);
`;

const SliderContainer = styled.div`
  position: relative;
  height: 12px;
  background: ${(props) => props.theme.contrast}10;
  border-radius: 6px;
  overflow: hidden;
`;

const SliderTrack = styled.div<{ $color: string; $value: number }>`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: ${(props) => props.$value}%;
  background: ${(props) => props.$color};
  border-radius: 6px;
  transition: width 0.1s ease, background 0.2s ease;
`;

const Slider = styled.input`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  margin: 0;
`;

const QuickButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const QuickButton = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 6px;
  border: 1px solid ${(props) => (props.$active ? "#9074f2" : `${props.theme.contrast}15`)};
  background: ${(props) => (props.$active ? "rgba(144, 116, 242, 0.15)" : "transparent")};
  color: ${(props) => (props.$active ? "#9074f2" : `${props.theme.contrast}70`)};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${(props) => props.theme.contrast}30;
    background: ${(props) => props.theme.contrast}05;
  }
`;

const ChanceLabel = styled.div<{ $color: string }>`
  text-align: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${(props) => props.$color};
  padding: 0.5rem;
  background: ${(props) => props.$color}15;
  border-radius: 6px;
`;

const MessageInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  border: 1px solid ${(props) => props.theme.contrast}15;
  border-radius: 8px;
  background: transparent;
  color: ${(props) => props.theme.contrast};

  &::placeholder {
    color: ${(props) => props.theme.contrast}40;
  }

  &:focus {
    outline: none;
    border-color: #9074f2;
  }
`;

const SaveButton = styled.button`
  width: 100%;
  padding: 0.875rem;
  font-size: 0.9375rem;
  font-weight: 600;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #9074f2, #6366f1);
  color: white;
  cursor: pointer;
  transition: opacity 0.2s ease, transform 0.2s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const LastUpdated = styled.div`
  margin-top: 1rem;
  font-size: 0.75rem;
  color: ${(props) => props.theme.contrast}50;
  text-align: center;
`;

const SyncButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  font-size: 0.8125rem;
  font-weight: 500;
  border-radius: 6px;
  border: 1px solid ${(props) => props.theme.contrast}15;
  background: transparent;
  color: ${(props) => props.theme.contrast}80;
  cursor: pointer;
  transition: all 0.15s ease;
  margin-bottom: 1rem;

  &:hover:not(:disabled) {
    border-color: ${(props) => props.theme.contrast}30;
    background: ${(props) => props.theme.contrast}05;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const SyncResult = styled.div`
  font-size: 0.8125rem;
  color: ${(props) => props.theme.contrast}70;
  margin-bottom: 1rem;
`;

const EventsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: ${(props) => props.theme.contrast}50;
  font-size: 0.875rem;
`;

const EventCard = styled.div`
  padding: 1rem;
  background: ${(props) => props.theme.contrast}05;
  border: 1px solid ${(props) => props.theme.contrast}08;
  border-radius: 8px;
`;

const EventName = styled.div`
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
  margin-bottom: 0.25rem;
`;

const EventTime = styled.div`
  font-size: 0.8125rem;
  color: #9074f2;
  font-weight: 500;
`;

const EventDesc = styled.div`
  font-size: 0.8125rem;
  color: ${(props) => props.theme.contrast}60;
  margin-top: 0.5rem;
`;

const EventAttendees = styled.div`
  font-size: 0.75rem;
  color: ${(props) => props.theme.contrast}50;
  margin-top: 0.375rem;
`;
