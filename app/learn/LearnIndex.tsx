"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styled from "styled-components";
import { Skeleton } from "@/components/generics/skeleton";
import { BlogView } from "@/components/layout/blog";
import {
  type BentoCardProps,
  BentoGrid,
  LabelFilter,
  NewsBubbles,
  SearchBar,
  SearchResultCard,
  UserInfoCard,
  useTimeTracking,
} from "@/components/learn";
import { SimpleNavbar } from "@/components/navbar/simple";
import { useDebounce } from "@/hooks/useDebounce";
import type { SearchResult } from "@/hooks/useBlogSearch";
import type { getPostsForBento } from "@/src/db/queries/blog";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ServerPost = Awaited<ReturnType<typeof getPostsForBento>>[number];

interface LearnIndexProps {
  posts: ServerPost[];
}

const POSTS_PER_PAGE = 20;

// ---------------------------------------------------------------------------
// Helpers: map Postgres rows -> BentoCardProps
// ---------------------------------------------------------------------------

function toBentoCard(post: ServerPost): BentoCardProps {
  return {
    // BentoGrid/BentoCard uses _id only as a React key, so cast is safe
    _id: post.id as unknown as BentoCardProps["_id"],
    slug: post.slug,
    title: post.title,
    description: post.description ?? "",
    contentType: (post.contentType ?? "article") as BentoCardProps["contentType"],
    coverImage: post.coverImage ?? undefined,
    youtubeId: post.youtubeId ?? undefined,
    labels: (post.labels ?? []) as string[],
    difficulty: (post.difficulty ?? undefined) as BentoCardProps["difficulty"],
    readTimeMins: post.readTimeMins ?? undefined,
    bentoSize: (post.bentoSize ?? "medium") as BentoCardProps["bentoSize"],
    viewCount: post.viewCount ?? 0,
    publishedAt: post.publishedAt ? new Date(post.publishedAt).getTime() : undefined,
    visibility: (post.visibility ?? "public") as BentoCardProps["visibility"],
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LearnIndex({ posts }: LearnIndexProps) {
  // ---- Time tracking (Server Action heartbeat) ----
  useTimeTracking();

  // ---- Client-side split: news vs articles ----
  const allBentoPosts = useMemo(() => posts.map(toBentoCard), [posts]);

  const newsPosts = useMemo(
    () => allBentoPosts.filter((p) => p.contentType === "news"),
    [allBentoPosts],
  );

  const allArticles = useMemo(
    () => allBentoPosts.filter((p) => p.contentType !== "news"),
    [allBentoPosts],
  );

  // ---- Client-side pagination ----
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);
  const articlePosts = useMemo(
    () => allArticles.slice(0, visibleCount),
    [allArticles, visibleCount],
  );
  const hasMore = visibleCount < allArticles.length;
  const isLoadingMore = useRef(false);

  // Infinite-scroll observer
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoadingMore.current) {
          isLoadingMore.current = true;
          setVisibleCount((prev) => prev + POSTS_PER_PAGE);
          // Reset after a tick so the observer can fire again
          requestAnimationFrame(() => {
            isLoadingMore.current = false;
          });
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore]);

  // ---- Search / label filter (inline, no Convex) ----
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [selectedLabels, setSelectedLabels] = useState<string[]>(() => {
    const param = searchParams.get("label");
    return param ? param.split(",").filter(Boolean) : [];
  });
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Derive all labels from the passed posts array
  const allLabels = useMemo(() => {
    const set = new Set<string>();
    for (const p of posts) {
      if (Array.isArray(p.labels)) {
        for (const l of p.labels as string[]) {
          set.add(l);
        }
      }
    }
    return Array.from(set).sort();
  }, [posts]);

  const debouncedQuery = useDebounce(query, 300);

  const isSearchActive = query.length > 0 || selectedLabels.length > 0;

  // Sync selected labels -> URL
  useEffect(() => {
    const current = searchParams.get("label");
    const next = selectedLabels.length > 0 ? selectedLabels.join(",") : null;

    if (current !== next) {
      const params = new URLSearchParams(searchParams.toString());
      if (next) {
        params.set("label", next);
      } else {
        params.delete("label");
      }
      const qs = params.toString();
      router.replace(`/learn${qs ? `?${qs}` : ""}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLabels]);

  // Perform search via /api/blog/search
  const performSearch = useCallback(
    async (searchQuery: string, labels: string[]) => {
      if (!searchQuery.trim() && labels.length === 0) {
        setResults(null);
        setSearchError(null);
        return;
      }

      setIsSearching(true);
      setSearchError(null);

      try {
        const params = new URLSearchParams();
        if (searchQuery.trim()) {
          params.set("q", searchQuery.trim());
        }
        if (labels.length > 0) {
          params.set("labels", labels.join(","));
        }
        params.set("limit", "20");

        const response = await fetch(`/api/blog/search?${params.toString()}`);

        const contentType = response.headers.get("content-type");
        if (!contentType?.includes("application/json")) {
          throw new Error("Search service unavailable");
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Search failed");
        }

        setResults(data.results);
      } catch (err) {
        console.error("[LearnIndex search] Error:", err);
        setSearchError(err instanceof Error ? err.message : "Search failed");
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [],
  );

  useEffect(() => {
    performSearch(debouncedQuery, selectedLabels);
  }, [debouncedQuery, selectedLabels, performSearch]);

  const toggleLabel = useCallback((label: string) => {
    setSelectedLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label],
    );
  }, []);

  const clearLabels = useCallback(() => {
    setSelectedLabels([]);
  }, []);

  const clearAll = useCallback(() => {
    setQuery("");
    setSelectedLabels([]);
    setResults(null);
    setSearchError(null);
  }, []);

  // Posts come pre-fetched from server, so no loading state needed
  // (skeleton only shows when JS hasn't hydrated yet, which is handled by Suspense in page.tsx)
  const isLoading = false;

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
            {/* Top row: News */}
            {newsPosts.length > 0 && (
              <TopRow>
                <NewsColumn>
                  <SectionHeader $align="right">
                    <SectionTitle>news</SectionTitle>
                  </SectionHeader>
                  <NewsBubbles posts={newsPosts as BentoCardProps[]} />
                </NewsColumn>
              </TopRow>
            )}

            {/* Articles section */}
            <Section>
              <SectionHeader>
                <ArticlesHeaderRow>
                  <UserInfoCard />
                  <SearchBar value={query} onChange={setQuery} />
                </ArticlesHeaderRow>
              </SectionHeader>

              {/* Label filter */}
              {allLabels.length > 0 && (
                <FilterContainer>
                  <LabelFilter
                    labels={allLabels}
                    selectedLabels={selectedLabels}
                    onToggle={toggleLabel}
                    onClear={selectedLabels.length > 0 ? clearLabels : undefined}
                    isLoading={false}
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
                    {hasMore && (
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
    </BlogView>
  );
}

// ===========================================================================
// Styled Components (copied from pages/learn/index.tsx)
// ===========================================================================

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
  padding: 0 48px;
  max-width: 1400px;
  margin: 0 auto;
  margin-top: -30px;
  margin-bottom: 0;
  display: flex;
  justify-content: flex-start;

  @media (max-width: 900px) {
    padding: 0 16px;
  }
`;

const HeaderTitle = styled.h1`
  margin: 0;
  font-size: 40px;
  position: relative;
  left: 20px;
  font-weight: 900;
  color: ${(props) => props.theme.contrast};
  font-family: 'Protest Revolution', cursive;
  letter-spacing: 2px;
  transform: rotate(-3deg);
  width: fit-content;

  @media (max-width: 640px) {
    font-size: 28px;
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
const SKELETON_LABEL_WIDTHS = [52, 78, 64, 45, 88, 56, 72, 94, 48, 82, 60, 75, 68, 42, 86];

// Loading skeleton that matches the actual layout
function LoadingSkeleton() {
  return (
    <>
      {/* Top row: News skeleton */}
      <TopRow>
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
          <ArticlesHeaderRow>
            <UserCardSkeleton>
              <SkeletonAvatar />
              <SkeletonName />
              <SkeletonXpBadge />
            </UserCardSkeleton>
          </ArticlesHeaderRow>
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
