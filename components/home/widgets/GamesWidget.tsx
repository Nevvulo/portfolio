import { useQuery } from "convex/react";
import { Code2, Gamepad2, Users, Eye } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { api } from "../../../convex/_generated/api";
import { WidgetContainer } from "./WidgetContainer";

// ============================================
// Software Widget (non-games)
// ============================================

export function SoftwareWidget() {
  const featured = useQuery(api.software.listFeaturedSoftware);

  const getHref = (software: NonNullable<typeof featured>[number]) => {
    if (software.openExternally) {
      if (software.links?.website) return software.links.website;
      if (software.links?.github) return software.links.github;
    }
    return `/software/${software.slug}`;
  };

  return (
    <WidgetContainer title="Software" icon={<Code2 size={16} />} headerAction={<Link href="/software">View all</Link>}>
      <SoftwareGrid>
        {featured?.map((software) => {
          const href = getHref(software);
          const isExternal = href.startsWith("http");
          return (
          <SoftwareCard
            key={software._id}
            href={href}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
          >
            <SoftwareImageContainer $gradient={software.background || "linear-gradient(135deg, rgba(144,116,242,0.2), rgba(59,130,246,0.15))"}>
              {software.bannerUrl ? (
                <Image
                  src={software.bannerUrl}
                  alt={software.name}
                  fill
                  sizes="(max-width: 480px) 100vw, 50vw"
                  style={{ objectFit: "cover" }}
                  unoptimized={software.bannerUrl.includes("convex.cloud")}
                />
              ) : (
                <PlaceholderIcon>
                  <Code2 size={28} />
                </PlaceholderIcon>
              )}
              <CardOverlay />
              {software.status === "coming-soon" && (
                <SoonOverlay>
                  <SoonLabel>soon™</SoonLabel>
                </SoonOverlay>
              )}
              {software.status !== "active" && software.status !== "coming-soon" && (
                <StatusBadge $status={software.status}>
                  {software.status === "beta" ? "Beta" : software.status}
                </StatusBadge>
              )}
            </SoftwareImageContainer>
            <SoftwareCardInfo>
              <SoftwareCardTitle>{software.name}</SoftwareCardTitle>
              <SoftwareCardDesc>{software.shortDescription}</SoftwareCardDesc>
            </SoftwareCardInfo>
          </SoftwareCard>
          );
        })}
      </SoftwareGrid>
    </WidgetContainer>
  );
}

// ============================================
// Games Widget (games only, with Roblox stats)
// ============================================

interface RobloxStats {
  visits: number;
  playing: number;
  favoritedCount: number;
}

export function GamesWidget() {
  const featured = useQuery(api.software.listFeaturedGames);
  const playerCountStat = useQuery(api.netvulo.getLiveStat, { key: "golfquest_players" });
  const playerCount = typeof playerCountStat?.value === "number" ? playerCountStat.value : 0;

  // Roblox stats state
  const [robloxStats, setRobloxStats] = useState<Record<string, RobloxStats>>({});

  // Fetch Roblox stats on mount for games with universeId
  useEffect(() => {
    if (!featured) return;

    featured.forEach(async (game) => {
      if (game.robloxUniverseId) {
        try {
          const res = await fetch(`/api/roblox/universe-stats?universeId=${game.robloxUniverseId}`);
          if (res.ok) {
            const stats = await res.json();
            setRobloxStats((prev) => ({ ...prev, [game.slug]: stats }));
          }
        } catch (error) {
          console.error(`Failed to fetch Roblox stats for ${game.slug}:`, error);
        }
      }
    });
  }, [featured]);

  // Listen for WebSocket player count updates
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_NETVULO_WS_URL;
    if (!wsUrl) return;

    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event_type === "PLAYER_COUNT_UPDATE" && data.source === "golfquest") {
            // Update is handled by Convex subscription, but we could also handle it here
          }
        } catch (e) {
          // Ignore parse errors
        }
      };

      ws.onclose = () => {
        // Reconnect after 5 seconds
        reconnectTimeout = setTimeout(connect, 5000);
      };

      ws.onerror = () => {
        ws?.close();
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      ws?.close();
    };
  }, []);

  return (
    <WidgetContainer title="Games" icon={<Gamepad2 size={16} />}>
      <GamesList>
        {featured?.map((game) => {
          const stats = robloxStats[game.slug];
          const isGolfquest = game.slug === "golfquest";
          const currentPlayers = isGolfquest ? playerCount : (stats?.playing ?? 0);

          // Games with openExternally go to roblox/website
          const getGameHref = () => {
            if (game.openExternally) {
              if (game.links?.roblox) return game.links.roblox;
              if (game.links?.website) return game.links.website;
            }
            return `/software/${game.slug}`;
          };
          const href = getGameHref();
          const isExternal = href.startsWith("http");

          return (
            <GameCard
              key={game._id}
              href={href}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noopener noreferrer" : undefined}
            >
              <GameImageContainer $gradient={game.background || "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(59,130,246,0.15))"}>
                {game.bannerUrl ? (
                  <GameBannerImage src={game.bannerUrl} alt={game.name} />
                ) : (
                  <PlaceholderIcon>
                    <Gamepad2 size={28} />
                  </PlaceholderIcon>
                )}

                {/* Top-left gradient overlay for text */}
                <GameOverlay />

                {/* Title + stats in top-left */}
                <GameInfo>
                  <GameTitle>{game.name}</GameTitle>
                  <GameStatsRow>
                    {currentPlayers > 0 && (
                      <GameStat $highlight>
                        <PlayerDot />
                        <Users size={11} />
                        <span>{currentPlayers.toLocaleString()}</span>
                      </GameStat>
                    )}
                    {stats?.visits != null && (
                      <GameStat>
                        <Eye size={11} />
                        <span>{formatNumber(stats.visits)}</span>
                      </GameStat>
                    )}
                  </GameStatsRow>
                </GameInfo>

                {/* Status badges */}
                {game.status === "coming-soon" && (
                  <SoonOverlayTopRight>
                    <SoonLabel>soon™</SoonLabel>
                  </SoonOverlayTopRight>
                )}
                {game.status !== "active" && game.status !== "coming-soon" && (
                  <StatusBadgeTopRight $status={game.status}>
                    {game.status === "beta" ? "Beta" : game.status}
                  </StatusBadgeTopRight>
                )}
              </GameImageContainer>
            </GameCard>
          );
        })}
      </GamesList>
    </WidgetContainer>
  );
}

