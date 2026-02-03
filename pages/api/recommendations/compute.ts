import type { NextApiRequest, NextApiResponse } from "next";
import { redis } from "../../../lib/redis";
import { findSimilarArticles } from "../../../lib/upstash-vector";

interface WatchHistoryItem {
  slug: string;
  totalSeconds: number;
}

interface PostMetadata {
  slug: string;
  publishedAt?: number;
  viewCount?: number;
  contentType?: "article" | "video" | "news";
  labels?: string[];
}

interface RecommendationResult {
  slug: string;
  score: number;
}

// Recency boost calculation - very gentle decay for educational content
// Educational articles don't "expire" - a 2022 article on JavaScript is still valuable
// halfLifeDays = 365 means content loses half its recency boost after a YEAR
function calculateRecencyBoost(publishedAt: number | undefined, halfLifeDays = 365): number {
  if (!publishedAt) return 0.5; // Default for posts without publishedAt

  const now = Date.now();
  const ageMs = now - publishedAt;
  const ageDays = ageMs / (24 * 60 * 60 * 1000);

  // Exponential decay with very long half-life
  const decay = Math.exp((-0.693 * ageDays) / halfLifeDays);

  // Minimum boost of 0.4 for old content (educational content stays relevant)
  return Math.max(0.4, decay);
}

