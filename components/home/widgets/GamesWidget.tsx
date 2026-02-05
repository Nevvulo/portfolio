import { useQuery } from "convex/react";
import { Code2, Gamepad2, Users, Eye, Package } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import styled from "styled-components";
import { api } from "../../../convex/_generated/api";
import { WidgetContainer } from "./WidgetContainer";

// ============================================
// Software Widget (non-games)
// ============================================

export function SoftwareWidget() {
  const featured = useQuery(api.software.listFeaturedSoftware);

  // Sort by order (hero first), then by name
  const sortedSoftware = useMemo(() => {
    if (!featured) return [];
    return [...featured].sort((a, b) => {
      // Items with order come first, sorted by order
      if (typeof a.order === "number" && typeof b.order === "number") {
        return a.order - b.order;
      }
      if (typeof a.order === "number") return -1;
      if (typeof b.order === "number") return 1;
      return a.name.localeCompare(b.name);
    });
  }, [featured]);

  const getHref = (software: NonNullable<typeof featured>[number]) => {
    if (software.openExternally) {
      if (software.links?.website) return software.links.website;
      if (software.links?.github) return software.links.github;
    }
    return `/software/${software.slug}`;
  };

  // Separate hero and regular cards, limit to 3 total
  const heroCard = sortedSoftware.find((sw) => typeof sw.order === "number" && sw.order === 0);
  const maxRegularCards = heroCard ? 2 : 3;
  const regularCards = sortedSoftware
    .filter((sw) => !(typeof sw.order === "number" && sw.order === 0))
    .slice(0, maxRegularCards);

  return (
    <WidgetContainer title="Software" icon={<Code2 size={16} />} headerAction={<Link href="/software">View all</Link>}>
      <SoftwareWidgetContent>
        {/* Hero card - full width */}
        {heroCard && (() => {
          const href = getHref(heroCard);
          const isExternal = href.startsWith("http");
          const accent = heroCard.accentColor ?? "#6366f1";
          const isComingSoon = heroCard.status === "coming-soon";
          const statusMap: Record<string, "active" | "beta" | "soon"> = {
            "active": "active",
            "beta": "beta",
            "coming-soon": "soon",
          };
          const statusLabel: Record<string, string> = {
            "active": "Active",
            "beta": "WIP",
            "coming-soon": "Idea",
          };

          return (
            <SoftwareHeroCard
              key={heroCard._id}
              href={isComingSoon ? undefined : href}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noopener noreferrer" : undefined}
              $accent={accent}
              $comingSoon={isComingSoon}
              $heroBanner={heroCard.bannerUrl}
            >
              <SoftwareCardGlow $color={accent} />
              <SoftwareHeroContent>
                <SoftwareBadgeRow>
                  <SoftwareBadge $color={accent}>{heroCard.type.toUpperCase()}</SoftwareBadge>
                  {heroCard.status !== "archived" && (
                    <SoftwareStatusBadge $status={statusMap[heroCard.status] ?? "active"}>
                      {statusLabel[heroCard.status] ?? heroCard.status}
                    </SoftwareStatusBadge>
                  )}
                </SoftwareBadgeRow>
                <SoftwareHeroTitleRow>
                  {heroCard.logoUrl && (
                    <SoftwareHeroIcon>
                      <img src={heroCard.logoUrl} alt={heroCard.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} />
                    </SoftwareHeroIcon>
                  )}
                  <SoftwareHeroTitle>{heroCard.name}</SoftwareHeroTitle>
                </SoftwareHeroTitleRow>
                <SoftwareHeroDesc>{heroCard.shortDescription}</SoftwareHeroDesc>
              </SoftwareHeroContent>
              <SoftwareCardScanlines />
            </SoftwareHeroCard>
          );
        })()}

        {/* Regular cards in a 2-column grid */}
        <SoftwareGrid>
          {regularCards.map((software) => {
            const href = getHref(software);
            const isExternal = href.startsWith("http");
            const accent = software.accentColor ?? "#6366f1";
            const isComingSoon = software.status === "coming-soon";
            const hasBanner = !!software.bannerUrl;

            return (
              <SoftwareSmallCard
                key={software._id}
                href={isComingSoon ? undefined : href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                $accent={accent}
                $comingSoon={isComingSoon}
                $hasBanner={hasBanner}
              >
                <SoftwareCardGlow $color={accent} />
                {hasBanner && <SoftwareCardBanner $src={software.bannerUrl!} />}
                <SoftwareSmallContent $hasBanner={hasBanner}>
                  {!hasBanner && (
                    <SoftwareSmallIcon $color={accent} $hasLogo={!!software.logoUrl}>
                      {software.logoUrl ? (
                        <img src={software.logoUrl} alt={software.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} />
                      ) : (
                        <Package size={20} />
                      )}
                    </SoftwareSmallIcon>
                  )}
                  <SoftwareSmallTitle>{software.name}</SoftwareSmallTitle>
                  <SoftwareSmallDesc>{software.shortDescription}</SoftwareSmallDesc>
                </SoftwareSmallContent>
                <SoftwareCardScanlines />
              </SoftwareSmallCard>
            );
          })}
        </SoftwareGrid>
      </SoftwareWidgetContent>
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

const SoftwareWidgetContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SoftwareGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const SoftwareCardScanlines = styled.div`
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.03) 2px,
    rgba(0, 0, 0, 0.03) 4px
  );
  pointer-events: none;
  z-index: 3;
`;

const SoftwareCardGlow = styled.div<{ $color: string }>`
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at center, ${(props) => props.$color}08 0%, transparent 50%);
  pointer-events: none;
  z-index: 1;
`;

const SoftwareHeroCard = styled.a<{ $accent: string; $comingSoon?: boolean; $heroBanner?: string }>`
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(20, 15, 35, 0.85) 0%, rgba(30, 25, 50, 0.7) 100%);
  backdrop-filter: blur(12px);
  border: 1px solid ${(props) => props.$accent}30;
  text-decoration: none;
  color: ${(props) => props.theme.contrast};
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: ${(props) => (props.$comingSoon ? "default" : "pointer")};

  ${(props) => props.$heroBanner && `
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background-image: url(${props.$heroBanner});
      background-size: cover;
      background-position: center;
      z-index: 0;
      opacity: 0.35;
    }
  `}

  ${(props) => props.$comingSoon && `
    opacity: 0.7;
    border-style: dashed;
  `}

  &:hover {
    transform: ${(props) => (props.$comingSoon ? "none" : "translateY(-2px)")};
    border-color: ${(props) => props.$accent}60;
    box-shadow: ${(props) =>
      props.$comingSoon ? "none" : `0 8px 24px rgba(0, 0, 0, 0.25), 0 0 40px ${props.$accent}10`};
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, ${(props) => props.$accent}50, transparent);
    z-index: 2;
  }
`;

const SoftwareHeroContent = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  padding: 1rem 1.25rem;
`;

const SoftwareHeroTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.35rem;
`;

const SoftwareHeroIcon = styled.div`
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
`;

const SoftwareHeroTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${(props) => props.theme.contrast};
  margin: 0;
  letter-spacing: -0.3px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
`;

const SoftwareHeroDesc = styled.p`
  font-size: 0.8rem;
  color: ${(props) => props.theme.contrast}bb;
  margin: 0;
  line-height: 1.4;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
`;

const SoftwareBadgeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
`;

const SoftwareBadge = styled.span<{ $color: string }>`
  display: inline-flex;
  padding: 2px 6px;
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 3px;
  background: ${(props) => props.$color}15;
  color: ${(props) => props.$color};
  border: 1px solid ${(props) => props.$color}30;
`;

const SoftwareStatusBadge = styled.span<{ $status: "active" | "soon" | "beta" }>`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  font-family: var(--font-mono);
  font-size: 8px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  border-radius: 3px;
  background: ${(props) =>
    props.$status === "active"
      ? "rgba(34, 197, 94, 0.15)"
      : props.$status === "beta"
        ? "rgba(234, 179, 8, 0.15)"
        : "rgba(255, 255, 255, 0.05)"};
  color: ${(props) =>
    props.$status === "active"
      ? "#22c55e"
      : props.$status === "beta"
        ? "#eab308"
        : "rgba(255, 255, 255, 0.5)"};
  border: 1px solid ${(props) =>
    props.$status === "active"
      ? "rgba(34, 197, 94, 0.3)"
      : props.$status === "beta"
        ? "rgba(234, 179, 8, 0.3)"
        : "rgba(255, 255, 255, 0.1)"};

  &::before {
    content: '';
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: currentColor;
    ${(props) => props.$status === "active" && `
      animation: statusPulse 2s ease-in-out infinite;
    `}
  }

  @keyframes statusPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
`;

const SoftwareSmallCard = styled.a<{ $accent: string; $comingSoon?: boolean; $hasBanner?: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: ${(props) => props.$hasBanner ? "auto" : "100px"};
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(20, 15, 35, 0.9) 0%, rgba(30, 25, 50, 0.8) 100%);
  backdrop-filter: blur(12px);
  border: 1px solid ${(props) => props.$accent}25;
  text-decoration: none;
  color: ${(props) => props.theme.contrast};
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: ${(props) => (props.$comingSoon ? "default" : "pointer")};

  ${(props) => props.$comingSoon && `
    opacity: 0.65;
    border-style: dashed;
  `}

  &:hover {
    transform: ${(props) => (props.$comingSoon ? "none" : "translateY(-2px)")};
    border-color: ${(props) => props.$accent}50;
    box-shadow: ${(props) => props.$comingSoon ? "none" : `0 6px 16px rgba(0, 0, 0, 0.2)`};
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, ${(props) => props.$accent}40, transparent);
    z-index: 2;
  }
`;

const SoftwareCardBanner = styled.div<{ $src: string }>`
  position: relative;
  width: 100%;
  height: 80px;
  background-image: url(${(props) => props.$src});
  background-size: cover;
  background-position: center;
  flex-shrink: 0;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, transparent 20%, rgba(20, 15, 35, 0.95) 100%);
  }
`;

const SoftwareSmallContent = styled.div<{ $hasBanner?: boolean }>`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  padding: ${(props) => props.$hasBanner ? "0.6rem 0.8rem 0.8rem" : "0.8rem"};
  ${(props) => props.$hasBanner && "margin-top: -1rem;"}
  flex: 1;
`;

const SoftwareSmallIcon = styled.div<{ $color: string; $hasLogo?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: ${(props) => props.$hasLogo ? "transparent" : `${props.$color}15`};
  border: ${(props) => props.$hasLogo ? "none" : `1px solid ${props.$color}30`};
  border-radius: 8px;
  color: ${(props) => props.$color};
  margin-bottom: 0.5rem;
  overflow: hidden;
`;

const SoftwareSmallTitle = styled.h4`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
  margin: 0 0 0.2rem 0;
  letter-spacing: -0.2px;
`;

const SoftwareSmallDesc = styled.p`
  font-size: 0.7rem;
  color: ${(props) => props.theme.contrast}70;
  margin: 0;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const GamesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
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
