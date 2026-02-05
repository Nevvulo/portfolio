import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { getCurrentUser, requireUser } from "./auth";

/**
 * Record a view for a blog post
 * Only counts once per user per post
 */
export const recordView = mutation({
  args: { postId: v.id("blogPosts") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    // Anonymous views: record in blogViews for counting, but do NOT
    // patch blogPosts.viewCount. Patching blogPosts on every anonymous
    // page view was invalidating all getForBento reactive subscriptions
    // for all connected clients, causing ~500+ MB/period of DB bandwidth.
    if (!user) {
      return { recorded: true, isNewView: true };
    }

    // Check if user already viewed
    const existingView = await ctx.db
      .query("blogViews")
      .withIndex("by_user_post", (q) => q.eq("userId", user._id).eq("postId", args.postId))
      .unique();

    if (existingView) {
      // Already viewed, update timestamp
      await ctx.db.patch(existingView._id, {
        viewedAt: Date.now(),
      });
      return { recorded: true, isNewView: false };
    }

    // New view
    await ctx.db.insert("blogViews", {
      postId: args.postId,
      userId: user._id,
      viewedAt: Date.now(),
    });

    // viewCount is synced periodically by syncViewCounts cron
    // to avoid patching blogPosts on every view (which invalidates all getForBento subscriptions)

    // Update interaction score
    await updateInteractionScore(ctx, args.postId, user._id, 1);

    return { recorded: true, isNewView: true };
  },
});

/**
 * Get view count for a post
 */
export const getViewCount = query({
  args: { postId: v.id("blogPosts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    return post?.viewCount ?? 0;
  },
});

/**
 * Check if current user has viewed a post
 */
export const hasViewed = query({
  args: { postId: v.id("blogPosts") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return false;

    const view = await ctx.db
      .query("blogViews")
      .withIndex("by_user_post", (q) => q.eq("userId", user._id).eq("postId", args.postId))
      .unique();

    return !!view;
  },
});

/**
 * Get reading history for current user
 */
export const getReadingHistory = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const limit = args.limit ?? 20;

    const views = await ctx.db
      .query("blogViews")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);

    // Get post info for each view
    const history = await Promise.all(
      views.map(async (view) => {
        const post = await ctx.db.get(view.postId);
        if (!post) return null;
        return {
          postId: post._id,
          slug: post.slug,
          title: post.title,
          viewedAt: view.viewedAt,
        };
      }),
    );

    return history.filter(Boolean);
  },
});

/**
 * Sync view counts from blogViews table to blogPosts.viewCount
 * Runs on a cron schedule to avoid patching blogPosts on every individual view
 * (which would invalidate all getForBento reactive subscriptions)
 */
export const syncViewCounts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("blogPosts")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();

    let updatedCount = 0;
    for (const post of posts) {
      const views = await ctx.db
        .query("blogViews")
        .withIndex("by_post", (q) => q.eq("postId", post._id))
        .collect();

      const actualCount = views.length;
      if (actualCount !== post.viewCount) {
        await ctx.db.patch(post._id, { viewCount: actualCount });
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      console.log(`syncViewCounts: updated ${updatedCount} posts`);
    }
  },
});

/**
 * Helper to update interaction score
 */
async function updateInteractionScore(ctx: any, postId: any, userId: any, points: number) {
  const existing = await ctx.db
    .query("blogInteractions")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .filter((q: any) => q.eq(q.field("postId"), postId))
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, {
      score: existing.score + points,
      lastInteraction: Date.now(),
    });
  } else {
    await ctx.db.insert("blogInteractions", {
      postId,
      userId,
      score: points,
      lastInteraction: Date.now(),
    });
  }
}
