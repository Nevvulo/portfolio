import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, requireNotBanned, requireUser } from "./auth";

// Media object validator (reused across mutations)
const mediaValidator = v.array(
  v.object({
    type: v.union(v.literal("image"), v.literal("video")),
    url: v.string(),
    filename: v.string(),
    mimeType: v.string(),
    fileSize: v.number(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
  }),
);

// ===========================================
// Queries
// ===========================================

/**
 * List root-level posts for a user's profile feed
 * Returns paginated results with author info
 */
export const list = query({
  args: {
    profileUserId: v.id("users"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.id("userFeedPosts")),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    // Get root-level posts only (parentId is undefined)
    let postsQuery = ctx.db
      .query("userFeedPosts")
      .withIndex("by_profile_root", (q) =>
        q.eq("profileUserId", args.profileUserId).eq("parentId", undefined).eq("isDeleted", false),
      )
      .order("desc");

    // Apply cursor for pagination
    if (args.cursor) {
      const cursorPost = await ctx.db.get(args.cursor);
      if (cursorPost) {
        postsQuery = postsQuery.filter((q) => q.lt(q.field("createdAt"), cursorPost.createdAt));
      }
    }

    const posts = await postsQuery.take(limit + 1);
    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, -1) : posts;

    // Get author info for each post
    const postsWithAuthors = await Promise.all(
      items.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        const reactionCount = await ctx.db
          .query("userFeedReactions")
          .withIndex("by_post", (q) => q.eq("postId", post._id))
          .collect();

        // Get repost info if applicable
        let repostedPost = null;
        let repostedFeedPost = null;
        if (post.repostOfPostId) {
          repostedPost = await ctx.db.get(post.repostOfPostId);
        }
        if (post.repostOfFeedId) {
          repostedFeedPost = await ctx.db.get(post.repostOfFeedId);
          if (repostedFeedPost) {
            const repostedAuthor = await ctx.db.get(repostedFeedPost.authorId);
            repostedFeedPost = { ...repostedFeedPost, author: repostedAuthor };
          }
        }

        // Fetch first-level replies for this post
        const replies = await ctx.db
          .query("userFeedPosts")
          .withIndex("by_parent", (q) => q.eq("parentId", post._id))
          .filter((q) => q.eq(q.field("isDeleted"), false))
          .order("asc")
          .take(10); // Limit to first 10 replies

        // Get author info and reactions for replies
        const repliesWithAuthors = await Promise.all(
          replies.map(async (reply) => {
            const replyAuthor = await ctx.db.get(reply.authorId);
            const replyReactions = await ctx.db
              .query("userFeedReactions")
              .withIndex("by_post", (q) => q.eq("postId", reply._id))
              .collect();

            return {
              ...reply,
              author: replyAuthor
                ? {
                    _id: replyAuthor._id,
                    displayName: replyAuthor.displayName,
                    username: replyAuthor.username,
                    avatarUrl: replyAuthor.avatarUrl,
                    tier: replyAuthor.tier,
                    isCreator: replyAuthor.isCreator,
                  }
                : null,
              reactions: {
                total: replyReactions.length,
                byType: replyReactions.reduce(
                  (acc, r) => {
                    acc[r.type] = (acc[r.type] || 0) + 1;
                    return acc;
                  },
                  {} as Record<string, number>,
                ),
              },
              replies: [], // Nested replies loaded on demand
            };
          }),
        );

        return {
          ...post,
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
          reactions: {
            total: reactionCount.length,
            byType: reactionCount.reduce(
              (acc, r) => {
                acc[r.type] = (acc[r.type] || 0) + 1;
                return acc;
              },
              {} as Record<string, number>,
            ),
          },
          replies: repliesWithAuthors,
          hasMoreReplies: post.replyCount > replies.length,
          repostedPost,
          repostedFeedPost,
        };
      }),
    );

    return {
      posts: postsWithAuthors,
      hasMore,
      nextCursor: hasMore && items.length > 0 ? items[items.length - 1]!._id : null,
    };
  },
});

