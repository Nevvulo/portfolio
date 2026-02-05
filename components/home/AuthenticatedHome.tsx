import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { ChevronRight, Sparkles } from "lucide-react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { type ReactNode } from "react";
import styled from "styled-components";
import { api } from "../../convex/_generated/api";
import { LOUNGE_COLORS } from "../../constants/theme";
import { useBentoLayout } from "../../hooks/useBentoLayout";
import { useRecommendations } from "../../hooks/useRecommendations";
import type { DiscordWidget } from "../../types/discord";
import { GrainOverlay } from "../backgrounds/GrainOverlay";
import { AuthenticatedNavbar } from "../navbar/AuthenticatedNavbar";
import { HomeFeed, HomeFeedSkeleton } from "./HomeFeed";
import { LevelProgress } from "./LevelProgress";
import { QuickAccessBar } from "./QuickAccessBar";
import {
  ActivityWidget,
  BENTO_SIZES,
  BentoCell,
  BentoWidgetGrid,
  CommunityWidget,
  FeaturedCarousel,
  GamesWidget,
  IntegrationsWidget,
  LatestContentWidget,
  LiveWidget,
  MusicWidget,
  PerksWidget,
  SoftwareWidget,
  VideosWidget,
  WidgetTracker,
} from "./widgets";

interface AuthenticatedHomeProps {
  isLive?: boolean;
  discordWidget?: DiscordWidget | null;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function AuthenticatedHome({ isLive = false, discordWidget }: AuthenticatedHomeProps) {
  const { user: clerkUser } = useUser();
  const router = useRouter();
  const mockLevel = router.query.mockLevel ? Number(router.query.mockLevel) : undefined;
  const convexUser = useQuery(api.users.getMe);
  const displayName = convexUser?.displayName || clerkUser?.firstName || "there";
  const avatarUrl = convexUser?.avatarUrl || clerkUser?.imageUrl;

  // Widget interaction ordering
  const interactions = useQuery(api.widgetInteractions.getMyInteractions);
  const sortedWidgets = useBentoLayout(interactions);

  // Single subscription for all widget posts (avoids 3 separate getForBento subscriptions)
  const allWidgetPosts = useQuery(api.blogPosts.getForBento, {});

  const WIDGET_RENDERERS: Record<string, (size: string) => ReactNode> = {
    "latest-content": (size) => <LatestContentWidget compact={size === "small" || size === "medium"} posts={allWidgetPosts ?? undefined} />,
    "music":          () => <MusicWidget />,
    "live":           () => <LiveWidget isLive={isLive} />,
    "activity":       () => <ActivityWidget />,
    "community":      () => <CommunityWidget discordWidget={discordWidget} />,
    "integrations":   () => <IntegrationsWidget />,
    "perks":          () => <PerksWidget />,
    "videos":         () => <VideosWidget posts={allWidgetPosts ?? undefined} />,
    "software":       () => <SoftwareWidget />,
    "games":          () => <GamesWidget />,
  };

  // Recommendations + infinite scroll (shared hook)
  const { posts: articlePosts, isLoading, loadMoreRef, isLoadingMore } = useRecommendations({
    excludeNews: true,
    excludeShorts: true,
    postsPerPage: 12,
  });

  const hasPosts = articlePosts.length > 0;

  return (
    <>
      <Head>
        <title>Home | Nevulo</title>
        <meta name="description" content="Your personalized dashboard on Nevulo" />
      </Head>

      <AuthenticatedNavbar hideBadges />

      <GrainOverlay />

      <PageContainer>
        {/* Welcome Header */}
        <WelcomeSection>
          <WelcomeContent>
            {avatarUrl && (
              <AvatarWrapper>
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  width={56}
                  height={56}
                  style={{ borderRadius: "50%", objectFit: "cover" }}
                />
              </AvatarWrapper>
            )}
            <WelcomeText>
              <WelcomeGreeting>{getGreeting()}, {displayName.split(" ")[0]}</WelcomeGreeting>
              <LevelProgress compact showBadges mockLevel={mockLevel} />
            </WelcomeText>
          </WelcomeContent>
        </WelcomeSection>

        {/* Quick Access */}
        <QuickAccessSection>
          <QuickAccessBar />
        </QuickAccessSection>

        {/* Featured Content Carousel */}
        <WidgetSection>
          <FeaturedCarousel />
        </WidgetSection>

        {/* Bento widget grid — sorted by interaction count */}
        <BentoWidgetGrid loading={!interactions}>
          {sortedWidgets
            .filter((widget) => {
              // Hide perks widget for free users
              if (widget.id === "perks" && convexUser?.tier === "free") {
                return false;
              }
              return true;
            })
            .map((widget) => {
              const content = WIDGET_RENDERERS[widget.id]?.(widget.effectiveSize);
              if (!content) return null;
              const size = BENTO_SIZES[widget.effectiveSize];
              return (
                <BentoCell key={widget.id} $cols={size.cols}>
                  <WidgetTracker widgetId={widget.id}>{content}</WidgetTracker>
                </BentoCell>
              );
            })}
        </BentoWidgetGrid>

        {/* For You Section */}
        <FeedSection>
          <SectionHeader>
            <SectionTitle>
              <Sparkles size={18} />
              <span>For You</span>
            </SectionTitle>
            <ViewAllLink href="/learn">
              Explore all
              <ChevronRight size={16} />
            </ViewAllLink>
          </SectionHeader>

          {isLoading ? (
            <HomeFeedSkeleton />
          ) : (
            <HomeFeed posts={articlePosts} />
          )}

          {/* Infinite scroll trigger */}
          {hasPosts && (
            <LoadMoreTrigger ref={loadMoreRef}>
              {isLoadingMore && <LoadingSpinner />}
            </LoadMoreTrigger>
          )}
        </FeedSection>

        {/* Tier promo for free users */}
        {convexUser?.tier === "free" && (
          <TierPromoSection>
            <TierPromoContainer href="/support">
              <TierPromoContent>
                <TierPromoTitle>Unlock more with Super Legend</TierPromoTitle>
                <TierPromoDescription>
                  Early access, exclusive Discord channels, and Vault downloads
                </TierPromoDescription>
              </TierPromoContent>
              <TierPromoArrow><ChevronRight size={20} /></TierPromoArrow>
            </TierPromoContainer>
          </TierPromoSection>
        )}
      </PageContainer>
    </>
  );
}

const PageContainer = styled.div`
  min-height: 100vh;
  background: ${(props) => props.theme.background};
  padding-top: calc(60px + env(safe-area-inset-top));
  padding-bottom: 80px;
`;

const WelcomeSection = styled.section`
  max-width: 1200px;
  margin: 0 auto;
  padding: 28px 48px 0;

  @media (max-width: 900px) {
    padding: 20px 16px 0;
  }
`;

const WelcomeContent = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;

const AvatarWrapper = styled.div`
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid ${LOUNGE_COLORS.tier1}50;
`;

const WelcomeText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const WelcomeGreeting = styled.h1`
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: ${(props) => props.theme.contrast};
  font-family: var(--font-sans);
  line-height: 1.2;

  @media (max-width: 600px) {
    font-size: 22px;
  }
`;

const QuickAccessSection = styled.section`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 48px;

  @media (max-width: 900px) {
    padding: 16px 16px;
  }
`;

const WidgetSection = styled.section`
  max-width: 1200px;
  margin: 0 auto 16px;

  @media (max-width: 768px) {
    margin-bottom: 12px;
  }
`;

const FeedSection = styled.section`
  max-width: 1200px;
  margin: 40px auto 0;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 48px 16px;

  @media (max-width: 900px) {
    padding: 0 16px 12px;
  }
`;

const SectionTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
  font-family: var(--font-sans);

