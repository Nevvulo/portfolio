import { getAuth } from "@clerk/nextjs/server";
import { and, asc, desc, eq, ne } from "drizzle-orm";
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/src/db";
import { blogPosts, users } from "@/src/db/schema";
import { redis } from "../../../lib/redis";

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

    // Cache miss - fetch from Postgres
    // Build query conditions
    const conditions = [eq(blogPosts.status, "published")];

    if (contentTypeStr) {
      conditions.push(eq(blogPosts.contentType, contentTypeStr));
    }

    if (excludeNewsFlag) {
      conditions.push(ne(blogPosts.contentType, "news"));
    }

    // Filter by visibility based on user tier
    // Public users only see public posts
    // Members see public + members
    // tier1 sees public + members + tier1
    // tier2 sees everything
    if (tier === "public") {
      conditions.push(eq(blogPosts.visibility, "public"));
    }
    // For logged-in users, we fetch all and let the client filter, matching original behavior

    const posts = await db.query.blogPosts.findMany({
      where: and(...conditions),
      orderBy: [desc(blogPosts.bentoOrder), desc(blogPosts.publishedAt)],
      with: {
        author: {
          columns: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
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
