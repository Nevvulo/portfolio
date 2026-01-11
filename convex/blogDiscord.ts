import { v } from "convex/values";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { publishPostMessage } from "./lib/upstashPubsub";

// ============================================
// SETTINGS QUERIES
// ============================================

// Get Discord blog settings
export const getDiscordSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("adminSettings").first();
    return settings?.discord ?? null;
  },
});

// Internal query for actions
export const getDiscordSettingsInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("adminSettings").first();
    return settings?.discord ?? null;
  },
});

// Get full admin settings (internal)
export const getSettingsInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("adminSettings").first();
  },
});

// ============================================
// SETTINGS MUTATIONS
// ============================================

// Channel config validator
const channelConfigValidator = v.optional(
  v.object({
    channelId: v.string(),
    channelType: v.union(v.literal("forum"), v.literal("text")),
    webhookUrl: v.optional(v.string()),
  })
);

// Update Discord blog settings
export const updateDiscordSettings = mutation({
  args: {
    useUserToken: v.boolean(),
    botEnabled: v.boolean(),
    channels: v.object({
      article: channelConfigValidator,
      video: channelConfigValidator,
      news: channelConfigValidator,
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("adminSettings").first();

    const discordSettings = {
      useUserToken: args.useUserToken,
      botEnabled: args.botEnabled,
      channels: args.channels,
    };

    if (existing) {
      await ctx.db.patch(existing._id, {
        discord: discordSettings,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      return await ctx.db.insert("adminSettings", {
        discord: discordSettings,
        updatedAt: Date.now(),
      });
    }
  },
});

// ============================================
// RESULT TYPES
// ============================================

type PublishResult = {
  success: boolean;
  reason?: string;
  threadId?: string;
  messageId?: string;
  error?: string;
};

type SyncResult = {
  success: boolean;
  reason?: string;
  messageId?: string;
  error?: string;
};

// ============================================
// PUBLISHING TO DISCORD
// ============================================

// Publish blog post to Discord (called when post is published)
// Uses Upstash Redis pub/sub - bot subscribes and handles Discord operations
export const publishToDiscord = internalAction({
  args: {
    postId: v.id("blogPosts"),
  },
  returns: v.object({
    success: v.boolean(),
    reason: v.optional(v.string()),
    threadId: v.optional(v.string()),
    messageId: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<PublishResult> => {
    const settings = await ctx.runQuery(internal.blogDiscord.getDiscordSettingsInternal);

    if (!settings?.botEnabled) {
      console.log("Discord publishing disabled, skipping");
      return { success: false, reason: "disabled" };
    }

    // Get the post
    const post = await ctx.runQuery(internal.blogDiscord.getPostInternal, {
      postId: args.postId,
    });

    if (!post) {
      console.error("Post not found:", args.postId);
      return { success: false, reason: "post_not_found" };
    }

    // Get channel config for this content type
    const channelConfig = settings.channels[post.contentType as keyof typeof settings.channels];

    if (!channelConfig) {
      console.log(`No Discord channel configured for ${post.contentType}`);
      return { success: false, reason: "no_channel_configured" };
    }

    try {
      // Publish to Redis - bot will receive and handle Discord operations
      const result = await publishPostMessage(
        args.postId,
        {
          channelId: channelConfig.channelId,
          channelType: channelConfig.channelType,
          webhookUrl: channelConfig.webhookUrl,
        },
        settings.useUserToken
      );

      if (!result.success) {
        console.error("Failed to publish to Redis:", result.error);
        return { success: false, reason: "redis_publish_failed", error: result.error };
      }

      if (result.subscribers === 0) {
        console.warn("No subscribers received the message - is the bot running?");
        return { success: false, reason: "no_subscribers" };
      }

      console.log(`Published Discord request for post ${post.slug}, ${result.subscribers} subscriber(s)`);
      // Bot will call updatePostDiscordInfo mutation when done
      return { success: true };
    } catch (error) {
      console.error("Error publishing to Discord:", error);
      return {
        success: false,
        reason: "exception",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

// Manual publish to Discord (called from admin panel)
export const manualPublishToDiscord = action({
  args: {
    postId: v.id("blogPosts"),
  },
  returns: v.object({
    success: v.boolean(),
    reason: v.optional(v.string()),
    threadId: v.optional(v.string()),
    messageId: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<PublishResult> => {
    return await ctx.runAction(internal.blogDiscord.publishToDiscord, {
      postId: args.postId,
    });
  },
});

// ============================================
// INTERNAL HELPERS
// ============================================

// Get post by ID (internal)
export const getPostInternal = internalQuery({
  args: { postId: v.id("blogPosts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.postId);
  },
});

// Update post with Discord info
export const updatePostDiscordInfo = internalMutation({
  args: {
    postId: v.id("blogPosts"),
    discordThreadId: v.optional(v.string()),
    discordMessageId: v.optional(v.string()),
    discordChannelId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, string | undefined> = {};

    if (args.discordThreadId !== undefined) {
      updates.discordThreadId = args.discordThreadId;
    }
    if (args.discordMessageId !== undefined) {
      updates.discordMessageId = args.discordMessageId;
    }
    if (args.discordChannelId !== undefined) {
      updates.discordChannelId = args.discordChannelId;
    }

    await ctx.db.patch(args.postId, updates);
  },
});

// ============================================
// COMMENT SYNC: WEBSITE -> DISCORD
// ============================================

// Sync a website comment to Discord thread
// Uses webhook to post directly (shows user's name/avatar instead of bot)
export const syncCommentToDiscord = internalAction({
  args: {
    commentId: v.id("blogComments"),
  },
  returns: v.object({
    success: v.boolean(),
    reason: v.optional(v.string()),
    messageId: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<SyncResult> => {
    // Get comment
    const comment = await ctx.runQuery(internal.blogDiscord.getCommentInternal, {
      commentId: args.commentId,
    });

    if (!comment) {
      console.error("Comment not found:", args.commentId);
      return { success: false, reason: "comment_not_found" };
    }

    // Get post
    const post = await ctx.runQuery(internal.blogDiscord.getPostInternal, {
      postId: comment.postId,
    });

    if (!post?.discordThreadId) {
      // No thread to sync to
      return { success: false, reason: "no_discord_thread" };
    }

    // Get settings
    const settings = await ctx.runQuery(internal.blogDiscord.getDiscordSettingsInternal);
    if (!settings?.botEnabled) {
      return { success: false, reason: "disabled" };
    }

    // Get channel config for this content type to find webhook URL
    const channelConfig = settings.channels[post.contentType as keyof typeof settings.channels];
    if (!channelConfig?.webhookUrl) {
      console.warn(`No webhook URL configured for ${post.contentType} channel, cannot sync comment`);
      return { success: false, reason: "no_webhook_configured" };
    }

    // Get author info
    let author = null;
    if (comment.authorId) {
      author = await ctx.runQuery(internal.blogDiscord.getUserInternal, {
        userId: comment.authorId,
      });
    }

    const authorName = author?.displayName || "Website User";
    const authorAvatar = author?.avatarUrl || undefined;

    try {
      // Post directly to Discord thread using webhook
      // Adding ?thread_id=X posts to that thread, ?wait=true returns message data
      const webhookUrlWithThread = `${channelConfig.webhookUrl}?thread_id=${post.discordThreadId}&wait=true`;

      const response = await fetch(webhookUrlWithThread, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: authorName,
          ...(authorAvatar && { avatar_url: authorAvatar }),
          content: comment.content.slice(0, 2000), // Discord limit
          allowed_mentions: { parse: [] }, // Don't ping anyone
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Webhook failed: ${response.status} ${response.statusText}`, errorText);
        return { success: false, reason: "webhook_failed", error: errorText };
      }

      // Try to get message ID from response (for wormhole mapping)
      let messageId: string | undefined;
      try {
        const data = await response.json();
        messageId = data.id;
      } catch {
        // Some webhook responses don't include message data
      }

      // Create wormhole mapping if we got a message ID
      if (messageId) {
        await ctx.runMutation(internal.blogDiscord.createWormholeMapping, {
          blogCommentId: args.commentId,
          discordMessageId: messageId,
          discordThreadId: post.discordThreadId,
          postId: post._id,
        });

        await ctx.runMutation(internal.blogDiscord.updateCommentDiscordId, {
          commentId: args.commentId,
          discordMessageId: messageId,
        });
      }

      console.log(`Synced comment ${args.commentId} to Discord thread via webhook`);
      return { success: true, messageId };
    } catch (error) {
      console.error("Error syncing comment to Discord:", error);
      return {
        success: false,
        reason: "exception",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

// ============================================
// COMMENT SYNC: DISCORD -> WEBSITE
// ============================================

// Create comment from Discord (called by bot)
export const createCommentFromDiscord = mutation({
  args: {
    secret: v.string(),
    discordThreadId: v.string(),
    discordMessageId: v.string(),
    content: v.string(),
    discordAuthor: v.object({
      id: v.string(),
      username: v.string(),
      discriminator: v.optional(v.string()),
      avatarUrl: v.optional(v.string()),
    }),
    replyToDiscordMessageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate secret
    const expectedSecret = process.env.DISCORD_WORMHOLE_SECRET;
    if (!expectedSecret || args.secret !== expectedSecret) {
      throw new Error("Invalid wormhole secret");
    }

    // Find blog post by Discord thread ID
    const post = await ctx.db
      .query("blogPosts")
      .withIndex("by_discordThreadId", (q) =>
        q.eq("discordThreadId", args.discordThreadId)
      )
      .unique();

    if (!post) {
      throw new Error(`No blog post found for thread: ${args.discordThreadId}`);
    }

    // Check for duplicate
    const existing = await ctx.db
      .query("blogComments")
      .withIndex("by_discordMessageId", (q) =>
        q.eq("discordMessageId", args.discordMessageId)
      )
      .unique();

    if (existing) {
      console.log("Comment already exists, skipping");
      return existing._id;
    }

    // Try to find website user by Discord ID
    let authorId: Id<"users"> | undefined;
    const userByDiscordId = await ctx.db
      .query("users")
      .withIndex("by_discordId", (q) => q.eq("discordId", args.discordAuthor.id))
      .unique();

    if (userByDiscordId) {
      authorId = userByDiscordId._id;
    }

    // Find parent comment if this is a reply
    let parentId: Id<"blogComments"> | undefined;
    const replyToId = args.replyToDiscordMessageId;
    if (replyToId) {
      const parentMapping = await ctx.db
        .query("blogCommentWormhole")
        .withIndex("by_discordMessage", (q) =>
          q.eq("discordMessageId", replyToId)
        )
        .unique();

      if (parentMapping) {
        parentId = parentMapping.blogCommentId;
      }
    }

    // Create comment
    const commentId = await ctx.db.insert("blogComments", {
      postId: post._id,
      authorId,
      content: args.content,
      parentId,
      isEdited: false,
      isDeleted: false,
      createdAt: Date.now(),
      discordMessageId: args.discordMessageId,
      discordAuthor: args.discordAuthor,
      source: "discord",
    });

    // Create wormhole mapping
    await ctx.db.insert("blogCommentWormhole", {
      blogCommentId: commentId,
      discordMessageId: args.discordMessageId,
      discordThreadId: args.discordThreadId,
      postId: post._id,
      createdAt: Date.now(),
    });

    console.log(`Created comment from Discord: ${commentId}`);
    return commentId;
  },
});

// ============================================
// WORMHOLE MAPPING HELPERS
// ============================================

export const getCommentInternal = internalQuery({
  args: { commentId: v.id("blogComments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.commentId);
  },
});

export const getUserInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const getWormholeMappingByComment = internalQuery({
  args: { commentId: v.id("blogComments") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("blogCommentWormhole")
      .withIndex("by_blogComment", (q) => q.eq("blogCommentId", args.commentId))
      .unique();
  },
});

export const createWormholeMapping = internalMutation({
  args: {
    blogCommentId: v.id("blogComments"),
    discordMessageId: v.string(),
    discordThreadId: v.string(),
    postId: v.id("blogPosts"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("blogCommentWormhole", {
      blogCommentId: args.blogCommentId,
      discordMessageId: args.discordMessageId,
      discordThreadId: args.discordThreadId,
      postId: args.postId,
      createdAt: Date.now(),
    });
  },
});

export const updateCommentDiscordId = internalMutation({
  args: {
    commentId: v.id("blogComments"),
    discordMessageId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.commentId, {
      discordMessageId: args.discordMessageId,
    });
  },
});

// ============================================
// QUERIES FOR BOT STARTUP
// ============================================

// Get all posts with Discord thread IDs (for bot to listen)
export const getPostsWithThreads = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("blogPosts")
      .collect();

    return posts
      .filter((p) => p.discordThreadId)
      .map((p) => ({
        _id: p._id,
        slug: p.slug,
        discordThreadId: p.discordThreadId,
      }));
  },
});

// Get post by Discord thread ID
export const getPostByThreadId = query({
  args: { discordThreadId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("blogPosts")
      .withIndex("by_discordThreadId", (q) =>
        q.eq("discordThreadId", args.discordThreadId)
      )
      .unique();
  },
});

// ============================================
// QUERIES FOR BOT (after receiving pub/sub message)
// ============================================

// Get post data for publishing to Discord
export const getPostForPublish = query({
  args: { postId: v.id("blogPosts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) return null;

    // Get author info
    const author = await ctx.db.get(post.authorId);

    const siteUrl = process.env.NEXT_PUBLIC_URL || "https://blakesanie.com";

    return {
      _id: post._id,
      slug: post.slug,
      title: post.title,
      description: post.description,
      contentType: post.contentType,
      coverImage: post.coverImage,
      url: `${siteUrl}/blog/${post.slug}`,
      author: author
        ? {
            displayName: author.displayName,
            username: author.username,
            avatarUrl: author.avatarUrl,
          }
        : null,
    };
  },
});

// Get comment data for syncing to Discord
export const getCommentForSync = query({
  args: { commentId: v.id("blogComments") },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);
    if (!comment) return null;

    // Get author info
    const author = comment.authorId ? await ctx.db.get(comment.authorId) : null;

    // Get post for thread ID
    const post = await ctx.db.get(comment.postId);

    // Get parent comment's Discord message ID for replies
    let replyToDiscordMessageId: string | undefined;
    if (comment.parentId) {
      const parentMapping = await ctx.db
        .query("blogCommentWormhole")
        .withIndex("by_blogComment", (q) => q.eq("blogCommentId", comment.parentId!))
        .unique();
      replyToDiscordMessageId = parentMapping?.discordMessageId;
    }

    return {
      _id: comment._id,
      postId: comment.postId,
      content: comment.content,
      parentId: comment.parentId,
      discordThreadId: post?.discordThreadId,
      replyToDiscordMessageId,
      author: author
        ? {
            displayName: author.displayName,
            username: author.username,
            avatarUrl: author.avatarUrl,
          }
        : null,
    };
  },
});

// ============================================
// MUTATIONS FOR BOT CALLBACKS
// ============================================

// Bot calls this after successfully posting to Discord
export const reportPostPublished = mutation({
  args: {
    secret: v.string(),
    postId: v.id("blogPosts"),
    discordThreadId: v.optional(v.string()),
    discordMessageId: v.optional(v.string()),
    discordChannelId: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate secret
    const expectedSecret = process.env.DISCORD_WORMHOLE_SECRET;
    if (!expectedSecret || args.secret !== expectedSecret) {
      throw new Error("Invalid wormhole secret");
    }

    const updates: Record<string, string | undefined> = {
      discordChannelId: args.discordChannelId,
    };

    if (args.discordThreadId) {
      updates.discordThreadId = args.discordThreadId;
    }
    if (args.discordMessageId) {
      updates.discordMessageId = args.discordMessageId;
    }

    await ctx.db.patch(args.postId, updates);
    console.log(`Updated post ${args.postId} with Discord info`);
  },
});

// Bot calls this after successfully syncing a comment to Discord
export const reportCommentSynced = mutation({
  args: {
    secret: v.string(),
    commentId: v.id("blogComments"),
    discordMessageId: v.string(),
    discordThreadId: v.string(),
    postId: v.id("blogPosts"),
  },
  handler: async (ctx, args) => {
    // Validate secret
    const expectedSecret = process.env.DISCORD_WORMHOLE_SECRET;
    if (!expectedSecret || args.secret !== expectedSecret) {
      throw new Error("Invalid wormhole secret");
    }

    // Update comment with Discord message ID
    await ctx.db.patch(args.commentId, {
      discordMessageId: args.discordMessageId,
    });

    // Create wormhole mapping
    await ctx.db.insert("blogCommentWormhole", {
      blogCommentId: args.commentId,
      discordMessageId: args.discordMessageId,
      discordThreadId: args.discordThreadId,
      postId: args.postId,
      createdAt: Date.now(),
    });

    console.log(`Synced comment ${args.commentId} to Discord message ${args.discordMessageId}`);
  },
});

