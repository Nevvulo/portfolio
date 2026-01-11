/* eslint-disable @typescript-eslint/no-explicit-any */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser, requireChannelAccess, isCreator, requireNotBanned, hasAccessToTier } from "./auth";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

/**
 * List messages for a channel (paginated)
 */
export const list = query({
  args: {
    channelId: v.id("channels"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    // Just verify access - don't need the return values
    await requireChannelAccess(ctx, args.channelId);

    const limit = args.limit ?? 50;

    let messagesQuery = ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .order("desc");

    // If we have a cursor, start from there
    if (args.cursor) {
      const cursorMessage = await ctx.db.get(args.cursor);
      if (cursorMessage) {
        messagesQuery = messagesQuery.filter((q) =>
          q.lt(q.field("createdAt"), cursorMessage.createdAt)
        );
      }
    }

    const messages = await messagesQuery.take(limit + 1);

    // Check if there are more messages
    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, -1) : messages;

    // Filter out deleted messages - they should be hidden, not shown
    const visibleItems = items.filter((message) => !message.isDeleted);

    // Get author info for each message
    const messagesWithAuthors = await Promise.all(
      visibleItems.map(async (message) => {
        const author = await ctx.db.get(message.authorId);

        // For Discord wormhole messages, try to find a linked Convex user
        let linkedUser = null;
        if (message.discordAuthor?.id) {
          // First try: Look up user by discordId field directly
          linkedUser = await ctx.db
            .query("users")
            .withIndex("by_discordId", (q) => q.eq("discordId", message.discordAuthor!.id))
            .unique();

          // Second try: Use discordClerkMapping table to find Clerk ID, then look up user
          if (!linkedUser) {
            const mapping = await ctx.db
              .query("discordClerkMapping")
              .withIndex("by_discordId", (q) => q.eq("discordId", message.discordAuthor!.id))
              .unique();

            if (mapping) {
              linkedUser = await ctx.db
                .query("users")
                .withIndex("by_clerkId", (q) => q.eq("clerkId", mapping.clerkId))
                .unique();
            }
          }
        }

        let replyTo = null;
        if (message.replyToId) {
          const replyMessage = await ctx.db.get(message.replyToId);
          if (replyMessage) {
            const replyAuthor = await ctx.db.get(replyMessage.authorId);

            // For Discord replies, try to find linked user
            let linkedReplyUser = null;
            if (replyMessage.discordAuthor?.id) {
              // First try: Look up user by discordId field directly
              linkedReplyUser = await ctx.db
                .query("users")
                .withIndex("by_discordId", (q) => q.eq("discordId", replyMessage.discordAuthor!.id))
                .unique();

              // Second try: Use discordClerkMapping table
              if (!linkedReplyUser) {
                const replyMapping = await ctx.db
                  .query("discordClerkMapping")
                  .withIndex("by_discordId", (q) => q.eq("discordId", replyMessage.discordAuthor!.id))
                  .unique();

                if (replyMapping) {
                  linkedReplyUser = await ctx.db
                    .query("users")
                    .withIndex("by_clerkId", (q) => q.eq("clerkId", replyMapping.clerkId))
                    .unique();
                }
              }
            }

            replyTo = {
              _id: replyMessage._id,
              content: replyMessage.isDeleted ? "[Message deleted]" : replyMessage.content.slice(0, 100),
              // Discord wormhole replies: prefer linked user, fall back to Discord author
              author: replyMessage.discordAuthor ? (
                linkedReplyUser ? {
                  _id: linkedReplyUser._id,
                  displayName: linkedReplyUser.displayName,
                  // Use Clerk avatar if available, otherwise fall back to Discord avatar
                  avatarUrl: linkedReplyUser.avatarUrl || replyMessage.discordAuthor.avatarUrl,
                  tier: linkedReplyUser.tier,
                  isDiscord: true,
                } : {
                  displayName: replyMessage.discordAuthor.username,
                  avatarUrl: replyMessage.discordAuthor.avatarUrl,
                  isDiscord: true,
                }
              ) : replyAuthor ? {
                _id: replyAuthor._id,
                displayName: replyAuthor.displayName,
                avatarUrl: replyAuthor.avatarUrl,
              } : null,
            };
          }
        }

        // Get reactions for this message
        const reactions = await ctx.db
          .query("reactions")
          .withIndex("by_message", (q) => q.eq("messageId", message._id))
          .collect();

        // Group reactions by emoji
        const reactionGroups = reactions.reduce((acc, reaction) => {
          if (!acc[reaction.emoji]) {
            acc[reaction.emoji] = { emoji: reaction.emoji, count: 0, userIds: [] };
          }
          const group = acc[reaction.emoji]!;
          group.count++;
          group.userIds.push(reaction.userId);
          return acc;
        }, {} as Record<string, { emoji: string; count: number; userIds: Id<"users">[] }>);

        // Fetch linked content post if available
        let contentPost = null;
        if (message.contentPostId) {
          const post = await ctx.db.get(message.contentPostId);
          if (post) {
            contentPost = {
              _id: post._id,
              type: post.type,
              title: post.title,
              content: post.content,
              media: post.media,
              eventData: post.eventData,
              giveawayData: post.giveawayData,
              pollData: post.pollData,
              emojiData: post.emojiData,
              requiredTier: post.requiredTier,
              isPinned: post.isPinned,
              createdAt: post.createdAt,
            };
          }
        }

        return {
          ...message,
          // Discord wormhole messages: prefer linked Convex user, fall back to Discord author
          author: message.discordAuthor ? (
            linkedUser ? {
              _id: linkedUser._id,
              clerkId: linkedUser.clerkId,
              displayName: linkedUser.displayName,
              // Use Clerk avatar if available, otherwise fall back to Discord avatar
              avatarUrl: linkedUser.avatarUrl || message.discordAuthor.avatarUrl,
              tier: linkedUser.tier,
              isCreator: linkedUser.isCreator,
              isDiscord: true,
            } : {
              displayName: message.discordAuthor.username,
              avatarUrl: message.discordAuthor.avatarUrl,
              isDiscord: true,
            }
          ) : author ? {
            _id: author._id,
            clerkId: author.clerkId,
            displayName: author.displayName,
            avatarUrl: author.avatarUrl,
            tier: author.tier,
            isCreator: author.isCreator,
          } : null,
          replyTo,
          reactions: Object.values(reactionGroups),
          contentPost,
        };
      })
    );

    return {
      messages: messagesWithAuthors.reverse(), // Reverse to get chronological order
      hasMore,
      nextCursor: hasMore && items.length > 0 ? items[items.length - 1]!._id : null,
    };
  },
});

