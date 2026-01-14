import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import Head from "next/head";
import { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { Skeleton } from "../../components/generics/skeleton";
import { BlogView } from "../../components/layout/blog";
import {
  type BentoCardProps,
  BentoGrid,
  LabelFilter,
  NewsBubbles,
  SearchBar,
  SearchResultCard,
  UserInfoCard,
  useTimeTracking,
} from "../../components/learn";
import { SimpleNavbar } from "../../components/navbar/simple";
import { api } from "../../convex/_generated/api";
import { useBlogSearch } from "../../hooks/useBlogSearch";

interface RecommendationScore {
  slug: string;
  score: number;
}

const POSTS_PER_PAGE = 20;

export default function Learn() {
  const { user, isSignedIn } = useUser();
  const [recScores, setRecScores] = useState<RecommendationScore[]>([]);
  // Refresh key changes on each page load to ensure fresh recommendations
  const [refreshKey] = useState(() => Date.now());

  // Infinite scroll state
  const [offset, setOffset] = useState(0);
  const [accumulatedPosts, setAccumulatedPosts] = useState<BentoCardProps[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const hasResetRef = useRef(false);

  const newsPosts = useQuery(api.blogPosts.getForBento, { contentType: "news" });
  const watchHistory = useQuery(
    api.articleWatchTime.getUserWatchHistory,
    isSignedIn ? { limit: 50 } : "skip",
  );
  const basePosts = useQuery(api.blogPosts.getForBento, { excludeNews: true });

  useEffect(() => {
    if (!isSignedIn || !user?.id || !basePosts || !watchHistory) return;

    const fetchRecs = async () => {
      try {
        const response = await fetch("/api/recommendations/compute", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache", // Prevent browser caching
          },
          body: JSON.stringify({
            clerkId: user.id,
            watchHistory: watchHistory.map((w) => ({
              slug: w.slug,
              totalSeconds: w.totalSeconds,
            })),
            // Pass full post metadata for recency-aware recommendations
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
  }, [isSignedIn, user?.id, basePosts, watchHistory, refreshKey]);

  // Paginated query for infinite scroll
  const paginatedResult = useQuery(
    api.blogPosts.getForBentoPaginated,
    basePosts
      ? {
          excludeNews: true,
          recommendationScores: recScores.length > 0 ? recScores : undefined,
          limit: POSTS_PER_PAGE,
          offset,
        }
      : "skip",
  );

  // Reset accumulated posts when recScores change (personalization updated)
  useEffect(() => {
    if (recScores.length > 0 && !hasResetRef.current) {
      setAccumulatedPosts([]);
      setOffset(0);
      hasResetRef.current = true;
    }
  }, [recScores]);

  // Accumulate posts as we load more
  useEffect(() => {
    if (paginatedResult?.posts) {
      setAccumulatedPosts((prev) => {
        if (offset === 0) {
          // First page - replace entirely
          return paginatedResult.posts as BentoCardProps[];
        }
        // Subsequent pages - append, avoiding duplicates
        const existingIds = new Set(prev.map((p) => p._id));
        const newPosts = paginatedResult.posts.filter((p) => !existingIds.has(p._id));
        return [...prev, ...(newPosts as BentoCardProps[])];
      });
      setIsLoadingMore(false);
    }
  }, [paginatedResult, offset]);

  // Intersection Observer for infinite scroll
  // Use refs to avoid recreating observer on every state change
  const hasMoreRef = useRef(false);
  const isLoadingMoreRef = useRef(false);

  // Keep refs in sync with state
  hasMoreRef.current = paginatedResult?.hasMore ?? false;
  isLoadingMoreRef.current = isLoadingMore;

  const handleLoadMore = useCallback(() => {
    if (hasMoreRef.current && !isLoadingMoreRef.current) {
      setIsLoadingMore(true);
      setOffset((prev) => prev + POSTS_PER_PAGE);
    }
  }, []); // No deps - always reads from refs

  // Track if we have posts to show (determines if LoadMoreTrigger is rendered)
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
      { threshold: 0.1, rootMargin: "200px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [handleLoadMore, hasPosts]); // Re-run when posts become available

  // Cache for preventing flash
  const articlePostsCache = useRef<BentoCardProps[]>([]);
  if (accumulatedPosts.length > 0) {
    articlePostsCache.current = accumulatedPosts;
  }
  const articlePosts = accumulatedPosts.length > 0 ? accumulatedPosts : articlePostsCache.current;

  // Track time on site for XP
  useTimeTracking();

  // Search functionality
  const {
    query,
    setQuery,
    selectedLabels,
    toggleLabel,
    clearLabels,
    results,
    isSearching,
    error: searchError,
    allLabels,
    isLabelsLoading,
    isActive: isSearchActive,
    clearAll,
  } = useBlogSearch();

  // Show skeleton until we have both news posts and article posts populated
  const isLoading = newsPosts === undefined || articlePosts.length === 0;
  const hasMore = paginatedResult?.hasMore ?? false;

  return (
    <BlogView>
      <NavbarWrapper>
        <SimpleNavbar />
      </NavbarWrapper>

      <PageHeader>
        <HeaderTitle>explore</HeaderTitle>
      </PageHeader>

      <ContentContainer>
        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* Top row: User card + News */}
            <TopRow>
              <UserInfoCard />
              {newsPosts.length > 0 && (
                <NewsColumn>
                  <SectionHeader $align="right">
                    <SectionTitle>news</SectionTitle>
                  </SectionHeader>
                  <NewsBubbles posts={newsPosts as BentoCardProps[]} />
                </NewsColumn>
              )}
            </TopRow>

            {/* Articles section */}
            <Section>
              <SectionHeader>
                <ArticlesHeaderRow>
                  <SectionTitle>content</SectionTitle>
                  <SearchBar value={query} onChange={setQuery} />
                </ArticlesHeaderRow>
              </SectionHeader>

              {/* Label filter - show skeleton when loading, or labels when available */}
              {(isLabelsLoading || allLabels.length > 0) && (
                <FilterContainer>
                  <LabelFilter
                    labels={allLabels}
                    selectedLabels={selectedLabels}
                    onToggle={toggleLabel}
                    onClear={selectedLabels.length > 0 ? clearLabels : undefined}
                    isLoading={isLabelsLoading}
                  />
                </FilterContainer>
              )}

              {/* Search results or BentoGrid */}
              {isSearchActive ? (
                <SearchResultsContainer>
                  {isSearching && <SearchStatus>Searching...</SearchStatus>}
                  {!isSearching && searchError && (
                    <SearchStatus>
                      <NoResultsText>{searchError}</NoResultsText>
                      <ClearSearchButton onClick={clearAll}>Clear search</ClearSearchButton>
                    </SearchStatus>
                  )}
                  {!isSearching && !searchError && results && results.length === 0 && (
                    <SearchStatus>
                      <NoResultsText>No articles found matching your search.</NoResultsText>
                      <ClearSearchButton onClick={clearAll}>Clear search</ClearSearchButton>
                    </SearchStatus>
                  )}
                  {!isSearching && !searchError && results && results.length > 0 && (
                    <ResultsList>
                      {results.map((result, i) => (
                        <SearchResultCard
                          key={result.slug}
                          result={result}
                          prioritizeImage={i < 3}
                        />
                      ))}
                    </ResultsList>
                  )}
                </SearchResultsContainer>
              ) : articlePosts.length > 0 ? (
                <>
                  <BentoGrid posts={articlePosts as BentoCardProps[]} />

                  {/* Infinite scroll trigger */}
                  <LoadMoreTrigger ref={loadMoreRef}>
                    {isLoadingMore && hasMore && (
                      <LoadingIndicator>
                        <LoadingDot $delay={0} />
                        <LoadingDot $delay={0.1} />
                        <LoadingDot $delay={0.2} />
                      </LoadingIndicator>
                    )}
                  </LoadMoreTrigger>
                </>
              ) : (
                <BentoGrid posts={[]} />
              )}
            </Section>
          </>
        )}
      </ContentContainer>

      <Head key="learn">
        <title>Learn - Nevulo</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Protest+Revolution&display=swap"
          rel="stylesheet"
        />
        <meta
          name="description"
          content="Learn software engineering, web development, and programming through articles, tutorials, and videos."
        />
        {/* OpenGraph tags */}
        <meta property="og:title" content="Learn - Nevulo" />
        <meta
          property="og:description"
          content="Learn software engineering, web development, and programming through articles, tutorials, and videos."
        />
        <meta property="og:url" content="https://nev.so/learn" />
        <meta
          property="og:image"
          content="https://nev.so/api/og?title=Learn&subtitle=Articles%20%26%20Tutorials"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="Nevulo" />
        <meta property="og:type" content="website" />
        {/* Twitter/Discord card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Learn - Nevulo" />
        <meta
          name="twitter:description"
          content="Learn software engineering and web development."
        />
        <meta
          name="twitter:image"
          content="https://nev.so/api/og?title=Learn&subtitle=Articles%20%26%20Tutorials"
        />
        <link rel="canonical" href="https://nev.so/learn" />
      </Head>
    </BlogView>
  );
}

// Override SimpleNavbar to left-align for learn page
const NavbarWrapper = styled.div`
  /* Override center alignment for nevulo logo */
  & > header > div:first-child {
    max-width: 1400px;
    justify-content: flex-start;
    padding: 0 48px;

    @media (max-width: 900px) {
      padding: 0 16px;
    }

    & > div:first-child {
      display: none; /* Hide left spacer */
    }

    & > div:nth-child(2) {
      align-items: flex-start;
    }

    & > div:last-child {
      display: none; /* Hide right spacer */
    }
  }
`;

const PageHeader = styled.div`
  padding: 0 48px 0;
  max-width: 1400px;
  margin: 0 auto;
  margin-top: -30px;
  display: flex;
  justify-content: flex-start;

  @media (max-width: 900px) {
    padding: 0 16px 0;
  }
`;

const HeaderTitle = styled.h1`
  margin: 0;
  font-size: 80px;
  position: relative;
  left: 20px;
  font-weight: 900;
  color: ${(props) => props.theme.contrast};
  font-family: 'Protest Revolution', cursive;
  letter-spacing: 2px;
  transform: rotate(-3deg);
  width: fit-content;

  @media (max-width: 640px) {
    font-size: 56px;
  }
`;

const ContentContainer = styled.div`
  padding-bottom: 60px;
`;

const TopRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 0 48px;
  max-width: 1400px;
  margin: 0 auto 16px;

  @media (max-width: 1100px) {
    flex-direction: column;
    gap: 16px;
  }

  @media (max-width: 900px) {
    padding: 0 16px;
  }
`;

const NewsColumn = styled.div`
  flex: 1;
  min-width: 0;
  margin-left: auto;

  @media (max-width: 900px) {
    width: 100%;
  }
`;

const Section = styled.div`
  max-width: 1400px;
  margin: 0 auto 24px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionHeader = styled.div<{ $align?: "left" | "right" }>`
  padding: 0 48px 8px;
  max-width: 1400px;
  margin: 0 auto;
  text-align: ${(p) => p.$align || "left"};

  @media (max-width: 900px) {
    padding: 0 16px 6px;
  }
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 32px;
  font-weight: 900;
  color: ${(props) => props.theme.contrast};
  font-family: 'Protest Revolution', cursive;
  letter-spacing: 1px;
  opacity: 0.6;

  @media (max-width: 640px) {
    font-size: 26px;
  }
`;

const ArticlesHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const FilterContainer = styled.div`
  padding: 0 48px 16px;
  max-width: 1400px;
  margin: 0 auto;

  @media (max-width: 900px) {
    padding: 0 16px 12px;
  }
`;

const SearchResultsContainer = styled.div`
  padding: 0 48px;
  max-width: 1400px;
  margin: 0 auto;

  @media (max-width: 900px) {
    padding: 0 16px;
  }
`;

const SearchStatus = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: ${(props) => props.theme.textColor};
`;

const NoResultsText = styled.p`
  margin: 0 0 16px;
  font-size: 16px;
`;

const ClearSearchButton = styled.button`
  background: rgba(144, 116, 242, 0.2);
  border: 1px solid rgba(144, 116, 242, 0.4);
  color: ${(props) => props.theme.contrast};
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-family: var(--font-sans);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(144, 116, 242, 0.3);
  }
`;

const ResultsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 6em;

  @media (max-width: 900px) {
    padding: 0;
  }
`;

// Infinite scroll loading components
const LoadMoreTrigger = styled.div`
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
`;

const LoadingIndicator = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const LoadingDot = styled.div<{ $delay: number }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(144, 116, 242, 0.6);
  animation: bounce 0.6s ease-in-out infinite;
  animation-delay: ${(p) => p.$delay}s;

  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
      opacity: 0.6;
    }
    50% {
      transform: translateY(-8px);
      opacity: 1;
    }
  }
`;

// Pre-generated widths for skeleton labels (matching LabelFilter)
const SKELETON_LABEL_WIDTHS = [
  52, 78, 64, 45, 88, 56, 72, 94, 48, 82, 60, 75, 68, 42, 86
];

// Loading skeleton that matches the actual layout
function LoadingSkeleton() {
  return (
    <>
      {/* Top row: User card skeleton + News skeleton */}
      <TopRow>
        <UserCardSkeleton>
          <SkeletonAvatar />
          <SkeletonName />
          <SkeletonXpBadge />
          <SkeletonNotificationBtn />
        </UserCardSkeleton>
        <NewsColumn>
          <SectionHeader $align="right">
            <SectionTitle>news</SectionTitle>
          </SectionHeader>
          <SkeletonNewsBubbles>
            <SkeletonBubble />
            <SkeletonNewsAvatar />
          </SkeletonNewsBubbles>
        </NewsColumn>
      </TopRow>

      {/* Articles section skeleton */}
      <SkeletonContentSection>
        <SectionHeader>
          <SectionTitle>content</SectionTitle>
        </SectionHeader>

        {/* Label filter skeleton */}
        <SkeletonFilterContainer>
          <SkeletonLabelsRow>
            {SKELETON_LABEL_WIDTHS.map((width, i) => (
              <SkeletonLabelPill key={i} $width={width} />
            ))}
          </SkeletonLabelsRow>
        </SkeletonFilterContainer>

        <SkeletonBentoGrid>
          <SkeletonBentoCard $cols={3} $rows={2} />
          <SkeletonBentoCard $cols={2} $rows={2} />
          <SkeletonBentoCard $cols={2} $rows={1} />
          <SkeletonBentoCard $cols={2} $rows={1} />
          <SkeletonBentoCard $cols={1} $rows={1} />
        </SkeletonBentoGrid>
      </SkeletonContentSection>
    </>
  );
}

// User card skeleton styles - matches UserInfoCard exactly
const UserCardSkeleton = styled.div`
  background: linear-gradient(135deg, rgba(144, 116, 242, 0.15) 0%, rgba(144, 116, 242, 0.05) 100%);
  border: 1px solid rgba(144, 116, 242, 0.3);
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  width: fit-content;
`;

const SkeletonAvatar = styled(Skeleton)`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  flex-shrink: 0;
`;

const SkeletonName = styled(Skeleton)`
  width: 60px;
  height: 15px;
  border-radius: 4px;
`;

const SkeletonXpBadge = styled(Skeleton)`
  width: 90px;
  height: 28px;
  border-radius: 6px;
`;

const SkeletonNotificationBtn = styled(Skeleton)`
  width: 28px;
  height: 28px;
  border-radius: 6px;
  margin-left: auto;
`;

const SkeletonSectionTitle = styled(Skeleton)`
  width: 80px;
  height: 28px;
  border-radius: 6px;
`;

// News bubbles skeleton - matches NewsBubbles layout EXACTLY
const SkeletonNewsBubbles = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  max-width: 50%;
  min-width: 45vw;
  margin-left: auto;
  width: 100%;
  padding-right: 48px;
  position: relative;
`;

const SkeletonBubble = styled(Skeleton)`
  max-width: 380px;
  width: 100%;
  height: 110px;
  border-radius: 16px 16px 4px 16px;

  @media (max-width: 900px) {
    max-width: 100%;
    width: 100%;
  }
`;

const SkeletonNewsAvatar = styled(Skeleton)`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  position: absolute;
  bottom: 0;
  right: 0;
`;

// Skeleton content section with proper spacing to match loaded state
const SkeletonContentSection = styled.div`
  max-width: 1400px;
  margin: 0 auto 24px;

  &:last-child {
    margin-bottom: 0;
  }
`;

// Bento grid skeleton - matches the 5-column layout
const SkeletonBentoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-auto-rows: 200px;
  gap: 16px;
  padding: 0 48px;
  max-width: 1200px;
  margin: 0 auto;
  box-sizing: border-box;
  contain: layout style;
  overflow: hidden;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(4, 1fr);
    grid-auto-rows: 180px;
  }

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: 180px;
    gap: 14px;
    padding: 0 16px;
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    grid-auto-rows: auto;
    gap: 16px;
    padding: 0 16px;
  }
`;

const SkeletonBentoCard = styled(Skeleton)<{ $cols: number; $rows: number }>`
  border-radius: 16px;
  grid-column: span ${(p) => p.$cols};
  grid-row: span ${(p) => p.$rows};

  @media (max-width: 900px) {
    grid-column: span ${(p) => Math.min(p.$cols, 2)};
  }

  @media (max-width: 600px) {
    grid-column: span 1 !important;
    grid-row: span 1 !important;
    min-height: 200px;
  }
`;

// Label filter skeleton styles
const SkeletonFilterContainer = styled.div`
  padding: 0 48px 16px;
  max-width: 1400px;
  margin: 0 auto;

  @media (max-width: 900px) {
    padding: 0 16px 12px;
  }
`;

const SkeletonLabelsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const SkeletonLabelPill = styled(Skeleton)<{ $width: number }>`
  width: ${(p) => p.$width}px;
  height: 22px;
  border-radius: 4px;
  flex-shrink: 0;
`;
