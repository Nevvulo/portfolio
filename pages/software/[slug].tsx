import { useQuery } from "convex/react";
import {
  ArrowUpRight,
  ChevronLeft,
  ExternalLink,
  Github,
  Globe,
} from "lucide-react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import styled from "styled-components";
import { api } from "../../convex/_generated/api";
import { LOUNGE_COLORS } from "../../constants/theme";
import { SimpleNavbar } from "../../components/navbar/simple";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "#22c55e" },
  beta: { label: "Beta", color: "#f59e0b" },
  "coming-soon": { label: "Coming Soon", color: "#a855f7" },
  archived: { label: "Archived", color: "#6b7280" },
};

export default function SoftwareDetailPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === "string" ? router.query.slug : "";
  const software = useQuery(
    api.software.getBySlug,
    slug ? { slug } : "skip"
  );

  if (software === undefined) {
    return (
      <>
        <SimpleNavbar backRoute="/software" />
        <LoadingContainer>
          <LoadingText>Loading...</LoadingText>
        </LoadingContainer>
      </>
    );
  }

  if (software === null) {
    return (
      <>
        <SimpleNavbar backRoute="/software" />
        <EmptyContainer>
          <EmptyTitle>Not Found</EmptyTitle>
          <EmptyDesc>This project doesn&apos;t exist or has been removed.</EmptyDesc>
          <BackLink href="/software">
            <ChevronLeft size={16} />
            Back to Software
          </BackLink>
        </EmptyContainer>
      </>
    );
  }

  const status = STATUS_LABELS[software.status] ?? STATUS_LABELS.active;
  const links = software.links ?? {};
  const hasLinks = Object.values(links).some(Boolean);

  return (
    <>
      <Head>
        <title>{software.name} - Nevulo</title>
        <meta name="description" content={software.shortDescription} />
        <meta property="og:title" content={`${software.name} - Nevulo`} />
        <meta property="og:description" content={software.shortDescription} />
        <meta property="og:url" content={`https://nev.so/software/${software.slug}`} />
        <meta
          property="og:image"
          content={`https://nev.so/api/og?title=${encodeURIComponent(software.name)}&subtitle=${encodeURIComponent(software.shortDescription)}`}
        />
      </Head>

      <SimpleNavbar backRoute="/software" />

      <PageContainer>
        {/* Hero */}
        <HeroBanner
          style={{
            background: software.bannerUrl
              ? `url(${software.bannerUrl}) center/cover`
              : software.background || "linear-gradient(135deg, rgba(144,116,242,0.2), rgba(59,130,246,0.15))",
          }}
        >
          <HeroOverlay />
          <HeroContent>
            <HeroMeta>
              <StatusBadge $color={status.color}>{status.label}</StatusBadge>
              {software.platforms?.map((p) => (
                <PlatformBadge key={p}>{p}</PlatformBadge>
              ))}
            </HeroMeta>
            <HeroTitle>{software.name}</HeroTitle>
            <HeroDesc>{software.shortDescription}</HeroDesc>
          </HeroContent>
        </HeroBanner>

        <ContentArea>
          {/* Links */}
          {hasLinks && (
            <LinksRow>
              {links.github && (
                <LinkButton href={links.github} target="_blank" rel="noopener noreferrer">
                  <Github size={16} />
                  GitHub
                  <ArrowUpRight size={14} />
                </LinkButton>
              )}
              {links.website && (
                <LinkButton href={links.website} target="_blank" rel="noopener noreferrer">
                  <Globe size={16} />
                  Website
                  <ArrowUpRight size={14} />
                </LinkButton>
              )}
              {links.roblox && (
                <LinkButton href={links.roblox} target="_blank" rel="noopener noreferrer" $primary>
                  <ExternalLink size={16} />
                  Play on Roblox
                  <ArrowUpRight size={14} />
                </LinkButton>
              )}
              {links.discord && (
                <LinkButton href={links.discord} target="_blank" rel="noopener noreferrer">
                  Discord
                  <ArrowUpRight size={14} />
                </LinkButton>
              )}
              {links.appStore && (
                <LinkButton href={links.appStore} target="_blank" rel="noopener noreferrer">
                  App Store
                  <ArrowUpRight size={14} />
                </LinkButton>
              )}
              {links.playStore && (
                <LinkButton href={links.playStore} target="_blank" rel="noopener noreferrer">
                  Google Play
                  <ArrowUpRight size={14} />
                </LinkButton>
              )}
            </LinksRow>
          )}

          {/* Technologies */}
          {software.technologies && software.technologies.length > 0 && (
            <Section>
              <SectionTitle>Technologies</SectionTitle>
              <TechRow>
                {software.technologies.map((t) => (
                  <TechTag key={t}>{t}</TechTag>
                ))}
              </TechRow>
            </Section>
          )}

          {/* Description */}
          {software.longDescription && (
            <Section>
              <SectionTitle>About</SectionTitle>
              <DescriptionText>{software.longDescription}</DescriptionText>
            </Section>
          )}

          {/* Stats */}
          {software.stats && (
            <Section>
              <SectionTitle>Stats</SectionTitle>
              <StatsRow>
                {software.stats.players != null && (
                  <StatCard>
                    <StatValue>{software.stats.players.toLocaleString()}</StatValue>
                    <StatLabel>Players</StatLabel>
                  </StatCard>
                )}
                {software.stats.downloads != null && (
                  <StatCard>
                    <StatValue>{software.stats.downloads.toLocaleString()}</StatValue>
                    <StatLabel>Downloads</StatLabel>
                  </StatCard>
                )}
                {software.stats.stars != null && (
                  <StatCard>
                    <StatValue>{software.stats.stars.toLocaleString()}</StatValue>
                    <StatLabel>Stars</StatLabel>
                  </StatCard>
                )}
              </StatsRow>
            </Section>
          )}
        </ContentArea>
      </PageContainer>
    </>
  );
}

