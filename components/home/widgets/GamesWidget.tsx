import { useQuery } from "convex/react";
import { Code2, Gamepad2, Users } from "lucide-react";
import Link from "next/link";
import styled from "styled-components";
import { api } from "../../../convex/_generated/api";
import { WidgetContainer } from "./WidgetContainer";

// ============================================
// Software Widget (non-games)
// ============================================

export function SoftwareWidget() {
  const featured = useQuery(api.software.listFeaturedSoftware);

  return (
    <WidgetContainer title="Software" icon={<Code2 size={16} />} headerAction={<Link href="/software">View all</Link>}>
      <SoftwareGrid>
        {featured?.map((software) => (
          <SoftwareCard key={software._id} href={`/software/${software.slug}`}>
            <CardImageContainer $gradient={software.background || undefined}>
              {software.bannerUrl ? (
                <BannerImage src={software.bannerUrl} alt={software.name} />
              ) : software.logoUrl ? (
                <LogoWrapper>
                  <LogoImage src={software.logoUrl} alt={software.name} />
                </LogoWrapper>
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
            </CardImageContainer>
            <CardInfo>
              <CardTitle>{software.name}</CardTitle>
              <CardDesc>{software.shortDescription}</CardDesc>
            </CardInfo>
          </SoftwareCard>
        ))}
      </SoftwareGrid>
    </WidgetContainer>
  );
}

// ============================================
// Games Widget (games only, with Roblox stats)
// ============================================

interface RobloxStats {
  playing: number;
  visits: number;
  favoritedCount: number;
  name: string;
}

export function GamesWidget() {
  const featured = useQuery(api.software.listFeaturedGames);
  const playerCountStat = useQuery(api.netvulo.getLiveStat, { key: "golfquest_players" });
  const playerCount = typeof playerCountStat?.value === "number" ? playerCountStat.value : 0;

  // TODO: Fetch Roblox stats when universe IDs are available on software entries
  const robloxStats: Record<string, RobloxStats> = {};

  return (
    <WidgetContainer title="Games" icon={<Gamepad2 size={16} />}>
      <GamesList>
        {featured?.map((game) => (
          <GameCard key={game._id} href={`/software/${game.slug}`}>
            <CardImageContainer $gradient={game.background || undefined}>
              {game.bannerUrl ? (
                <BannerImage src={game.bannerUrl} alt={game.name} />
              ) : game.logoUrl ? (
                <LogoWrapper>
                  <LogoImage src={game.logoUrl} alt={game.name} />
                </LogoWrapper>
              ) : (
                <PlaceholderIcon>
                  <Gamepad2 size={28} />
                </PlaceholderIcon>
              )}
              <CardOverlay />
              {playerCount > 0 && game.slug === "golfquest" && (
                <PlayerBadge>
                  <PlayerDot />
                  <Users size={10} />
                  <span>{playerCount} playing</span>
                </PlayerBadge>
              )}
              {game.status === "coming-soon" && (
                <SoonOverlay>
                  <SoonLabel>soon™</SoonLabel>
                </SoonOverlay>
              )}
              {game.status !== "active" && game.status !== "coming-soon" && (
                <StatusBadge $status={game.status}>
                  {game.status === "beta" ? "Beta" : game.status}
                </StatusBadge>
              )}
            </CardImageContainer>
            <CardInfo>
              <CardTitle>{game.name}</CardTitle>
              <CardDesc>{game.shortDescription}</CardDesc>
              {robloxStats[game.slug] != null && (
                <StatsRow>
                  <StatItem>{robloxStats[game.slug]!.visits.toLocaleString()} visits</StatItem>
                </StatsRow>
              )}
            </CardInfo>
          </GameCard>
        ))}
      </GamesList>
    </WidgetContainer>
  );
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

const CardImageContainer = styled.div<{ $gradient?: string }>`
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  ${(p) => p.$gradient && `background: ${p.$gradient};`}
`;

const BannerImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const LogoWrapper = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
`;

const LogoImage = styled.img`
  max-width: 80%;
  max-height: 80%;
  object-fit: contain;
`;

const CardOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent 50%, rgba(0, 0, 0, 0.4) 100%);
`;

const PlayerBadge = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 7px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  color: #22c55e;
  z-index: 2;
`;

const PlayerDot = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #22c55e;
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

const CardInfo = styled.div`
  padding: 10px 12px;
`;

const CardTitle = styled.h4`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
`;

const CardDesc = styled.p`
  margin: 2px 0 0;
  font-size: 11px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.6;
`;

const StatsRow = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 4px;
`;

const StatItem = styled.span`
  font-size: 10px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.5;
`;

