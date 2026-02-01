import { useQuery } from "convex/react";
import {
  ArrowUpRight,
  Boxes,
  Code2,
  Gamepad2,
  Globe,
  Layers,
  Wrench,
} from "lucide-react";
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import styled from "styled-components";
import { api } from "../../convex/_generated/api";
import { LOUNGE_COLORS } from "../../constants/theme";
import { SimpleNavbar } from "../../components/navbar/simple";

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

export default function SoftwarePage() {
  const [filter, setFilter] = useState<TypeFilter>("all");
  const software = useQuery(api.software.listPublic);

  const filtered = software?.filter(
    (s) => filter === "all" || s.type === filter
  );

  return (
    <>
      <Head>
        <title>Software & Games - Nevulo</title>
        <meta
          name="description"
          content="Explore software, games, tools, and projects built by Nevulo."
        />
        <meta property="og:title" content="Software & Games - Nevulo" />
        <meta
          property="og:description"
          content="Explore software, games, tools, and projects built by Nevulo."
        />
        <meta property="og:url" content="https://nev.so/software" />
        <meta
          property="og:image"
          content="https://nev.so/api/og?title=Software%20%26%20Games&subtitle=Projects%20by%20Nevulo"
        />
      </Head>

      <SimpleNavbar title="Software" />

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
          {filtered?.map((item) => {
            const status = STATUS_LABELS[item.status] ?? STATUS_LABELS.active;
            return (
              <ProjectCard key={item._id} href={`/software/${item.slug}`}>
                {item.bannerUrl ? (
                  <CardBanner style={{ backgroundImage: `url(${item.bannerUrl})` }} />
                ) : item.background ? (
                  <CardBanner style={{ background: item.background }} />
                ) : (
                  <CardBanner style={{ background: "linear-gradient(135deg, rgba(144,116,242,0.2), rgba(59,130,246,0.15))" }} />
                )}
                <CardBody>
                  <CardTop>
                    <StatusBadge $color={status.color}>{status.label}</StatusBadge>
                    {item.platforms?.map((p) => (
                      <PlatformBadge key={p}>{p}</PlatformBadge>
                    ))}
                  </CardTop>
                  <CardTitle>{item.name}</CardTitle>
                  <CardDesc>{item.shortDescription}</CardDesc>
                  {item.technologies && item.technologies.length > 0 && (
                    <TechRow>
                      {item.technologies.slice(0, 4).map((t) => (
                        <TechTag key={t}>{t}</TechTag>
                      ))}
                    </TechRow>
                  )}
                  <CardFooter>
                    {item.links?.github && (
                      <FooterLink
                        href={item.links.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        GitHub <ArrowUpRight size={12} />
                      </FooterLink>
                    )}
                    {item.links?.website && (
                      <FooterLink
                        href={item.links.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Website <ArrowUpRight size={12} />
                      </FooterLink>
                    )}
                    {item.links?.roblox && (
                      <FooterLink
                        href={item.links.roblox}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Play on Roblox <ArrowUpRight size={12} />
                      </FooterLink>
                    )}
                  </CardFooter>
                </CardBody>
              </ProjectCard>
            );
          })}
        </ProjectGrid>

        {filtered && filtered.length === 0 && (
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

const ProjectCard = styled(Link)`
  display: block;
  border-radius: 14px;
  overflow: hidden;
  background: ${(props) => props.theme.postBackground};
  border: 1px solid rgba(255, 255, 255, 0.08);
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(255, 255, 255, 0.15);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }
`;

const CardBanner = styled.div`
  height: 120px;
  background-size: cover;
  background-position: center;
`;

const CardBody = styled.div`
  padding: 16px;
`;

const CardTop = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  flex-wrap: wrap;
`;

const StatusBadge = styled.span<{ $color: string }>`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  padding: 2px 8px;
  border-radius: 4px;
  background: ${(p) => p.$color}20;
  color: ${(p) => p.$color};
`;

const PlatformBadge = styled.span`
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  padding: 2px 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.5);
`;

const CardTitle = styled.h3`
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 700;
  color: ${(props) => props.theme.contrast};
  font-family: var(--font-sans);
`;

const CardDesc = styled.p`
  margin: 0 0 12px;
  font-size: 13px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.7;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const TechRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 12px;
`;

const TechTag = styled.span`
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(59, 130, 246, 0.1);
  color: #60a5fa;
`;

const CardFooter = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const FooterLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  color: ${LOUNGE_COLORS.tier1};
  text-decoration: none;
  transition: opacity 0.15s ease;
  &:hover {
    opacity: 0.8;
  }
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