/**
 * Send a message to a channel
 */
export const send = mutation({
  args: {
    channelId: v.id("channels"),
    content: v.string(),
    replyToId: v.optional(v.id("messages")),
    embeds: v.optional(v.array(v.object({
      type: v.union(
        v.literal("link"),
        v.literal("image"),
        v.literal("video"),
        v.literal("audio"),
        v.literal("youtube")
      ),
      url: v.optional(v.string()),
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      thumbnail: v.optional(v.string()),
      filename: v.optional(v.string()),
      mimeType: v.optional(v.string()),
      fileSize: v.optional(v.number()),
      width: v.optional(v.number()),
      height: v.optional(v.number()),
      duration: v.optional(v.number()),
      embedUrl: v.optional(v.string()),
      siteName: v.optional(v.string()),
    }))),
  },
  handler: async (ctx, args) => {
    // Check if user is banned before allowing message send
    await requireNotBanned(ctx);
    const { user } = await requireChannelAccess(ctx, args.channelId);

    // Validate content length
    if (args.content.length > 4000) {
      throw new Error("Message too long. Maximum 4000 characters.");
    }

    // Allow empty content if there are attachments
    const hasEmbeds = args.embeds && args.embeds.length > 0;
    if (args.content.trim().length === 0 && !hasEmbeds) {
      throw new Error("Message cannot be empty");
    }

    const messageId = await ctx.db.insert("messages", {
      channelId: args.channelId,
      authorId: user._id,
      content: args.content,
      embeds: args.embeds,
      replyToId: args.replyToId,
      isPinned: false,
      isEdited: false,
      isDeleted: false,
      createdAt: Date.now(),
    });

    // Update read state
    const existingReadState = await ctx.db
      .query("readStates")
      .withIndex("by_user_channel", (q) =>
        q.eq("userId", user._id).eq("channelId", args.channelId)
      )
      .unique();

    if (existingReadState) {
      await ctx.db.patch(existingReadState._id, {
        lastReadMessageId: messageId,
        lastReadAt: Date.now(),
      });
    } else {
      await ctx.db.insert("readStates", {
        userId: user._id,
        channelId: args.channelId,
        lastReadMessageId: messageId,
        lastReadAt: Date.now(),
      });
    }

    // Extract and create mention notifications
    await createMentionNotifications(ctx, args.content, messageId, args.channelId, user);

    // Send to Discord if channel has wormhole configured
    const channel = await ctx.db.get(args.channelId);
    if (channel?.discordWebhookUrl) {
      // Get Discord message ID if this is a reply
      let replyToDiscordMessageId: string | undefined;
      if (args.replyToId) {
        const replyMapping = await ctx.db
          .query("wormholeMapping")
          .withIndex("by_convexMessage", (q) => q.eq("convexMessageId", args.replyToId!))
          .unique();
        replyToDiscordMessageId = replyMapping?.discordMessageId;
      }

      // Schedule the Discord send action
      await ctx.scheduler.runAfter(0, internal.discord.sendToDiscord, {
        messageId,
        channelId: args.channelId,
        content: args.content,
        embeds: args.embeds,
        authorName: user.displayName,
        authorAvatarUrl: user.avatarUrl,
        replyToDiscordMessageId,
      });
    }

    return messageId;
  },
});

