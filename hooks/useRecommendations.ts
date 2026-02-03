import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../convex/_generated/api";
import type { BentoCardProps } from "../components/learn/BentoCard";

interface RecommendationScore {
  slug: string;
  score: number;
}

interface UseRecommendationsOptions {
  excludeNews?: boolean;
  excludeShorts?: boolean;
  postsPerPage?: number;
}

export function useRecommendations(options: UseRecommendationsOptions = {}) {
  const { excludeNews = false, excludeShorts = false, postsPerPage = 20 } = options;
  const { user: clerkUser, isSignedIn } = useUser();

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
    isSignedIn ? { limit: 50 } : "skip",
  );
  const basePosts = useQuery(api.blogPosts.getForBento, {
    excludeNews: excludeNews || undefined,
    excludeShorts: excludeShorts || undefined,
  });

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

  // Paginated query
  const paginatedResult = useQuery(
    api.blogPosts.getForBentoPaginated,
    basePosts
      ? {
          excludeNews: excludeNews || undefined,
          excludeShorts: excludeShorts || undefined,
          recommendationScores: recScores.length > 0 ? recScores : undefined,
          limit: postsPerPage,
          offset,
        }
      : "skip",
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
      setOffset((prev) => prev + postsPerPage);
    }
  }, [postsPerPage]);

  const hasPosts = accumulatedPosts.length > 0;

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

  // Cache for preventing flash
  const articlePostsCache = useRef<BentoCardProps[]>([]);
  if (accumulatedPosts.length > 0) {
    articlePostsCache.current = accumulatedPosts;
  }
  const posts = accumulatedPosts.length > 0 ? accumulatedPosts : articlePostsCache.current;

  return {
    posts,
    isLoading: posts.length === 0,
    hasMore: paginatedResult?.hasMore ?? false,
    loadMoreRef,
    isLoadingMore,
  };
}
