import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalAction, internalMutation, mutation, query } from "./_generated/server";

// Embed validator for message attachments
const embedValidator = v.object({
  type: v.string(),
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
});

/**
 * Send a message to Discord via webhook
 * Called after a message is created in the lounge
 */
export const sendToDiscord = internalAction({
  args: {
    messageId: v.id("messages"),
    channelId: v.id("channels"),
    content: v.string(),
    embeds: v.optional(v.array(embedValidator)),
    authorName: v.string(),
    authorAvatarUrl: v.optional(v.string()),
    replyToDiscordMessageId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<string | null> => {
    // Get channel to find webhook URL (use internal query - no auth needed)
    const channel = (await ctx.runQuery(internal.channels.getInternal, {
      channelId: args.channelId,
    })) as {
      discordWebhookUrl?: string;
    } | null;

    if (!channel?.discordWebhookUrl) {
      return null;
    }

    // Build Discord embeds from our embeds (for images/videos)
    const discordEmbeds: Array<{ image?: { url: string }; video?: { url: string } }> = [];
    if (args.embeds) {
      for (const embed of args.embeds) {
        if (embed.type === "image" && embed.url) {
          discordEmbeds.push({ image: { url: embed.url } });
        } else if (embed.type === "video" && embed.url) {
          discordEmbeds.push({ video: { url: embed.url } });
        }
      }
    }

    // Discord requires either content or embeds - can't be both empty
    const hasContent = args.content && args.content.trim().length > 0;
    const hasEmbeds = discordEmbeds.length > 0;

    if (!hasContent && !hasEmbeds) {
      console.error("Discord: Cannot send empty message with no embeds");
      return null;
    }

    // Build the webhook payload
    const payload: Record<string, unknown> = {
      username: args.authorName,
      avatar_url: args.authorAvatarUrl,
      allowed_mentions: {
        parse: [] as string[],
      },
    };

    // Only include content if not empty
    if (hasContent) {
      payload.content = args.content;
    }

    // Include embeds if we have any
    if (hasEmbeds) {
      payload.embeds = discordEmbeds;
    }

    try {
      const response = await fetch(channel.discordWebhookUrl + "?wait=true", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Discord webhook error:", response.status, errorText);
        return null;
      }

      const data = (await response.json()) as { id: string };
      const discordMessageId = data.id;

      // Store the mapping for reply sync
      if (discordMessageId) {
        await ctx.runMutation(internal.discord.storeWormholeMapping, {
          convexMessageId: args.messageId,
          discordMessageId,
          channelId: args.channelId,
        });
      }

      return discordMessageId;
    } catch (error) {
      console.error("Failed to send to Discord:", error);
      return null;
    }
  },
});

/**
 * Send an announcement to Discord with rich embed
 */
export const sendAnnouncementToDiscord = internalAction({
  args: {
    channelId: v.id("channels"),
    title: v.optional(v.string()),
    content: v.string(),
    authorName: v.string(),
    authorAvatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<string | null> => {
    // Use internal query - no auth required for internal actions
    const channel = (await ctx.runQuery(internal.channels.getInternal, {
      channelId: args.channelId,
    })) as {
      discordWebhookUrl?: string;
    } | null;

    if (!channel?.discordWebhookUrl) {
      return null;
    }

    // Build a rich embed for announcements
    const embed = {
      title: args.title || "📢 Announcement",
      description: args.content,
      color: 0x9074f2, // LOUNGE_COLORS.tier1 as hex integer
      timestamp: new Date().toISOString(),
      footer: {
        text: "nevulounge",
      },
    };

    const payload = {
      username: args.authorName,
      avatar_url: args.authorAvatarUrl,
      embeds: [embed],
      allowed_mentions: {
        parse: ["roles"] as string[],
      },
    };

    try {
      const response = await fetch(channel.discordWebhookUrl + "?wait=true", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Discord announcement webhook error:", response.status, errorText);
        return null;
      }

      const data = (await response.json()) as { id: string };
      return data.id;
    } catch (error) {
      console.error("Failed to send announcement to Discord:", error);
      return null;
    }
  },
});

/**
 * Store wormhole mapping between Convex and Discord message IDs
 */
export const storeWormholeMapping = internalMutation({
  args: {
    convexMessageId: v.id("messages"),
    discordMessageId: v.string(),
    channelId: v.id("channels"),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("wormholeMapping", {
      convexMessageId: args.convexMessageId,
      discordMessageId: args.discordMessageId,
      channelId: args.channelId,
      createdAt: Date.now(),
    });
  },
});

/**
 * Query to get wormhole mapping by Convex message ID
 */
export const getWormholeMappingByConvex = query({
  args: {
    convexMessageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("wormholeMapping")
      .withIndex("by_convexMessage", (q) => q.eq("convexMessageId", args.convexMessageId))
      .unique();
  },
});

/**
 * Get guild emojis (cached in Convex, refreshed by bot)
 */
export const getGuildEmojis = query({
  handler: async (ctx) => {
    const emojis = await ctx.db.query("discordEmojis").collect();
    return emojis.map((e) => ({
      id: e.emojiId,
      name: e.name,
      animated: e.animated,
    }));
  },
});

/**
 * Sync guild emojis from Discord (called by bot on startup)
 */
export const syncGuildEmojis = mutation({
  args: {
    secret: v.string(),
    emojis: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        animated: v.boolean(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const expectedSecret = process.env.DISCORD_WORMHOLE_SECRET;
    if (!expectedSecret || args.secret !== expectedSecret) {
      throw new Error("Invalid wormhole secret");
    }

    // Clear existing emojis
    const existing = await ctx.db.query("discordEmojis").collect();
    for (const emoji of existing) {
      await ctx.db.delete(emoji._id);
    }

    // Insert new emojis
    for (const emoji of args.emojis) {
      await ctx.db.insert("discordEmojis", {
        emojiId: emoji.id,
        name: emoji.name,
        animated: emoji.animated,
      });
    }

    return args.emojis.length;
  },
});

/**
 * Get channel by Discord channel ID
 */
export const getChannelByDiscordId = query({
  args: {
    discordChannelId: v.string(),
  },
  handler: async (ctx, args) => {
    const channels = await ctx.db.query("channels").collect();
    return channels.find((c) => c.discordChannelId === args.discordChannelId) ?? null;
  },
});

/**
 * Send a content post to Discord with rich embed
 * For polls, uses Discord's native poll feature
 */
export const sendContentPostToDiscord = internalAction({
  args: {
    postId: v.id("contentPosts"),
    channelId: v.id("channels"),
    type: v.string(),
    title: v.string(),
    content: v.string(),
    media: v.optional(
      v.object({
        type: v.string(),
        url: v.string(),
        thumbnail: v.optional(v.string()),
        duration: v.optional(v.number()),
        fileSize: v.optional(v.number()),
        platforms: v.optional(v.array(v.string())),
      }),
    ),
    // Poll-specific data for native Discord polls
    pollData: v.optional(
      v.object({
        options: v.array(v.object({ id: v.string(), text: v.string() })),
        endsAt: v.optional(v.number()),
        allowMultiple: v.boolean(),
      }),
    ),
    // Emoji blast data
    emojiData: v.optional(
      v.object({
        emoji: v.string(),
        message: v.optional(v.string()),
      }),
    ),
    authorName: v.string(),
    authorAvatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<string | null> => {
    // Use internal query - no auth required for internal actions
    const channel = (await ctx.runQuery(internal.channels.getInternal, {
      channelId: args.channelId,
    })) as {
      discordWebhookUrl?: string;
    } | null;

    if (!channel?.discordWebhookUrl) {
      return null;
    }

    // For emoji blasts, send as raw message (not embed)
    if (args.type === "emoji" && args.emojiData) {
      const emoji = args.emojiData.emoji || "🎉";
      const message = args.emojiData.message || "";
      // Format: "**AuthorName** message 🎉" - e.g., "**Blake** sent @everyone a 🎉"
      const messageContent = message
        ? `**${args.authorName}** ${message} ${emoji}`
        : `**${args.authorName}** ${emoji}`;
      const emojiPayload = {
        content: `# ${messageContent}`,
        username: args.authorName,
        avatar_url: args.authorAvatarUrl,
        allowed_mentions: {
          parse: [] as string[],
        },
      };

      try {
        const response = await fetch(channel.discordWebhookUrl + "?wait=true", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(emojiPayload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Discord emoji webhook error:", response.status, errorText);
          return null;
        }

        const data = (await response.json()) as { id: string };
        return data.id;
      } catch (error) {
        console.error("Failed to send emoji to Discord:", error);
        return null;
      }
    }

    // For polls, use Discord's native poll feature
    if (args.type === "poll" && args.pollData) {
      // Calculate duration in hours (Discord requires duration, not end timestamp)
      let durationHours = 24; // Default 24 hours
      if (args.pollData.endsAt) {
        const hoursUntilEnd = Math.ceil((args.pollData.endsAt - Date.now()) / (1000 * 60 * 60));
        durationHours = Math.max(1, Math.min(168, hoursUntilEnd)); // Discord allows 1-168 hours (7 days)
      }

      const pollPayload = {
        username: args.authorName,
        avatar_url: args.authorAvatarUrl,
        content: args.content ? `**${args.title}**\n\n${args.content}` : `**${args.title}**`,
        poll: {
          question: { text: args.title.slice(0, 300) }, // Discord limits question to 300 chars
          answers: args.pollData.options.slice(0, 10).map((opt) => ({
            poll_media: { text: opt.text.slice(0, 55) }, // Discord limits answers to 55 chars
          })),
          duration: durationHours,
          allow_multiselect: args.pollData.allowMultiple,
          layout_type: 1, // Default layout
        },
        allowed_mentions: {
          parse: [] as string[],
        },
      };

      try {
        const response = await fetch(channel.discordWebhookUrl + "?wait=true", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(pollPayload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Discord poll webhook error:", response.status, errorText);
          // Fall back to embed if native poll fails
          return await sendAsEmbed();
        }

        const data = (await response.json()) as { id: string };
        return data.id;
      } catch (error) {
        console.error("Failed to send poll to Discord:", error);
        return await sendAsEmbed();
      }
    }

    // For non-poll content, use rich embeds
    return await sendAsEmbed();

    async function sendAsEmbed(): Promise<string | null> {
      // Map content types to emojis
      const typeEmojis: Record<string, string> = {
        music: "🎵",
        video: "🎬",
        writing: "📝",
        game_build: "🎮",
        news: "📰",
        tools: "🔧",
        event: "📅",
        advice: "💡",
        giveaway: "🎁",
        poll: "📊",
        emoji: "😀",
      };

      const emoji = typeEmojis[args.type] || "📢";

      // Build a rich embed
      const embed: Record<string, unknown> = {
        title: `${emoji} ${args.title}`,
        description: args.content.slice(0, 2000),
        color: 0xfaa81a, // Gold color
        timestamp: new Date().toISOString(),
        footer: {
          text: `${args.type.replace("_", " ").toUpperCase()} • nevulounge`,
        },
      };

      // Add media thumbnail if available
      if (args.media?.thumbnail) {
        embed.image = { url: args.media.thumbnail };
      } else if (args.media?.url && args.media.type.startsWith("image")) {
        embed.image = { url: args.media.url };
      }

      const payload = {
        username: args.authorName,
        avatar_url: args.authorAvatarUrl,
        embeds: [embed],
        allowed_mentions: {
          parse: ["roles"] as string[],
        },
      };

      try {
        const response = await fetch(channel!.discordWebhookUrl + "?wait=true", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Discord content post webhook error:", response.status, errorText);
          return null;
        }

        const data = (await response.json()) as { id: string };
        return data.id;
      } catch (error) {
        console.error("Failed to send content post to Discord:", error);
        return null;
      }
    }
  },
});

/**
 * Create a message from Discord (called by the bot)
 * Validates the wormhole secret for security
 */
export const createMessageFromDiscord = mutation({
  args: {
    secret: v.string(),
    channelId: v.id("channels"),
    content: v.string(),
    discordMessageId: v.string(),
    discordAuthor: v.object({
      id: v.string(),
      username: v.string(),
      discriminator: v.optional(v.string()),
      avatarUrl: v.optional(v.string()),
    }),
    replyToDiscordMessageId: v.optional(v.string()),
    // Attachments from Discord (images, videos, etc.)
    attachments: v.optional(
      v.array(
        v.object({
          type: v.string(),
          url: v.string(),
          proxyUrl: v.optional(v.string()),
          filename: v.optional(v.string()),
          width: v.optional(v.number()),
          height: v.optional(v.number()),
          mimeType: v.optional(v.string()),
          fileSize: v.optional(v.number()),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    // Validate secret
    const expectedSecret = process.env.DISCORD_WORMHOLE_SECRET;
    if (!expectedSecret || args.secret !== expectedSecret) {
      throw new Error("Invalid wormhole secret");
    }

    // Check if message already exists (prevent duplicates)
    const existingMessage = await ctx.db
      .query("messages")
      .withIndex("by_discordMessageId", (q) => q.eq("discordMessageId", args.discordMessageId))
      .unique();

    if (existingMessage) {
      return existingMessage._id;
    }

    // Get fallback author (creator user)
    let user = await ctx.db
      .query("users")
      .withIndex("by_discordId", (q) => q.eq("discordId", args.discordAuthor.id))
      .unique();

    if (!user) {
      user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("isCreator"), true))
        .first();
    }

    if (!user) {
      throw new Error("No fallback user found");
    }

    // Find reply-to message if this is a reply
    let replyToId: Id<"messages"> | undefined;
    if (args.replyToDiscordMessageId) {
      const replyMapping = await ctx.db
        .query("wormholeMapping")
        .withIndex("by_discordMessage", (q) =>
          q.eq("discordMessageId", args.replyToDiscordMessageId!),
        )
        .unique();

      if (replyMapping) {
        replyToId = replyMapping.convexMessageId;
      }
    }

    // Convert Discord attachments to embeds
    const embeds = args.attachments?.map((attachment) => ({
      type: attachment.type as "image" | "video" | "audio" | "link" | "youtube",
      url: attachment.proxyUrl || attachment.url, // Prefer proxy URL (doesn't expire as quickly)
      filename: attachment.filename,
      width: attachment.width,
      height: attachment.height,
      mimeType: attachment.mimeType,
      fileSize: attachment.fileSize,
    }));

    // Create the message
    const messageId = await ctx.db.insert("messages", {
      channelId: args.channelId,
      authorId: user._id,
      content: args.content,
      embeds: embeds && embeds.length > 0 ? embeds : undefined,
      discordMessageId: args.discordMessageId,
      discordAuthor: args.discordAuthor,
      replyToId,
      isPinned: false,
      isEdited: false,
      isDeleted: false,
      createdAt: Date.now(),
    });

    // Store the mapping
    await ctx.db.insert("wormholeMapping", {
      convexMessageId: messageId,
      discordMessageId: args.discordMessageId,
      channelId: args.channelId,
      createdAt: Date.now(),
    });

    return messageId;
  },
});

/**
 * Upsert Discord → Clerk ID mapping
 * Called from the website when a user syncs their supporter status
 */
export const upsertDiscordClerkMapping = mutation({
  args: {
    discordId: v.string(),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if mapping already exists
    const existing = await ctx.db
      .query("discordClerkMapping")
      .withIndex("by_discordId", (q) => q.eq("discordId", args.discordId))
      .unique();

    if (existing) {
      // Update if Clerk ID changed
      if (existing.clerkId !== args.clerkId) {
        await ctx.db.patch(existing._id, {
          clerkId: args.clerkId,
          updatedAt: Date.now(),
        });
      }
    } else {
      // Create new mapping
      await ctx.db.insert("discordClerkMapping", {
        discordId: args.discordId,
        clerkId: args.clerkId,
        updatedAt: Date.now(),
      });
    }
  },
});