/**
 * Edit a message (own messages only)
 */
export const edit = mutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireNotBanned(ctx);
    const message = await ctx.db.get(args.messageId);

    if (!message) {
      throw new Error("Message not found");
    }

    if (message.authorId !== user._id && !isCreator(user)) {
      throw new Error("You can only edit your own messages");
    }

    if (message.isDeleted) {
      throw new Error("Cannot edit a deleted message");
    }

    if (args.content.length > 4000) {
      throw new Error("Message too long. Maximum 4000 characters.");
    }

    await ctx.db.patch(args.messageId, {
      content: args.content,
      isEdited: true,
      editedAt: Date.now(),
    });
  },
});

/**
 * Delete a message (own messages or admin)
 */
export const deleteMessage = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const message = await ctx.db.get(args.messageId);

    if (!message) {
      throw new Error("Message not found");
    }

    if (message.authorId !== user._id && !isCreator(user)) {
      throw new Error("You can only delete your own messages");
    }

    // Soft delete
    await ctx.db.patch(args.messageId, {
      isDeleted: true,
    });
  },
});

/**
 * Pin/unpin a message (admin only)
 */
export const togglePin = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (!isCreator(user)) {
      throw new Error("Only admins can pin messages");
    }

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    await ctx.db.patch(args.messageId, {
      isPinned: !message.isPinned,
    });
  },
});

/**
 * Get pinned messages for a channel
 */
export const getPinned = query({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    await requireChannelAccess(ctx, args.channelId);

    const pinnedMessages = await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .filter((q) => q.and(
        q.eq(q.field("isPinned"), true),
        q.eq(q.field("isDeleted"), false)
      ))
      .collect();

    // Get author info
    const messagesWithAuthors = await Promise.all(
      pinnedMessages.map(async (message) => {
        const author = await ctx.db.get(message.authorId);
        return {
          ...message,
          author: author ? {
            _id: author._id,
            displayName: author.displayName,
            avatarUrl: author.avatarUrl,
          } : null,
        };
      })
    );

    return messagesWithAuthors;
  },
});

/**
 * Add a reaction to a message
 */
