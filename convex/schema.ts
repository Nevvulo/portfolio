import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table - extends Clerk user data with lounge-specific fields
  users: defineTable({
    clerkId: v.string(),
    discordId: v.optional(v.string()),
    username: v.optional(v.string()),  // Unique username for profile URLs (@username)
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
    tier: v.union(v.literal("free"), v.literal("tier1"), v.literal("tier2")),
    tierValidUntil: v.optional(v.number()), // timestamp
    isCreator: v.boolean(), // Discord ID: 246574843460321291
    status: v.union(v.literal("online"), v.literal("offline"), v.literal("away")),
    lastSeenAt: v.number(),
    notificationPreferences: v.object({
      emailDigest: v.union(v.literal("daily"), v.literal("weekly"), v.literal("none")),
      inAppNotifications: v.boolean(),
    }),
    // Profile fields for UserPopout
    bannerUrl: v.optional(v.string()),       // Vercel Blob URL
    bannerFocalY: v.optional(v.number()),    // 0-100, default 50 (center)
    bio: v.optional(v.string()),             // Max 200 chars
    // Supporter status fields (synced from API)
    discordHighestRole: v.optional(v.object({
      id: v.string(),
      name: v.string(),
      color: v.number(),
      position: v.number(),
    })),
    twitchSubTier: v.optional(v.union(v.literal(1), v.literal(2), v.literal(3))),
    discordBooster: v.optional(v.boolean()),
    clerkPlan: v.optional(v.string()),
    clerkPlanStatus: v.optional(v.string()),
    supporterSyncedAt: v.optional(v.number()),
    // Connection usernames (for displaying in other users' popouts)
    discordUsername: v.optional(v.string()),
    twitchUsername: v.optional(v.string()),
    // Moderation fields
    isBanned: v.optional(v.boolean()),
    banReason: v.optional(v.string()),
    bannedAt: v.optional(v.number()),
    kickedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_discordId", ["discordId"])
    .index("by_username", ["username"])
    .index("by_status", ["status"]),

  // Channels - both general and tier-gated
  channels: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    type: v.union(v.literal("chat"), v.literal("announcements"), v.literal("content")),
    requiredTier: v.union(v.literal("free"), v.literal("tier1"), v.literal("tier2")),
    order: v.number(),
    icon: v.optional(v.string()), // emoji or icon name
    isArchived: v.boolean(),
    // Discord wormhole link
    discordChannelId: v.optional(v.string()),
    discordWebhookUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_tier", ["requiredTier"])
    .index("by_order", ["order"]),

  // Messages - Discord-style chat messages
  messages: defineTable({
    channelId: v.id("channels"),
    authorId: v.id("users"),
    content: v.string(), // Markdown content
    // Message type for special rendering (system messages, emoji blasts, etc.)
    messageType: v.optional(v.union(
      v.literal("default"),      // Regular chat message
      v.literal("system"),       // Generic system message
      v.literal("emoji_blast"),  // Emoji blast announcement
      v.literal("join"),         // User joined
      v.literal("leave"),        // User left
      v.literal("boost"),        // Server boost
      v.literal("giveaway"),     // Giveaway announcement
      v.literal("poll"),         // Poll announcement
      v.literal("content")       // Generic content post announcement
    )),
    // Link to content post for special rendering
    contentPostId: v.optional(v.id("contentPosts")),
    embeds: v.optional(v.array(v.object({
      // Embed type discriminator
      type: v.union(
        v.literal("link"),      // URL preview (generic websites)
        v.literal("image"),     // Uploaded image attachment
        v.literal("video"),     // Uploaded video attachment
        v.literal("audio"),     // Uploaded audio attachment
        v.literal("youtube")    // YouTube video embed
      ),
      // Common fields
      url: v.optional(v.string()),           // Primary URL (blob URL or external)
      title: v.optional(v.string()),         // Title for link previews
      description: v.optional(v.string()),   // Description for link previews
      thumbnail: v.optional(v.string()),     // Thumbnail URL
      // File attachment fields (for image/video/audio types)
      filename: v.optional(v.string()),      // Original filename
      mimeType: v.optional(v.string()),      // MIME type (image/png, video/mp4, etc.)
      fileSize: v.optional(v.number()),      // File size in bytes
      width: v.optional(v.number()),         // Image/video width
      height: v.optional(v.number()),        // Image/video height
      duration: v.optional(v.number()),      // Video/audio duration in seconds
      // Video embed specific
      embedUrl: v.optional(v.string()),      // For YouTube embedded player URL
      // Link preview metadata
      siteName: v.optional(v.string()),      // e.g., "YouTube", "Twitter"
    }))),
    replyToId: v.optional(v.id("messages")),
    threadId: v.optional(v.id("threads")),
    isPinned: v.boolean(),
    isEdited: v.boolean(),
    isDeleted: v.boolean(),
    // Discord wormhole fields
    discordMessageId: v.optional(v.string()),
    discordAuthor: v.optional(v.object({
      id: v.string(),
      username: v.string(),
      discriminator: v.optional(v.string()),
      avatarUrl: v.optional(v.string()),
    })),
    createdAt: v.number(),
    editedAt: v.optional(v.number()),
  })
    .index("by_channel", ["channelId", "createdAt"])
    .index("by_thread", ["threadId", "createdAt"])
    .index("by_author", ["authorId"])
    .index("by_discordMessageId", ["discordMessageId"]),

  // Threads - for threaded replies
  threads: defineTable({
    channelId: v.id("channels"),
    rootMessageId: v.id("messages"),
    title: v.optional(v.string()),
    messageCount: v.number(),
    lastMessageAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_channel", ["channelId"])
    .index("by_rootMessage", ["rootMessageId"]),

  // Reactions - message reactions
  reactions: defineTable({
    messageId: v.id("messages"),
    userId: v.id("users"),
    emoji: v.string(),
    createdAt: v.number(),
  })
    .index("by_message", ["messageId"])
    .index("by_user_message", ["userId", "messageId"]),

  // Content Posts - creator-only rich content
  contentPosts: defineTable({
    authorId: v.id("users"),
    channelId: v.id("channels"),
    type: v.union(
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
    ),
    title: v.string(),
    content: v.string(), // Rich text / markdown
    media: v.optional(v.object({
      type: v.string(),
      url: v.string(), // Vercel Blob URL
      thumbnail: v.optional(v.string()),
      duration: v.optional(v.number()), // for audio/video
      fileSize: v.optional(v.number()),
      platforms: v.optional(v.array(v.string())), // for game builds
      soundcloudUrl: v.optional(v.string()), // for music content
    })),
    eventData: v.optional(v.object({
      startTime: v.number(),
      endTime: v.optional(v.number()),
      timezone: v.string(),
      location: v.optional(v.string()),
    })),
    giveawayData: v.optional(v.object({
      endsAt: v.number(),
      maxEntries: v.optional(v.number()),
      prize: v.string(),
      winnerId: v.optional(v.id("users")),
    })),
    pollData: v.optional(v.object({
      options: v.array(v.object({
        id: v.string(),
        text: v.string(),
      })),
      endsAt: v.optional(v.number()),
      allowMultiple: v.boolean(),
    })),
    // For emoji type - the emoji to display
    emojiData: v.optional(v.object({
      emoji: v.string(),
      message: v.optional(v.string()), // e.g., "sent @everyone a"
    })),
    requiredTier: v.union(v.literal("free"), v.literal("tier1"), v.literal("tier2")),
    isPinned: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_channel", ["channelId", "createdAt"])
    .index("by_type", ["type", "createdAt"])
    .index("by_author", ["authorId"]),

  // Poll Votes
  pollVotes: defineTable({
    postId: v.id("contentPosts"),
    optionId: v.string(),
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_post", ["postId"])
    .index("by_user_post", ["userId", "postId"]),

  // Giveaway Entries
  giveawayEntries: defineTable({
    postId: v.id("contentPosts"),
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_post", ["postId"])
    .index("by_user_post", ["userId", "postId"]),

  // Typing Indicators (ephemeral, TTL managed)
  typingIndicators: defineTable({
    channelId: v.id("channels"),
    userId: v.id("users"),
    expiresAt: v.number(),
  })
    .index("by_channel", ["channelId"])
    .index("by_expires", ["expiresAt"]),

  // Notifications
  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("mention"),
      v.literal("reply"),
      v.literal("new_content"),
      v.literal("reward"),
      v.literal("giveaway_win"),
      v.literal("channel_message")
    ),
    referenceType: v.optional(v.union(
      v.literal("message"),
      v.literal("contentPost"),
      v.literal("reward")
    )),
    referenceId: v.optional(v.string()), // message/post/reward ID
    channelId: v.optional(v.id("channels")),
    title: v.string(),
    body: v.string(),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId", "createdAt"])
    .index("by_user_unread", ["userId", "isRead"]),

  // Rewards / Loot Drops (Mystery Boxes)
  rewards: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("monthly_drop"), v.literal("special")),
    month: v.string(), // "2025-01" format
    items: v.array(v.object({
      id: v.string(), // Unique item ID for tracking
      type: v.string(), // "emoji_pack", "wallpaper", "discount_code", etc.
      name: v.string(),
      description: v.string(),
      rarity: v.union(
        v.literal("common"),
        v.literal("uncommon"),
        v.literal("rare"),
        v.literal("epic"),
        v.literal("legendary")
      ),
      assetUrl: v.optional(v.string()), // Vercel Blob URL for downloadables
      code: v.optional(v.string()), // Discount codes, unlock codes, etc.
      isClaimed: v.boolean(), // Track if item has been claimed/downloaded
      claimedAt: v.optional(v.number()), // Timestamp when claimed
      expiresAt: v.optional(v.number()), // Optional expiration date
    })),
    isRevealed: v.boolean(),
    revealedAt: v.optional(v.number()),
    revealType: v.optional(v.union(v.literal("scratch"), v.literal("mystery_box"))),
    deliveredAt: v.number(),
    emailSentAt: v.optional(v.number()),
  })
    .index("by_user", ["userId", "deliveredAt"])
    .index("by_month", ["month"])
    .index("by_user_month", ["userId", "month"]),

  // Reward Templates - Admin-created box templates for reuse
  rewardTemplates: defineTable({
    name: v.string(), // Internal name for the template
    description: v.optional(v.string()),
    type: v.union(v.literal("monthly_drop"), v.literal("special")),
    revealType: v.union(v.literal("scratch"), v.literal("mystery_box")),
    items: v.array(v.object({
      type: v.string(),
      name: v.string(),
      description: v.string(),
      rarity: v.union(
        v.literal("common"),
        v.literal("uncommon"),
        v.literal("rare"),
        v.literal("epic"),
        v.literal("legendary")
      ),
      assetUrl: v.optional(v.string()),
      code: v.optional(v.string()),
      expiresAfterDays: v.optional(v.number()), // Relative expiration
    })),
    targetTiers: v.array(v.union(v.literal("free"), v.literal("tier1"), v.literal("tier2"), v.literal("all"))),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_active", ["isActive"]),

  // Scheduled Drops - Track monthly auto-drops status
  scheduledDrops: defineTable({
    templateId: v.optional(v.id("rewardTemplates")),
    month: v.string(), // "2025-01" format
    targetTier: v.union(v.literal("free"), v.literal("tier1"), v.literal("tier2"), v.literal("all")),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    processedCount: v.number(),
    totalCount: v.number(),
    scheduledAt: v.number(),
    processedAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  })
    .index("by_month", ["month"])
    .index("by_status", ["status"]),

  // Read States - track last read position per channel
  readStates: defineTable({
    userId: v.id("users"),
    channelId: v.id("channels"),
    lastReadMessageId: v.optional(v.id("messages")),
    lastReadAt: v.number(),
  })
    .index("by_user_channel", ["userId", "channelId"])
    .index("by_user", ["userId"]),

  // Wormhole Mapping - Discord ↔ Convex message ID mapping for reply sync
  wormholeMapping: defineTable({
    convexMessageId: v.id("messages"),
    discordMessageId: v.string(),
    channelId: v.id("channels"),
    createdAt: v.number(),
  })
    .index("by_convexMessage", ["convexMessageId"])
    .index("by_discordMessage", ["discordMessageId"])
    .index("by_channel", ["channelId"]),

  // Discord custom emojis cache
  discordEmojis: defineTable({
    emojiId: v.string(),
    name: v.string(),
    animated: v.boolean(),
  }).index("by_emojiId", ["emojiId"]),

  // Discord → Clerk ID mapping cache (synced from Upstash)
  // This allows Convex to look up website users from Discord IDs
  discordClerkMapping: defineTable({
    discordId: v.string(),
    clerkId: v.string(),
    updatedAt: v.number(),
  })
    .index("by_discordId", ["discordId"])
    .index("by_clerkId", ["clerkId"]),

  // Jungle - Club Penguin style shared listening room
  jungleListeners: defineTable({
    userId: v.id("users"),
    joinedAt: v.number(),
    lastHeartbeat: v.number(), // For detecting disconnected users
  })
    .index("by_user", ["userId"])
    .index("by_heartbeat", ["lastHeartbeat"]),

  // Jungle current track and queue
  jungleState: defineTable({
    // Singleton - only one document
    // Streaming mode: "youtube" for playlist, "live" for real-time audio streaming
    mode: v.union(v.literal("youtube"), v.literal("live"), v.literal("idle")),
    // YouTube mode fields
    currentTrack: v.optional(v.object({
      youtubeId: v.string(),       // YouTube video ID
      title: v.string(),
      artist: v.optional(v.string()),
      duration: v.number(),        // in seconds
      startedAt: v.number(),       // timestamp when track started
      addedBy: v.string(),         // display name
    })),
    queue: v.array(v.object({
      id: v.string(),              // internal queue ID
      youtubeId: v.string(),       // YouTube video ID
      title: v.string(),
      artist: v.optional(v.string()),
      duration: v.number(),
      addedBy: v.string(),
    })),
    isPlaying: v.boolean(),        // pause/play state for YouTube
    // Live streaming mode fields
    liveStreamTitle: v.optional(v.string()),
    liveStreamStartedAt: v.optional(v.number()),
    updatedAt: v.number(),
  }),
});
