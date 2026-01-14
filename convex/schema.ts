import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table - extends Clerk user data with lounge-specific fields
  users: defineTable({
    clerkId: v.string(),
    discordId: v.optional(v.string()),
    username: v.optional(v.string()), // Unique username for profile URLs (@username)
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
    tier: v.union(v.literal("free"), v.literal("tier1"), v.literal("tier2")),
    tierValidUntil: v.optional(v.number()), // timestamp
    isCreator: v.boolean(), // Discord ID: 246574843460321291
    // Role system: 0 = normal member, 1 = staff, 2 = creator-only
    role: v.optional(v.number()),
    status: v.union(v.literal("online"), v.literal("offline"), v.literal("away")),
    lastSeenAt: v.number(),
    notificationPreferences: v.object({
      emailDigest: v.union(v.literal("daily"), v.literal("weekly"), v.literal("none")),
      inAppNotifications: v.boolean(),
    }),
    // Profile fields for UserPopout
    bannerUrl: v.optional(v.string()), // Vercel Blob URL
    bannerFocalY: v.optional(v.number()), // 0-100, default 50 (center)
    bio: v.optional(v.string()), // Max 200 chars
    // Supporter status fields (synced from API)
    discordHighestRole: v.optional(
      v.object({
        id: v.string(),
        name: v.string(),
        color: v.number(),
        position: v.number(),
      }),
    ),
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
    // Experience/Level system
    level: v.optional(v.number()), // Current level (starts at 1)
    experience: v.optional(v.number()), // XP towards next level
    totalExperience: v.optional(v.number()), // All-time XP earned
    // User feed settings
    feedPrivacy: v.optional(
      v.union(
        v.literal("everyone"), // Anyone can post on feed
        v.literal("approval"), // Contributions require approval
        v.literal("owner_only"), // Only profile owner can post
      ),
    ),
    // Credits page visibility
    showOnCredits: v.optional(v.boolean()), // Opt-in to appear on /credits page
    isContributor: v.optional(v.boolean()), // Show in contributors section
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
    // Advanced access rules (overrides requiredTier if set)
    accessRules: v.optional(
      v.object({
        matchMode: v.optional(v.union(v.literal("any"), v.literal("all"))), // Default: "any" (OR logic)
        twitchSubs: v.optional(v.boolean()), // Any Twitch subscriber
        twitchSubTier: v.optional(v.union(v.literal(1), v.literal(2), v.literal(3))), // Minimum Twitch tier
        superLegend: v.optional(v.boolean()), // Super Legend I or II
        superLegendTier: v.optional(v.union(v.literal(1), v.literal(2))), // 1 = SL I, 2 = SL II
        discordBoosters: v.optional(v.boolean()), // Discord server boosters
      }),
    ),
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
    messageType: v.optional(
      v.union(
        v.literal("default"), // Regular chat message
        v.literal("system"), // Generic system message
        v.literal("emoji_blast"), // Emoji blast announcement
        v.literal("join"), // User joined
        v.literal("leave"), // User left
        v.literal("boost"), // Server boost
        v.literal("giveaway"), // Giveaway announcement
        v.literal("poll"), // Poll announcement
        v.literal("content"), // Generic content post announcement
      ),
    ),
    // Link to content post for special rendering
    contentPostId: v.optional(v.id("contentPosts")),
    embeds: v.optional(
      v.array(
        v.object({
          // Embed type discriminator
          type: v.union(
            v.literal("link"), // URL preview (generic websites)
            v.literal("image"), // Uploaded image attachment
            v.literal("video"), // Uploaded video attachment
            v.literal("audio"), // Uploaded audio attachment
            v.literal("youtube"), // YouTube video embed
          ),
          // Common fields
          url: v.optional(v.string()), // Primary URL (blob URL or external)
          title: v.optional(v.string()), // Title for link previews
          description: v.optional(v.string()), // Description for link previews
          thumbnail: v.optional(v.string()), // Thumbnail URL
          // File attachment fields (for image/video/audio types)
          filename: v.optional(v.string()), // Original filename
          mimeType: v.optional(v.string()), // MIME type (image/png, video/mp4, etc.)
          fileSize: v.optional(v.number()), // File size in bytes
          width: v.optional(v.number()), // Image/video width
          height: v.optional(v.number()), // Image/video height
          duration: v.optional(v.number()), // Video/audio duration in seconds
          // Video embed specific
          embedUrl: v.optional(v.string()), // For YouTube embedded player URL
          // Link preview metadata
          siteName: v.optional(v.string()), // e.g., "YouTube", "Twitter"
        }),
      ),
    ),
    replyToId: v.optional(v.id("messages")),
    threadId: v.optional(v.id("threads")),
    isPinned: v.boolean(),
    isEdited: v.boolean(),
    isDeleted: v.boolean(),
    // Discord wormhole fields
    discordMessageId: v.optional(v.string()),
    discordAuthor: v.optional(
      v.object({
        id: v.string(),
        username: v.string(),
        discriminator: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
      }),
    ),
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
      v.literal("emoji"),
    ),
    title: v.string(),
    content: v.string(), // Rich text / markdown
    media: v.optional(
      v.object({
        type: v.string(),
        url: v.string(), // Vercel Blob URL
        thumbnail: v.optional(v.string()),
        duration: v.optional(v.number()), // for audio/video
        fileSize: v.optional(v.number()),
        platforms: v.optional(v.array(v.string())), // for game builds
        soundcloudUrl: v.optional(v.string()), // for music content
      }),
    ),
    eventData: v.optional(
      v.object({
        startTime: v.number(),
        endTime: v.optional(v.number()),
        timezone: v.string(),
        location: v.optional(v.string()),
      }),
    ),
    giveawayData: v.optional(
      v.object({
        endsAt: v.number(),
        maxEntries: v.optional(v.number()),
        prize: v.string(),
        winnerId: v.optional(v.id("users")),
      }),
    ),
    pollData: v.optional(
      v.object({
        options: v.array(
          v.object({
            id: v.string(),
            text: v.string(),
          }),
        ),
        endsAt: v.optional(v.number()),
        allowMultiple: v.boolean(),
      }),
    ),
    // For emoji type - the emoji to display
    emojiData: v.optional(
      v.object({
        emoji: v.string(),
        message: v.optional(v.string()), // e.g., "sent @everyone a"
      }),
    ),
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
      v.literal("channel_message"),
      // Comment & feed notifications
      v.literal("comment_reply"),
      v.literal("collaborator_added"),
      v.literal("comment_reaction"),
      v.literal("feed_reply"),
      v.literal("feed_reaction"),
    ),
    referenceType: v.optional(
      v.union(
        v.literal("message"),
        v.literal("contentPost"),
        v.literal("reward"),
        v.literal("blogComment"),
        v.literal("blogPost"),
        v.literal("feedPost"),
      ),
    ),
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
    items: v.array(
      v.object({
        id: v.string(), // Unique item ID for tracking
        type: v.string(), // "emoji_pack", "wallpaper", "discount_code", etc.
        name: v.string(),
        description: v.string(),
        rarity: v.union(
          v.literal("common"),
          v.literal("uncommon"),
          v.literal("rare"),
          v.literal("epic"),
          v.literal("legendary"),
        ),
        assetUrl: v.optional(v.string()), // Vercel Blob URL for downloadables
        code: v.optional(v.string()), // Discount codes, unlock codes, etc.
        isClaimed: v.boolean(), // Track if item has been claimed/downloaded
        claimedAt: v.optional(v.number()), // Timestamp when claimed
        expiresAt: v.optional(v.number()), // Optional expiration date
      }),
    ),
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
    items: v.array(
      v.object({
        type: v.string(),
        name: v.string(),
        description: v.string(),
        rarity: v.union(
          v.literal("common"),
          v.literal("uncommon"),
          v.literal("rare"),
          v.literal("epic"),
          v.literal("legendary"),
        ),
        assetUrl: v.optional(v.string()),
        code: v.optional(v.string()),
        expiresAfterDays: v.optional(v.number()), // Relative expiration
      }),
    ),
    targetTiers: v.array(
      v.union(v.literal("free"), v.literal("tier1"), v.literal("tier2"), v.literal("all")),
    ),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_active", ["isActive"]),

  // Scheduled Drops - Track monthly auto-drops status
  scheduledDrops: defineTable({
    templateId: v.optional(v.id("rewardTemplates")),
    month: v.string(), // "2025-01" format
    targetTier: v.union(
      v.literal("free"),
      v.literal("tier1"),
      v.literal("tier2"),
      v.literal("all"),
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
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
    currentTrack: v.optional(
      v.object({
        youtubeId: v.string(), // YouTube video ID
        title: v.string(),
        artist: v.optional(v.string()),
        duration: v.number(), // in seconds
        startedAt: v.number(), // timestamp when track started
        addedBy: v.string(), // display name
      }),
    ),
    queue: v.array(
      v.object({
        id: v.string(), // internal queue ID
        youtubeId: v.string(), // YouTube video ID
        title: v.string(),
        artist: v.optional(v.string()),
        duration: v.number(),
        addedBy: v.string(),
      }),
    ),
    isPlaying: v.boolean(), // pause/play state for YouTube
    // Live streaming mode fields
    liveStreamTitle: v.optional(v.string()),
    liveStreamStartedAt: v.optional(v.number()),
    updatedAt: v.number(),
  }),

  // ============================================
  // BLOG / LEARN SECTION
  // ============================================

  // Blog Post Content - separated for bandwidth optimization
  // List queries read only metadata (~5KB), content loaded separately (~200KB)
  blogPostContent: defineTable({
    postId: v.id("blogPosts"),
    content: v.string(), // MDX content
  }).index("by_post", ["postId"]),

  // Blog Posts - migrated from Git, now stored in Convex
  blogPosts: defineTable({
    // Core content
    slug: v.string(),
    title: v.string(),
    description: v.string(),
    content: v.optional(v.string()), // DEPRECATED: Use blogPostContent table
    contentType: v.union(v.literal("article"), v.literal("video"), v.literal("news")),

    // Media
    coverImage: v.optional(v.string()), // Vercel Blob URL
    coverAuthor: v.optional(v.string()), // Photo credit
    coverAuthorUrl: v.optional(v.string()),
    coverGradientIntensity: v.optional(v.number()), // 0-100, defaults to 100
    youtubeId: v.optional(v.string()), // For video content type

    // Author & metadata
    authorId: v.id("users"),
    collaborators: v.optional(v.array(v.id("users"))), // Users who can edit this post
    labels: v.array(v.string()),
    difficulty: v.optional(
      v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
    ),
    readTimeMins: v.optional(v.number()),
    keyIdeas: v.optional(v.array(v.string())),
    location: v.optional(v.string()), // Where it was written

    // AI disclosure - optional, computed from publishedAt if not set
    aiDisclosureStatus: v.optional(
      v.union(v.literal("none"), v.literal("llm-assisted"), v.literal("llm-reviewed")),
    ),

    // Visibility & access
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
    visibility: v.union(
      v.literal("public"),
      v.literal("members"),
      v.literal("tier1"),
      v.literal("tier2"),
    ),

    // Bento layout
    bentoSize: v.union(
      v.literal("small"),
      v.literal("medium"),
      v.literal("large"),
      v.literal("banner"),
      v.literal("featured"),
    ),
    bentoOrder: v.number(),

    // External links (legacy from blogmap)
    mediumUrl: v.optional(v.string()),
    hashnodeUrl: v.optional(v.string()),
    devToUrl: v.optional(v.string()),
    discussionId: v.optional(v.string()),
    discussionNo: v.optional(v.number()),

    // Discord integration - for forum thread comments sync
    discordThreadId: v.optional(v.string()), // Forum thread ID (if forum channel)
    discordMessageId: v.optional(v.string()), // Announcement message ID (if text channel)
    discordChannelId: v.optional(v.string()), // Which channel it was posted to

    // Analytics
    viewCount: v.number(),

    // Timestamps
    publishedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status", "publishedAt"])
    .index("by_author", ["authorId"])
    .index("by_visibility", ["visibility", "status"])
    .index("by_contentType", ["contentType", "status"])
    .index("by_bentoOrder", ["bentoOrder"])
    .index("by_discordThreadId", ["discordThreadId"]),

  // Blog Views - one view per account per post for analytics
  blogViews: defineTable({
    postId: v.id("blogPosts"),
    userId: v.id("users"),
    viewedAt: v.number(),
  })
    .index("by_post", ["postId"])
    .index("by_user", ["userId"])
    .index("by_user_post", ["userId", "postId"]),

  // Blog Comments
  blogComments: defineTable({
    postId: v.id("blogPosts"),
    authorId: v.optional(v.id("users")), // Optional for Discord-only commenters
    content: v.string(), // Markdown
    parentId: v.optional(v.id("blogComments")), // For replies
    isEdited: v.boolean(),
    isDeleted: v.boolean(),
    createdAt: v.number(),
    editedAt: v.optional(v.number()),
    // Discord sync fields
    discordMessageId: v.optional(v.string()), // If synced to/from Discord
    discordAuthor: v.optional(
      v.object({
        // For Discord-originated comments
        id: v.string(),
        username: v.string(),
        discriminator: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
      }),
    ),
    source: v.optional(v.union(v.literal("website"), v.literal("discord"))),
  })
    .index("by_post", ["postId", "createdAt"])
    .index("by_author", ["authorId"])
    .index("by_parent", ["parentId"])
    .index("by_discordMessageId", ["discordMessageId"]),

  // Blog Reactions - for engagement scoring (supports multiple per user per post)
  // Supports both authenticated (userId) and anonymous (ip) reactions
  blogReactions: defineTable({
    postId: v.id("blogPosts"),
    userId: v.optional(v.id("users")), // Optional for anonymous reactions
    ip: v.optional(v.string()), // IP address for anonymous rate limiting
    type: v.union(v.literal("like"), v.literal("helpful"), v.literal("insightful")),
    createdAt: v.number(),
  })
    .index("by_post", ["postId"])
    .index("by_user_post", ["userId", "postId"])
    .index("by_user", ["userId", "createdAt"])
    .index("by_ip_post", ["ip", "postId"]),

  // Blog Interaction Scores - for personalized recommendations
  blogInteractions: defineTable({
    postId: v.id("blogPosts"),
    userId: v.id("users"),
    score: v.number(), // Weighted interaction score
    lastInteraction: v.number(),
  })
    .index("by_user", ["userId", "score"])
    .index("by_post", ["postId"]),

  // Article Watch Time - granular tracking for recommendations
  articleWatchTime: defineTable({
    postId: v.id("blogPosts"),
    userId: v.id("users"),
    totalSeconds: v.number(),
    lastHeartbeat: v.number(),
    sessionId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_post", ["postId"])
    .index("by_user_post", ["userId", "postId"]),

  // Blog Comment Reports - for moderation
  blogCommentReports: defineTable({
    commentId: v.id("blogComments"),
    reporterId: v.id("users"),
    reason: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("reviewed"), v.literal("dismissed")),
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_comment", ["commentId"])
    .index("by_status", ["status", "createdAt"]),

  // Blog Comment Reactions - emoji reactions on blog comments
  blogCommentReactions: defineTable({
    commentId: v.id("blogComments"),
    postId: v.id("blogPosts"), // Denormalized for efficient queries
    userId: v.id("users"),
    type: v.union(
      v.literal("heart"),
      v.literal("thumbs_up"),
      v.literal("eyes"),
      v.literal("fire"),
      v.literal("thinking"),
      v.literal("laugh"),
    ),
    createdAt: v.number(),
  })
    .index("by_comment", ["commentId"])
    .index("by_post", ["postId"])
    .index("by_user_comment", ["userId", "commentId"]),

  // Content Reports - for blog post content moderation
  contentReports: defineTable({
    postId: v.id("blogPosts"),
    reporterId: v.id("users"),
    category: v.union(
      v.literal("content_quality"), // Typo, spelling mistake
      v.literal("factual_error"), // Misreporting, misunderstanding
      v.literal("dislike"), // Don't like the content
      v.literal("infringement"), // Copyright/legal issue
      v.literal("contact_request"), // Wants to get in touch
      v.literal("mention_removal"), // Mentioned and wants removal
      v.literal("other"), // Something else
    ),
    reason: v.optional(v.string()), // Freeform text explanation
    status: v.union(v.literal("pending"), v.literal("reviewed"), v.literal("dismissed")),
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_post", ["postId"])
    .index("by_status", ["status", "createdAt"])
    .index("by_reporter", ["reporterId"]),

  // Blog Comment Wormhole - Discord ↔ Convex comment ID mapping for sync
  blogCommentWormhole: defineTable({
    blogCommentId: v.id("blogComments"),
    discordMessageId: v.string(),
    discordThreadId: v.string(),
    postId: v.id("blogPosts"),
    createdAt: v.number(),
  })
    .index("by_blogComment", ["blogCommentId"])
    .index("by_discordMessage", ["discordMessageId"])
    .index("by_thread", ["discordThreadId"]),

  // News Items - quick snippets with Discord webhook
  newsItems: defineTable({
    title: v.string(),
    content: v.string(), // Short markdown (max 500 chars)
    authorId: v.id("users"),
    isPublished: v.boolean(),
    sentToDiscord: v.boolean(),
    discordMessageId: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_published", ["isPublished", "createdAt"]),

  // ============================================
  // EXPERIENCE SYSTEM
  // ============================================

  // Experience Events - tracks XP grants to prevent farming
  experienceEvents: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("post_view"), // 1-3 XP, once per post per day
      v.literal("news_read"), // 2 XP, once per news per day
      v.literal("reaction"), // 1 XP, first reaction on post (ever)
      v.literal("comment"), // 2-3 XP, max 5 per day
      v.literal("time_on_site"), // 3-10 XP per 10 mins
    ),
    referenceId: v.optional(v.string()), // postId for views/reactions, null for time
    xpGranted: v.number(),
    date: v.string(), // "YYYY-MM-DD" for daily limits
    createdAt: v.number(),
  })
    .index("by_user_date", ["userId", "date"])
    .index("by_user_type_date", ["userId", "type", "date"])
    .index("by_user_type_ref", ["userId", "type", "referenceId"]),

  // Time tracking sessions for XP
  timeTrackingSessions: defineTable({
    userId: v.id("users"),
    sessionStart: v.number(),
    lastHeartbeat: v.number(),
    totalMinutes: v.number(), // Minutes tracked this session
    xpGrantedThisSession: v.number(),
    date: v.string(), // "YYYY-MM-DD"
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "date"]),

  // ============================================
  // ADMIN SETTINGS (singleton)
  // ============================================

  adminSettings: defineTable({
    // YouTube PubSubHubbub integration
    youtube: v.optional(
      v.object({
        channelId: v.string(),
        autoPublish: v.boolean(),
        defaultLabels: v.array(v.string()),
        defaultVisibility: v.union(
          v.literal("public"),
          v.literal("members"),
          v.literal("tier1"),
          v.literal("tier2"),
        ),
        subscriptionExpiresAt: v.optional(v.number()),
        lastVideoProcessed: v.optional(v.string()),
        callbackSecret: v.optional(v.string()),
      }),
    ),

    // Discord blog integration
    discord: v.optional(
      v.object({
        // Auth preference - whether to post as user account or bot
        useUserToken: v.boolean(), // false = bot token, true = user token from env

        // Master enable/disable
        botEnabled: v.boolean(),

        // Channel config per content type
        channels: v.object({
          article: v.optional(
            v.object({
              channelId: v.string(),
              channelType: v.union(v.literal("forum"), v.literal("text")),
              webhookUrl: v.optional(v.string()), // For text channels only
            }),
          ),
          video: v.optional(
            v.object({
              channelId: v.string(),
              channelType: v.union(v.literal("forum"), v.literal("text")),
              webhookUrl: v.optional(v.string()),
            }),
          ),
          news: v.optional(
            v.object({
              channelId: v.string(),
              channelType: v.union(v.literal("forum"), v.literal("text")),
              webhookUrl: v.optional(v.string()),
            }),
          ),
        }),

        // Comment webhook - sends notifications when users comment on posts
        commentWebhook: v.optional(
          v.object({
            webhookUrl: v.string(),
            enabled: v.boolean(),
          }),
        ),
      }),
    ),

    updatedAt: v.number(),
  }),

  // ============================================
  // PROJECTS PORTFOLIO
  // ============================================

  // Technologies - for project badges
  technologies: defineTable({
    key: v.string(), // "REACT", "TYPESCRIPT"
    label: v.string(), // "React", "TypeScript"
    color: v.string(), // hex color
  }).index("by_key", ["key"]),

  // Roles - for project badges
  roles: defineTable({
    key: v.string(), // "DEVELOPER", "LEAD_DEVELOPER"
    label: v.string(), // "Developer", "Lead Developer"
    description: v.string(), // Tooltip description
    color: v.string(), // hex color
  }).index("by_key", ["key"]),

  // Projects - portfolio projects
  projects: defineTable({
    slug: v.string(),
    name: v.string(),
    shortDescription: v.string(),
    background: v.string(), // CSS gradient
    logoUrl: v.optional(v.string()), // path to static asset
    logoDarkUrl: v.optional(v.string()), // dark mode variant
    logoWidth: v.optional(v.number()),
    logoHeight: v.optional(v.number()),
    logoIncludesName: v.optional(v.boolean()), // false = show title alongside logo
    status: v.union(v.literal("active"), v.literal("inactive")),
    maintained: v.boolean(),
    timeline: v.object({
      startYear: v.number(),
      endYear: v.optional(v.number()),
      startMonth: v.optional(v.number()),
      endMonth: v.optional(v.number()),
    }),
    links: v.optional(
      v.object({
        github: v.optional(v.string()),
        website: v.optional(v.string()),
      }),
    ),
    technologies: v.array(v.string()), // keys referencing technologies table
    roles: v.array(v.string()), // keys referencing roles table
    contentSections: v.array(
      v.object({
        id: v.string(),
        emoji: v.optional(v.string()),
        header: v.string(),
        subheader: v.optional(v.string()),
        subheaderColor: v.optional(v.string()),
        text: v.string(),
      }),
    ),
    order: v.number(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status"])
    .index("by_order", ["order"]),

  // ============================================
  // CONTENT HIGHLIGHTS (Medium-style highlighting)
  // ============================================

  // Text highlights on blog posts - with text anchoring for resilience
  contentHighlights: defineTable({
    postId: v.id("blogPosts"),
    userId: v.id("users"),

    // Text anchoring (survives content edits)
    highlightedText: v.string(), // The selected text
    prefix: v.string(), // ~80 chars before highlight
    suffix: v.string(), // ~80 chars after highlight

    // If true, this is a reaction-only anchor (no visible highlight mark)
    isReactionOnly: v.optional(v.boolean()),

    createdAt: v.number(),
  })
    .index("by_post", ["postId"])
    .index("by_user", ["userId", "createdAt"]) // Query all user's highlights (sorted by date)
    .index("by_user_post", ["userId", "postId"]), // Check user's highlights on specific post

  // Inline comments on highlights
  contentComments: defineTable({
    highlightId: v.id("contentHighlights"),
    postId: v.id("blogPosts"), // Denormalized for efficient queries
    authorId: v.id("users"),
    content: v.string(), // Markdown content
    parentId: v.optional(v.id("contentComments")), // Threading support
    isEdited: v.boolean(),
    isDeleted: v.boolean(),
    createdAt: v.number(),
    editedAt: v.optional(v.number()),
  })
    .index("by_highlight", ["highlightId"])
    .index("by_post", ["postId"])
    .index("by_author", ["authorId"]),

  // Inline reactions on highlights (emoji style)
  contentReactions: defineTable({
    highlightId: v.id("contentHighlights"),
    postId: v.id("blogPosts"), // Denormalized
    userId: v.id("users"),
    type: v.union(
      v.literal("fire"),
      v.literal("heart"),
      v.literal("plus1"),
      v.literal("eyes"),
      v.literal("question"),
    ),
    createdAt: v.number(),
  })
    .index("by_highlight", ["highlightId"])
    .index("by_post", ["postId"])
    .index("by_user_highlight", ["userId", "highlightId"]),

  // ============================================
  // User Profile Feed System
  // ============================================

  // User feed posts - supports unlimited threading depth
  userFeedPosts: defineTable({
    // Core content
    authorId: v.id("users"), // Who wrote this post
    profileUserId: v.id("users"), // Whose profile this appears on
    content: v.string(), // Limited markdown (bold, italics only)

    // Threading (unlimited depth, Reddit-style)
    parentId: v.optional(v.id("userFeedPosts")), // Parent post (for replies)
    rootId: v.optional(v.id("userFeedPosts")), // Root post of thread (denormalized)
    replyDepth: v.number(), // 0 = root, 1+ = nested reply
    replyCount: v.number(), // Direct reply count (denormalized)

    // Media attachments (Vercel Blob)
    media: v.optional(
      v.array(
        v.object({
          type: v.union(v.literal("image"), v.literal("video")),
          url: v.string(),
          filename: v.string(),
          mimeType: v.string(),
          fileSize: v.number(),
          width: v.optional(v.number()),
          height: v.optional(v.number()),
        }),
      ),
    ),

    // Resharing support
    repostOfPostId: v.optional(v.id("blogPosts")), // Learn post being shared
    repostOfFeedId: v.optional(v.id("userFeedPosts")), // Feed post being shared

    // Moderation
    moderationScore: v.optional(v.number()), // 0-1 from AI scoring
    moderationFlags: v.optional(v.array(v.string())), // ["spam", "toxic", etc.]
    isHidden: v.boolean(), // Hidden by moderation
    isDeleted: v.boolean(), // Soft delete

    // Timestamps
    createdAt: v.number(),
    editedAt: v.optional(v.number()),
  })
    .index("by_profile", ["profileUserId", "isDeleted", "createdAt"])
    .index("by_profile_root", ["profileUserId", "parentId", "isDeleted", "createdAt"]) // Root posts only
    .index("by_author", ["authorId", "createdAt"])
    .index("by_parent", ["parentId", "createdAt"])
    .index("by_root", ["rootId", "createdAt"]),

  // Pending feed contributions (for approval mode)
  pendingFeedPosts: defineTable({
    profileUserId: v.id("users"), // Whose profile this would appear on
    authorId: v.id("users"), // Who submitted
    content: v.string(),
    parentId: v.optional(v.id("userFeedPosts")), // If replying to existing post
    media: v.optional(
      v.array(
        v.object({
          type: v.union(v.literal("image"), v.literal("video")),
          url: v.string(),
          filename: v.string(),
          mimeType: v.string(),
          fileSize: v.number(),
          width: v.optional(v.number()),
          height: v.optional(v.number()),
        }),
      ),
    ),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    rejectReason: v.optional(v.string()),
    createdAt: v.number(),
    reviewedAt: v.optional(v.number()),
  })
    .index("by_profile_status", ["profileUserId", "status", "createdAt"])
    .index("by_author", ["authorId", "createdAt"]),

  // User feed reactions (likes on feed posts)
  userFeedReactions: defineTable({
    postId: v.id("userFeedPosts"),
    userId: v.id("users"),
    type: v.union(v.literal("like"), v.literal("heart"), v.literal("fire")),
    createdAt: v.number(),
  })
    .index("by_post", ["postId"])
    .index("by_user_post", ["userId", "postId"]),
});
