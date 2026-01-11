import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, hasAccessToTier, requireUser } from "./auth";

/**
 * Check if user can access a post
 */
async function canAccessPost(
  ctx: any,
  postId: Id<"blogPosts">,
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

/** Get all highlights for a post (for rendering overlays). */
export const getForPost = query({
  args: { postId: v.id("blogPosts") },
  handler: async (ctx, args) => {
    await canAccessPost(ctx, args.postId);

    const highlights = await ctx.db
      .query("contentHighlights")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();

    return highlights;
  },
});

/** Get highlight counts for a post (for hero display). */
export const getCounts = query({
  args: { postId: v.id("blogPosts") },
  handler: async (ctx, args) => {
    await canAccessPost(ctx, args.postId);

    const highlights = await ctx.db
      .query("contentHighlights")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();

    const uniqueUsers = new Set(highlights.map((h) => h.userId.toString()));

    return {
      total: highlights.length,
      uniqueUsers: uniqueUsers.size,
    };
  },
});

/** Get highlights with user details (for modal display). */
export const getWithDetails = query({
  args: { postId: v.id("blogPosts") },
  handler: async (ctx, args) => {
    await canAccessPost(ctx, args.postId);

    const highlights = await ctx.db
      .query("contentHighlights")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .order("desc")
      .collect();

    // Get user info for each highlight
    const highlightsWithUsers = await Promise.all(
      highlights.map(async (highlight) => {
        const user = await ctx.db.get(highlight.userId);
        return {
          ...highlight,
          user: user
            ? {
                _id: user._id,
                displayName: user.displayName,
                username: user.username,
                avatarUrl: user.avatarUrl,
              }
            : null,
        };
      }),
    );

    // Group by user for display
    const byUser = new Map<
      string,
      {
        user: { _id: Id<"users">; displayName: string; username?: string; avatarUrl?: string };
        highlights: typeof highlightsWithUsers;
      }
    >();

    for (const h of highlightsWithUsers) {
      if (!h.user) continue;
      const key = h.user._id.toString();
      if (!byUser.has(key)) {
        byUser.set(key, { user: h.user, highlights: [] });
      }
      byUser.get(key)!.highlights.push(h);
    }

    return {
      highlights: highlightsWithUsers,
      byUser: Array.from(byUser.values()),
    };
  },
});

/**
 * Get all highlights for the current user across all posts
 */
export const getMyHighlights = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const limit = args.limit ?? 100;

    const highlights = await ctx.db
      .query("contentHighlights")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);

    // Get post info for each highlight
    const highlightsWithPosts = await Promise.all(
      highlights.map(async (highlight) => {
        const post = await ctx.db.get(highlight.postId);
        return {
          ...highlight,
          post: post
            ? {
                _id: post._id,
                slug: post.slug,
                title: post.title,
                coverImage: post.coverImage,
              }
            : null,
        };
      }),
    );

    return highlightsWithPosts;
  },
});

/**
 * Get current user's highlights for a specific post
 */
export const getMyHighlightsForPost = query({
  args: { postId: v.id("blogPosts") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const highlights = await ctx.db
      .query("contentHighlights")
      .withIndex("by_user_post", (q) => q.eq("userId", user._id).eq("postId", args.postId))
      .collect();

    return highlights;
  },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Create a new highlight
 */
export const create = mutation({
  args: {
    postId: v.id("blogPosts"),
    highlightedText: v.string(),
    prefix: v.string(),
    suffix: v.string(),
    isReactionOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { user } = await canAccessPost(ctx, args.postId);

    if (!user) {
      throw new Error("You must be logged in to highlight");
    }

    // Validate text length
    if (args.highlightedText.length === 0) {
      throw new Error("Highlighted text cannot be empty");
    }

    if (args.highlightedText.length > 2000) {
      throw new Error("Highlighted text is too long (max 2000 characters)");
    }

    // Create the highlight
    const highlightId = await ctx.db.insert("contentHighlights", {
      postId: args.postId,
      userId: user._id,
      highlightedText: args.highlightedText,
      prefix: args.prefix.slice(-80), // Ensure max 80 chars
      suffix: args.suffix.slice(0, 80), // Ensure max 80 chars
      isReactionOnly: args.isReactionOnly ?? false,
      createdAt: Date.now(),
    });

    return highlightId;
  },
});

/**
 * Remove a highlight (and cascade delete comments/reactions)
 */
export const remove = mutation({
  args: { highlightId: v.id("contentHighlights") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const highlight = await ctx.db.get(args.highlightId);
    if (!highlight) {
      throw new Error("Highlight not found");
    }

    // Only owner can delete
    if (highlight.userId.toString() !== user._id.toString()) {
      throw new Error("You can only delete your own highlights");
    }

    // Delete associated comments
    const comments = await ctx.db
      .query("contentComments")
      .withIndex("by_highlight", (q) => q.eq("highlightId", args.highlightId))
      .collect();

    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    // Delete associated reactions
    const reactions = await ctx.db
      .query("contentReactions")
      .withIndex("by_highlight", (q) => q.eq("highlightId", args.highlightId))
      .collect();

    for (const reaction of reactions) {
      await ctx.db.delete(reaction._id);
    }

    // Delete the highlight
    await ctx.db.delete(args.highlightId);

    return { deleted: true };
  },
});

/**
 * Remove all highlights for a post by the current user
 */
export const removeAllFromPost = mutation({
  args: { postId: v.id("blogPosts") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // Get all highlights by this user for this post
    const highlights = await ctx.db
      .query("contentHighlights")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect();

    let deletedCount = 0;

    for (const highlight of highlights) {
      // Delete associated comments
      const comments = await ctx.db
        .query("contentComments")
        .withIndex("by_highlight", (q) => q.eq("highlightId", highlight._id))
        .collect();

      for (const comment of comments) {
        await ctx.db.delete(comment._id);
      }

      // Delete associated reactions
      const reactions = await ctx.db
        .query("contentReactions")
        .withIndex("by_highlight", (q) => q.eq("highlightId", highlight._id))
        .collect();

      for (const reaction of reactions) {
        await ctx.db.delete(reaction._id);
      }

      // Delete the highlight
      await ctx.db.delete(highlight._id);
      deletedCount++;
    }

    return { deleted: deletedCount };
  },
});
