import { getAuth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import type { NextApiRequest, NextApiResponse } from "next";
import { api } from "../../../convex/_generated/api";
import { redis } from "../../../lib/redis";

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Cache configuration
const CACHE_TTL_SECONDS = 300; // 5 minutes
const CACHE_VERSION = "v1";

// Tier levels for cache keys
type CacheTier = "public" | "members" | "tier1" | "tier2";

function getTierFromUser(clerkPlan?: string | null): CacheTier {
  if (!clerkPlan) return "members"; // Logged in but no paid tier
  if (clerkPlan === "super_legend_2") return "tier2";
  if (clerkPlan === "super_legend") return "tier1";
  return "members";
}

function getCacheKey(tier: CacheTier, contentType?: string, excludeNews?: boolean): string {
  const parts = [`bento:${CACHE_VERSION}:${tier}`];
  if (contentType) parts.push(`type:${contentType}`);
  if (excludeNews) parts.push("excludeNews");
  return parts.join(":");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { contentType, excludeNews } = req.query;
  const excludeNewsFlag = excludeNews === "true";
  const contentTypeStr = typeof contentType === "string" ? contentType : undefined;

  try {
    // Determine user tier for cache key
    const { userId } = getAuth(req);
    let tier: CacheTier = "public";
    let clerkPlan: string | null = null;

    if (userId) {
      // Get user's plan from Redis (already cached by supporter status)
      const supporterKey = `user:status:${userId}`;
      const userData = await redis.hgetall(supporterKey);
      clerkPlan = (userData?.clerkPlan as string) || null;
      tier = getTierFromUser(clerkPlan);
    }

    const cacheKey = getCacheKey(tier, contentTypeStr, excludeNewsFlag);

    // Try cache first
    const cached = await redis.get<string>(cacheKey);
    if (cached) {
      // Parse and return cached data
      const data = typeof cached === "string" ? JSON.parse(cached) : cached;
      return res.status(200).json({
        posts: data.posts,
        fromCache: true,
        tier,
        cachedAt: data.cachedAt,
      });
    }

    // Cache miss - fetch from Convex
    // Set auth if user is logged in
    if (userId) {
      const token = await getAuth(req).getToken({ template: "convex" });
      if (token) {
        convex.setAuth(token);
      }
    }

    const posts = await convex.query(api.blogPosts.getForBento, {
      contentType: contentTypeStr as "article" | "video" | "news" | undefined,
      excludeNews: excludeNewsFlag,
    });

    // Cache the result
    const cacheData = {
      posts,
      cachedAt: Date.now(),
    };
    await redis.set(cacheKey, JSON.stringify(cacheData), { ex: CACHE_TTL_SECONDS });

    return res.status(200).json({
      posts,
      fromCache: false,
      tier,
      cachedAt: cacheData.cachedAt,
    });
  } catch (error) {
    console.error("[api/learn/bento] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
