"use client";

import {
  ArrowUpRight,
  Boxes,
  Code2,
  Gamepad2,
  Globe,
  Layers,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import styled from "styled-components";
import { LOUNGE_COLORS } from "../../constants/theme";
import { SimpleNavbar } from "../../components/navbar/simple";
import type { Software } from "@/src/db/types";

type TypeFilter = "all" | "app" | "tool" | "library" | "game" | "website" | "bot";

const TYPE_FILTERS: { key: TypeFilter; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "All", icon: <Boxes size={14} /> },
  { key: "game", label: "Games", icon: <Gamepad2 size={14} /> },
  { key: "app", label: "Apps", icon: <Layers size={14} /> },
  { key: "tool", label: "Tools", icon: <Wrench size={14} /> },
  { key: "library", label: "Libraries", icon: <Code2 size={14} /> },
  { key: "website", label: "Websites", icon: <Globe size={14} /> },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "#22c55e" },
  beta: { label: "Beta", color: "#f59e0b" },
  "coming-soon": { label: "Coming Soon", color: "#a855f7" },
  archived: { label: "Archived", color: "#6b7280" },
};

interface SoftwarePageProps {
  software: Software[];
}

export default function SoftwarePage({ software }: SoftwarePageProps) {
  const [filter, setFilter] = useState<TypeFilter>("all");

  const filtered = software.filter(
    (s) => filter === "all" || s.type === filter
  );

  return (
    <>
      <SimpleNavbar />

      <PageContainer>
        <PageHeader>
          <PageTitle>Software & Games</PageTitle>
          <PageDescription>
            Projects I&apos;m building — from Roblox games to open-source tools.
          </PageDescription>
        </PageHeader>

        <FilterRow>
          {TYPE_FILTERS.map((f) => (
            <FilterChip
              key={f.key}
              $active={filter === f.key}
              onClick={() => setFilter(f.key)}
            >
              {f.icon}
              {f.label}
            </FilterChip>
          ))}
        </FilterRow>

        <ProjectGrid>
          {filtered.map((item) => {
            const status = STATUS_LABELS[item.status] ?? STATUS_LABELS.active;
            const isGame = item.type === "game";
            const links = item.links as Record<string, string> | null;
            const stats = item.stats as { players?: number; downloads?: number; stars?: number } | null;
            const techs = (item.technologies ?? []) as string[];
            const plats = (item.platforms ?? []) as string[];

            const getExternalUrl = () => {
              if (isGame && links?.roblox) return links.roblox;
              if (links?.website) return links.website;
              if (links?.github) return links.github;
              return null;
            };

            const externalUrl = getExternalUrl();
            const href = item.openExternally && externalUrl ? externalUrl : `/software/${item.slug}`;
            const isExternal = href.startsWith("http");

            return (
              <ProjectCard
                key={item.id}
                href={href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                $accent={item.accentColor}
              >
                <CardBannerWrapper>
                  {item.bannerUrl ? (
                    <CardBanner style={{ backgroundImage: `url(${item.bannerUrl})` }} />
                  ) : (
                    <CardBanner style={{ background: item.background || "linear-gradient(135deg, rgba(144,116,242,0.2), rgba(59,130,246,0.15))" }} />
                  )}
                  <CardBannerOverlay />
                  {isExternal && (
                    <ExternalBadge>
                      <ArrowUpRight size={10} />
                    </ExternalBadge>
                  )}
                </CardBannerWrapper>
                <CardBody>
                  <CardTop>
                    <StatusBadge $color={status.color}>{status.label}</StatusBadge>
                    <TypeBadge $type={item.type}>{item.type}</TypeBadge>
                    {plats.map((p) => (
                      <PlatformBadge key={p}>{p}</PlatformBadge>
                    ))}
                  </CardTop>
                  <CardTitle>{item.name}</CardTitle>
                  <CardDesc>{item.shortDescription}</CardDesc>
                  {stats && (stats.players || stats.downloads || stats.stars) && (
                    <StatsRow>
                      {stats.players != null && (
                        <StatItem>
                          <span>{stats.players.toLocaleString()}</span>
                          <label>Players</label>
                        </StatItem>
                      )}
                      {stats.downloads != null && (
                        <StatItem>
                          <span>{stats.downloads.toLocaleString()}</span>
                          <label>Downloads</label>
                        </StatItem>
                      )}
                      {stats.stars != null && (
                        <StatItem>
                          <span>{stats.stars.toLocaleString()}</span>
                          <label>Stars</label>
                        </StatItem>
                      )}
                    </StatsRow>
                  )}
                  {techs.length > 0 && (
                    <TechRow>
                      {techs.slice(0, 4).map((t) => (
                        <TechTag key={t}>{t}</TechTag>
                      ))}
                    </TechRow>
                  )}
                </CardBody>
              </ProjectCard>
            );
          })}
        </ProjectGrid>

        {filtered.length === 0 && (
          <EmptyState>
            <EmptyIcon><Boxes size={32} /></EmptyIcon>
            <EmptyText>No projects in this category yet.</EmptyText>
          </EmptyState>
        )}
      </PageContainer>
    </>
  );
}

const PageContainer = styled.div`
  min-height: 100vh;
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 1.5rem 4rem;
`;

const PageHeader = styled.div`
  margin-bottom: 24px;
`;

const PageTitle = styled.h1`
  font-family: var(--font-sans);
  font-size: 32px;
  font-weight: 700;
  color: ${(props) => props.theme.contrast};
  margin: 0 0 8px;
`;

const PageDescription = styled.p`
  font-size: 15px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.7;
  margin: 0;
  line-height: 1.5;
`;

const FilterRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const FilterChip = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  border: 1px solid ${(p) => (p.$active ? "rgba(144,116,242,0.4)" : "rgba(255,255,255,0.08)")};
  background: ${(p) => (p.$active ? "rgba(144,116,242,0.15)" : "rgba(255,255,255,0.03)")};
  color: ${(p) => (p.$active ? LOUNGE_COLORS.tier1 : "rgba(255,255,255,0.6)")};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  &:hover {
    border-color: rgba(144, 116, 242, 0.3);
  }
`;

const ProjectGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

const ProjectCard = styled(Link)<{ $accent?: string | null }>`
  display: block;
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(20, 15, 35, 0.9) 0%, rgba(30, 25, 50, 0.8) 100%);
  border: 1px solid ${(p) => p.$accent ? `${p.$accent}30` : "rgba(255, 255, 255, 0.08)"};
  text-decoration: none;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-4px);
    border-color: ${(p) => p.$accent ? `${p.$accent}50` : "rgba(255, 255, 255, 0.2)"};
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.3), ${(p) => p.$accent ? `0 0 40px ${p.$accent}15` : "none"};
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, ${(p) => p.$accent || "rgba(255,255,255,0.2)"}50, transparent);
  }