/**
 * Get replies to a specific post (for lazy loading thread expansion)
 */
export const getReplies = query({
  args: {
    parentId: v.id("userFeedPosts"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.id("userFeedPosts")),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    let repliesQuery = ctx.db
      .query("userFeedPosts")
      .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
      .filter((q) => q.eq(q.field("isDeleted"), false))
      .order("asc"); // Oldest first for chronological thread order

    if (args.cursor) {
      const cursorPost = await ctx.db.get(args.cursor);
      if (cursorPost) {
        repliesQuery = repliesQuery.filter((q) => q.gt(q.field("createdAt"), cursorPost.createdAt));
      }
    }

    const replies = await repliesQuery.take(limit + 1);
    const hasMore = replies.length > limit;
    const items = hasMore ? replies.slice(0, -1) : replies;

    const repliesWithAuthors = await Promise.all(
      items.map(async (reply) => {
        const author = await ctx.db.get(reply.authorId);
        const reactionCount = await ctx.db
          .query("userFeedReactions")
          .withIndex("by_post", (q) => q.eq("postId", reply._id))
          .collect();

        return {
          ...reply,
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
          reactions: {
            total: reactionCount.length,
            byType: reactionCount.reduce(
              (acc, r) => {
                acc[r.type] = (acc[r.type] || 0) + 1;
                return acc;
              },
              {} as Record<string, number>,
            ),
          },
        };
      }),
    );

    return {
      replies: repliesWithAuthors,
      hasMore,
      nextCursor: hasMore && items.length > 0 ? items[items.length - 1]!._id : null,
    };
  },
});

/**
 * Get a full thread starting from a root post
 * Recursively fetches replies up to a specified depth
 */
export const getThread = query({
  args: {
    postId: v.id("userFeedPosts"),
    maxDepth: v.optional(v.number()), // Default 3
  },
  handler: async (ctx, args) => {
    const maxDepth = args.maxDepth ?? 3;
    const rootPost = await ctx.db.get(args.postId);

    if (!rootPost || rootPost.isDeleted) {
      return null;
    }

    // Recursive function to build thread tree
    async function buildThread(postId: Id<"userFeedPosts">, currentDepth: number): Promise<any> {
      const post = await ctx.db.get(postId);
      if (!post || post.isDeleted) return null;

      const author = await ctx.db.get(post.authorId);
      const reactionCount = await ctx.db
        .query("userFeedReactions")
        .withIndex("by_post", (q) => q.eq("postId", post._id))
        .collect();

      const postWithAuthor = {
        ...post,
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
        reactions: {
          total: reactionCount.length,
          byType: reactionCount.reduce(
            (acc, r) => {
              acc[r.type] = (acc[r.type] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>,
          ),
        },
        replies: [] as any[],
        hasMoreReplies: false,
      };

      // If we haven't reached max depth, fetch replies
      if (currentDepth < maxDepth) {
        const replies = await ctx.db
          .query("userFeedPosts")
          .withIndex("by_parent", (q) => q.eq("parentId", post._id))
          .filter((q) => q.eq(q.field("isDeleted"), false))
          .order("asc")
          .take(10); // Limit initial replies per level

        postWithAuthor.hasMoreReplies = replies.length >= 10 || post.replyCount > replies.length;

        for (const reply of replies) {
          const replyThread = await buildThread(reply._id, currentDepth + 1);
          if (replyThread) {
            postWithAuthor.replies.push(replyThread);
          }
        }
      } else if (post.replyCount > 0) {
        postWithAuthor.hasMoreReplies = true;
      }

      return postWithAuthor;
    }

    return buildThread(args.postId, 0);
  },
});

/**
 * Get pending posts awaiting approval for a profile owner
 */
export const getPendingPosts = query({
  args: {
    profileUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // Only the profile owner can see pending posts
    if (user._id !== args.profileUserId) {
      return [];
    }

    const pendingPosts = await ctx.db
      .query("pendingFeedPosts")
      .withIndex("by_profile_status", (q) =>
        q.eq("profileUserId", args.profileUserId).eq("status", "pending"),
      )
      .order("desc")
      .collect();

    // Get author info
    const postsWithAuthors = await Promise.all(
      pendingPosts.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        return {
          ...post,
          author: author
            ? {
                _id: author._id,
                displayName: author.displayName,
                username: author.username,
                avatarUrl: author.avatarUrl,
              }
            : null,
        };
      }),
    );

    return postsWithAuthors;
  },
});