function parseZrangeWithScores(arr: string[] | null): [string, number][] {
  const pairs: [string, number][] = [];
  if (!arr || arr.length === 0) return pairs;
  for (let i = 0; i < arr.length; i += 2) {
    const key = arr[i];
    const score = arr[i + 1];
    if (key !== undefined && score !== undefined) {
      pairs.push([key, Number(score)]);
    }
  }
  return pairs;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Support both old format (allPostSlugs) and new format (posts with metadata)
  const { clerkId, watchHistory, allPostSlugs, posts } = req.body as {
    clerkId: string;
    watchHistory: WatchHistoryItem[];
    allPostSlugs?: string[];
    posts?: PostMetadata[];
  };

  if (!clerkId || (!allPostSlugs && !posts)) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Build metadata map from posts array (if provided)
  const postMetadata = new Map<string, PostMetadata>();
  const slugList: string[] = [];

  if (posts && posts.length > 0) {
    for (const post of posts) {
      postMetadata.set(post.slug, post);
      slugList.push(post.slug);
    }
  } else if (allPostSlugs) {
    for (const slug of allPostSlugs) {
      slugList.push(slug);
    }
  }

  try {
    const scores = new Map<string, number>();

    for (const slug of slugList) {
      scores.set(slug, 0);
    }

    // =============================================================
    // FACTOR 1: RECENCY - DISABLED for educational content
    // Educational content doesn't expire - a 2022 JavaScript article
    // is just as valuable as a 2026 one. Recency was causing videos
    // to dominate simply because they're newer, not because they're
    // more relevant. Let engagement signals drive recommendations instead.
    // =============================================================
    // (Recency factor removed - all posts start at 0)

    // =============================================================
    // FACTOR 2: CO-VIEWING SIMILARITY (35% weight - increased)
    // Posts that users commonly view together - this is real engagement signal
    // =============================================================
    const userViews = await redis.zrange<string[]>(`user:views:${clerkId}`, 0, 9, {
      rev: true,
      withScores: true,
    });

    const userViewPairs = parseZrangeWithScores(userViews);

    for (const [postSlug, viewScore] of userViewPairs) {
      const coViewed = await redis.zrange<string[]>(`post:coviewed:${postSlug}`, 0, 4, {
        rev: true,
        withScores: true,
      });

      const coViewedPairs = parseZrangeWithScores(coViewed);

      for (const [relatedSlug, coScore] of coViewedPairs) {
        if (scores.has(relatedSlug)) {
          const contribution = coScore * Math.log10(viewScore + 1) * 0.35;
          scores.set(relatedSlug, (scores.get(relatedSlug) ?? 0) + contribution);
        }
      }
    }

    // =============================================================
    // FACTOR 3: VECTOR/SEMANTIC SIMILARITY (25% weight - increased)
    // Content semantically similar to what user has watched
    // =============================================================
    if (userViewPairs.length > 0) {
      try {
        const topSlugs = userViewPairs.slice(0, 5).map(([slug]) => slug);
        const queryText = topSlugs.join(" ");
        const similar = await findSimilarArticles(queryText, { topK: 15 });

        for (const result of similar) {
          const slug = result.id;
          if (scores.has(slug)) {
            scores.set(slug, (scores.get(slug) ?? 0) + result.score * 0.25);
          }
        }
      } catch {
        // Vector search failed, continue without
      }
    }

    // =============================================================
    // FACTOR 4: COLLABORATIVE FILTERING (15% weight)
    // What similar users have watched
    // =============================================================
    const similarityScores = new Map<string, number>();

    for (const [postSlug, score] of userViewPairs.slice(0, 5)) {
      const viewers = await redis.zrange<string[]>(`post:viewers:${postSlug}`, 0, 19, {
        rev: true,
        withScores: true,
      });

      const viewerPairs = parseZrangeWithScores(viewers);

      for (const [viewerId, viewScore] of viewerPairs) {
        if (viewerId !== clerkId) {
          const contribution = Math.min(score, viewScore);
          similarityScores.set(viewerId, (similarityScores.get(viewerId) ?? 0) + contribution);
        }
      }
    }

    const similarUsers = Array.from(similarityScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);

    for (const similarUserId of similarUsers) {
      const theirViews = await redis.zrange<string[]>(`user:views:${similarUserId}`, 0, 9, {
        rev: true,
        withScores: true,
      });

      const theirViewPairs = parseZrangeWithScores(theirViews);

      for (const [postSlug, score] of theirViewPairs) {
        if (scores.has(postSlug)) {
          scores.set(postSlug, (scores.get(postSlug) ?? 0) + Math.log10(score + 1) * 0.15);
        }
      }
    }

    // =============================================================
    // FACTOR 5: GLOBAL POPULARITY - DISABLED
    // Was causing videos to rank higher because they had more
    // popularity data in Redis. For a learning platform, we want
    // admin-curated bento order to be primary, not popularity.
    // =============================================================

    // =============================================================
    // PENALTY: Already viewed content gets 70% reduction
    // =============================================================
    const viewedSlugs = new Set(watchHistory?.map((w) => w.slug) ?? []);
    for (const slug of viewedSlugs) {
      if (scores.has(slug)) {
        scores.set(slug, (scores.get(slug) ?? 0) * 0.3);
      }
    }

    // =============================================================
    // VARIETY: DISABLED - was adding random noise that caused
    // videos to randomly rank higher than articles even with no
    // engagement data. Bento order should be respected when there's
    // no real signal.
    // =============================================================

    // =============================================================
    // CONTENT TYPE PENALTY: Videos get 70% reduction
    // This platform is article-first. Videos are supplementary content.
    // Even if users engage with videos, articles should be prioritized.
    // =============================================================
    for (const slug of slugList) {
      const metadata = postMetadata.get(slug);
      if (metadata?.contentType === "video") {
        const currentScore = scores.get(slug) ?? 0;
        scores.set(slug, currentScore * 0.3); // 70% reduction
      }
    }

    // =============================================================
    // CONTENT TYPE PENALTY: Shorts get 95% reduction
    // Shorts display poorly in bento grids and are low quality.
    // This is a safety net — query-level excludeShorts should filter
    // them out, but this ensures they're buried if they slip through.
    // =============================================================
    for (const slug of slugList) {
      const metadata = postMetadata.get(slug);
      if (metadata?.labels?.includes("short")) {
        const currentScore = scores.get(slug) ?? 0;
        scores.set(slug, currentScore * 0.05); // 95% reduction
      }
    }

    const recommendations: RecommendationResult[] = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([slug, score]) => ({ slug, score }));

    return res.status(200).json({ recommendations });
  } catch (error) {
    console.error("[recommendations/compute] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