export const addReaction = mutation({
  args: {
    messageId: v.id("messages"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const message = await ctx.db.get(args.messageId);

    if (!message) {
      throw new Error("Message not found");
    }

    // Check user has access to the channel
    await requireChannelAccess(ctx, message.channelId);

    // Check if user already reacted with this emoji
    const existingReaction = await ctx.db
      .query("reactions")
      .withIndex("by_user_message", (q) =>
        q.eq("userId", user._id).eq("messageId", args.messageId)
      )
      .filter((q) => q.eq(q.field("emoji"), args.emoji))
      .unique();

    if (existingReaction) {
      return; // Already reacted
    }

    await ctx.db.insert("reactions", {
      messageId: args.messageId,
      userId: user._id,
      emoji: args.emoji,
      createdAt: Date.now(),
    });
  },
});

/**
 * Remove a reaction from a message
 */
export const removeReaction = mutation({
  args: {
    messageId: v.id("messages"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const reaction = await ctx.db
      .query("reactions")
      .withIndex("by_user_message", (q) =>
        q.eq("userId", user._id).eq("messageId", args.messageId)
      )
      .filter((q) => q.eq(q.field("emoji"), args.emoji))
      .unique();

    if (reaction) {
      await ctx.db.delete(reaction._id);
    }
  },
});

/**
 * Mark channel as read
 */
export const markChannelRead = mutation({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const { user } = await requireChannelAccess(ctx, args.channelId);

    // Get the latest message
    const latestMessage = await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .order("desc")
      .first();

    const existingReadState = await ctx.db
      .query("readStates")
      .withIndex("by_user_channel", (q) =>
        q.eq("userId", user._id).eq("channelId", args.channelId)
      )
      .unique();

    if (existingReadState) {
      await ctx.db.patch(existingReadState._id, {
        lastReadMessageId: latestMessage?._id,
        lastReadAt: Date.now(),
      });
    } else {
      await ctx.db.insert("readStates", {
        userId: user._id,
        channelId: args.channelId,
        lastReadMessageId: latestMessage?._id,
        lastReadAt: Date.now(),
      });
    }
  },
});

/**
 * Get unread counts for all channels (with mention tracking)
 * Returns { channelId: { messages: number, mentions: number } }
 */
export const getUnreadCounts = query({
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    // Build mention patterns for this user
    // Discord-linked users: <@discordId>
    // Non-Discord users: <@n:clerkId>
    const mentionPatterns: string[] = [];
    if (user.discordId) {
      mentionPatterns.push(`<@${user.discordId}>`);
    }
    if (user.clerkId) {
      mentionPatterns.push(`<@n:${user.clerkId}>`);
    }

    const readStates = await ctx.db
      .query("readStates")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const unreadCounts: Record<string, { messages: number; mentions: number }> = {};

    for (const readState of readStates) {
      const channel = await ctx.db.get(readState.channelId);
      if (!channel) continue;

      // Count messages after last read (excluding deleted messages)
      const unreadMessages = await ctx.db
        .query("messages")
        .withIndex("by_channel", (q) => q.eq("channelId", readState.channelId))
        .filter((q) => q.and(
          q.gt(q.field("createdAt"), readState.lastReadAt),
          q.eq(q.field("isDeleted"), false)
        ))
        .collect();

      // Count mentions within unread messages
      let mentionCount = 0;
      for (const msg of unreadMessages) {
        for (const pattern of mentionPatterns) {
          if (msg.content.includes(pattern)) {
            mentionCount++;
            break; // Only count once per message even if mentioned multiple times
          }
        }
      }

      unreadCounts[readState.channelId] = {
        messages: unreadMessages.length,
        mentions: mentionCount,
      };
    }

    // Also check channels without read states (user hasn't visited yet)
    // These should show as fully unread
    const allChannels = await ctx.db.query("channels").collect();
    const visitedChannelIds = new Set(readStates.map(rs => rs.channelId.toString()));

    for (const channel of allChannels) {
      if (channel.isArchived) continue;
      if (visitedChannelIds.has(channel._id.toString())) continue;

      if (!hasAccessToTier(user.tier, channel.requiredTier)) continue;

      // Count all messages in this channel (user has never visited)
      const allMessages = await ctx.db
        .query("messages")
        .withIndex("by_channel", (q) => q.eq("channelId", channel._id))
        .filter((q) => q.eq(q.field("isDeleted"), false))
        .collect();

      // Count mentions
      let mentionCount = 0;
      for (const msg of allMessages) {
        for (const pattern of mentionPatterns) {
          if (msg.content.includes(pattern)) {
            mentionCount++;
            break;
          }
        }
      }

      // Cap unread at a reasonable number for display
      unreadCounts[channel._id] = {
        messages: Math.min(allMessages.length, 99),
        mentions: mentionCount,
      };
    }

    return unreadCounts;
  },
});

/**
 * Send an announcement to a channel (admin only)
 * Optionally broadcasts to multiple channels and/or Discord
 */
export const sendAnnouncement = mutation({
  args: {
    channelIds: v.array(v.id("channels")),
    content: v.string(),
    title: v.optional(v.string()),
    sendToDiscord: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (!isCreator(user)) {
      throw new Error("Only the creator can send announcements");
    }

    if (args.content.length > 4000) {
      throw new Error("Announcement too long. Maximum 4000 characters.");
    }

    const messageIds: Id<"messages">[] = [];

    for (const channelId of args.channelIds) {
      const channel = await ctx.db.get(channelId);
      if (!channel) continue;

      // Format announcement content
      const formattedContent = args.title
        ? `**${args.title}**\n\n${args.content}`
        : args.content;

      const messageId = await ctx.db.insert("messages", {
        channelId,
        authorId: user._id,
        content: formattedContent,
        isPinned: true, // Announcements are auto-pinned
        isEdited: false,
        isDeleted: false,
        createdAt: Date.now(),
      });

      messageIds.push(messageId);

      // Send to Discord if enabled and channel has webhook
      if (args.sendToDiscord && channel.discordWebhookUrl) {
        await ctx.scheduler.runAfter(0, internal.discord.sendAnnouncementToDiscord, {
          channelId,
          title: args.title,
          content: args.content,
          authorName: user.displayName,
          authorAvatarUrl: user.avatarUrl,
        });
      }
    }

    return messageIds;
  },
});