/**
 * Check if user can post on a profile
 */
export const canPost = query({
  args: {
    profileUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser) {
      return { canPost: false, reason: "not_authenticated" };
    }

    // Check if user is banned
    if (currentUser.isBanned) {
      return { canPost: false, reason: "banned" };
    }

    const profileUser = await ctx.db.get(args.profileUserId);
    if (!profileUser) {
      return { canPost: false, reason: "profile_not_found" };
    }

    const privacy = profileUser.feedPrivacy ?? "owner_only";

    // Owner can always post
    if (currentUser._id === args.profileUserId) {
      return { canPost: true, requiresApproval: false };
    }

    switch (privacy) {
      case "everyone":
        return { canPost: true, requiresApproval: false };
      case "approval":
        return { canPost: true, requiresApproval: true };
      case "owner_only":
        return { canPost: false, reason: "owner_only" };
      default:
        return { canPost: false, reason: "owner_only" };
    }
  },
});

// ===========================================
// Mutations
// ===========================================

/**
 * Create a new feed post or reply
 */
export const create = mutation({
  args: {
    profileUserId: v.id("users"),
    content: v.string(),
    parentId: v.optional(v.id("userFeedPosts")),
    media: v.optional(mediaValidator),
    repostOfPostId: v.optional(v.id("blogPosts")),
    repostOfFeedId: v.optional(v.id("userFeedPosts")),
  },
  handler: async (ctx, args) => {
    const user = await requireNotBanned(ctx);

    // Validate content length
    if (args.content.length > 2000) {
      throw new Error("Post content too long. Maximum 2000 characters.");
    }

    // Check if user can post on this profile
    const profileUser = await ctx.db.get(args.profileUserId);
    if (!profileUser) {
      throw new Error("Profile not found");
    }

    const privacy = profileUser.feedPrivacy ?? "owner_only";
    const isOwner = user._id === args.profileUserId;

    // Validate permissions
    if (!isOwner && privacy === "owner_only") {
      throw new Error("Only the profile owner can post here.");
    }

    // Handle threading
    let replyDepth = 0;
    let rootId: Id<"userFeedPosts"> | undefined;

    if (args.parentId) {
      const parentPost = await ctx.db.get(args.parentId);
      if (!parentPost || parentPost.isDeleted) {
        throw new Error("Parent post not found");
      }
      replyDepth = parentPost.replyDepth + 1;
      rootId = parentPost.rootId ?? parentPost._id;
    }

    // If approval required and not owner, create pending post
    if (!isOwner && privacy === "approval") {
      const pendingId = await ctx.db.insert("pendingFeedPosts", {
        profileUserId: args.profileUserId,
        authorId: user._id,
        content: args.content,
        parentId: args.parentId,
        media: args.media,
        status: "pending",
        createdAt: Date.now(),
      });
      return { pendingId, status: "pending" };
    }

    // Create the post directly
    const postId = await ctx.db.insert("userFeedPosts", {
      authorId: user._id,
      profileUserId: args.profileUserId,
      content: args.content,
      parentId: args.parentId,
      rootId,
      replyDepth,
      replyCount: 0,
      media: args.media,
      repostOfPostId: args.repostOfPostId,
      repostOfFeedId: args.repostOfFeedId,
      isHidden: false,
      isDeleted: false,
      createdAt: Date.now(),
    });

    // Update parent's reply count and notify author
    if (args.parentId) {
      const parent = await ctx.db.get(args.parentId);
      if (parent) {
        await ctx.db.patch(args.parentId, {
          replyCount: parent.replyCount + 1,
        });

        // Notify parent post author if not self-reply
        if (parent.authorId.toString() !== user._id.toString()) {
          const parentAuthor = await ctx.db.get(parent.authorId);
          if (parentAuthor?.notificationPreferences?.inAppNotifications) {
            await ctx.db.insert("notifications", {
              userId: parent.authorId,
              type: "feed_reply",
              referenceType: "feedPost",
              referenceId: postId.toString(),
              title: `${user.displayName} replied to your post`,
              body: profileUser.username ? `On @${profileUser.username}'s profile` : "",
              isRead: false,
              createdAt: Date.now(),
            });
          }
        }
      }
    }

    return { postId, status: "created" };
  },
});

