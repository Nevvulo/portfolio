import { v } from "convex/values";
import { internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

const UPSTASH_REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redisCommand(command: string[]): Promise<unknown> {
  if (!UPSTASH_REDIS_URL || !UPSTASH_REDIS_TOKEN) {
    return null;
  }

  const response = await fetch(`${UPSTASH_REDIS_URL}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_REDIS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    console.error("[recommendations] Redis error:", await response.text());
    return null;
  }

  const data = await response.json();
  return data.result;
}

export const rebuildCoViewingMatrix = internalAction({
  args: {},
  handler: async (ctx) => {
    if (!UPSTASH_REDIS_URL || !UPSTASH_REDIS_TOKEN) {
      console.warn("[recommendations] Missing Redis credentials");
      return { processed: 0 };
    }

    const recentWatchTime = await ctx.runQuery(
      internal.articleWatchTime.getAllWatchTimeRecent,
      { sinceDays: 30 }
    );

    const userPosts = new Map<string, Map<string, number>>();
    for (const record of recentWatchTime) {
      if (!userPosts.has(record.clerkId)) {
        userPosts.set(record.clerkId, new Map());
      }
      userPosts.get(record.clerkId)!.set(record.postSlug, record.totalSeconds);
    }

    const coViewScores = new Map<string, Map<string, number>>();

    for (const [, posts] of userPosts) {
      const postSlugs = Array.from(posts.keys());

      for (let i = 0; i < postSlugs.length; i++) {
        for (let j = i + 1; j < postSlugs.length; j++) {
          const postA = postSlugs[i] as string;
          const postB = postSlugs[j] as string;

          const scoreA = posts.get(postA) ?? 0;
          const scoreB = posts.get(postB) ?? 0;
          const weight = Math.sqrt(scoreA * scoreB);

          if (!coViewScores.has(postA)) coViewScores.set(postA, new Map());
          if (!coViewScores.has(postB)) coViewScores.set(postB, new Map());

          const mapA = coViewScores.get(postA)!;
          const mapB = coViewScores.get(postB)!;

          mapA.set(postB, (mapA.get(postB) ?? 0) + weight);
          mapB.set(postA, (mapB.get(postA) ?? 0) + weight);
        }
      }
    }

    let processed = 0;
    for (const [postSlug, related] of coViewScores) {
      const members = Array.from(related.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20);

      if (members.length > 0) {
        await redisCommand(["DEL", `post:coviewed:${postSlug}`]);

        // Batch all members into a single ZADD command (95% reduction in commands)
        const zaddArgs: string[] = ["ZADD", `post:coviewed:${postSlug}`];
        for (const [relatedSlug, score] of members) {
          zaddArgs.push(score.toString(), relatedSlug);
        }
        await redisCommand(zaddArgs);
        processed++;
      }
    }

    console.log(`[recommendations] Rebuilt co-viewing matrix for ${processed} posts`);
    return { processed };
  },
});

export const getPopularPosts = internalQuery({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("blogPosts")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();

    return posts
      .filter((p) => p.visibility === "public")
      .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
      .slice(0, args.limit ?? 20)
      .map((p) => ({
        slug: p.slug,
        title: p.title,
        viewCount: p.viewCount ?? 0,
      }));
  },
});
