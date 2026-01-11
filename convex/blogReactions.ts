import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser, requireUser, hasAccessToTier, isStaff } from "./auth";
import { Doc, Id } from "./_generated/dataModel";

// Reaction type validator
const reactionTypeValidator = v.union(
  v.literal("like"),
  v.literal("helpful"),
  v.literal("insightful")
);

// Interaction points per reaction type
const REACTION_POINTS: Record<"like" | "helpful" | "insightful", number> = {
  like: 3,
  helpful: 4,
  insightful: 5,
};

// Rate limits
const MAX_REACTIONS_PER_POST = 5;
const MAX_REACTIONS_PER_24H = 10;
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Check if user can access a post's reactions
 */
async function canAccessPost(
  ctx: any,
  postId: Id<"blogPosts">
): Promise<{ post: Doc<"blogPosts">; user: Doc<"users"> | null }> {
  const post = await ctx.db.get(postId);
  if (!post) {
    throw new Error("Post not found");
  }

  const user = await getCurrentUser(ctx);

  // Check visibility
  if (post.visibility === "public") {
    return { post, user };
  }

  if (!user) {
    throw new Error("You must be logged in to view this content");
  }

  if (post.visibility === "members") {
    return { post, user };
  }

  if (!hasAccessToTier(user.tier, post.visibility)) {
    throw new Error("You don't have access to this content");
  }

  return { post, user };
}

// ============================================
// QUERIES
// ============================================

/**
 * Get reaction counts for a post
 */
export const getCounts = query({
  args: { postId: v.id("blogPosts") },
  handler: async (ctx, args) => {
    const reactions = await ctx.db
      .query("blogReactions")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();

    // Count by type
    const counts = {
      like: 0,
      helpful: 0,
      insightful: 0,
      total: reactions.length,
    };

    for (const reaction of reactions) {
      const type = reaction.type as keyof typeof counts;
      if (type in counts && type !== "total") {
        counts[type]++;
      }
    }

    return counts;
  },
});

/**
 * Get current user's reactions to a post (counts per type)
 */
export const getMyReactions = query({
  args: { postId: v.id("blogPosts") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const reactions = await ctx.db
      .query("blogReactions")
      .withIndex("by_user_post", (q) =>
        q.eq("userId", user._id).eq("postId", args.postId)
      )
      .collect();

    const counts = {
      like: 0,
      helpful: 0,
      insightful: 0,
      total: reactions.length,
    };

    for (const reaction of reactions) {
      const type = reaction.type as keyof typeof counts;
      if (type in counts && type !== "total") {
        counts[type]++;
      }
    }

    return counts;
  },
});

/**
 * Get current user's reaction budget info
 */