  svg {
    color: ${LOUNGE_COLORS.tier1};
  }
`;

const ViewAllLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 500;
  color: ${LOUNGE_COLORS.tier1};
  text-decoration: none;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.8;
  }
`;

const LoadMoreTrigger = styled.div`
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 24px;
`;

const LoadingSpinner = styled.div`
  width: 24px;
  height: 24px;
  border: 2px solid rgba(144, 116, 242, 0.2);
  border-top-color: #9074f2;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const TierPromoSection = styled.section`
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 48px 0;

  @media (max-width: 900px) {
    padding: 24px 16px 0;
  }
`;

const TierPromoContainer = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px;
  background: linear-gradient(135deg, rgba(144, 116, 242, 0.12) 0%, rgba(144, 116, 242, 0.04) 100%);
  border: 1px solid rgba(144, 116, 242, 0.15);
  border-radius: 14px;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    background: linear-gradient(135deg, rgba(144, 116, 242, 0.16) 0%, rgba(144, 116, 242, 0.06) 100%);
    border-color: rgba(144, 116, 242, 0.25);
    transform: translateY(-1px);
  }
`;

const TierPromoContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const TierPromoTitle = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
`;

const TierPromoDescription = styled.span`
  font-size: 13px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.6;
`;

const TierPromoArrow = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${LOUNGE_COLORS.tier1};
  opacity: 0.7;
`;