const PageContainer = styled.div`
  min-height: 100vh;
  max-width: 800px;
  margin: 0 auto;
  padding-bottom: 4rem;
`;

const HeroBanner = styled.div`
  position: relative;
  min-height: 240px;
  display: flex;
  align-items: flex-end;
  border-radius: 16px;
  overflow: hidden;
  margin: 0 1.5rem;

  @media (max-width: 600px) {
    margin: 0 1rem;
    min-height: 180px;
  }
`;

const HeroOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.3) 50%, transparent 100%);
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 1;
  padding: 28px;
  width: 100%;

  @media (max-width: 600px) {
    padding: 20px;
  }
`;

const HeroMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

const StatusBadge = styled.span<{ $color: string }>`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  padding: 3px 10px;
  border-radius: 4px;
  background: ${(p) => p.$color}25;
  color: ${(p) => p.$color};
`;

const PlatformBadge = styled.span`
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  padding: 3px 8px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
`;

const HeroTitle = styled.h1`
  margin: 0;
  font-size: 32px;
  font-weight: 800;
  color: white;
  font-family: var(--font-sans);
  line-height: 1.2;

  @media (max-width: 600px) {
    font-size: 24px;
  }
`;

const HeroDesc = styled.p`
  margin: 6px 0 0;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
`;

const ContentArea = styled.div`
  padding: 24px 1.5rem 0;

  @media (max-width: 600px) {
    padding: 20px 1rem 0;
  }
`;

const LinksRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 28px;
`;

const LinkButton = styled.a<{ $primary?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.15s ease;
  background: ${(p) => (p.$primary ? LOUNGE_COLORS.tier1 : "rgba(255,255,255,0.06)")};
  color: ${(p) => (p.$primary ? "white" : "rgba(255,255,255,0.8)")};
  border: 1px solid ${(p) => (p.$primary ? "transparent" : "rgba(255,255,255,0.1)")};

  &:hover {
    transform: translateY(-1px);
    background: ${(p) => (p.$primary ? LOUNGE_COLORS.tier1 : "rgba(255,255,255,0.1)")};
  }
`;

const Section = styled.div`
  margin-bottom: 28px;
`;

const SectionTitle = styled.h3`
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const TechRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const TechTag = styled.span`
  font-size: 12px;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 6px;
  background: rgba(59, 130, 246, 0.1);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.15);
`;

const DescriptionText = styled.p`
  font-size: 15px;
  color: ${(props) => props.theme.textColor};
  line-height: 1.7;
  margin: 0;
  white-space: pre-wrap;
`;

const StatsRow = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
`;

const StatCard = styled.div`
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  text-align: center;
  min-width: 100px;
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: ${(props) => props.theme.contrast};
  font-family: var(--font-sans);
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 2px;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
`;

const LoadingText = styled.span`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
`;

const EmptyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 120px 24px;
`;

const EmptyTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: ${(props) => props.theme.contrast};
  margin: 0;
`;

const EmptyDesc = styled.p`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 500;
  color: ${LOUNGE_COLORS.tier1};
  text-decoration: none;
  margin-top: 8px;
  transition: opacity 0.15s ease;
  &:hover {
    opacity: 0.8;
  }
`;