// Format large numbers (e.g., 1.2M, 500K)
function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toLocaleString();
}

// ============================================
// Shared styled components
// ============================================

const SoftwareGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const SoftwareImageContainer = styled.div<{ $gradient?: string }>`
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  ${(p) => p.$gradient && `background: ${p.$gradient};`}
`;

const SoftwareCardInfo = styled.div`
  padding: 0.7em 0.8em;
`;

const SoftwareCardTitle = styled.h4`
  margin: 0;
  font-size: 1em;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
`;

const SoftwareCardDesc = styled.p`
  margin: 0.2em 0 0;
  font-size: 0.8em;
  color: ${(props) => props.theme.textColor};
  opacity: 0.6;
  line-height: 1.4;
`;

const GamesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SoftwareCard = styled(Link)`
  display: flex;
  flex-direction: column;
  border-radius: 10px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(255, 255, 255, 0.12);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const GameCard = styled(Link)`
  display: block;
  border-radius: 10px;
  overflow: hidden;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const GameImageContainer = styled.div<{ $gradient?: string }>`
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  overflow: hidden;
  ${(p) => p.$gradient && `background: ${p.$gradient};`}
`;

const GameBannerImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const GameOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.3) 40%, transparent 70%);
  pointer-events: none;
`;

const GameInfo = styled.div`
  position: absolute;
  top: 10px;
  left: 12px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const GameTitle = styled.h4`
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
`;

const GameStatsRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const GameStat = styled.div<{ $highlight?: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
  color: ${(p) => (p.$highlight ? "#4ade80" : "rgba(255, 255, 255, 0.8)")};
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);

  svg {
    opacity: 0.9;
  }
`;

const PlayerDot = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4ade80;
  box-shadow: 0 0 4px #4ade80;
`;

const CardOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent 50%, rgba(0, 0, 0, 0.4) 100%);
`;

const StatusBadge = styled.div<{ $status?: string }>`
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  z-index: 2;
  background: ${(p) =>
    p.$status === "beta"
      ? "rgba(59, 130, 246, 0.85)"
      : p.$status === "coming-soon"
        ? "rgba(245, 158, 11, 0.85)"
        : "rgba(107, 114, 128, 0.85)"};
  color: white;
`;

const StatusBadgeTopRight = styled(StatusBadge)`
  top: 8px;
  left: auto;
  right: 8px;
`;

const SoonOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(225deg, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0.25) 30%, transparent 55%);
  z-index: 2;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 8px 10px;
  pointer-events: none;
`;

const SoonOverlayTopRight = styled(SoonOverlay)``;

const SoonLabel = styled.span`
  font-family: "Fira Code", var(--font-mono), monospace;
  font-size: 22px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 0.5px;
`;

const PlaceholderIcon = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.3);
`;
