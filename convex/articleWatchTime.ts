import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { getCurrentUser } from "./auth";

const UPSTASH_REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Helper to call Redis REST API
async function redisCommand(command: string[]): Promise<unknown> {
  if (!UPSTASH_REDIS_URL || !UPSTASH_REDIS_TOKEN) return null;

  const response = await fetch(UPSTASH_REDIS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_REDIS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    console.error("[articleWatchTime] Redis error:", await response.text());
    return null;
  }

  const data = await response.json();
  return data.result;
}

export const trackHeartbeat = mutation({
  args: {
    postId: v.id("blogPosts"),
    sessionId: v.string(),
    secondsIncrement: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return { success: false };

    const now = Date.now();

    const existing = await ctx.db
      .query("articleWatchTime")
      .withIndex("by_user_post", (q) => q.eq("userId", user._id).eq("postId", args.postId))
      .unique();

    if (existing) {
      const secondsSinceLast = (now - existing.lastHeartbeat) / 1000;
      const validIncrement = secondsSinceLast < 30 ? args.secondsIncrement : 0;

      await ctx.db.patch(existing._id, {
        totalSeconds: existing.totalSeconds + validIncrement,
        lastHeartbeat: now,
        sessionId: args.sessionId,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("articleWatchTime", {
        postId: args.postId,
        userId: user._id,
        clerkId: user.clerkId,
        totalSeconds: args.secondsIncrement,
        lastHeartbeat: now,
        sessionId: args.sessionId,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

/**
 * Get user's watch history sorted by total time spent
 * OPTIMIZED: Batch fetch posts to avoid N+1 queries
 * OPTIMIZED: Uses identity lookup to avoid reactive dependency on users table.
 */
export const getUserWatchHistory = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const limit = args.limit ?? 50;

    // Use by_clerkId index — no users table read
    const watchRecords = await ctx.db
      .query("articleWatchTime")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .collect();

    // Sort and limit
    const sorted = watchRecords.sort((a, b) => b.totalSeconds - a.totalSeconds).slice(0, limit);

    // Batch fetch all posts at once (avoids N+1 queries)
    const postIds = [...new Set(sorted.map((r) => r.postId))];
    const posts = await Promise.all(postIds.map((id) => ctx.db.get(id)));
    const postMap = new Map(posts.filter(Boolean).map((p) => [p!._id.toString(), p!]));

    // Build results using cached post data
    const withSlugs = sorted.map((record) => {
      const post = postMap.get(record.postId.toString());
      return {
        postId: record.postId,
        slug: post?.slug ?? "",
        totalSeconds: record.totalSeconds,
        updatedAt: record.updatedAt,
      };
    });

    return withSlugs.filter((r) => r.slug);
  },
});

/**
 * Internal query for recommendations - get user's watch history
 * OPTIMIZED: Batch fetch posts to avoid N+1 queries
 */
export const getWatchHistoryForRecs = internalQuery({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    const watchRecords = await ctx.db
      .query("articleWatchTime")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const sorted = watchRecords.sort((a, b) => b.totalSeconds - a.totalSeconds).slice(0, limit);

    // Batch fetch all posts at once (avoids N+1 queries)
    const postIds = [...new Set(sorted.map((r) => r.postId))];
    const posts = await Promise.all(postIds.map((id) => ctx.db.get(id)));
    const postMap = new Map(posts.filter(Boolean).map((p) => [p!._id.toString(), p!]));

    const withSlugs = sorted.map((record) => {
      const post = postMap.get(record.postId.toString());
      return {
        postId: record.postId,
        slug: post?.slug ?? "",
        totalSeconds: record.totalSeconds,
      };
    });

    return withSlugs.filter((r) => r.slug);
  },
});

/**
 * Get all watch time records from recent days for recommendation matrix
 * OPTIMIZED: Batch fetch posts and users to avoid N+2 queries per record
 */
export const getAllWatchTimeRecent = internalQuery({
  args: {
    sinceDays: v.number(),
  },
  handler: async (ctx, args) => {
    const cutoff = Date.now() - args.sinceDays * 24 * 60 * 60 * 1000;

    // TODO: Add index on updatedAt for better performance
    const records = await ctx.db.query("articleWatchTime").collect();
    const recent = records.filter((r) => r.updatedAt > cutoff);

    // Batch fetch all posts and users at once (avoids N+2 queries per record)
    const postIds = [...new Set(recent.map((r) => r.postId))];
    const userIds = [...new Set(recent.map((r) => r.userId))];

    const [posts, users] = await Promise.all([
      Promise.all(postIds.map((id) => ctx.db.get(id))),
      Promise.all(userIds.map((id) => ctx.db.get(id))),
    ]);

    const postMap = new Map(posts.filter(Boolean).map((p) => [p!._id.toString(), p!]));
    const userMap = new Map(users.filter(Boolean).map((u) => [u!._id.toString(), u!]));

    const withDetails = recent.map((record) => {
      const post = postMap.get(record.postId.toString());
      const user = userMap.get(record.userId.toString());
      return {
        userId: record.userId,
        clerkId: user?.clerkId ?? "",
        postSlug: post?.slug ?? "",
        totalSeconds: record.totalSeconds,
      };
    });

    return withDetails.filter((r) => r.postSlug && r.clerkId);
  },
});

// ============================================
// REDIS FLUSH MECHANISM
// ============================================

/**
 * Internal mutation to upsert watch time from Redis buffer
 * Called by the flush action for each buffered record
 */
export const upsertFromBuffer = internalMutation({
  args: {
    clerkId: v.string(),
    postId: v.string(),
    totalSeconds: v.number(),
  },
  handler: async (ctx, args) => {
    // Find user by clerkId
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      console.warn(`[articleWatchTime] User not found for clerkId: ${args.clerkId}`);
      return { success: false };
    }

    // Find post by string ID (postId from Redis is a string)
    // In Convex, we need to convert this to the actual document
    // The postId stored in Redis is the document ID as a string
    const postId = args.postId as any; // This will be cast appropriately by Convex

    // Check if watch time record exists
    const existing = await ctx.db
      .query("articleWatchTime")
      .withIndex("by_user_post", (q) => q.eq("userId", user._id).eq("postId", postId))
      .unique();

    const now = Date.now();

    if (existing) {
      // Update existing record - ADD the buffered seconds (not replace)
      await ctx.db.patch(existing._id, {
        totalSeconds: existing.totalSeconds + args.totalSeconds,
        lastHeartbeat: now,
        updatedAt: now,
      });
    } else {
      // Create new record
      await ctx.db.insert("articleWatchTime", {
        postId,
        userId: user._id,
        clerkId: args.clerkId,
        totalSeconds: args.totalSeconds,
        lastHeartbeat: now,
        sessionId: "redis-flush",
        createdAt: now,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

/**
 * Internal action to flush Redis watch time buffer to Convex
 * Scans all watchtime:* keys and upserts to Convex database
 * Called periodically by cron job
 */
export const flushRedisBuffer = internalAction({
  args: {},
  handler: async (ctx) => {
    if (!UPSTASH_REDIS_URL || !UPSTASH_REDIS_TOKEN) {
      console.warn("[articleWatchTime] Missing Redis credentials, skipping flush");
      return { flushed: 0 };
    }

    // Scan for all watch time keys
    const keys: string[] = [];
    let cursor = "0";

    do {
      const result = (await redisCommand([
        "SCAN",
        cursor,
        "MATCH",
        "watchtime:*",
        "COUNT",
        "100",
      ])) as [string, string[]] | null;
      if (!result) break;
      cursor = result[0];
      keys.push(...result[1]);
    } while (cursor !== "0");

    if (keys.length === 0) {
      console.log("[articleWatchTime] No buffered watch time to flush");
      return { flushed: 0 };
    }

    console.log(`[articleWatchTime] Flushing ${keys.length} watch time records from Redis`);

    // Get all values in batch
    const values = (await redisCommand(["MGET", ...keys])) as string[] | null;
    if (!values) {
      console.error("[articleWatchTime] Failed to get values from Redis");
      return { flushed: 0 };
    }

    let flushed = 0;
    const keysToDelete: string[] = [];

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const value = values[i];
      if (!key || !value) continue;

      // Parse key: watchtime:{clerkId}:{postId}
      const parts = key.split(":");
      if (parts.length !== 3) continue;

      const clerkId = parts[1];
      const postId = parts[2];
      if (!clerkId || !postId) continue;
      const totalSeconds = parseInt(value, 10);

      if (isNaN(totalSeconds) || totalSeconds <= 0) continue;

      try {
        // Upsert to Convex
        await ctx.runMutation(internal.articleWatchTime.upsertFromBuffer, {
          clerkId,
          postId,
          totalSeconds,
        });
        keysToDelete.push(key);
        flushed++;
      } catch (error) {
        console.error(`[articleWatchTime] Failed to flush key ${key}:`, error);
      }
    }

    // Delete flushed keys from Redis
    if (keysToDelete.length > 0) {
      await redisCommand(["DEL", ...keysToDelete]);
    }

    console.log(`[articleWatchTime] Flushed ${flushed} records to Convex`);
    return { flushed };
  },
});