export const getMyReactionBudget = query({
  args: { postId: v.id("blogPosts") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    // Get reactions for this post
    const postReactions = await ctx.db
      .query("blogReactions")
      .withIndex("by_user_post", (q) =>
        q.eq("userId", user._id).eq("postId", args.postId)
      )
      .collect();

    // Get reactions in last 24 hours
    const windowStart = Date.now() - RATE_LIMIT_WINDOW_MS;
    const recentReactions = await ctx.db
      .query("blogReactions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.gte(q.field("createdAt"), windowStart))
      .collect();

    return {
      postUsed: postReactions.length,
      postMax: MAX_REACTIONS_PER_POST,
      postRemaining: MAX_REACTIONS_PER_POST - postReactions.length,
      dailyUsed: recentReactions.length,
      dailyMax: MAX_REACTIONS_PER_24H,
      dailyRemaining: MAX_REACTIONS_PER_24H - recentReactions.length,
    };
  },
});

/**
 * Legacy: Get current user's reaction to a post (for backwards compat)
 */
export const getMyReaction = query({
  args: { postId: v.id("blogPosts") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const reactions = await ctx.db
      .query("blogReactions")
      .withIndex("by_user_post", (q) =>
        q.eq("userId", user._id).eq("postId", args.postId)
      )
      .collect();

    // Return the most common type or null
    if (reactions.length === 0) return null;

    const counts: Record<string, number> = {};
    for (const r of reactions) {
      counts[r.type] = (counts[r.type] || 0) + 1;
    }

    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  },
});

/**
 * Get reactions with user info (for admin/display)
 */
export const getReactions = query({
  args: {
    postId: v.id("blogPosts"),
    type: v.optional(reactionTypeValidator),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await canAccessPost(ctx, args.postId);
    const limit = args.limit ?? 50;

    let reactions = await ctx.db
      .query("blogReactions")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .order("desc")
      .take(limit);

    if (args.type) {
      reactions = reactions.filter((r) => r.type === args.type);
    }

    // Get user info
    const reactionsWithUsers = await Promise.all(
      reactions.map(async (reaction) => {
        const user = await ctx.db.get(reaction.userId);
        return {
          ...reaction,
          user: user
            ? {
                _id: user._id,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
              }
            : null,
        };
      })
    );

    return reactionsWithUsers;
  },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Add a reaction to a post (supports multiple reactions)
 */
export const react = mutation({
  args: {
    postId: v.id("blogPosts"),
    type: reactionTypeValidator,
  },
  handler: async (ctx, args) => {
    const { user } = await canAccessPost(ctx, args.postId);

    if (!user) {
      throw new Error("You must be logged in to react");
    }

    // Staff/creator bypass rate limits entirely
    const bypassRateLimit = isStaff(user);

    // Check post limit
    const postReactions = await ctx.db
      .query("blogReactions")
      .withIndex("by_user_post", (q) =>
        q.eq("userId", user._id).eq("postId", args.postId)
      )
      .collect();

    if (!bypassRateLimit && postReactions.length >= MAX_REACTIONS_PER_POST) {
      return {
        action: "rate_limited",
        reason: "post_limit",
        message: "Maximum reactions reached for this post"
      };
    }

    // Check 24h limit
    const windowStart = Date.now() - RATE_LIMIT_WINDOW_MS;
    const recentReactions = await ctx.db
      .query("blogReactions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.gte(q.field("createdAt"), windowStart))
      .collect();

    if (!bypassRateLimit && recentReactions.length >= MAX_REACTIONS_PER_24H) {
      return {
        action: "rate_limited",
        reason: "daily_limit",
        message: "Daily reaction limit reached"
      };
    }

    // Add the reaction
    await ctx.db.insert("blogReactions", {
      postId: args.postId,
      userId: user._id,
      type: args.type,
      createdAt: Date.now(),
    });

    // Add points
    await updateInteractionScore(
      ctx,
      args.postId,
      user._id,
      REACTION_POINTS[args.type]
    );

    const newTotal = postReactions.length + 1;
    return {
      action: "added",
      type: args.type,
      postTotal: newTotal,
      postRemaining: MAX_REACTIONS_PER_POST - newTotal,
      dailyRemaining: MAX_REACTIONS_PER_24H - recentReactions.length - 1,
    };
  },
});

/**
 * Remove one reaction of a specific type from a post
 */
export const unreact = mutation({
  args: {
    postId: v.id("blogPosts"),
    type: reactionTypeValidator,
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // Find one reaction of this type to remove
    const reactions = await ctx.db
      .query("blogReactions")
      .withIndex("by_user_post", (q) =>
        q.eq("userId", user._id).eq("postId", args.postId)
      )
      .filter((q) => q.eq(q.field("type"), args.type))
      .first();

    if (!reactions) {
      return { action: "none" };
    }

    await ctx.db.delete(reactions._id);

    // Subtract points
    await updateInteractionScore(
      ctx,
      args.postId,
      user._id,
      -REACTION_POINTS[args.type]
    );

    return { action: "removed", type: args.type };
  },
});

/**
 * Remove reaction from a post
 */
export const removeReaction = mutation({
  args: { postId: v.id("blogPosts") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const existing = await ctx.db
      .query("blogReactions")
      .withIndex("by_user_post", (q) =>
        q.eq("userId", user._id).eq("postId", args.postId)
      )
      .unique();

    if (!existing) {
      return { action: "none" };
    }

    await ctx.db.delete(existing._id);

    // Subtract points
    const reactionType = existing.type as "like" | "helpful" | "insightful";
    await updateInteractionScore(
      ctx,
      args.postId,
      user._id,
      -REACTION_POINTS[reactionType]
    );

    return { action: "removed", type: existing.type };
  },
});

/**
 * Remove ALL reactions for the current user on a post
 */
export const removeAllFromPost = mutation({
  args: { postId: v.id("blogPosts") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // Get all reactions by this user for the post
    const reactions = await ctx.db
      .query("blogReactions")
      .withIndex("by_user_post", (q) => q.eq("userId", user._id).eq("postId", args.postId))
      .collect();

    if (!reactions || reactions.length === 0) {
      return { action: "none" };
    }

    // Delete each reaction and accumulate points to subtract
    let totalPoints = 0;
    for (const r of reactions) {
      // Defensive cast — ensure type is one of the known keys
      const t = r.type as "like" | "helpful" | "insightful";
      const pts = REACTION_POINTS[t] ?? 0;
      totalPoints += pts;
      await ctx.db.delete(r._id);
    }

    if (totalPoints !== 0) {
      await updateInteractionScore(ctx, args.postId, user._id, -totalPoints);
    }

    return { action: "removed_all", removedCount: reactions.length, totalPointsRemoved: totalPoints };
  },
});

/**
 * Helper to update interaction score
 */
async function updateInteractionScore(
  ctx: any,
  postId: any,
  userId: any,
  points: number
) {
  const existing = await ctx.db
    .query("blogInteractions")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .filter((q: any) => q.eq(q.field("postId"), postId))
    .unique();

  if (existing) {
    const newScore = Math.max(0, existing.score + points);
    await ctx.db.patch(existing._id, {
      score: newScore,
      lastInteraction: Date.now(),
    });
  } else if (points > 0) {
    await ctx.db.insert("blogInteractions", {
      postId,
      userId,
      score: points,
      lastInteraction: Date.now(),
    });
  }
}
