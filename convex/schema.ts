import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table - extends Clerk user data with site-wide fields
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
    // Founder status - first 10 subscribers get permanent founder badge (1-10)
    founderNumber: v.optional(
      v.union(
        v.literal(1),
        v.literal(2),
        v.literal(3),
        v.literal(4),
        v.literal(5),
        v.literal(6),
        v.literal(7),
        v.literal(8),
        v.literal(9),
        v.literal(10),
      ),
    ),
    supporterSyncedAt: v.optional(v.number()),
    // Connection usernames (for displaying in other users' popouts)
    discordUsername: v.optional(v.string()),
    twitchUsername: v.optional(v.string()),
    // Roblox account linking (manual verification - not OAuth)
    robloxUserId: v.optional(v.string()), // Roblox user ID (numeric string)
    robloxUsername: v.optional(v.string()), // Roblox display name
    robloxVerifiedAt: v.optional(v.number()), // When verification completed
    // Moderation fields
    isBanned: v.optional(v.boolean()),
    banReason: v.optional(v.string()),
    bannedAt: v.optional(v.number()),
    kickedAt: v.optional(v.number()),
    // Experience/Level system
    level: v.optional(v.number()), // Current level (starts at 1)
    experience: v.optional(v.number()), // XP towards next level
    totalExperience: v.optional(v.number()), // All-time XP earned
    // Profile links (Linktree-style)
    profileLinks: v.optional(v.array(v.object({
      type: v.union(v.literal("service"), v.literal("custom")),
      serviceKey: v.optional(v.string()),
      url: v.string(),
      title: v.optional(v.string()),
    }))),
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
    // Super Legend service linking - array of linked service slugs
    linkedServices: v.optional(v.array(v.object({
      slug: v.string(), // Service slug (e.g., "golfquest", "nevi")
      serviceUserId: v.optional(v.string()), // Service-specific user ID
      serviceUsername: v.optional(v.string()), // Display name on service
      linkedAt: v.number(), // When the link was established
    }))),
    createdAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_discordId", ["discordId"])
    .index("by_username", ["username"])
    .index("by_status", ["status"])
    .index("by_robloxUserId", ["robloxUserId"]),

  // User Stats - separated from users table to avoid reactive cascades on XP grants
  // level/experience/totalExperience on users table are DEPRECATED - use this table instead
  userStats: defineTable({
    userId: v.id("users"),
    clerkId: v.string(),
    totalExperience: v.number(),
    level: v.number(),
    experience: v.number(), // XP towards next level
  })
    .index("by_userId", ["userId"])
    .index("by_clerkId", ["clerkId"]),

  // Notifications
  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("mention"),
      v.literal("reply"),
      v.literal("new_content"),
      v.literal("comment_reply"),
      v.literal("collaborator_added"),
      v.literal("comment_reaction"),
      v.literal("feed_reply"),
      v.literal("feed_reaction"),
      // Inventory system
      v.literal("inventory_item"),
      v.literal("lootbox_received"),
      v.literal("tier_claimable_available"),
      // Legacy types (existing data)
      v.literal("reward"),
      v.literal("giveaway_win"),
      v.literal("channel_message"),
    ),
    referenceType: v.optional(
      v.union(
        v.literal("blogComment"),
        v.literal("blogPost"),
        v.literal("feedPost"),
        // Legacy types (existing data)
        v.literal("message"),
        v.literal("contentPost"),
        v.literal("reward"),
      ),
    ),
    referenceId: v.optional(v.string()),
    channelId: v.optional(v.string()), // Legacy field from lounge notifications
    title: v.string(),
    body: v.string(),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId", "createdAt"])
    .index("by_user_unread", ["userId", "isRead"]),

  // Discord → Clerk ID mapping cache (synced from Upstash)
  // This allows Convex to look up website users from Discord IDs
  discordClerkMapping: defineTable({
    discordId: v.string(),
    clerkId: v.string(),
    updatedAt: v.number(),
  })
    .index("by_discordId", ["discordId"])
    .index("by_clerkId", ["clerkId"]),

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
    clerkId: v.optional(v.string()),
    totalSeconds: v.number(),
    lastHeartbeat: v.number(),
    sessionId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_post", ["postId"])
    .index("by_user_post", ["userId", "postId"])
    .index("by_clerkId", ["clerkId"]),

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
    clerkId: v.optional(v.string()),
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
    .index("by_user_type_ref", ["userId", "type", "referenceId"])
    .index("by_clerkId_date", ["clerkId", "date"]),

  // Time tracking sessions for XP
  timeTrackingSessions: defineTable({
    userId: v.id("users"),
    clerkId: v.optional(v.string()),
    sessionStart: v.number(),
    lastHeartbeat: v.number(),
    totalMinutes: v.number(), // Minutes tracked this session
    xpGrantedThisSession: v.number(),
    date: v.string(), // "YYYY-MM-DD"
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "date"])
    .index("by_clerkId_date", ["clerkId", "date"]),

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

    // Stream settings - stream-o-meter and schedule
    stream: v.optional(
      v.object({
        // Stream-o-meter: 0-100 chance of streaming today
        streamChance: v.number(),
        streamChanceMessage: v.optional(v.string()), // Optional custom message
        lastUpdated: v.number(),
        // Rough schedule (day of week -> typical stream times)
        schedule: v.optional(
          v.array(
            v.object({
              day: v.union(
                v.literal("monday"),
                v.literal("tuesday"),
                v.literal("wednesday"),
                v.literal("thursday"),
                v.literal("friday"),
                v.literal("saturday"),
                v.literal("sunday"),
              ),
              startTime: v.optional(v.string()), // "HH:MM" format
              endTime: v.optional(v.string()), // "HH:MM" format
              likelihood: v.union(v.literal("likely"), v.literal("maybe"), v.literal("unlikely")),
            }),
          ),
        ),
      }),
    ),

    updatedAt: v.number(),
  }),

  // Discord Scheduled Events cache
  discordEvents: defineTable({
    eventId: v.string(),
    guildId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    scheduledStartTime: v.number(),
    scheduledEndTime: v.optional(v.number()),
    entityType: v.union(v.literal("stage_instance"), v.literal("voice"), v.literal("external")),
    status: v.union(
      v.literal("scheduled"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("canceled"),
    ),
    coverImageUrl: v.optional(v.string()),
    location: v.optional(v.string()),
    userCount: v.optional(v.number()),
    syncedAt: v.number(),
  })
    .index("by_eventId", ["eventId"])
    .index("by_startTime", ["scheduledStartTime"])
    .index("by_status", ["status"]),

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
  // SOFTWARE & GAMES (Nevulo Studios)
  // ============================================

  // Software projects, tools, games, and apps
  software: defineTable({
    slug: v.string(),
    name: v.string(),
    shortDescription: v.string(),
    longDescription: v.optional(v.string()), // Markdown
    type: v.union(
      v.literal("app"),
      v.literal("tool"),
      v.literal("library"),
      v.literal("game"),
      v.literal("website"),
      v.literal("bot"),
    ),
    category: v.union(
      v.literal("open-source"),
      v.literal("commercial"),
      v.literal("personal"),
      v.literal("game"),
    ),
    status: v.union(
      v.literal("active"),
      v.literal("coming-soon"),
      v.literal("archived"),
      v.literal("beta"),
    ),
    logoUrl: v.optional(v.string()),
    bannerUrl: v.optional(v.string()),
    background: v.optional(v.string()), // CSS gradient
    links: v.optional(
      v.object({
        github: v.optional(v.string()),
        website: v.optional(v.string()),
        roblox: v.optional(v.string()),
        discord: v.optional(v.string()),
        appStore: v.optional(v.string()),
        playStore: v.optional(v.string()),
      }),
    ),
    technologies: v.array(v.string()),
    platforms: v.array(v.string()), // "web", "roblox", "desktop", "mobile"
    stats: v.optional(
      v.object({
        players: v.optional(v.number()),
        downloads: v.optional(v.number()),
        stars: v.optional(v.number()),
      }),
    ),
    robloxUniverseId: v.optional(v.string()), // For fetching visits from Roblox API
    order: v.number(),
    isFeatured: v.boolean(),
    accentColor: v.optional(v.string()), // Hex color for card accent on homepage (e.g. "#5865f2")
    displaySize: v.optional(v.union(v.literal("featured"), v.literal("medium"), v.literal("small"))), // Controls grid span on homepage
    openExternally: v.optional(v.boolean()), // If true, links go to website/roblox instead of /software/[slug] page
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_slug", ["slug"])
    .index("by_type", ["type", "status"])
    .index("by_category", ["category", "status"])
    .index("by_status", ["status"])
    .index("by_order", ["order"])
    .index("by_featured", ["isFeatured", "order"]),

  // ============================================
  // FEATURED CONTENT (Homepage carousels & spotlights)
  // ============================================

  // Admin-configurable featured items for homepage
  featuredContent: defineTable({
    title: v.string(),
    subtitle: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("article"),
      v.literal("video"),
      v.literal("software"),
      v.literal("game"),
      v.literal("project"),
      v.literal("external"),
    ),
    linkUrl: v.string(), // Where it links to
    imageUrl: v.optional(v.string()),
    background: v.optional(v.string()), // CSS gradient
    targetId: v.optional(v.string()), // Optional reference to blogPost/software slug
    slot: v.union(
      v.literal("hero"), // Main hero carousel
      v.literal("carousel"), // Secondary carousel
      v.literal("spotlight"), // Featured spotlight section
    ),
    order: v.number(),
    isActive: v.boolean(),
    startsAt: v.optional(v.number()), // Optional scheduling
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_slot", ["slot", "isActive", "order"])
    .index("by_active", ["isActive", "order"]),

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

  // ============================================
  // VAULT - Downloadable files with tier-restricted access
  // ============================================

  vaultFiles: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    slug: v.string(),
    fileType: v.union(
      v.literal("pdf"),
      v.literal("video"),
      v.literal("document"),
      v.literal("image"),
      v.literal("archive"),
    ),
    fileUrl: v.string(),
    thumbnailUrl: v.optional(v.string()),
    filename: v.string(),
    mimeType: v.string(),
    fileSize: v.number(),
    pageCount: v.optional(v.number()),
    duration: v.optional(v.number()),
    visibility: v.union(
      v.literal("public"),
      v.literal("members"),
      v.literal("tier1"),
      v.literal("tier2"),
    ),
    order: v.number(),
    authorId: v.id("users"),
    downloadCount: v.number(),
    isArchived: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_visibility", ["visibility", "isArchived"])
    .index("by_order", ["order"]),

  // ============================================
  // SUPPORTER ADMIN - Super Legend Management
  // ============================================

  // Track vault file downloads for analytics
  vaultDownloadLogs: defineTable({
    userId: v.id("users"),
    fileId: v.id("vaultFiles"),
    downloadedAt: v.number(),
    userTier: v.string(),
  })
    .index("by_user", ["userId", "downloadedAt"])
    .index("by_file", ["fileId", "downloadedAt"]),

  // Custom notifications sent to subscribers
  supporterNotifications: defineTable({
    title: v.string(),
    message: v.string(),
    targetTier: v.union(v.literal("tier1"), v.literal("tier2"), v.literal("all")),
    sentAt: v.number(),
    sentBy: v.id("users"),
    recipientCount: v.number(),
    discordWebhookSent: v.boolean(),
  }).index("by_sent", ["sentAt"]),

  // ============================================
  // NETVULO LIVE STATS
  // ============================================

  // Live stats from Netvulo event broker (player counts, stream status, etc.)
  liveStats: defineTable({
    key: v.string(), // "golfquest_players", "stream_status", etc.
    value: v.any(), // Flexible value (number, object, etc.)
    source: v.string(), // Service that sent the update
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  // Netvulo event log (optional - for debugging/history)
  netvuloEvents: defineTable({
    eventType: v.string(),
    eventId: v.string(),
    source: v.string(),
    data: v.any(),
    receivedAt: v.number(),
  }).index("by_type", ["eventType", "receivedAt"]),

  // ============================================
  // ROBLOX ACCOUNT LINKING
  // ============================================

  // ============================================
  // WIDGET INTERACTION TRACKING
  // ============================================

  widgetInteractions: defineTable({
    userId: v.id("users"),
    clerkId: v.optional(v.string()),
    widgetId: v.string(),
    interactionCount: v.number(),
    lastInteractedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_widget", ["userId", "widgetId"])
    .index("by_clerkId", ["clerkId"]),

  // Pending Roblox verification requests
  robloxVerifications: defineTable({
    clerkId: v.string(), // User requesting verification
    robloxUserId: v.string(), // Roblox user ID to verify
    robloxUsername: v.string(), // Roblox username at time of request
    verificationCode: v.string(), // Code user must add to profile
    status: v.union(
      v.literal("pending"),
      v.literal("verified"),
      v.literal("expired"),
      v.literal("failed")
    ),
    createdAt: v.number(),
    expiresAt: v.number(), // Verification expires after 15 minutes
    verifiedAt: v.optional(v.number()),
  })
    .index("by_clerkId", ["clerkId", "status"])
    .index("by_code", ["verificationCode"])
    .index("by_robloxUserId", ["robloxUserId"]),

  // ============================================
  // INVENTORY & REWARDS SYSTEM
  // ============================================

  // Global item catalog (admin-defined)
  inventoryItems: defineTable({
    slug: v.string(), // Unique ID: "golden-crown"
    name: v.string(),
    description: v.string(),
    iconUrl: v.optional(v.string()), // Icon/preview image
    previewUrl: v.optional(v.string()), // Larger preview
    backgroundColor: v.optional(v.string()), // Hex for card bg
    rarity: v.union(
      v.literal("common"),
      v.literal("uncommon"),
      v.literal("rare"),
      v.literal("epic"),
      v.literal("legendary"),
    ),
    type: v.union(
      v.literal("cosmetic"),
      v.literal("wallpaper"),
      v.literal("consumable"),
      v.literal("download"),
      v.literal("code"),
      v.literal("role"),
      v.literal("collectible"),
    ),
    category: v.optional(v.string()), // DEPRECATED: use services instead
    services: v.optional(v.array(v.string())), // Service slugs: ["nevi", "golfquest"]. Empty/undefined = all services
    isStackable: v.boolean(),
    isConsumable: v.boolean(),
    maxPerUser: v.optional(v.number()),
    assetUrl: v.optional(v.string()), // Download URL
    code: v.optional(v.string()), // For code-type items
    metadata: v.optional(v.any()), // Arbitrary (role IDs, effect configs, GQ item mappings)
    onClaimEffects: v.optional(
      v.array(
        v.object({
          service: v.string(),
          action: v.string(),
          payload: v.optional(v.any()),
        }),
      ),
    ),
    isArchived: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_rarity", ["rarity"])
    .index("by_type", ["type"])
    .index("by_archived", ["isArchived"]),

  // Items a user owns
  userInventory: defineTable({
    userId: v.id("users"),
    itemId: v.id("inventoryItems"),
    source: v.union(
      v.literal("direct_send"),
      v.literal("lootbox"),
      v.literal("tier_claim"),
      v.literal("purchase"),
      v.literal("event"),
      v.literal("migration"),
    ),
    sourceReferenceId: v.optional(v.string()), // Lootbox ID, tier claimable ID, etc.
    quantity: v.number(), // 1 for non-stackable
    isUsed: v.boolean(), // For consumables
    usedAt: v.optional(v.number()),
    acquiredAt: v.number(),
    expiresAt: v.optional(v.number()),
    metadata: v.optional(v.any()),
  })
    .index("by_user", ["userId"])
    .index("by_user_item", ["userId", "itemId"])
    .index("by_item", ["itemId"]),

  // Admin-created lootbox definitions (simplified: all items guaranteed, tier2 only)
  lootboxTemplates: defineTable({
    name: v.string(), // "January 2026 Legend Loot"
    description: v.optional(v.string()),
    // New format: array of item IDs (all granted on open)
    // Old format had: array of {itemId, weight?, guaranteed} objects — kept via v.any() compat
    items: v.any(),
    isActive: v.boolean(),
    createdAt: v.number(),
    // DEPRECATED fields (kept for existing data backward compat)
    iconUrl: v.optional(v.string()),
    boxStyle: v.optional(v.union(
      v.literal("mystery_box"),
      v.literal("chest"),
      v.literal("envelope"),
      v.literal("crate"),
    )),
    accentColor: v.optional(v.string()),
    rollCount: v.optional(v.number()),
    targetTiers: v.optional(v.array(v.string())),
  }).index("by_active", ["isActive"]),

  // Lootboxes in user's possession
  userLootboxes: defineTable({
    userId: v.id("users"),
    templateId: v.optional(v.id("lootboxTemplates")), // null for custom one-offs
    customName: v.optional(v.string()),
    customItems: v.optional(v.array(v.id("inventoryItems"))),
    isOpened: v.boolean(),
    openedAt: v.optional(v.number()),
    receivedItemIds: v.optional(v.array(v.id("inventoryItems"))), // Resolved items after opening
    boxStyle: v.union(
      v.literal("mystery_box"),
      v.literal("chest"),
      v.literal("envelope"),
      v.literal("crate"),
    ),
    displayName: v.string(),
    deliveredAt: v.number(),
    expiresAt: v.optional(v.number()),
  })
    .index("by_user", ["userId", "isOpened", "deliveredAt"])
    .index("by_template", ["templateId"]),

  // Permanent items available to claim by tier
  tierClaimables: defineTable({
    itemId: v.id("inventoryItems"),
    requiredTier: v.union(v.literal("tier1"), v.literal("tier2")),
    displayOrder: v.number(),
    headline: v.optional(v.string()), // "Claim your crown!"
    isActive: v.boolean(),
    availableFrom: v.optional(v.number()),
    availableUntil: v.optional(v.number()), // null = permanent
    createdAt: v.number(),
  })
    .index("by_tier", ["requiredTier", "isActive", "displayOrder"])
    .index("by_item", ["itemId"]),

  // Track who claimed what
  tierClaimRecords: defineTable({
    userId: v.id("users"),
    tierClaimableId: v.id("tierClaimables"),
    claimedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_claimable", ["userId", "tierClaimableId"]),
});