`;

const CardBannerWrapper = styled.div`
  position: relative;
  height: 140px;
  overflow: hidden;
`;

const CardBanner = styled.div`
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
`;

const CardBannerOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent 40%, rgba(20, 15, 35, 0.9) 100%);
`;

const ExternalBadge = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.8);
`;

const CardBody = styled.div`
  padding: 16px 20px 20px;
`;

const CardTop = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  flex-wrap: wrap;
`;

const StatusBadge = styled.span<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  padding: 3px 8px;
  border-radius: 4px;
  background: ${(p) => p.$color}18;
  color: ${(p) => p.$color};
  border: 1px solid ${(p) => p.$color}30;

  &::before {
    content: '';
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: ${(p) => p.$color};
  }
`;

const TYPE_COLORS: Record<string, string> = {
  game: "#10b981",
  app: "#6366f1",
  tool: "#f59e0b",
  library: "#3b82f6",
  website: "#8b5cf6",
  bot: "#ec4899",
};

const TypeBadge = styled.span<{ $type: string }>`
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  padding: 3px 8px;
  border-radius: 4px;
  background: ${(p) => TYPE_COLORS[p.$type] || "#6366f1"}18;
  color: ${(p) => TYPE_COLORS[p.$type] || "#6366f1"};
  border: 1px solid ${(p) => TYPE_COLORS[p.$type] || "#6366f1"}30;
`;

const PlatformBadge = styled.span`
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  padding: 2px 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
`;

const CardTitle = styled.h3`
  margin: 0 0 6px;
  font-size: 1.25rem;
  font-weight: 700;
  color: ${(props) => props.theme.contrast};
  font-family: var(--font-sans);
  letter-spacing: -0.3px;
`;

const CardDesc = styled.p`
  margin: 0 0 14px;
  font-size: 0.8125rem;
  color: ${(props) => props.theme.textColor};
  opacity: 0.7;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const StatsRow = styled.div`
  display: flex;
  gap: 1.25rem;
  margin-bottom: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;

  span {
    font-family: var(--font-mono);
    font-size: 1rem;
    font-weight: 700;
    color: ${(props) => props.theme.contrast};
  }

  label {
    font-family: var(--font-mono);
    font-size: 0.625rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: rgba(255, 255, 255, 0.4);
  }
`;

const TechRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const TechTag = styled.span`
  font-size: 10px;
  font-weight: 500;
  padding: 3px 8px;
  border-radius: 4px;
  background: rgba(59, 130, 246, 0.1);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.2);
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 80px 0;
`;

const EmptyIcon = styled.div`
  color: rgba(255, 255, 255, 0.2);
`;

const EmptyText = styled.p`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
`;