/**
 * Helper function to parse mentions from content and create notifications
 * Mention formats:
 * - <@discordId> - Discord user mention
 * - <@n:clerkId> - Website user mention (non-Discord)
 */
async function createMentionNotifications(
  ctx: any,
  content: string,
  messageId: Id<"messages">,
  channelId: Id<"channels">,
  sender: { _id: Id<"users">; displayName: string }
) {
  // Parse Discord-style mentions: <@123456789>
  const discordMentionRegex = /<@(\d+)>/g;
  // Parse website mentions: <@n:clerk_id_here>
  const websiteMentionRegex = /<@n:([^>]+)>/g;

  const mentionedUserIds = new Set<string>();

  // Find Discord mentions and resolve to user IDs
  let match;
  while ((match = discordMentionRegex.exec(content)) !== null) {
    const discordId = match[1];
    if (!discordId) continue;

    // Find user by Discord ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_discordId", (q: any) => q.eq("discordId", discordId))
      .unique();

    if (user && user._id.toString() !== sender._id.toString()) {
      mentionedUserIds.add(user._id.toString());
    }
  }

  // Find website mentions
  while ((match = websiteMentionRegex.exec(content)) !== null) {
    const clerkId = match[1];
    if (!clerkId) continue;

    // Find user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", clerkId))
      .unique();

    if (user && user._id.toString() !== sender._id.toString()) {
      mentionedUserIds.add(user._id.toString());
    }
  }

  // Get channel name for notification body
  const channel = await ctx.db.get(channelId);
  const channelName = channel?.name || "a channel";

  // Create notifications for each mentioned user
  for (const userIdStr of mentionedUserIds) {
    const userId = userIdStr as Id<"users">;

    // Check user's notification preferences
    const user = await ctx.db.get(userId);
    if (!user || !user.notificationPreferences?.inAppNotifications) {
      continue;
    }

    // Create the notification
    await ctx.db.insert("notifications", {
      userId,
      type: "mention",
      referenceType: "message",
      referenceId: messageId.toString(),
      channelId,
      title: `${sender.displayName} mentioned you`,
      body: `You were mentioned in #${channelName}`,
      isRead: false,
      createdAt: Date.now(),
    });
  }
}

/**
 * Share a learn post to a lounge channel
 */
export const shareLearnPost = mutation({
  args: {
    channelId: v.id("channels"),
    postId: v.id("blogPosts"),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireChannelAccess(ctx, args.channelId);

    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    // Create message with link embed
    const messageId = await ctx.db.insert("messages", {
      channelId: args.channelId,
      authorId: user._id,
      content: args.comment || `Check out this article: ${post.title}`,
      embeds: [
        {
          type: "link" as const,
          url: `https://nev.so/learn/${post.slug}`,
          title: post.title,
          description: post.description,
          thumbnail: post.coverImage,
        },
      ],
      isPinned: false,
      isEdited: false,
      isDeleted: false,
      createdAt: Date.now(),
    });

    // Update read state
    const existingReadState = await ctx.db
      .query("readStates")
      .withIndex("by_user_channel", (q) =>
        q.eq("userId", user._id).eq("channelId", args.channelId)
      )
      .unique();

    if (existingReadState) {
      await ctx.db.patch(existingReadState._id, {
        lastReadMessageId: messageId,
        lastReadAt: Date.now(),
      });
    } else {
      await ctx.db.insert("readStates", {
        userId: user._id,
        channelId: args.channelId,
        lastReadMessageId: messageId,
        lastReadAt: Date.now(),
      });
    }

    // Send to Discord if channel has wormhole configured
    const channel = await ctx.db.get(args.channelId);
    if (channel?.discordWebhookUrl) {
      await ctx.scheduler.runAfter(0, internal.discord.sendToDiscord, {
        messageId,
        channelId: args.channelId,
        content: args.comment || `Check out this article: ${post.title}`,
        embeds: [
          {
            type: "link" as const,
            url: `https://nev.so/learn/${post.slug}`,
            title: post.title,
            description: post.description,
            thumbnail: post.coverImage,
          },
        ],
        authorName: user.displayName,
        authorAvatarUrl: user.avatarUrl,
      });
    }

    return messageId;
  },
});
