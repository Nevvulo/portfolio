import { useUser } from "@clerk/nextjs";
import { useQuery as useRQ } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getWatchHistoryForUser } from "@/src/db/actions/blog";
import { getPostsForBentoAction } from "@/src/db/actions/queries";
import type { BentoCardProps } from "../components/learn/BentoCard";

interface RecommendationScore {
  slug: string;
  score: number;
}

interface UseRecommendationsOptions {
  excludeNews?: boolean;
  excludeShorts?: boolean;
  postsPerPage?: number;
  /** If true, also returns unfiltered allPosts (e.g. for news section) from the same subscription */
  returnAllPosts?: boolean;
}

/**
 * Recommendations hook - fetches posts and watch history via React Query,
 * then does personalization sorting + pagination client-side.
 */
export function useRecommendations(options: UseRecommendationsOptions = {}) {
  const { excludeNews = false, excludeShorts = false, postsPerPage = 20, returnAllPosts = false } = options;
  const { user: clerkUser, isSignedIn } = useUser();

  // Recommendation state
  const [recScores, setRecScores] = useState<RecommendationScore[]>([]);
  const [refreshKey] = useState(() => Date.now());

  // Client-side pagination state
  const [visibleCount, setVisibleCount] = useState(postsPerPage);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { data: watchHistory } = useRQ({
    queryKey: ["watchHistory"],
    queryFn: () => getWatchHistoryForUser(),
    enabled: isSignedIn,
    staleTime: 60_000,
  });
  const { data: rawPosts } = useRQ({
    queryKey: ["postsForBento"],
    queryFn: () => getPostsForBentoAction(),
    staleTime: 30_000,
  });

  // Apply client-side filters
  const basePosts = useMemo(() => {
    if (!rawPosts) return undefined;
    let filtered = rawPosts;
    if (excludeNews) filtered = filtered.filter((p) => p.contentType !== "news");
    if (excludeShorts) filtered = filtered.filter((p) => !p.labels?.includes("short"));
    return filtered;
  }, [rawPosts, excludeNews, excludeShorts]);

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
              labels: p.labels,
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

  // Reset visible count when scores change (new personalization applied)
  const prevScoresLen = useRef(0);
  useEffect(() => {
    if (recScores.length > 0 && prevScoresLen.current === 0) {
      setVisibleCount(postsPerPage);
    }
    prevScoresLen.current = recScores.length;
  }, [recScores, postsPerPage]);

  // Apply recommendation scoring and sorting client-side
  // (replaces the getForBentoPaginated server-side subscription)
  const sortedPosts = useMemo(() => {
    if (!basePosts) return [];

    const scoreMap = new Map<string, number>();
    for (const { slug, score } of recScores) {
      scoreMap.set(slug, score);
    }

    const hasPersonalization = scoreMap.size > 0;
    if (!hasPersonalization) return basePosts as BentoCardProps[];

    // Replicate server-side personalization logic client-side
    const featuredPosts = basePosts.filter((p) => p.bentoSize === "featured");
    const nonFeaturedWithIndex = basePosts
      .map((post, index) => ({ post, bentoIndex: index }))
      .filter(({ post }) => post.bentoSize !== "featured");

    const maxRecScore = Math.max(...Array.from(scoreMap.values()), 0.01);
    const MAX_POSITION_SHIFT = 5;

    const scoredNonFeatured = nonFeaturedWithIndex.map(({ post, bentoIndex }) => {
      const recScore = scoreMap.get(post.slug) ?? 0;
      const normalizedRecScore = recScore / maxRecScore;
      const adjustedIndex = bentoIndex - featuredPosts.length;
      const positionShift = -normalizedRecScore * MAX_POSITION_SHIFT;

      // Size boost for highly recommended posts
      let bentoSize = post.bentoSize;
      if (recScore > maxRecScore * 0.5) {
        if (bentoSize === "small") bentoSize = "medium";
        else if (bentoSize === "medium") bentoSize = "large";
      }

      return { ...post, bentoSize, sortKey: adjustedIndex + positionShift };
    });

    scoredNonFeatured.sort((a, b) => a.sortKey - b.sortKey);

    return [...featuredPosts, ...scoredNonFeatured] as BentoCardProps[];
  }, [basePosts, recScores]);

  // Client-side pagination
  const posts = sortedPosts.slice(0, visibleCount);
  const hasMore = visibleCount < sortedPosts.length;

  // Infinite scroll
  const hasMoreRef = useRef(false);
  const isLoadingMoreRef = useRef(false);
  hasMoreRef.current = hasMore;
  isLoadingMoreRef.current = isLoadingMore;

  const handleLoadMore = useCallback(() => {
    if (hasMoreRef.current && !isLoadingMoreRef.current) {
      setIsLoadingMore(true);
      setVisibleCount((prev) => prev + postsPerPage);
      requestAnimationFrame(() => setIsLoadingMore(false));
    }
  }, [postsPerPage]);

  const hasPosts = posts.length > 0;

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          handleLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: "200px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [handleLoadMore, hasPosts]);

  return {
    posts,
    /** All unfiltered posts from the subscription (only populated when returnAllPosts=true) */
    allPosts: returnAllPosts ? rawPosts : undefined,
    isLoading: !basePosts,
    hasMore,
    loadMoreRef,
    isLoadingMore,
  };
}
