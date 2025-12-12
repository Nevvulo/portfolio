import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser, requireChannelAccess, isCreator } from "./auth";
import { internal } from "./_generated/api";

// Content type validator matching schema
const contentTypeValidator = v.union(
  v.literal("music"),
  v.literal("video"),
  v.literal("writing"),
  v.literal("game_build"),
  v.literal("news"),
  v.literal("tools"),
  v.literal("event"),
  v.literal("advice"),
  v.literal("giveaway"),
  v.literal("poll"),
  v.literal("emoji")
);

/**
 * List content posts for a channel
 */
export const list = query({
  args: {
    channelId: v.id("channels"),
    limit: v.optional(v.number()),
    type: v.optional(contentTypeValidator),
  },
  handler: async (ctx, args) => {
    await requireChannelAccess(ctx, args.channelId);

    const limit = args.limit ?? 20;

    let postsQuery = ctx.db
      .query("contentPosts")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .order("desc");

    if (args.type) {
      postsQuery = postsQuery.filter((q) => q.eq(q.field("type"), args.type));
    }

    const posts = await postsQuery.take(limit);

    // Get author info for each post
    const postsWithAuthors = await Promise.all(
      posts.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        return {
          ...post,
          author: author
            ? {
                _id: author._id,
                displayName: author.displayName,
                avatarUrl: author.avatarUrl,
                tier: author.tier,
                isCreator: author.isCreator,
              }
            : null,
        };
      })
    );

    return postsWithAuthors;
  },
});

/**
 * Get a single content post
 */
