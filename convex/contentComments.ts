import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import {
  getCurrentUser,
  hasAccessToTier,
  isCreator,
  isStaff,
  requireNotBanned,
  requireUser,
} from "./auth";

/** Verifies user can access the post via its highlight. Throws if not. */
async function canAccessPostViaHighlight(
  ctx: any,
  highlightId: Id<"contentHighlights">,
): Promise<{ highlight: Doc<"contentHighlights">; post: Doc<"blogPosts"> }> {
  const highlight = await ctx.db.get(highlightId);
  if (!highlight) {
    throw new Error("Highlight not found");
  }

  const post = await ctx.db.get(highlight.postId);
  if (!post) {
    throw new Error("Post not found");
  }

  // Check visibility
  if (post.visibility !== "public") {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("You must be logged in to view this content");
    }

    if (post.visibility !== "members" && !hasAccessToTier(user.tier, post.visibility)) {
      throw new Error("You don't have access to this content");
    }
  }

  return { highlight, post };
}

// ============================================
// QUERIES
// ============================================

/** Get comments for a highlight. */
export const getForHighlight = query({
  args: { highlightId: v.id("contentHighlights") },
  handler: async (ctx, args) => {
    await canAccessPostViaHighlight(ctx, args.highlightId);

    const comments = await ctx.db
      .query("contentComments")
      .withIndex("by_highlight", (q) => q.eq("highlightId", args.highlightId))
      .filter((q) => q.eq(q.field("isDeleted"), false))
      .collect();

    // Get author info
    const commentsWithAuthors = await Promise.all(
      comments.map(async (comment) => {
        const author = await ctx.db.get(comment.authorId);
        return {
          ...comment,
          author: author
            ? {
                _id: author._id,
                displayName: author.displayName,
                username: author.username,
                avatarUrl: author.avatarUrl,
                tier: author.tier,
                isCreator: author.isCreator,
              }
            : null,
        };
      }),
    );

    // Separate top-level and replies
    const topLevel = commentsWithAuthors.filter((c) => !c.parentId);
    const replies = commentsWithAuthors.filter((c) => c.parentId);

    // Nest replies under their parents
    const nested = topLevel.map((comment) => ({
      ...comment,
      replies: replies.filter((r) => r.parentId?.toString() === comment._id.toString()),
    }));

    return nested;
  },
});

/** Get comment count for a highlight. */
export const getCountForHighlight = query({
  args: { highlightId: v.id("contentHighlights") },
  handler: async (ctx, args) => {
    await canAccessPostViaHighlight(ctx, args.highlightId);

    const comments = await ctx.db
      .query("contentComments")
      .withIndex("by_highlight", (q) => q.eq("highlightId", args.highlightId))
      .filter((q) => q.eq(q.field("isDeleted"), false))
      .collect();

    return comments.length;
  },
});

/**
 * Get all comment counts for highlights on a post (for batch display)
 */
export const getCountsForPost = query({
  args: { postId: v.id("blogPosts") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("contentComments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .filter((q) => q.eq(q.field("isDeleted"), false))
      .collect();

    // Group by highlight
    const countsByHighlight = new Map<string, number>();
    for (const comment of comments) {
      const key = comment.highlightId.toString();
      countsByHighlight.set(key, (countsByHighlight.get(key) ?? 0) + 1);
    }

    return Object.fromEntries(countsByHighlight);
  },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Create a comment on a highlight
 */
export const create = mutation({
  args: {
    highlightId: v.id("contentHighlights"),
    content: v.string(),
    parentId: v.optional(v.id("contentComments")),
  },
  handler: async (ctx, args) => {
    const user = await requireNotBanned(ctx);

    // Validate content
    if (args.content.trim().length === 0) {
      throw new Error("Comment cannot be empty");
    }

    if (args.content.length > 2000) {
      throw new Error("Comment is too long (max 2000 characters)");
    }

    // Get the highlight to get postId
    const highlight = await ctx.db.get(args.highlightId);
    if (!highlight) {
      throw new Error("Highlight not found");
    }

    // Cannot comment on reaction-only highlights
    if (highlight.isReactionOnly) {
      throw new Error("Cannot add comments to reaction-only highlights");
    }

    // Validate parent if provided
    if (args.parentId) {
      const parent = await ctx.db.get(args.parentId);
      if (!parent) {
        throw new Error("Parent comment not found");
      }
      if (parent.highlightId.toString() !== args.highlightId.toString()) {
        throw new Error("Parent comment belongs to a different highlight");
      }
    }

    const commentId = await ctx.db.insert("contentComments", {
      highlightId: args.highlightId,
      postId: highlight.postId,
      authorId: user._id,
      content: args.content.trim(),
      parentId: args.parentId,
      isEdited: false,
      isDeleted: false,
      createdAt: Date.now(),
    });

    return commentId;
  },
});

/**
 * Edit a comment
 */
export const edit = mutation({
  args: {
    commentId: v.id("contentComments"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireNotBanned(ctx);

    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    // Only author or creator can edit
    const isAuthor = comment.authorId.toString() === user._id.toString();
    const isAdmin = isCreator(user);

    if (!isAuthor && !isAdmin) {
      throw new Error("You can only edit your own comments");
    }

    // Validate content
    if (args.content.trim().length === 0) {
      throw new Error("Comment cannot be empty");
    }

    if (args.content.length > 2000) {
      throw new Error("Comment is too long (max 2000 characters)");
    }

    await ctx.db.patch(args.commentId, {
      content: args.content.trim(),
      isEdited: true,
      editedAt: Date.now(),
    });

    return { edited: true };
  },
});

/**
 * Delete a comment (soft delete)
 * Authors can delete their own comments, staff/creators can delete any
 */
export const deleteComment = mutation({
  args: { commentId: v.id("contentComments") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    // Author can delete their own comments, staff can delete any
    const isAuthor = comment.authorId.toString() === user._id.toString();
    const hasModPowers = isStaff(user);

    if (!isAuthor && !hasModPowers) {
      throw new Error("You can only delete your own comments");
    }

    await ctx.db.patch(args.commentId, {
      isDeleted: true,
    });

    return { deleted: true };
  },
});
