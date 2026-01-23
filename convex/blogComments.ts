import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import {
  getCurrentUser,
  hasAccessToTier,
  isCreator,
  isStaff,
  requireCreator,
  requireNotBanned,
  requireUser,
} from "./auth";

/**
 * Check if user can access a post's comments
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

/**
 * Get author info for a comment
 */
async function getAuthorInfo(ctx: any, authorId: Id<"users"> | undefined) {
  if (!authorId) return null;
  const author = await ctx.db.get(authorId);
  if (!author) return null;
  return {
    _id: author._id,
    displayName: author.displayName,
    username: author.username,
    avatarUrl: author.avatarUrl,
    tier: author.tier,
    isCreator: author.isCreator,
  };
}

// ============================================
// QUERIES
// ============================================

/**
 * List comments for a post with cursor-based pagination
 */
export const list = query({
  args: {
    postId: v.id("blogPosts"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()), // createdAt timestamp for cursor
  },
  handler: async (ctx, args) => {
    await canAccessPost(ctx, args.postId);
    const limit = args.limit ?? 20;

    // Get top-level comments (no parentId)
    let commentsQuery = ctx.db
      .query("blogComments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .order("desc");

    // Apply cursor if provided
    if (args.cursor) {
      commentsQuery = commentsQuery.filter((q) => q.lt(q.field("createdAt"), args.cursor!));
    }

    // Fetch more than needed to filter and check hasMore
    const comments = await commentsQuery.take(limit * 3);

    // Filter to top-level only and not deleted
    const topLevel = comments.filter((c) => !c.parentId && !c.isDeleted);

    // Take only the limit we need
    const paginatedTopLevel = topLevel.slice(0, limit + 1);
    const hasMore = paginatedTopLevel.length > limit;
    const items = hasMore ? paginatedTopLevel.slice(0, -1) : paginatedTopLevel;

    // Get replies and author info for each
    const commentsWithReplies = await Promise.all(
      items.map(async (comment) => {
        const author = await getAuthorInfo(ctx, comment.authorId);

        // Get replies (limited to first 5, with hasMoreReplies flag)
        const replies = await ctx.db
          .query("blogComments")
          .withIndex("by_parent", (q) => q.eq("parentId", comment._id))
          .order("asc")
          .take(6);

        const filteredReplies = replies.filter((r) => !r.isDeleted);
        const hasMoreReplies = filteredReplies.length > 5;
        const limitedReplies = hasMoreReplies ? filteredReplies.slice(0, 5) : filteredReplies;

        const repliesWithAuthors = await Promise.all(
          limitedReplies.map(async (reply) => ({
            ...reply,
            author: await getAuthorInfo(ctx, reply.authorId),
          })),
        );

        return {
          ...comment,
          author,
          replies: repliesWithAuthors,
          hasMoreReplies,
        };
      }),
    );

    return {
      comments: commentsWithReplies,
      hasMore,
      nextCursor: hasMore && items.length > 0 ? items[items.length - 1]!.createdAt : null,
    };
  },
});

/**
 * List replies for a comment with cursor-based pagination
 */
export const listReplies = query({
  args: {
    parentId: v.id("blogComments"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()), // createdAt timestamp for cursor
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    let repliesQuery = ctx.db
      .query("blogComments")
      .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
      .order("asc");

    // Apply cursor if provided
    if (args.cursor) {
      repliesQuery = repliesQuery.filter((q) => q.gt(q.field("createdAt"), args.cursor!));
    }

    const replies = await repliesQuery.take(limit + 1);
    const filteredReplies = replies.filter((r) => !r.isDeleted);

    const hasMore = filteredReplies.length > limit;
    const items = hasMore ? filteredReplies.slice(0, -1) : filteredReplies;

    const repliesWithAuthors = await Promise.all(
      items.map(async (reply) => ({
        ...reply,
        author: await getAuthorInfo(ctx, reply.authorId),
      })),
    );

    return {
      replies: repliesWithAuthors,
      hasMore,
      nextCursor: hasMore && items.length > 0 ? items[items.length - 1]!.createdAt : null,
    };
  },
});

/**
 * Get comment count for a post
 */
export const getCount = query({
  args: { postId: v.id("blogPosts") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("blogComments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();

    return comments.filter((c) => !c.isDeleted).length;
  },
});

/**
 * List all comments for admin moderation
 */
export const listAll = query({
  args: {
    limit: v.optional(v.number()),
    includeDeleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);
    const limit = args.limit ?? 100;

    const comments = await ctx.db.query("blogComments").order("desc").take(limit);

    // Filter deleted if needed
    let filtered = comments;
    if (!args.includeDeleted) {
      filtered = comments.filter((c) => !c.isDeleted);
    }

    // Get post and author info
    const commentsWithInfo = await Promise.all(
      filtered.map(async (comment) => {
        const author = await getAuthorInfo(ctx, comment.authorId);
        const post = await ctx.db.get(comment.postId);
        return {
          ...comment,
          author,
          post: post ? { _id: post._id, title: post.title, slug: post.slug } : null,
        };
      }),
    );

    return commentsWithInfo;
  },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Create a comment
 */
export const create = mutation({
  args: {
    postId: v.id("blogPosts"),
    content: v.string(),
    parentId: v.optional(v.id("blogComments")),
  },
  handler: async (ctx, args) => {
    // Check if user is banned first
    await requireNotBanned(ctx);
    const { post, user } = await canAccessPost(ctx, args.postId);

    if (!user) {
      throw new Error("You must be logged in to comment");
    }

    // Validate content
    if (args.content.trim().length === 0) {
      throw new Error("Comment cannot be empty");
    }
    if (args.content.length > 2000) {
      throw new Error("Comment is too long (max 2000 characters)");
    }

    // If replying, verify parent exists and belongs to same post
    if (args.parentId) {
      const parent = await ctx.db.get(args.parentId);
      if (!parent) {
        throw new Error("Parent comment not found");
      }
      if (parent.postId !== args.postId) {
        throw new Error("Parent comment belongs to different post");
      }
    }

    const commentId = await ctx.db.insert("blogComments", {
      postId: args.postId,
      authorId: user._id,
      content: args.content,
      parentId: args.parentId,
      isEdited: false,
      isDeleted: false,
      createdAt: Date.now(),
      source: "website",
    });

    // Notify parent comment author if this is a reply (not self-reply)
    if (args.parentId) {
      const parent = await ctx.db.get(args.parentId);
      if (parent?.authorId && parent.authorId.toString() !== user._id.toString()) {
        const parentAuthor = await ctx.db.get(parent.authorId);
        if (parentAuthor?.notificationPreferences?.inAppNotifications) {
          await ctx.db.insert("notifications", {
            userId: parent.authorId,
            type: "comment_reply",
            referenceType: "blogComment",
            referenceId: commentId.toString(),
            title: `${user.displayName} replied to your comment`,
            body: `On "${post.title}"`,
            isRead: false,
            createdAt: Date.now(),
          });
        }
      }
    }

    // Update interaction score
    const points = args.parentId ? 5 : 7; // Reply: 5, Comment: 7
    await updateInteractionScore(ctx, args.postId, user._id, points);

    // Sync to Discord if post has a thread
    if (post.discordThreadId) {
      await ctx.scheduler.runAfter(0, internal.blogDiscord.syncCommentToDiscord, {
        commentId,
      });
    }

    return commentId;
  },
});

/**
 * Edit a comment
 */
export const edit = mutation({
  args: {
    commentId: v.id("blogComments"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireNotBanned(ctx);
    const comment = await ctx.db.get(args.commentId);

    if (!comment) {
      throw new Error("Comment not found");
    }

    // Only author or creator can edit
    if (comment.authorId !== user._id && !isCreator(user)) {
      throw new Error("You can only edit your own comments");
    }

    if (comment.isDeleted) {
      throw new Error("Cannot edit deleted comment");
    }

    // Validate content
    if (args.content.trim().length === 0) {
      throw new Error("Comment cannot be empty");
    }
    if (args.content.length > 2000) {
      throw new Error("Comment is too long (max 2000 characters)");
    }

    await ctx.db.patch(args.commentId, {
      content: args.content,
      isEdited: true,
      editedAt: Date.now(),
    });
  },
});

/**
 * Delete a comment (soft delete)
 * Authors can delete their own comments, staff/creators can delete any
 */
export const deleteComment = mutation({
  args: { commentId: v.id("blogComments") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const comment = await ctx.db.get(args.commentId);

    if (!comment) {
      throw new Error("Comment not found");
    }

    // Author can delete their own comments, staff can delete any
    const isAuthor = comment.authorId === user._id;
    const hasModPowers = isStaff(user);

    if (!isAuthor && !hasModPowers) {
      throw new Error("You can only delete your own comments");
    }

    await ctx.db.patch(args.commentId, {
      isDeleted: true,
    });
  },
});

/**
 * Admin: permanently delete a comment and its replies
 */
export const adminDelete = mutation({
  args: { commentId: v.id("blogComments") },
  handler: async (ctx, args) => {
    await requireCreator(ctx);
    const comment = await ctx.db.get(args.commentId);

    if (!comment) {
      throw new Error("Comment not found");
    }

    // Delete all replies first
    const replies = await ctx.db
      .query("blogComments")
      .withIndex("by_parent", (q) => q.eq("parentId", args.commentId))
      .collect();

    for (const reply of replies) {
      await ctx.db.delete(reply._id);
    }

    // Delete the comment
    await ctx.db.delete(args.commentId);
  },
});

/**
 * Admin: restore a deleted comment
 */
export const restore = mutation({
  args: { commentId: v.id("blogComments") },
  handler: async (ctx, args) => {
    await requireCreator(ctx);
    const comment = await ctx.db.get(args.commentId);

    if (!comment) {
      throw new Error("Comment not found");
    }

    await ctx.db.patch(args.commentId, {
      isDeleted: false,
    });
  },
});

/**
 * Report a comment (creates a flag for admin review)
 */
export const report = mutation({
  args: {
    commentId: v.id("blogComments"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const comment = await ctx.db.get(args.commentId);

    if (!comment) {
      throw new Error("Comment not found");
    }

    // Check if already reported by this user
    const existingReport = await ctx.db
      .query("blogCommentReports")
      .withIndex("by_comment", (q) => q.eq("commentId", args.commentId))
      .filter((q) => q.eq(q.field("reporterId"), user._id))
      .unique();

    if (existingReport) {
      throw new Error("You have already reported this comment");
    }

    await ctx.db.insert("blogCommentReports", {
      commentId: args.commentId,
      reporterId: user._id,
      reason: args.reason,
      status: "pending",
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get reported comments (admin only)
 */
export const getReports = query({
  args: {
    status: v.optional(
      v.union(v.literal("pending"), v.literal("reviewed"), v.literal("dismissed")),
    ),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    let reports = await ctx.db.query("blogCommentReports").order("desc").collect();

    if (args.status) {
      reports = reports.filter((r) => r.status === args.status);
    }

    // Get comment and reporter info
    const reportsWithInfo = await Promise.all(
      reports.map(async (report) => {
        const comment = await ctx.db.get(report.commentId);
        const reporter = await ctx.db.get(report.reporterId);
        const commentAuthor = comment?.authorId ? await ctx.db.get(comment.authorId) : null;

        return {
          ...report,
          comment: comment
            ? {
                _id: comment._id,
                content: comment.content,
                author: commentAuthor
                  ? {
                      _id: commentAuthor._id,
                      displayName: commentAuthor.displayName,
                      username: commentAuthor.username,
                    }
                  : comment.discordAuthor
                    ? {
                        _id: null,
                        displayName: comment.discordAuthor.username,
                        username: null,
                      }
                    : null,
              }
            : null,
          reporter: reporter
            ? {
                _id: reporter._id,
                displayName: reporter.displayName,
                username: reporter.username,
              }
            : null,
        };
      }),
    );

    return reportsWithInfo;
  },
});

/**
 * Resolve a report (admin only)
 */
export const resolveReport = mutation({
  args: {
    reportId: v.id("blogCommentReports"),
    status: v.union(v.literal("reviewed"), v.literal("dismissed")),
    deleteComment: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const report = await ctx.db.get(args.reportId);
    if (!report) {
      throw new Error("Report not found");
    }

    // Update report status
    await ctx.db.patch(args.reportId, {
      status: args.status,
      resolvedAt: Date.now(),
    });

    // Optionally delete the comment
    if (args.deleteComment && args.status === "reviewed") {
      const comment = await ctx.db.get(report.commentId);
      if (comment) {
        await ctx.db.patch(report.commentId, {
          isDeleted: true,
        });
      }
    }

    return { success: true };
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
