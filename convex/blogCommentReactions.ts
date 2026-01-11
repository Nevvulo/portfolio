import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, requireNotBanned } from "./auth";

// Reaction type validator
const reactionTypeValidator = v.union(
  v.literal("heart"),
  v.literal("thumbs_up"),
  v.literal("eyes"),
  v.literal("fire"),
  v.literal("thinking"),
  v.literal("laugh"),
);

// Emoji mapping for notification messages
const REACTION_EMOJI: Record<string, string> = {
  heart: "❤️",
  thumbs_up: "👍",
  eyes: "👀",
  fire: "🔥",
  thinking: "🤔",
  laugh: "😂",
};

// ============================================
// QUERIES
// ============================================

/**
 * Get reactions for a single comment
 */
export const getForComment = query({
  args: { commentId: v.id("blogComments") },
  handler: async (ctx, args) => {
    const reactions = await ctx.db
      .query("blogCommentReactions")
      .withIndex("by_comment", (q) => q.eq("commentId", args.commentId))
      .collect();

    const counts: Record<string, number> = {
      heart: 0,
      thumbs_up: 0,
      eyes: 0,
      fire: 0,
      thinking: 0,
      laugh: 0,
    };
    for (const r of reactions) {
      if (r.type in counts) counts[r.type]++;
    }

    return { counts, total: reactions.length };
  },
});

/**
 * Get reactions for all comments on a post (batch query for efficiency)
 */
export const getForPost = query({
  args: { postId: v.id("blogPosts") },
  handler: async (ctx, args) => {
    const reactions = await ctx.db
      .query("blogCommentReactions")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();

    // Group by comment
    const byComment = new Map<string, { counts: Record<string, number>; total: number }>();

    for (const r of reactions) {
      const key = r.commentId.toString();
      if (!byComment.has(key)) {
        byComment.set(key, {
          counts: { heart: 0, thumbs_up: 0, eyes: 0, fire: 0, thinking: 0, laugh: 0 },
          total: 0,
        });
      }
      const entry = byComment.get(key)!;
      if (r.type in entry.counts) entry.counts[r.type]++;
      entry.total++;
    }

    return Object.fromEntries(byComment);
  },
});

/**
 * Get current user's reactions for all comments on a post
 */
export const getMyReactionsForPost = query({
  args: { postId: v.id("blogPosts") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return {};

    const reactions = await ctx.db
      .query("blogCommentReactions")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect();

    const byComment: Record<string, string> = {};
    for (const r of reactions) {
      byComment[r.commentId.toString()] = r.type;
    }
    return byComment;
  },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Toggle a reaction on a comment (add/change/remove)
 */
export const toggle = mutation({
  args: {
    commentId: v.id("blogComments"),
    type: reactionTypeValidator,
  },
  handler: async (ctx, args) => {
    const user = await requireNotBanned(ctx);

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");
    if (comment.isDeleted) throw new Error("Cannot react to deleted comment");

    // Check for existing reaction
    const existing = await ctx.db
      .query("blogCommentReactions")
      .withIndex("by_user_comment", (q) => q.eq("userId", user._id).eq("commentId", args.commentId))
      .unique();

    if (existing) {
      if (existing.type === args.type) {
        // Same type - remove (toggle off)
        await ctx.db.delete(existing._id);
        return { action: "removed" as const };
      } else {
        // Different type - update
        await ctx.db.patch(existing._id, { type: args.type, createdAt: Date.now() });
        return { action: "changed" as const, from: existing.type, to: args.type };
      }
    }

    // New reaction - add it
    await ctx.db.insert("blogCommentReactions", {
      commentId: args.commentId,
      postId: comment.postId,
      userId: user._id,
      type: args.type,
      createdAt: Date.now(),
    });

    // Create notification for comment author (if not self-reaction)
    if (comment.authorId && comment.authorId.toString() !== user._id.toString()) {
      await createCommentReactionNotification(ctx, comment, user, args.type);
    }

    return { action: "added" as const, type: args.type };
  },
});

/**
 * Helper: Create notification for comment reaction
 */
async function createCommentReactionNotification(
  ctx: any,
  comment: Doc<"blogComments">,
  reactor: { _id: Id<"users">; displayName: string },
  reactionType: string,
) {
  if (!comment.authorId) return;

  const author = await ctx.db.get(comment.authorId);
  if (!author?.notificationPreferences?.inAppNotifications) return;

  const post = await ctx.db.get(comment.postId);
  const emoji = REACTION_EMOJI[reactionType] || "🙂";

  await ctx.db.insert("notifications", {
    userId: comment.authorId,
    type: "comment_reaction",
    referenceType: "blogComment",
    referenceId: comment._id.toString(),
    title: `${reactor.displayName} reacted ${emoji} to your comment`,
    body: post ? `On "${post.title}"` : "On an article",
    isRead: false,
    createdAt: Date.now(),
  });
}