export const get = query({
  args: { postId: v.id("contentPosts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) return null;

    await requireChannelAccess(ctx, post.channelId);

    const author = await ctx.db.get(post.authorId);
    return {
      ...post,
      author: author
        ? {
            _id: author._id,
            displayName: author.displayName,
            avatarUrl: author.avatarUrl,
            tier: author.tier,
            isCreator: author.isCreator,
          }
        : null,
    };
  },
});

/**
 * Create a content post (creator only)
 */
export const create = mutation({
  args: {
    channelId: v.id("channels"),
    type: contentTypeValidator,
    title: v.string(),
    content: v.string(),
    requiredTier: v.union(v.literal("tier1"), v.literal("tier2")),
    // Media attachment
    media: v.optional(
      v.object({
        type: v.string(),
        url: v.string(),
        thumbnail: v.optional(v.string()),
        duration: v.optional(v.number()),
        fileSize: v.optional(v.number()),
        platforms: v.optional(v.array(v.string())),
        soundcloudUrl: v.optional(v.string()),
      })
    ),
    // Event data
    eventData: v.optional(
      v.object({
        startTime: v.number(),
        endTime: v.optional(v.number()),
        timezone: v.string(),
        location: v.optional(v.string()),
      })
    ),
    // Giveaway data
    giveawayData: v.optional(
      v.object({
        endsAt: v.number(),
        maxEntries: v.optional(v.number()),
        prize: v.string(),
      })
    ),
    // Poll data
    pollData: v.optional(
      v.object({
        options: v.array(
          v.object({
            id: v.string(),
            text: v.string(),
          })
        ),
        endsAt: v.optional(v.number()),
        allowMultiple: v.boolean(),
      })
    ),
    // Emoji data
    emojiData: v.optional(
      v.object({
        emoji: v.string(),
        message: v.optional(v.string()),
      })
    ),
    // Discord options
    sendToDiscord: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<string> => {
    const user = await requireUser(ctx);
    if (!isCreator(user)) {
      throw new Error("Only the creator can post content");
    }

    const channel = await ctx.db.get(args.channelId);
    if (!channel) {
      throw new Error("Channel not found");
    }

    // Validate required data based on type
    if (args.type === "event" && !args.eventData) {
      throw new Error("Event data is required for event posts");
    }
    if (args.type === "giveaway" && !args.giveawayData) {
      throw new Error("Giveaway data is required for giveaway posts");
    }
    if (args.type === "poll" && !args.pollData) {
      throw new Error("Poll data is required for poll posts");
    }
    if (args.type === "emoji" && !args.emojiData) {
      throw new Error("Emoji data is required for emoji posts");
    }
    if ((args.type === "music" || args.type === "video") && !args.media) {
      throw new Error("Media is required for music/video posts");
    }

    const postId = await ctx.db.insert("contentPosts", {
      authorId: user._id,
      channelId: args.channelId,
      type: args.type,
      title: args.title,
      content: args.content,
      media: args.media,
      eventData: args.eventData,
      giveawayData: args.giveawayData,
      pollData: args.pollData,
      emojiData: args.emojiData,
      requiredTier: args.requiredTier,
      isPinned: false,
      createdAt: Date.now(),
    });

    // Also create a message in the channel so it shows up in chat
    let messageContent: string;
    let messageType: "default" | "emoji_blast" | "giveaway" | "poll" | "content" | undefined;

    if (args.type === "emoji" && args.emojiData) {
      // Emoji blast: title + optional description + emoji
      // Format: "title|description|emoji" - parsed by SystemMessage component
      const title = args.title || "";
      const description = args.emojiData.message || args.content || "";
      const emoji = args.emojiData.emoji;
      messageContent = `${title}|${description}|${emoji}`;
      messageType = "emoji_blast";
    } else if (args.type === "poll" && args.pollData) {
      // Poll: render via ContentPost embed
      messageContent = args.title || "Poll";
      messageType = "poll";
    } else if (args.type === "giveaway" && args.giveawayData) {
      // Giveaway: render via ContentPost embed
      messageContent = args.title || "Giveaway";
      messageType = "giveaway";
    } else if ((args.type === "video" || args.type === "music") && args.media) {
      // Video/Music: render via ContentPost embed
      messageContent = args.title || (args.type === "video" ? "New Video" : "New Music");
      messageType = "content";
    } else {
      // Default: title + content (news, writing, tools, etc.)
      messageContent = args.title || "New Post";
      messageType = "content";
    }

    await ctx.db.insert("messages", {
      channelId: args.channelId,
      authorId: user._id,
      content: messageContent,
      messageType: messageType,
      contentPostId: postId, // Link to the content post for embedded rendering
      isPinned: messageType !== "emoji_blast", // Emoji blasts are not pinned, others are
      isEdited: false,
      isDeleted: false,
      createdAt: Date.now(),
    });

    // Send to Discord if enabled and channel has webhook
    if (args.sendToDiscord && channel.discordWebhookUrl) {
      await ctx.scheduler.runAfter(0, internal.discord.sendContentPostToDiscord, {
        postId,
        channelId: args.channelId,
        type: args.type,
        title: args.title,
        content: args.content,
        media: args.media,
        pollData: args.pollData,
        emojiData: args.emojiData,
        authorName: user.displayName,
        authorAvatarUrl: user.avatarUrl,
      });
    }

    return postId;
  },
});

/**
 * Update a content post (creator only)
 */
export const update = mutation({
  args: {
    postId: v.id("contentPosts"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    media: v.optional(
      v.object({
        type: v.string(),
        url: v.string(),
        thumbnail: v.optional(v.string()),
        duration: v.optional(v.number()),
        fileSize: v.optional(v.number()),
        platforms: v.optional(v.array(v.string())),
        soundcloudUrl: v.optional(v.string()),
      })
    ),
    isPinned: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (!isCreator(user)) {
      throw new Error("Only the creator can update content posts");
    }

    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    await ctx.db.patch(args.postId, {
      ...(args.title !== undefined && { title: args.title }),
      ...(args.content !== undefined && { content: args.content }),
      ...(args.media !== undefined && { media: args.media }),
      ...(args.isPinned !== undefined && { isPinned: args.isPinned }),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Delete a content post (creator only)
 */
export const deletePost = mutation({
  args: { postId: v.id("contentPosts") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (!isCreator(user)) {
      throw new Error("Only the creator can delete content posts");
    }

    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    // Delete associated votes/entries
    if (post.type === "poll") {
      const votes = await ctx.db
        .query("pollVotes")
        .withIndex("by_post", (q) => q.eq("postId", args.postId))
        .collect();
      for (const vote of votes) {
        await ctx.db.delete(vote._id);
      }
    }

    if (post.type === "giveaway") {
      const entries = await ctx.db
        .query("giveawayEntries")
        .withIndex("by_post", (q) => q.eq("postId", args.postId))
        .collect();
      for (const entry of entries) {
        await ctx.db.delete(entry._id);
      }
    }

    await ctx.db.delete(args.postId);
  },
});

/**
 * Vote on a poll
 */
export const votePoll = mutation({
  args: {
    postId: v.id("contentPosts"),
    optionId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const post = await ctx.db.get(args.postId);

    if (!post) {
      throw new Error("Post not found");
    }
    if (post.type !== "poll") {
      throw new Error("This is not a poll");
    }
    if (!post.pollData) {
      throw new Error("Poll data not found");
    }

    await requireChannelAccess(ctx, post.channelId);

    // Check if poll has ended
    if (post.pollData.endsAt && post.pollData.endsAt < Date.now()) {
      throw new Error("This poll has ended");
    }

    // Check if user already voted (if not multiple choice)
    if (!post.pollData.allowMultiple) {
      const existingVote = await ctx.db
        .query("pollVotes")
        .withIndex("by_user_post", (q) =>
          q.eq("userId", user._id).eq("postId", args.postId)
        )
        .first();

      if (existingVote) {
        throw new Error("You have already voted on this poll");
      }
    }

    // Check if already voted for this option
    const existingOptionVote = await ctx.db
      .query("pollVotes")
      .withIndex("by_user_post", (q) =>
        q.eq("userId", user._id).eq("postId", args.postId)
      )
      .filter((q) => q.eq(q.field("optionId"), args.optionId))
      .first();

    if (existingOptionVote) {
      throw new Error("You have already voted for this option");
    }

    await ctx.db.insert("pollVotes", {
      postId: args.postId,
      optionId: args.optionId,
      userId: user._id,
      createdAt: Date.now(),
    });
  },
});

/**
 * Get poll results
 */
export const getPollResults = query({
  args: { postId: v.id("contentPosts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post || post.type !== "poll" || !post.pollData) {
      return null;
    }

    await requireChannelAccess(ctx, post.channelId);

    const votes = await ctx.db
      .query("pollVotes")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();

    // Count votes per option
    const voteCounts: Record<string, number> = {};
    for (const option of post.pollData.options) {
      voteCounts[option.id] = 0;
    }
    for (const vote of votes) {
      if (vote.optionId in voteCounts) {
        (voteCounts[vote.optionId] as number)++;
      }
    }

    return {
      totalVotes: votes.length,
      voteCounts,
    };
  },
});

/**
 * Enter a giveaway
 */
export const enterGiveaway = mutation({
  args: { postId: v.id("contentPosts") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const post = await ctx.db.get(args.postId);

    if (!post) {
      throw new Error("Post not found");
    }
    if (post.type !== "giveaway") {
      throw new Error("This is not a giveaway");
    }
    if (!post.giveawayData) {
      throw new Error("Giveaway data not found");
    }

    await requireChannelAccess(ctx, post.channelId);

    // Check if giveaway has ended
    if (post.giveawayData.endsAt < Date.now()) {
      throw new Error("This giveaway has ended");
    }

    // Check max entries
    if (post.giveawayData.maxEntries) {
      const entryCount = await ctx.db
        .query("giveawayEntries")
        .withIndex("by_post", (q) => q.eq("postId", args.postId))
        .collect();
      if (entryCount.length >= post.giveawayData.maxEntries) {
        throw new Error("This giveaway has reached maximum entries");
      }
    }

    // Check if already entered
    const existingEntry = await ctx.db
      .query("giveawayEntries")
      .withIndex("by_user_post", (q) =>
        q.eq("userId", user._id).eq("postId", args.postId)
      )
      .first();

    if (existingEntry) {
      throw new Error("You have already entered this giveaway");
    }

    await ctx.db.insert("giveawayEntries", {
      postId: args.postId,
      userId: user._id,
      createdAt: Date.now(),
    });
  },
});

/**
 * Get giveaway entry count
 */
export const getGiveawayEntries = query({
  args: { postId: v.id("contentPosts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post || post.type !== "giveaway") {
      return null;
    }

    await requireChannelAccess(ctx, post.channelId);

    const entries = await ctx.db
      .query("giveawayEntries")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();

    // Check if current user entered
    const user = await requireUser(ctx);
    const userEntry = entries.find((e) => e.userId === user._id);

    return {
      totalEntries: entries.length,
      hasEntered: !!userEntry,
    };
  },
});
