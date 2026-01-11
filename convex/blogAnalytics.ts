import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireCreator } from "./auth";

// Time period helpers
function getStartOfDay(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function getDaysAgo(days: number): number {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return getStartOfDay(date);
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toISOString().split("T")[0] ?? "";
}

/**
 * Get time-series views data
 */
export const getViewsOverTime = query({
  args: {
    days: v.number(), // 7, 30, 90, 180, 365
    postId: v.optional(v.id("blogPosts")),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const startTime = getDaysAgo(args.days);
    const views = await ctx.db.query("blogViews").collect();

    // Filter by time range and optionally by post
    let filteredViews = views.filter((v) => v.viewedAt >= startTime);
    if (args.postId) {
      filteredViews = filteredViews.filter((v) => v.postId === args.postId);
    }

    // Group by day
    const viewsByDay: Record<string, number> = {};

    // Initialize all days in range
    for (let i = 0; i < args.days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      viewsByDay[formatDate(getStartOfDay(date))] = 0;
    }

    // Count views per day
    for (const view of filteredViews) {
      const dateKey = formatDate(getStartOfDay(new Date(view.viewedAt)));
      if (viewsByDay[dateKey] !== undefined) {
        viewsByDay[dateKey]++;
      }
    }

    // Convert to sorted array
    return Object.entries(viewsByDay)
      .map(([date, count]) => ({ date, views: count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },
});

/**
 * Get time-series reactions data
 */
export const getReactionsOverTime = query({
  args: {
    days: v.number(),
    postId: v.optional(v.id("blogPosts")),
    type: v.optional(v.union(v.literal("like"), v.literal("helpful"), v.literal("insightful"))),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const startTime = getDaysAgo(args.days);
    const reactions = await ctx.db.query("blogReactions").collect();

    // Filter by time range
    let filtered = reactions.filter((r) => r.createdAt >= startTime);
    if (args.postId) {
      filtered = filtered.filter((r) => r.postId === args.postId);
    }
    if (args.type) {
      filtered = filtered.filter((r) => r.type === args.type);
    }

    // Group by day
    const reactionsByDay: Record<
      string,
      { like: number; helpful: number; insightful: number; total: number }
    > = {};

    // Initialize all days
    for (let i = 0; i < args.days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      reactionsByDay[formatDate(getStartOfDay(date))] = {
        like: 0,
        helpful: 0,
        insightful: 0,
        total: 0,
      };
    }

    // Count reactions
    for (const reaction of filtered) {
      const dateKey = formatDate(getStartOfDay(new Date(reaction.createdAt)));
      if (reactionsByDay[dateKey]) {
        reactionsByDay[dateKey][reaction.type]++;
        reactionsByDay[dateKey].total++;
      }
    }

    return Object.entries(reactionsByDay)
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },
});

/**
 * Get time-series comments data
 */
export const getCommentsOverTime = query({
  args: {
    days: v.number(),
    postId: v.optional(v.id("blogPosts")),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const startTime = getDaysAgo(args.days);
    const comments = await ctx.db.query("blogComments").collect();

    // Filter by time range and not deleted
    let filtered = comments.filter((c) => c.createdAt >= startTime && !c.isDeleted);
    if (args.postId) {
      filtered = filtered.filter((c) => c.postId === args.postId);
    }

    // Group by day
    const commentsByDay: Record<string, number> = {};

    for (let i = 0; i < args.days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      commentsByDay[formatDate(getStartOfDay(date))] = 0;
    }

    for (const comment of filtered) {
      const dateKey = formatDate(getStartOfDay(new Date(comment.createdAt)));
      if (commentsByDay[dateKey] !== undefined) {
        commentsByDay[dateKey]++;
      }
    }

    return Object.entries(commentsByDay)
      .map(([date, count]) => ({ date, comments: count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },
});

/**
 * Get detailed analytics summary
 */
export const getDetailedAnalytics = query({
  args: {
    days: v.number(),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const startTime = getDaysAgo(args.days);
    const previousStartTime = getDaysAgo(args.days * 2);

    const allPosts = await ctx.db.query("blogPosts").collect();
    const allViews = await ctx.db.query("blogViews").collect();
    const allReactions = await ctx.db.query("blogReactions").collect();
    const allComments = await ctx.db.query("blogComments").collect();

    // Current period stats
    const currentViews = allViews.filter((v) => v.viewedAt >= startTime);
    const previousViews = allViews.filter(
      (v) => v.viewedAt >= previousStartTime && v.viewedAt < startTime,
    );

    const currentReactions = allReactions.filter((r) => r.createdAt >= startTime);
    const previousReactions = allReactions.filter(
      (r) => r.createdAt >= previousStartTime && r.createdAt < startTime,
    );

    const currentComments = allComments.filter((c) => c.createdAt >= startTime && !c.isDeleted);
    const previousComments = allComments.filter(
      (c) => c.createdAt >= previousStartTime && c.createdAt < startTime && !c.isDeleted,
    );

    // Calculate percentage changes
    const calcChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    // Reaction breakdown
    const reactionBreakdown = {
      like: currentReactions.filter((r) => r.type === "like").length,
      helpful: currentReactions.filter((r) => r.type === "helpful").length,
      insightful: currentReactions.filter((r) => r.type === "insightful").length,
    };

    // Top posts by views in period
    const viewCountByPost: Record<string, number> = {};
    for (const view of currentViews) {
      const postIdStr = view.postId.toString();
      viewCountByPost[postIdStr] = (viewCountByPost[postIdStr] || 0) + 1;
    }

    const topPostsByViews = Object.entries(viewCountByPost)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([postId, views]) => {
        const post = allPosts.find((p) => p._id.toString() === postId);
        return {
          _id: postId,
          title: post?.title ?? "Unknown",
          slug: post?.slug ?? "",
          views,
        };
      });

    // Top posts by reactions in period
    const reactionCountByPost: Record<string, number> = {};
    for (const reaction of currentReactions) {
      const postIdStr = reaction.postId.toString();
      reactionCountByPost[postIdStr] = (reactionCountByPost[postIdStr] || 0) + 1;
    }

    const topPostsByReactions = Object.entries(reactionCountByPost)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([postId, reactions]) => {
        const post = allPosts.find((p) => p._id.toString() === postId);
        return {
          _id: postId,
          title: post?.title ?? "Unknown",
          slug: post?.slug ?? "",
          reactions,
        };
      });

    // Top posts by comments in period
    const commentCountByPost: Record<string, number> = {};
    for (const comment of currentComments) {
      const postIdStr = comment.postId.toString();
      commentCountByPost[postIdStr] = (commentCountByPost[postIdStr] || 0) + 1;
    }

    const topPostsByComments = Object.entries(commentCountByPost)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([postId, comments]) => {
        const post = allPosts.find((p) => p._id.toString() === postId);
        return {
          _id: postId,
          title: post?.title ?? "Unknown",
          slug: post?.slug ?? "",
          comments,
        };
      });

    return {
      summary: {
        views: {
          current: currentViews.length,
          previous: previousViews.length,
          change: calcChange(currentViews.length, previousViews.length),
        },
        reactions: {
          current: currentReactions.length,
          previous: previousReactions.length,
          change: calcChange(currentReactions.length, previousReactions.length),
        },
        comments: {
          current: currentComments.length,
          previous: previousComments.length,
          change: calcChange(currentComments.length, previousComments.length),
        },
        totalPosts: allPosts.length,
        publishedPosts: allPosts.filter((p) => p.status === "published").length,
        draftPosts: allPosts.filter((p) => p.status === "draft").length,
      },
      reactionBreakdown,
      topPostsByViews,
      topPostsByReactions,
      topPostsByComments,
    };
  },
});

/**
 * Get per-post analytics
 */
export const getPostAnalytics = query({
  args: {
    postId: v.id("blogPosts"),
    days: v.number(),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    const startTime = getDaysAgo(args.days);

    const views = await ctx.db
      .query("blogViews")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();

    const reactions = await ctx.db
      .query("blogReactions")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();

    const comments = await ctx.db
      .query("blogComments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();

    // Period filtered
    const periodViews = views.filter((v) => v.viewedAt >= startTime);
    const periodReactions = reactions.filter((r) => r.createdAt >= startTime);
    const periodComments = comments.filter((c) => c.createdAt >= startTime && !c.isDeleted);

    return {
      post: {
        _id: post._id,
        title: post.title,
        slug: post.slug,
        status: post.status,
        visibility: post.visibility,
        publishedAt: post.publishedAt,
        totalViews: post.viewCount,
      },
      period: {
        views: periodViews.length,
        reactions: periodReactions.length,
        comments: periodComments.length,
        reactionBreakdown: {
          like: periodReactions.filter((r) => r.type === "like").length,
          helpful: periodReactions.filter((r) => r.type === "helpful").length,
          insightful: periodReactions.filter((r) => r.type === "insightful").length,
        },
      },
      allTime: {
        views: views.length,
        reactions: reactions.length,
        comments: comments.filter((c) => !c.isDeleted).length,
        reactionBreakdown: {
          like: reactions.filter((r) => r.type === "like").length,
          helpful: reactions.filter((r) => r.type === "helpful").length,
          insightful: reactions.filter((r) => r.type === "insightful").length,
        },
      },
    };
  },
});

/**
 * Get all posts with their analytics for a table view
 */
export const getAllPostsAnalytics = query({
  args: {
    days: v.number(),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const startTime = getDaysAgo(args.days);
    const posts = await ctx.db.query("blogPosts").collect();
    const views = await ctx.db.query("blogViews").collect();
    const reactions = await ctx.db.query("blogReactions").collect();
    const comments = await ctx.db.query("blogComments").collect();

    // Build lookup maps
    const viewsByPost: Record<string, { total: number; period: number }> = {};
    const reactionsByPost: Record<
      string,
      { total: number; period: number; like: number; helpful: number; insightful: number }
    > = {};
    const commentsByPost: Record<string, { total: number; period: number }> = {};

    // Initialize
    for (const post of posts) {
      const id = post._id.toString();
      viewsByPost[id] = { total: 0, period: 0 };
      reactionsByPost[id] = { total: 0, period: 0, like: 0, helpful: 0, insightful: 0 };
      commentsByPost[id] = { total: 0, period: 0 };
    }

    // Count views
    for (const view of views) {
      const id = view.postId.toString();
      if (viewsByPost[id]) {
        viewsByPost[id].total++;
        if (view.viewedAt >= startTime) {
          viewsByPost[id].period++;
        }
      }
    }

    // Count reactions
    for (const reaction of reactions) {
      const id = reaction.postId.toString();
      if (reactionsByPost[id]) {
        reactionsByPost[id].total++;
        if (reaction.createdAt >= startTime) {
          reactionsByPost[id].period++;
          reactionsByPost[id][reaction.type]++;
        }
      }
    }

    // Count comments
    for (const comment of comments) {
      const id = comment.postId.toString();
      if (commentsByPost[id] && !comment.isDeleted) {
        commentsByPost[id].total++;
        if (comment.createdAt >= startTime) {
          commentsByPost[id].period++;
        }
      }
    }

    return posts
      .map((post) => {
        const id = post._id.toString();
        return {
          _id: post._id,
          title: post.title,
          slug: post.slug,
          status: post.status,
          visibility: post.visibility,
          contentType: post.contentType,
          publishedAt: post.publishedAt,
          views: viewsByPost[id] || { total: 0, period: 0 },
          reactions: reactionsByPost[id] || {
            total: 0,
            period: 0,
            like: 0,
            helpful: 0,
            insightful: 0,
          },
          comments: commentsByPost[id] || { total: 0, period: 0 },
        };
      })
      .sort((a, b) => b.views.period - a.views.period);
  },
});
