import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, requireUser } from "./auth";

// Reaction type validator
const reactionTypeValidator = v.union(
  v.literal("fire"),
  v.literal("heart"),
  v.literal("plus1"),
  v.literal("eyes"),
  v.literal("question"),
);

// ============================================
// QUERIES
// ============================================

/**
 * Get reactions for a highlight
 */
export const getForHighlight = query({
  args: { highlightId: v.id("contentHighlights") },
  handler: async (ctx, args) => {
    const reactions = await ctx.db
      .query("contentReactions")
      .withIndex("by_highlight", (q) => q.eq("highlightId", args.highlightId))
      .collect();

    // Count by type
    const counts: Record<string, number> = {
      fire: 0,
      heart: 0,
      plus1: 0,
      eyes: 0,
      question: 0,
    };

    for (const reaction of reactions) {
      if (reaction.type in counts) {
        counts[reaction.type]++;
      }
    }

    return {
      counts,
      total: reactions.length,
    };
  },
});

/**
 * Get all reactions for a post (grouped by highlight for gutter display)
 */
export const getForPost = query({
  args: { postId: v.id("blogPosts") },
  handler: async (ctx, args) => {
    const reactions = await ctx.db
      .query("contentReactions")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();

    // Group by highlight
    const byHighlight = new Map<string, { counts: Record<string, number>; total: number }>();

    for (const reaction of reactions) {
      const key = reaction.highlightId.toString();
      if (!byHighlight.has(key)) {
        byHighlight.set(key, {
          counts: { fire: 0, heart: 0, plus1: 0, eyes: 0, question: 0 },
          total: 0,
        });
      }
      const entry = byHighlight.get(key)!;
      if (reaction.type in entry.counts) entry.counts[reaction.type]++;
      entry.total++;
    }

    return Object.fromEntries(byHighlight);
  },
});

/**
 * Get current user's reaction to a highlight
 */
export const getMyReaction = query({
  args: { highlightId: v.id("contentHighlights") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const reaction = await ctx.db
      .query("contentReactions")
      .withIndex("by_user_highlight", (q) =>
        q.eq("userId", user._id).eq("highlightId", args.highlightId),
      )
      .unique();

    return reaction?.type ?? null;
  },
});

/**
 * Get user's reactions for all highlights on a post
 */
export const getMyReactionsForPost = query({
  args: { postId: v.id("blogPosts") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return {};

    const reactions = await ctx.db
      .query("contentReactions")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect();

    // Map highlightId -> reaction type
    const byHighlight: Record<string, string> = {};
    for (const r of reactions) {
      byHighlight[r.highlightId.toString()] = r.type;
    }

    return byHighlight;
  },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Add or toggle a reaction on a highlight
 */
export const react = mutation({
  args: {
    highlightId: v.id("contentHighlights"),
    type: reactionTypeValidator,
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // Get the highlight to get postId
    const highlight = await ctx.db.get(args.highlightId);
    if (!highlight) {
      throw new Error("Highlight not found");
    }

    // Check for existing reaction
    const existing = await ctx.db
      .query("contentReactions")
      .withIndex("by_user_highlight", (q) =>
        q.eq("userId", user._id).eq("highlightId", args.highlightId),
      )
      .unique();

    if (existing) {
      if (existing.type === args.type) {
        // Same reaction - remove it (toggle off)
        await ctx.db.delete(existing._id);
        return { action: "removed" };
      } else {
        // Different reaction - update it
        await ctx.db.patch(existing._id, {
          type: args.type,
          createdAt: Date.now(),
        });
        return { action: "changed", from: existing.type, to: args.type };
      }
    }

    // New reaction
    await ctx.db.insert("contentReactions", {
      highlightId: args.highlightId,
      postId: highlight.postId,
      userId: user._id,
      type: args.type,
      createdAt: Date.now(),
    });

    return { action: "added", type: args.type };
  },
});

/**
 * Remove reaction from a highlight
 */
export const removeReaction = mutation({
  args: { highlightId: v.id("contentHighlights") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const existing = await ctx.db
      .query("contentReactions")
      .withIndex("by_user_highlight", (q) =>
        q.eq("userId", user._id).eq("highlightId", args.highlightId),
      )
      .unique();

    if (!existing) {
      return { action: "none" };
    }

    await ctx.db.delete(existing._id);

    return { action: "removed", type: existing.type };
  },
});
