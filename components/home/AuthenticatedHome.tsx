import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { ChevronRight, Sparkles } from "lucide-react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { api } from "../../convex/_generated/api";
import { LOUNGE_COLORS } from "../../constants/theme";
import { useBentoLayout } from "../../hooks/useBentoLayout";
import type { DiscordWidget } from "../../types/discord";
import type { BentoCardProps } from "../learn/BentoCard";
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
  SoftwareWidget,
  VideosWidget,
  WidgetTracker,
} from "./widgets";

interface RecommendationScore {
  slug: string;
  score: number;
}

interface AuthenticatedHomeProps {
  isLive?: boolean;
  discordWidget?: DiscordWidget | null;
}

const POSTS_PER_PAGE = 12;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function AuthenticatedHome({ isLive = false, discordWidget }: AuthenticatedHomeProps) {
  const { user: clerkUser, isSignedIn } = useUser();
  const convexUser = useQuery(api.users.getMe);
  const displayName = convexUser?.displayName || clerkUser?.firstName || "there";
  const avatarUrl = convexUser?.avatarUrl || clerkUser?.imageUrl;

  // Widget interaction ordering
  const interactions = useQuery(api.widgetInteractions.getMyInteractions);
  const sortedWidgets = useBentoLayout(interactions);

  const WIDGET_RENDERERS: Record<string, (size: string) => ReactNode> = {
    "latest-content": (size) => <LatestContentWidget compact={size === "small" || size === "medium"} />,
    "music":          () => <MusicWidget />,
    "live":           () => <LiveWidget isLive={isLive} />,
    "activity":       () => <ActivityWidget />,
    "community":      () => <CommunityWidget discordWidget={discordWidget} />,
    "integrations":   () => <IntegrationsWidget />,
    "videos":         () => <VideosWidget />,
    "software":       () => <SoftwareWidget />,
    "games":          () => <GamesWidget />,
  };

  // Recommendation state
  const [recScores, setRecScores] = useState<RecommendationScore[]>([]);
  const [refreshKey] = useState(() => Date.now());

  // Infinite scroll state
  const [offset, setOffset] = useState(0);
  const [accumulatedPosts, setAccumulatedPosts] = useState<BentoCardProps[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const hasResetRef = useRef(false);

  // Queries
  const watchHistory = useQuery(
    api.articleWatchTime.getUserWatchHistory,
    isSignedIn ? { limit: 50 } : "skip"
  );
  const basePosts = useQuery(api.blogPosts.getForBento, { excludeNews: true });

  // Compute recommendations
  useEffect(() => {
    if (!isSignedIn || !clerkUser?.id || !basePosts || !watchHistory) return;

    const fetchRecs = async () => {
      try {
        const response = await fetch("/api/recommendations/compute", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
          body: JSON.stringify({
            clerkId: clerkUser.id,
            watchHistory: watchHistory.map((w) => ({
              slug: w.slug,
              totalSeconds: w.totalSeconds,
            })),
            posts: basePosts.map((p) => ({
              slug: p.slug,
              publishedAt: p.publishedAt,
              viewCount: p.viewCount,
              contentType: p.contentType,
            })),
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setRecScores(data.recommendations || []);
        }
      } catch {
        // Silently fail, fall back to default ordering
      }
    };

    fetchRecs();
  }, [isSignedIn, clerkUser?.id, basePosts, watchHistory, refreshKey]);

  // Paginated query
  const paginatedResult = useQuery(
    api.blogPosts.getForBentoPaginated,
    basePosts
      ? {
          excludeNews: true,
          recommendationScores: recScores.length > 0 ? recScores : undefined,
          limit: POSTS_PER_PAGE,
          offset,
        }
      : "skip"
  );

  // Reset on recScores change
  useEffect(() => {
    if (recScores.length > 0 && !hasResetRef.current) {
      setAccumulatedPosts([]);
      setOffset(0);
      hasResetRef.current = true;
    }
  }, [recScores]);

  // Accumulate posts
  useEffect(() => {
    if (paginatedResult?.posts) {
      setAccumulatedPosts((prev) => {
        if (offset === 0) {
          return paginatedResult.posts as BentoCardProps[];
        }
        const existingIds = new Set(prev.map((p) => p._id));
        const newPosts = paginatedResult.posts.filter((p) => !existingIds.has(p._id));
        return [...prev, ...(newPosts as BentoCardProps[])];
      });
      setIsLoadingMore(false);
    }
  }, [paginatedResult, offset]);

  // Infinite scroll observer
  const hasMoreRef = useRef(false);
  const isLoadingMoreRef = useRef(false);
  hasMoreRef.current = paginatedResult?.hasMore ?? false;
  isLoadingMoreRef.current = isLoadingMore;

  const handleLoadMore = useCallback(() => {
    if (hasMoreRef.current && !isLoadingMoreRef.current) {
      setIsLoadingMore(true);
      setOffset((prev) => prev + POSTS_PER_PAGE);
    }
  }, []);

  const hasPosts = accumulatedPosts.length > 0;

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [handleLoadMore, hasPosts]);

  // Cache for preventing flash
  const articlePostsCache = useRef<BentoCardProps[]>([]);
  if (accumulatedPosts.length > 0) {
    articlePostsCache.current = accumulatedPosts;
  }
  const articlePosts = accumulatedPosts.length > 0 ? accumulatedPosts : articlePostsCache.current;

  const isLoading = articlePosts.length === 0;
  const hasMore = paginatedResult?.hasMore ?? false;

  return (
    <>
      <Head>
        <title>Home | Nevulo</title>
        <meta name="description" content="Your personalized dashboard on Nevulo" />
      </Head>

      <AuthenticatedNavbar />

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
              <LevelProgress compact tier={convexUser?.tier as any} />
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
          {sortedWidgets.map((widget) => {
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
              {isLoadingMore && <LoadingIndicator>Loading more...</LoadingIndicator>}
              {!hasMore && articlePosts.length > 10 && (
                <EndMessage>You've seen it all!</EndMessage>
              )}
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

const LoadingIndicator = styled.span`
  font-size: 14px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.6;
`;

const EndMessage = styled.span`
  font-size: 14px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.5;
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