/**
 * Edit a feed post (author only)
 */
export const edit = mutation({
  args: {
    postId: v.id("userFeedPosts"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireNotBanned(ctx);
    const post = await ctx.db.get(args.postId);

    if (!post || post.isDeleted) {
      throw new Error("Post not found");
    }

    // Only author can edit
    if (post.authorId !== user._id) {
      throw new Error("You can only edit your own posts.");
    }

    // Validate content length
    if (args.content.length > 2000) {
      throw new Error("Post content too long. Maximum 2000 characters.");
    }

    await ctx.db.patch(args.postId, {
      content: args.content,
      editedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete a feed post (soft delete)
 */
export const deletePost = mutation({
  args: {
    postId: v.id("userFeedPosts"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const post = await ctx.db.get(args.postId);

    if (!post || post.isDeleted) {
      throw new Error("Post not found");
    }

    // Author or profile owner can delete
    const canDelete =
      post.authorId === user._id || post.profileUserId === user._id || user.isCreator;

    if (!canDelete) {
      throw new Error("You don't have permission to delete this post.");
    }

    await ctx.db.patch(args.postId, {
      isDeleted: true,
    });

    // Decrement parent's reply count
    if (post.parentId) {
      const parent = await ctx.db.get(post.parentId);
      if (parent && parent.replyCount > 0) {
        await ctx.db.patch(post.parentId, {
          replyCount: parent.replyCount - 1,
        });
      }
    }

    return { success: true };
  },
});

/**
 * Approve a pending post
 */
export const approvePendingPost = mutation({
  args: {
    pendingPostId: v.id("pendingFeedPosts"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const pendingPost = await ctx.db.get(args.pendingPostId);

    if (!pendingPost) {
      throw new Error("Pending post not found");
    }

    // Only profile owner can approve
    if (pendingPost.profileUserId !== user._id) {
      throw new Error("Only the profile owner can approve posts.");
    }

    if (pendingPost.status !== "pending") {
      throw new Error("Post has already been reviewed.");
    }

    // Handle threading
    let replyDepth = 0;
    let rootId: Id<"userFeedPosts"> | undefined;

    if (pendingPost.parentId) {
      const parentPost = await ctx.db.get(pendingPost.parentId);
      if (parentPost && !parentPost.isDeleted) {
        replyDepth = parentPost.replyDepth + 1;
        rootId = parentPost.rootId ?? parentPost._id;
      }
    }

    // Create the actual post
    const postId = await ctx.db.insert("userFeedPosts", {
      authorId: pendingPost.authorId,
      profileUserId: pendingPost.profileUserId,
      content: pendingPost.content,
      parentId: pendingPost.parentId,
      rootId,
      replyDepth,
      replyCount: 0,
      media: pendingPost.media,
      isHidden: false,
      isDeleted: false,
      createdAt: Date.now(),
    });

    // Update parent's reply count
    if (pendingPost.parentId) {
      const parent = await ctx.db.get(pendingPost.parentId);
      if (parent) {
        await ctx.db.patch(pendingPost.parentId, {
          replyCount: parent.replyCount + 1,
        });
      }
    }

    // Mark pending post as approved
    await ctx.db.patch(args.pendingPostId, {
      status: "approved",
      reviewedAt: Date.now(),
    });

    return { postId };
  },
});

/**
 * Reject a pending post
 */
export const rejectPendingPost = mutation({
  args: {
    pendingPostId: v.id("pendingFeedPosts"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const pendingPost = await ctx.db.get(args.pendingPostId);

    if (!pendingPost) {
      throw new Error("Pending post not found");
    }

    // Only profile owner can reject
    if (pendingPost.profileUserId !== user._id) {
      throw new Error("Only the profile owner can reject posts.");
    }

    if (pendingPost.status !== "pending") {
      throw new Error("Post has already been reviewed.");
    }

    await ctx.db.patch(args.pendingPostId, {
      status: "rejected",
      rejectReason: args.reason,
      reviewedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Toggle a reaction on a feed post
 */
export const toggleReaction = mutation({
  args: {
    postId: v.id("userFeedPosts"),
    type: v.union(v.literal("like"), v.literal("heart"), v.literal("fire")),
  },
  handler: async (ctx, args) => {
    const user = await requireNotBanned(ctx);

    const post = await ctx.db.get(args.postId);
    if (!post || post.isDeleted) {
      throw new Error("Post not found");
    }

    // Check for existing reaction
    const existing = await ctx.db
      .query("userFeedReactions")
      .withIndex("by_user_post", (q) => q.eq("userId", user._id).eq("postId", args.postId))
      .unique();

    if (existing) {
      // If same type, remove reaction
      if (existing.type === args.type) {
        await ctx.db.delete(existing._id);
        return { action: "removed" };
      } else {
        // Change reaction type
        await ctx.db.patch(existing._id, { type: args.type });
        return { action: "changed", from: existing.type, to: args.type };
      }
    } else {
      // Add new reaction
      await ctx.db.insert("userFeedReactions", {
        postId: args.postId,
        userId: user._id,
        type: args.type,
        createdAt: Date.now(),
      });

      // Notify post author (if not self-reaction)
      if (post.authorId.toString() !== user._id.toString()) {
        const postAuthor = await ctx.db.get(post.authorId);
        if (postAuthor?.notificationPreferences?.inAppNotifications) {
          const emoji = { like: "👍", heart: "❤️", fire: "🔥" }[args.type];
          await ctx.db.insert("notifications", {
            userId: post.authorId,
            type: "feed_reaction",
            referenceType: "feedPost",
            referenceId: args.postId.toString(),
            title: `${user.displayName} reacted ${emoji} to your post`,
            body: "",
            isRead: false,
            createdAt: Date.now(),
          });
        }
      }

      return { action: "added" };
    }
  },
});

/**
 * Update feed privacy settings
 */
export const updateFeedPrivacy = mutation({
  args: {
    privacy: v.union(v.literal("everyone"), v.literal("approval"), v.literal("owner_only")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    await ctx.db.patch(user._id, {
      feedPrivacy: args.privacy,
    });

    return { success: true };
  },
});

/**
 * Get user's reaction on a post
 */
export const getUserReaction = query({
  args: {
    postId: v.id("userFeedPosts"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const reaction = await ctx.db
      .query("userFeedReactions")
      .withIndex("by_user_post", (q) => q.eq("userId", user._id).eq("postId", args.postId))
      .unique();

    return reaction?.type ?? null;
  },
});

/**
 * Repost a feed post to user's own profile
 * Creates a new post that references the original
 */
export const repost = mutation({
  args: {
    originalPostId: v.id("userFeedPosts"),
    caption: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireNotBanned(ctx);

    // Get the original post
    const originalPost = await ctx.db.get(args.originalPostId);
    if (!originalPost || originalPost.isDeleted) {
      throw new Error("Original post not found");
    }

    // Validate caption length if provided
    if (args.caption && args.caption.length > 500) {
      throw new Error("Caption too long. Maximum 500 characters.");
    }

    // Check if user already reposted this to their own feed
    const existingRepost = await ctx.db
      .query("userFeedPosts")
      .withIndex("by_profile_root", (q) =>
        q.eq("profileUserId", user._id).eq("parentId", undefined).eq("isDeleted", false),
      )
      .filter((q) => q.eq(q.field("repostOfFeedId"), args.originalPostId))
      .first();

    if (existingRepost) {
      throw new Error("You've already reposted this to your feed");
    }

    // Create the repost on user's own profile
    const postId = await ctx.db.insert("userFeedPosts", {
      authorId: user._id,
      profileUserId: user._id, // Repost to own profile
      content: args.caption || "",
      replyDepth: 0,
      replyCount: 0,
      repostOfFeedId: args.originalPostId,
      isHidden: false,
      isDeleted: false,
      createdAt: Date.now(),
    });

    return { postId, status: "reposted" };
  },
});

/**
 * Get repost count for a feed post
 */
export const getRepostCount = query({
  args: {
    postId: v.id("userFeedPosts"),
  },
  handler: async (ctx, args) => {
    const reposts = await ctx.db
      .query("userFeedPosts")
      .filter((q) =>
        q.and(q.eq(q.field("repostOfFeedId"), args.postId), q.eq(q.field("isDeleted"), false)),
      )
      .collect();

    return reposts.length;
  },
});

/**
 * Check if user has reposted a specific post
 */
export const hasUserReposted = query({
  args: {
    postId: v.id("userFeedPosts"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return false;

    const repost = await ctx.db
      .query("userFeedPosts")
      .withIndex("by_profile_root", (q) =>
        q.eq("profileUserId", user._id).eq("parentId", undefined).eq("isDeleted", false),
      )
      .filter((q) => q.eq(q.field("repostOfFeedId"), args.postId))
      .first();

    return !!repost;
  },
});

/**
 * Repost a blog post to user's own profile feed
 */
export const repostBlogPost = mutation({
  args: {
    blogPostId: v.id("blogPosts"),
    caption: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireNotBanned(ctx);

    // Get the blog post
    const blogPost = await ctx.db.get(args.blogPostId);
    if (!blogPost) {
      throw new Error("Blog post not found");
    }

    // Validate caption length if provided
    if (args.caption && args.caption.length > 500) {
      throw new Error("Caption too long. Maximum 500 characters.");
    }

    // Check if user already reposted this blog post to their feed
    const existingRepost = await ctx.db
      .query("userFeedPosts")
      .withIndex("by_profile_root", (q) =>
        q.eq("profileUserId", user._id).eq("parentId", undefined).eq("isDeleted", false),
      )
      .filter((q) => q.eq(q.field("repostOfPostId"), args.blogPostId))
      .first();

    if (existingRepost) {
      throw new Error("You've already reposted this article to your feed");
    }

    // Create the repost on user's own profile
    const postId = await ctx.db.insert("userFeedPosts", {
      authorId: user._id,
      profileUserId: user._id,
      content: args.caption || "",
      replyDepth: 0,
      replyCount: 0,
      repostOfPostId: args.blogPostId,
      isHidden: false,
      isDeleted: false,
      createdAt: Date.now(),
    });

    return { postId, status: "reposted" };
  },
});

/**
 * Check if user has reposted a specific blog post
 */
export const hasUserRepostedBlogPost = query({
  args: {
    blogPostId: v.id("blogPosts"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return false;

    const repost = await ctx.db
      .query("userFeedPosts")
      .withIndex("by_profile_root", (q) =>
        q.eq("profileUserId", user._id).eq("parentId", undefined).eq("isDeleted", false),
      )
      .filter((q) => q.eq(q.field("repostOfPostId"), args.blogPostId))
      .first();

    return !!repost;
  },
});
