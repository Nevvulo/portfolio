import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

// ============================================
// USERS
// ============================================

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    clerkId: varchar("clerk_id", { length: 255 }).notNull().unique(),
    discordId: varchar("discord_id", { length: 255 }),
    fluxerId: varchar("fluxer_id", { length: 255 }),
    username: varchar("username", { length: 255 }).unique(),
    displayName: varchar("display_name", { length: 255 }).notNull(),
    avatarUrl: text("avatar_url"),
    tier: varchar("tier", { length: 20 }).notNull().default("free"), // free, tier1, tier2
    tierValidUntil: timestamp("tier_valid_until"),
    isCreator: boolean("is_creator").notNull().default(false),
    role: integer("role").default(0), // 0 = normal, 1 = staff, 2 = creator-only
    status: varchar("status", { length: 20 }).notNull().default("offline"), // online, offline, away
    lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),

    // Notification preferences
    emailDigest: varchar("email_digest", { length: 20 }).notNull().default("none"), // daily, weekly, none
    inAppNotifications: boolean("in_app_notifications").notNull().default(true),

    // Profile
    bannerUrl: text("banner_url"),
    bannerFocalY: integer("banner_focal_y"),
    bio: varchar("bio", { length: 200 }),

    // Supporter status
    discordHighestRole: jsonb("discord_highest_role"), // { id, name, color, position }
    twitchSubTier: integer("twitch_sub_tier"), // 1, 2, 3
    discordBooster: boolean("discord_booster"),
    clerkPlan: varchar("clerk_plan", { length: 50 }),
    clerkPlanStatus: varchar("clerk_plan_status", { length: 50 }),
    founderNumber: integer("founder_number"), // 1-10

    supporterSyncedAt: timestamp("supporter_synced_at"),

    // Connection usernames
    discordUsername: varchar("discord_username", { length: 255 }),
    twitchUsername: varchar("twitch_username", { length: 255 }),

    // Roblox linking
    robloxUserId: varchar("roblox_user_id", { length: 255 }),
    robloxUsername: varchar("roblox_username", { length: 255 }),
    robloxVerifiedAt: timestamp("roblox_verified_at"),

    // Moderation
    isBanned: boolean("is_banned").default(false),
    banReason: text("ban_reason"),
    bannedAt: timestamp("banned_at"),
    kickedAt: timestamp("kicked_at"),

    // Experience/Level system (single source — no separate userStats table)
    level: integer("level").default(1),
    experience: integer("experience").default(0),
    totalExperience: integer("total_experience").default(0),

    // Profile links (Linktree-style)
    profileLinks: jsonb("profile_links"), // Array<{ type, serviceKey?, url, title? }>

    // User feed settings
    feedPrivacy: varchar("feed_privacy", { length: 20 }).default("everyone"), // everyone, approval, owner_only

    // Credits page
    showOnCredits: boolean("show_on_credits").default(false),
    isContributor: boolean("is_contributor").default(false),

    // Super Legend service linking
    linkedServices: jsonb("linked_services"), // Array<{ slug, serviceUserId?, serviceUsername?, linkedAt }>

    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("users_clerk_id_idx").on(table.clerkId),
    index("users_discord_id_idx").on(table.discordId),
    index("users_fluxer_id_idx").on(table.fluxerId),
    index("users_username_idx").on(table.username),
    index("users_status_idx").on(table.status),
    index("users_roblox_user_id_idx").on(table.robloxUserId),
  ],
);

// ============================================
// NOTIFICATIONS
// ============================================

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 50 }).notNull(), // mention, reply, new_content, comment_reply, etc.
    referenceType: varchar("reference_type", { length: 50 }), // blogComment, blogPost, feedPost, etc.
    referenceId: varchar("reference_id", { length: 255 }),
    channelId: varchar("channel_id", { length: 255 }),
    title: varchar("title", { length: 500 }).notNull(),
    body: text("body").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("notifications_user_created_idx").on(table.userId, table.createdAt),
    index("notifications_user_unread_idx").on(table.userId, table.isRead),
  ],
);

// ============================================
// BLOG / LEARN SECTION
// ============================================

export const blogPosts = pgTable(
  "blog_posts",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description").notNull(),
    body: text("body"), // MDX content — stored inline (no separate content table)
    contentType: varchar("content_type", { length: 20 }).notNull(), // article, video, news

    // Media
    coverImage: text("cover_image"),
    coverAuthor: varchar("cover_author", { length: 255 }),
    coverAuthorUrl: text("cover_author_url"),
    coverGradientIntensity: integer("cover_gradient_intensity"),
    youtubeId: varchar("youtube_id", { length: 50 }),

    // Author
    authorId: integer("author_id")
      .notNull()
      .references(() => users.id),
    collaborators: jsonb("collaborators"), // Array<number> (user IDs)
    labels: jsonb("labels").notNull().default([]), // Array<string>
    difficulty: varchar("difficulty", { length: 20 }), // beginner, intermediate, advanced
    readTimeMins: integer("read_time_mins"),
    keyIdeas: jsonb("key_ideas"), // Array<string>
    location: varchar("location", { length: 255 }),

    // AI disclosure
    aiDisclosureStatus: varchar("ai_disclosure_status", { length: 20 }), // none, llm-assisted, llm-reviewed

    // Visibility
    status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, published, archived
    visibility: varchar("visibility", { length: 20 }).notNull().default("public"), // public, members, tier1, tier2

    // Bento layout
    bentoSize: varchar("bento_size", { length: 20 }).notNull().default("medium"), // small, medium, large, banner, featured
    bentoOrder: integer("bento_order").notNull().default(0),

    // External links
    mediumUrl: text("medium_url"),
    hashnodeUrl: text("hashnode_url"),
    devToUrl: text("dev_to_url"),
    discussionId: varchar("discussion_id", { length: 255 }),
    discussionNo: integer("discussion_no"),

    // Discord integration
    discordThreadId: varchar("discord_thread_id", { length: 255 }),
    discordMessageId: varchar("discord_message_id", { length: 255 }),
    discordChannelId: varchar("discord_channel_id", { length: 255 }),

    // Analytics
    viewCount: integer("view_count").notNull().default(0),

    // Timestamps
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [
    uniqueIndex("blog_posts_slug_idx").on(table.slug),
    index("blog_posts_status_published_idx").on(table.status, table.publishedAt),
    index("blog_posts_author_idx").on(table.authorId),
    index("blog_posts_visibility_status_idx").on(table.visibility, table.status),
    index("blog_posts_content_type_status_idx").on(table.contentType, table.status),
    index("blog_posts_bento_order_idx").on(table.bentoOrder),
    index("blog_posts_discord_thread_idx").on(table.discordThreadId),
  ],
);

export const blogViews = pgTable(
  "blog_views",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => blogPosts.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    viewedAt: timestamp("viewed_at").notNull().defaultNow(),
  },
  (table) => [
    index("blog_views_post_idx").on(table.postId),
    index("blog_views_user_idx").on(table.userId),
    uniqueIndex("blog_views_user_post_idx").on(table.userId, table.postId),
  ],
);

export const blogComments = pgTable(
  "blog_comments",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => blogPosts.id, { onDelete: "cascade" }),
    authorId: integer("author_id").references(() => users.id, { onDelete: "set null" }),
    content: text("content").notNull(),
    parentId: integer("parent_id"), // self-referencing FK (set below via relations)
    isEdited: boolean("is_edited").notNull().default(false),
    isDeleted: boolean("is_deleted").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    editedAt: timestamp("edited_at"),

    // Discord sync
    discordMessageId: varchar("discord_message_id", { length: 255 }),
    discordAuthor: jsonb("discord_author"), // { id, username, discriminator?, avatarUrl? }
    source: varchar("source", { length: 20 }).default("website"), // website, discord
  },
  (table) => [
    index("blog_comments_post_idx").on(table.postId, table.createdAt),
    index("blog_comments_author_idx").on(table.authorId),
    index("blog_comments_parent_idx").on(table.parentId),
    index("blog_comments_discord_msg_idx").on(table.discordMessageId),
  ],
);

export const blogReactions = pgTable(
  "blog_reactions",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => blogPosts.id, { onDelete: "cascade" }),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    ip: varchar("ip", { length: 45 }),
    type: varchar("type", { length: 20 }).notNull(), // like, helpful, insightful
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("blog_reactions_post_idx").on(table.postId),
    index("blog_reactions_user_post_idx").on(table.userId, table.postId),
    index("blog_reactions_user_idx").on(table.userId, table.createdAt),
    index("blog_reactions_ip_post_idx").on(table.ip, table.postId),
  ],
);

export const blogInteractions = pgTable(
  "blog_interactions",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => blogPosts.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    score: real("score").notNull().default(0),
    lastInteraction: timestamp("last_interaction").notNull().defaultNow(),
  },
  (table) => [
    index("blog_interactions_user_score_idx").on(table.userId, table.score),
    index("blog_interactions_post_idx").on(table.postId),
  ],
);

export const articleWatchTime = pgTable(
  "article_watch_time",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => blogPosts.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    totalSeconds: integer("total_seconds").notNull().default(0),
    lastHeartbeat: timestamp("last_heartbeat").notNull().defaultNow(),
    sessionId: varchar("session_id", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("article_watch_time_user_idx").on(table.userId),
    index("article_watch_time_post_idx").on(table.postId),
    uniqueIndex("article_watch_time_user_post_idx").on(table.userId, table.postId),
  ],
);

export const blogCommentReports = pgTable(
  "blog_comment_reports",
  {
    id: serial("id").primaryKey(),
    commentId: integer("comment_id")
      .notNull()
      .references(() => blogComments.id, { onDelete: "cascade" }),
    reporterId: integer("reporter_id")
      .notNull()
      .references(() => users.id),
    reason: text("reason"),
    status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, reviewed, dismissed
    createdAt: timestamp("created_at").notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at"),
  },
  (table) => [
    index("blog_comment_reports_comment_idx").on(table.commentId),
    index("blog_comment_reports_status_idx").on(table.status, table.createdAt),
  ],
);

export const blogCommentReactions = pgTable(
  "blog_comment_reactions",
  {
    id: serial("id").primaryKey(),
    commentId: integer("comment_id")
      .notNull()
      .references(() => blogComments.id, { onDelete: "cascade" }),
    postId: integer("post_id")
      .notNull()
      .references(() => blogPosts.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 20 }).notNull(), // heart, thumbs_up, eyes, fire, thinking, laugh
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("blog_comment_reactions_comment_idx").on(table.commentId),
    index("blog_comment_reactions_post_idx").on(table.postId),
    index("blog_comment_reactions_user_comment_idx").on(table.userId, table.commentId),
  ],
);

export const contentReports = pgTable(
  "content_reports",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => blogPosts.id, { onDelete: "cascade" }),
    reporterId: integer("reporter_id")
      .notNull()
      .references(() => users.id),
    category: varchar("category", { length: 30 }).notNull(), // content_quality, factual_error, dislike, etc.
    reason: text("reason"),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at"),
  },
  (table) => [
    index("content_reports_post_idx").on(table.postId),
    index("content_reports_status_idx").on(table.status, table.createdAt),
    index("content_reports_reporter_idx").on(table.reporterId),
  ],
);

// News Items
export const newsItems = pgTable(
  "news_items",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 500 }).notNull(),
    content: varchar("content", { length: 500 }).notNull(),
    authorId: integer("author_id")
      .notNull()
      .references(() => users.id),
    isPublished: boolean("is_published").notNull().default(false),
    sentToDiscord: boolean("sent_to_discord").notNull().default(false),
    discordMessageId: varchar("discord_message_id", { length: 255 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("news_items_published_idx").on(table.isPublished, table.createdAt)],
);

// ============================================
// EXPERIENCE SYSTEM
// ============================================

export const experienceEvents = pgTable(
  "experience_events",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 30 }).notNull(), // post_view, news_read, reaction, comment, time_on_site
    referenceId: varchar("reference_id", { length: 255 }),
    xpGranted: integer("xp_granted").notNull(),
    date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("experience_events_user_date_idx").on(table.userId, table.date),
    index("experience_events_user_type_date_idx").on(table.userId, table.type, table.date),
    index("experience_events_user_type_ref_idx").on(table.userId, table.type, table.referenceId),
  ],
);

export const timeTrackingSessions = pgTable(
  "time_tracking_sessions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sessionStart: timestamp("session_start").notNull().defaultNow(),
    lastHeartbeat: timestamp("last_heartbeat").notNull().defaultNow(),
    totalMinutes: integer("total_minutes").notNull().default(0),
    xpGrantedThisSession: integer("xp_granted_this_session").notNull().default(0),
    date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  },
  (table) => [
    index("time_tracking_sessions_user_idx").on(table.userId),
    index("time_tracking_sessions_user_date_idx").on(table.userId, table.date),
  ],
);

// ============================================
// ADMIN SETTINGS (singleton-ish)
// ============================================

export const adminSettings = pgTable("admin_settings", {
  id: serial("id").primaryKey(),
  youtube: jsonb("youtube"), // YouTube PubSubHubbub config
  discord: jsonb("discord"), // Discord integration config
  stream: jsonb("stream"), // Stream-o-meter and schedule
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const discordEvents = pgTable(
  "discord_events",
  {
    id: serial("id").primaryKey(),
    eventId: varchar("event_id", { length: 255 }).notNull().unique(),
    guildId: varchar("guild_id", { length: 255 }).notNull(),
    name: varchar("name", { length: 500 }).notNull(),
    description: text("description"),
    scheduledStartTime: timestamp("scheduled_start_time").notNull(),
    scheduledEndTime: timestamp("scheduled_end_time"),
    entityType: varchar("entity_type", { length: 20 }).notNull(), // stage_instance, voice, external
    status: varchar("status", { length: 20 }).notNull(), // scheduled, active, completed, canceled
    coverImageUrl: text("cover_image_url"),
    location: varchar("location", { length: 500 }),
    userCount: integer("user_count"),
    syncedAt: timestamp("synced_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("discord_events_event_id_idx").on(table.eventId),
    index("discord_events_start_time_idx").on(table.scheduledStartTime),
    index("discord_events_status_idx").on(table.status),
  ],
);

// ============================================
// PROJECTS PORTFOLIO
// ============================================

export const technologies = pgTable(
  "technologies",
  {
    id: serial("id").primaryKey(),
    key: varchar("key", { length: 100 }).notNull().unique(),
    label: varchar("label", { length: 255 }).notNull(),
    color: varchar("color", { length: 20 }).notNull(),
  },
  (table) => [uniqueIndex("technologies_key_idx").on(table.key)],
);

export const roles = pgTable(
  "roles",
  {
    id: serial("id").primaryKey(),
    key: varchar("key", { length: 100 }).notNull().unique(),
    label: varchar("label", { length: 255 }).notNull(),
    description: text("description").notNull(),
    color: varchar("color", { length: 20 }).notNull(),
  },
  (table) => [uniqueIndex("roles_key_idx").on(table.key)],
);

export const projects = pgTable(
  "projects",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    shortDescription: text("short_description").notNull(),
    background: text("background").notNull(), // CSS gradient
    logoUrl: text("logo_url"),
    logoDarkUrl: text("logo_dark_url"),
    logoWidth: integer("logo_width"),
    logoHeight: integer("logo_height"),
    logoIncludesName: boolean("logo_includes_name"),
    status: varchar("status", { length: 20 }).notNull().default("active"), // active, inactive
    maintained: boolean("maintained").notNull().default(true),
    timeline: jsonb("timeline").notNull(), // { startYear, endYear?, startMonth?, endMonth? }
    links: jsonb("links"), // { github?, website? }
    technologies: jsonb("technologies").notNull().default([]), // Array<string> (keys)
    roles: jsonb("project_roles").notNull().default([]), // Array<string> (keys)
    contentSections: jsonb("content_sections").notNull().default([]), // Array<{ id, emoji?, header, subheader?, ... }>
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [
    uniqueIndex("projects_slug_idx").on(table.slug),
    index("projects_status_idx").on(table.status),
    index("projects_order_idx").on(table.displayOrder),
  ],
);

// ============================================
// SOFTWARE & GAMES
// ============================================

export const software = pgTable(
  "software",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    shortDescription: text("short_description").notNull(),
    longDescription: text("long_description"),
    type: varchar("type", { length: 20 }).notNull(), // app, tool, library, game, website, bot
    category: varchar("category", { length: 20 }).notNull(), // open-source, commercial, personal, game
    status: varchar("status", { length: 20 }).notNull().default("active"), // active, coming-soon, archived, beta
    logoUrl: text("logo_url"),
    bannerUrl: text("banner_url"),
    background: text("background"), // CSS gradient
    links: jsonb("links"), // { github?, website?, roblox?, discord?, appStore?, playStore? }
    technologies: jsonb("technologies").notNull().default([]), // Array<string>
    platforms: jsonb("platforms").notNull().default([]), // Array<string>
    stats: jsonb("stats"), // { players?, downloads?, stars? }
    robloxUniverseId: varchar("roblox_universe_id", { length: 255 }),
    displayOrder: integer("display_order").notNull().default(0),
    isFeatured: boolean("is_featured").notNull().default(false),
    accentColor: varchar("accent_color", { length: 20 }),
    displaySize: varchar("display_size", { length: 20 }), // featured, medium, small
    openExternally: boolean("open_externally").default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [
    uniqueIndex("software_slug_idx").on(table.slug),
    index("software_type_status_idx").on(table.type, table.status),
    index("software_category_status_idx").on(table.category, table.status),
    index("software_status_idx").on(table.status),
    index("software_order_idx").on(table.displayOrder),
    index("software_featured_idx").on(table.isFeatured, table.displayOrder),
  ],
);

// ============================================
// FEATURED CONTENT
// ============================================

export const featuredContent = pgTable(
  "featured_content",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 500 }).notNull(),
    subtitle: varchar("subtitle", { length: 500 }),
    description: text("description"),
    type: varchar("type", { length: 20 }).notNull(), // article, video, software, game, project, external
    linkUrl: text("link_url").notNull(),
    imageUrl: text("image_url"),
    background: text("background"),
    targetId: varchar("target_id", { length: 255 }),
    slot: varchar("slot", { length: 20 }).notNull(), // hero, carousel, spotlight
    displayOrder: integer("display_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    startsAt: timestamp("starts_at"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("featured_content_slot_idx").on(table.slot, table.isActive, table.displayOrder),
    index("featured_content_active_idx").on(table.isActive, table.displayOrder),
  ],
);

// ============================================
// CONTENT HIGHLIGHTS (Medium-style highlighting)
// ============================================

export const contentHighlights = pgTable(
  "content_highlights",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => blogPosts.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    highlightedText: text("highlighted_text").notNull(),
    prefix: text("prefix").notNull(),
    suffix: text("suffix").notNull(),
    isReactionOnly: boolean("is_reaction_only").default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("content_highlights_post_idx").on(table.postId),
    index("content_highlights_user_idx").on(table.userId, table.createdAt),
    index("content_highlights_user_post_idx").on(table.userId, table.postId),
  ],
);

export const contentComments = pgTable(
  "content_comments",
  {
    id: serial("id").primaryKey(),
    highlightId: integer("highlight_id")
      .notNull()
      .references(() => contentHighlights.id, { onDelete: "cascade" }),
    postId: integer("post_id")
      .notNull()
      .references(() => blogPosts.id, { onDelete: "cascade" }),
    authorId: integer("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    parentId: integer("parent_id"), // self-ref
    isEdited: boolean("is_edited").notNull().default(false),
    isDeleted: boolean("is_deleted").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    editedAt: timestamp("edited_at"),
  },
  (table) => [
    index("content_comments_highlight_idx").on(table.highlightId),
    index("content_comments_post_idx").on(table.postId),
    index("content_comments_author_idx").on(table.authorId),
  ],
);

export const contentReactions = pgTable(
  "content_reactions",
  {
    id: serial("id").primaryKey(),
    highlightId: integer("highlight_id")
      .notNull()
      .references(() => contentHighlights.id, { onDelete: "cascade" }),
    postId: integer("post_id")
      .notNull()
      .references(() => blogPosts.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 20 }).notNull(), // fire, heart, plus1, eyes, question
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("content_reactions_highlight_idx").on(table.highlightId),
    index("content_reactions_post_idx").on(table.postId),
    index("content_reactions_user_highlight_idx").on(table.userId, table.highlightId),
  ],
);

// ============================================
// USER PROFILE FEED SYSTEM
// ============================================

export const userFeedPosts = pgTable(
  "user_feed_posts",
  {
    id: serial("id").primaryKey(),
    authorId: integer("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    profileUserId: integer("profile_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    parentId: integer("parent_id"),
    rootId: integer("root_id"),
    replyDepth: integer("reply_depth").notNull().default(0),
    replyCount: integer("reply_count").notNull().default(0),
    media: jsonb("media"), // Array<{ type, url, filename, mimeType, fileSize, width?, height? }>
    repostOfPostId: integer("repost_of_post_id").references(() => blogPosts.id),
    repostOfFeedId: integer("repost_of_feed_id"),
    moderationScore: real("moderation_score"),
    moderationFlags: jsonb("moderation_flags"),
    isHidden: boolean("is_hidden").notNull().default(false),
    isDeleted: boolean("is_deleted").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    editedAt: timestamp("edited_at"),
  },
  (table) => [
    index("user_feed_posts_profile_idx").on(
      table.profileUserId,
      table.isDeleted,
      table.createdAt,
    ),
    index("user_feed_posts_profile_root_idx").on(
      table.profileUserId,
      table.parentId,
      table.isDeleted,
      table.createdAt,
    ),
    index("user_feed_posts_author_idx").on(table.authorId, table.createdAt),
    index("user_feed_posts_parent_idx").on(table.parentId, table.createdAt),
    index("user_feed_posts_root_idx").on(table.rootId, table.createdAt),
  ],
);

export const pendingFeedPosts = pgTable(
  "pending_feed_posts",
  {
    id: serial("id").primaryKey(),
    profileUserId: integer("profile_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    authorId: integer("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    parentId: integer("parent_id").references(() => userFeedPosts.id),
    media: jsonb("media"),
    status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, approved, rejected
    rejectReason: text("reject_reason"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    reviewedAt: timestamp("reviewed_at"),
  },
  (table) => [
    index("pending_feed_posts_profile_status_idx").on(
      table.profileUserId,
      table.status,
      table.createdAt,
    ),
    index("pending_feed_posts_author_idx").on(table.authorId, table.createdAt),
  ],
);

export const userFeedReactions = pgTable(
  "user_feed_reactions",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => userFeedPosts.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 20 }).notNull(), // like, heart, fire
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("user_feed_reactions_post_idx").on(table.postId),
    uniqueIndex("user_feed_reactions_user_post_idx").on(table.userId, table.postId),
  ],
);

// ============================================
// VAULT - Downloadable files
// ============================================

export const vaultFiles = pgTable(
  "vault_files",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    fileType: varchar("file_type", { length: 20 }).notNull(), // pdf, video, document, image, archive
    fileUrl: text("file_url").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    filename: varchar("filename", { length: 500 }).notNull(),
    mimeType: varchar("mime_type", { length: 255 }).notNull(),
    fileSize: integer("file_size").notNull(),
    pageCount: integer("page_count"),
    duration: integer("duration"),
    visibility: varchar("visibility", { length: 20 }).notNull().default("public"),
    displayOrder: integer("display_order").notNull().default(0),
    authorId: integer("author_id")
      .notNull()
      .references(() => users.id),
    downloadCount: integer("download_count").notNull().default(0),
    isArchived: boolean("is_archived").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("vault_files_slug_idx").on(table.slug),
    index("vault_files_visibility_idx").on(table.visibility, table.isArchived),
    index("vault_files_order_idx").on(table.displayOrder),
  ],
);

export const vaultDownloadLogs = pgTable(
  "vault_download_logs",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    fileId: integer("file_id")
      .notNull()
      .references(() => vaultFiles.id, { onDelete: "cascade" }),
    downloadedAt: timestamp("downloaded_at").notNull().defaultNow(),
    userTier: varchar("user_tier", { length: 20 }).notNull(),
  },
  (table) => [
    index("vault_download_logs_user_idx").on(table.userId, table.downloadedAt),
    index("vault_download_logs_file_idx").on(table.fileId, table.downloadedAt),
  ],
);

// ============================================
// SUPPORTER ADMIN
// ============================================

export const supporterNotifications = pgTable(
  "supporter_notifications",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 500 }).notNull(),
    message: text("message").notNull(),
    targetTier: varchar("target_tier", { length: 20 }).notNull(), // tier1, tier2, all
    sentAt: timestamp("sent_at").notNull().defaultNow(),
    sentBy: integer("sent_by")
      .notNull()
      .references(() => users.id),
    recipientCount: integer("recipient_count").notNull().default(0),
    discordWebhookSent: boolean("discord_webhook_sent").notNull().default(false),
  },
  (table) => [index("supporter_notifications_sent_idx").on(table.sentAt)],
);

// ============================================
// NETVULO LIVE STATS
// ============================================

export const liveStats = pgTable(
  "live_stats",
  {
    id: serial("id").primaryKey(),
    key: varchar("key", { length: 255 }).notNull().unique(),
    value: jsonb("value"),
    source: varchar("source", { length: 255 }).notNull(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("live_stats_key_idx").on(table.key)],
);

export const netvuloEvents = pgTable(
  "netvulo_events",
  {
    id: serial("id").primaryKey(),
    eventType: varchar("event_type", { length: 255 }).notNull(),
    eventId: varchar("event_id", { length: 255 }).notNull(),
    source: varchar("source", { length: 255 }).notNull(),
    data: jsonb("data"),
    receivedAt: timestamp("received_at").notNull().defaultNow(),
  },
  (table) => [index("netvulo_events_type_idx").on(table.eventType, table.receivedAt)],
);

// ============================================
// WIDGET INTERACTION TRACKING
// ============================================

export const widgetInteractions = pgTable(
  "widget_interactions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    widgetId: varchar("widget_id", { length: 255 }).notNull(),
    interactionCount: integer("interaction_count").notNull().default(0),
    lastInteractedAt: timestamp("last_interacted_at").notNull().defaultNow(),
  },
  (table) => [
    index("widget_interactions_user_idx").on(table.userId),
    uniqueIndex("widget_interactions_user_widget_idx").on(table.userId, table.widgetId),
  ],
);

// ============================================
// ROBLOX ACCOUNT LINKING
// ============================================

export const robloxVerifications = pgTable(
  "roblox_verifications",
  {
    id: serial("id").primaryKey(),
    clerkId: varchar("clerk_id", { length: 255 }).notNull(),
    robloxUserId: varchar("roblox_user_id", { length: 255 }).notNull(),
    robloxUsername: varchar("roblox_username", { length: 255 }).notNull(),
    verificationCode: varchar("verification_code", { length: 255 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, verified, expired, failed
    createdAt: timestamp("created_at").notNull().defaultNow(),
    expiresAt: timestamp("expires_at").notNull(),
    verifiedAt: timestamp("verified_at"),
  },
  (table) => [
    index("roblox_verifications_clerk_status_idx").on(table.clerkId, table.status),
    index("roblox_verifications_code_idx").on(table.verificationCode),
    index("roblox_verifications_roblox_user_idx").on(table.robloxUserId),
  ],
);

// ============================================
// INVENTORY & REWARDS SYSTEM
// ============================================

export const inventoryItems = pgTable(
  "inventory_items",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description").notNull(),
    iconUrl: text("icon_url"),
    previewUrl: text("preview_url"),
    backgroundColor: varchar("background_color", { length: 20 }),
    rarity: varchar("rarity", { length: 20 }).notNull(), // common, uncommon, rare, epic, legendary
    type: varchar("type", { length: 20 }).notNull(), // cosmetic, wallpaper, consumable, download, code, role, collectible
    services: jsonb("services"), // Array<string> — service slugs
    isStackable: boolean("is_stackable").notNull().default(false),
    isConsumable: boolean("is_consumable").notNull().default(false),
    maxPerUser: integer("max_per_user"),
    assetUrl: text("asset_url"),
    code: text("code"),
    metadata: jsonb("metadata"),
    onClaimEffects: jsonb("on_claim_effects"), // Array<{ service, action, payload? }>
    isArchived: boolean("is_archived").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("inventory_items_slug_idx").on(table.slug),
    index("inventory_items_rarity_idx").on(table.rarity),
    index("inventory_items_type_idx").on(table.type),
    index("inventory_items_archived_idx").on(table.isArchived),
  ],
);

export const userInventory = pgTable(
  "user_inventory",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    itemId: integer("item_id")
      .notNull()
      .references(() => inventoryItems.id, { onDelete: "cascade" }),
    source: varchar("source", { length: 30 }).notNull(), // direct_send, lootbox, tier_claim, purchase, event, migration
    sourceReferenceId: varchar("source_reference_id", { length: 255 }),
    quantity: integer("quantity").notNull().default(1),
    isUsed: boolean("is_used").notNull().default(false),
    usedAt: timestamp("used_at"),
    acquiredAt: timestamp("acquired_at").notNull().defaultNow(),
    expiresAt: timestamp("expires_at"),
    metadata: jsonb("metadata"),
  },
  (table) => [
    index("user_inventory_user_idx").on(table.userId),
    index("user_inventory_user_item_idx").on(table.userId, table.itemId),
    index("user_inventory_item_idx").on(table.itemId),
  ],
);

export const lootboxTemplates = pgTable(
  "lootbox_templates",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    items: jsonb("items").notNull(), // Array of item IDs or { itemId, weight?, guaranteed } objects
    isActive: boolean("is_active").notNull().default(true),
    iconUrl: text("icon_url"),
    boxStyle: varchar("box_style", { length: 20 }), // mystery_box, chest, envelope, crate
    accentColor: varchar("accent_color", { length: 20 }),
    rollCount: integer("roll_count"),
    targetTiers: jsonb("target_tiers"), // Array<string>
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("lootbox_templates_active_idx").on(table.isActive)],
);

export const userLootboxes = pgTable(
  "user_lootboxes",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    templateId: integer("template_id").references(() => lootboxTemplates.id),
    customName: varchar("custom_name", { length: 255 }),
    customItems: jsonb("custom_items"), // Array of inventory_item IDs
    isOpened: boolean("is_opened").notNull().default(false),
    openedAt: timestamp("opened_at"),
    receivedItemIds: jsonb("received_item_ids"), // Array of inventory_item IDs
    boxStyle: varchar("box_style", { length: 20 }).notNull(), // mystery_box, chest, envelope, crate
    displayName: varchar("display_name", { length: 255 }).notNull(),
    deliveredAt: timestamp("delivered_at").notNull().defaultNow(),
    expiresAt: timestamp("expires_at"),
  },
  (table) => [
    index("user_lootboxes_user_idx").on(table.userId, table.isOpened, table.deliveredAt),
    index("user_lootboxes_template_idx").on(table.templateId),
  ],
);

export const tierClaimables = pgTable(
  "tier_claimables",
  {
    id: serial("id").primaryKey(),
    itemId: integer("item_id")
      .notNull()
      .references(() => inventoryItems.id, { onDelete: "cascade" }),
    requiredTier: varchar("required_tier", { length: 20 }).notNull(), // tier1, tier2
    displayOrder: integer("display_order").notNull().default(0),
    headline: varchar("headline", { length: 255 }),
    isActive: boolean("is_active").notNull().default(true),
    availableFrom: timestamp("available_from"),
    availableUntil: timestamp("available_until"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("tier_claimables_tier_idx").on(table.requiredTier, table.isActive, table.displayOrder),
    index("tier_claimables_item_idx").on(table.itemId),
  ],
);

export const tierClaimRecords = pgTable(
  "tier_claim_records",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tierClaimableId: integer("tier_claimable_id")
      .notNull()
      .references(() => tierClaimables.id, { onDelete: "cascade" }),
    claimedAt: timestamp("claimed_at").notNull().defaultNow(),
  },
  (table) => [
    index("tier_claim_records_user_idx").on(table.userId),
    uniqueIndex("tier_claim_records_user_claimable_idx").on(table.userId, table.tierClaimableId),
  ],
);

// ============================================
// RELATIONS (for Drizzle relational queries)
// ============================================

export const usersRelations = relations(users, ({ many }) => ({
  notifications: many(notifications),
  blogPosts: many(blogPosts),
  blogComments: many(blogComments),
  blogReactions: many(blogReactions),
  experienceEvents: many(experienceEvents),
  timeTrackingSessions: many(timeTrackingSessions),
  articleWatchTime: many(articleWatchTime),
  contentHighlights: many(contentHighlights),
  userFeedPosts: many(userFeedPosts, { relationName: "authorFeedPosts" }),
  profileFeedPosts: many(userFeedPosts, { relationName: "profileFeedPosts" }),
  widgetInteractions: many(widgetInteractions),
  userInventory: many(userInventory),
  userLootboxes: many(userLootboxes),
}));

export const blogPostsRelations = relations(blogPosts, ({ one, many }) => ({
  author: one(users, {
    fields: [blogPosts.authorId],
    references: [users.id],
  }),
  views: many(blogViews),
  comments: many(blogComments),
  reactions: many(blogReactions),
  highlights: many(contentHighlights),
  watchTime: many(articleWatchTime),
}));

export const blogCommentsRelations = relations(blogComments, ({ one, many }) => ({
  post: one(blogPosts, {
    fields: [blogComments.postId],
    references: [blogPosts.id],
  }),
  author: one(users, {
    fields: [blogComments.authorId],
    references: [users.id],
  }),
  parent: one(blogComments, {
    fields: [blogComments.parentId],
    references: [blogComments.id],
    relationName: "commentReplies",
  }),
  replies: many(blogComments, { relationName: "commentReplies" }),
  reactions: many(blogCommentReactions),
}));

export const blogReactionsRelations = relations(blogReactions, ({ one }) => ({
  post: one(blogPosts, {
    fields: [blogReactions.postId],
    references: [blogPosts.id],
  }),
  user: one(users, {
    fields: [blogReactions.userId],
    references: [users.id],
  }),
}));

export const blogCommentReactionsRelations = relations(blogCommentReactions, ({ one }) => ({
  comment: one(blogComments, {
    fields: [blogCommentReactions.commentId],
    references: [blogComments.id],
  }),
  post: one(blogPosts, {
    fields: [blogCommentReactions.postId],
    references: [blogPosts.id],
  }),
  user: one(users, {
    fields: [blogCommentReactions.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const experienceEventsRelations = relations(experienceEvents, ({ one }) => ({
  user: one(users, {
    fields: [experienceEvents.userId],
    references: [users.id],
  }),
}));

export const articleWatchTimeRelations = relations(articleWatchTime, ({ one }) => ({
  user: one(users, {
    fields: [articleWatchTime.userId],
    references: [users.id],
  }),
  post: one(blogPosts, {
    fields: [articleWatchTime.postId],
    references: [blogPosts.id],
  }),
}));

export const contentHighlightsRelations = relations(contentHighlights, ({ one, many }) => ({
  post: one(blogPosts, {
    fields: [contentHighlights.postId],
    references: [blogPosts.id],
  }),
  user: one(users, {
    fields: [contentHighlights.userId],
    references: [users.id],
  }),
  comments: many(contentComments),
  reactions: many(contentReactions),
}));

export const contentCommentsRelations = relations(contentComments, ({ one }) => ({
  highlight: one(contentHighlights, {
    fields: [contentComments.highlightId],
    references: [contentHighlights.id],
  }),
  post: one(blogPosts, {
    fields: [contentComments.postId],
    references: [blogPosts.id],
  }),
  author: one(users, {
    fields: [contentComments.authorId],
    references: [users.id],
  }),
}));

export const contentReactionsRelations = relations(contentReactions, ({ one }) => ({
  highlight: one(contentHighlights, {
    fields: [contentReactions.highlightId],
    references: [contentHighlights.id],
  }),
  user: one(users, {
    fields: [contentReactions.userId],
    references: [users.id],
  }),
}));

export const userFeedPostsRelations = relations(userFeedPosts, ({ one, many }) => ({
  author: one(users, {
    fields: [userFeedPosts.authorId],
    references: [users.id],
    relationName: "authorFeedPosts",
  }),
  profileUser: one(users, {
    fields: [userFeedPosts.profileUserId],
    references: [users.id],
    relationName: "profileFeedPosts",
  }),
  reactions: many(userFeedReactions),
}));

export const userFeedReactionsRelations = relations(userFeedReactions, ({ one }) => ({
  post: one(userFeedPosts, {
    fields: [userFeedReactions.postId],
    references: [userFeedPosts.id],
  }),
  user: one(users, {
    fields: [userFeedReactions.userId],
    references: [users.id],
  }),
}));

export const vaultFilesRelations = relations(vaultFiles, ({ one, many }) => ({
  author: one(users, {
    fields: [vaultFiles.authorId],
    references: [users.id],
  }),
  downloads: many(vaultDownloadLogs),
}));

export const vaultDownloadLogsRelations = relations(vaultDownloadLogs, ({ one }) => ({
  user: one(users, {
    fields: [vaultDownloadLogs.userId],
    references: [users.id],
  }),
  file: one(vaultFiles, {
    fields: [vaultDownloadLogs.fileId],
    references: [vaultFiles.id],
  }),
}));

export const userInventoryRelations = relations(userInventory, ({ one }) => ({
  user: one(users, {
    fields: [userInventory.userId],
    references: [users.id],
  }),
  item: one(inventoryItems, {
    fields: [userInventory.itemId],
    references: [inventoryItems.id],
  }),
}));

export const userLootboxesRelations = relations(userLootboxes, ({ one }) => ({
  user: one(users, {
    fields: [userLootboxes.userId],
    references: [users.id],
  }),
  template: one(lootboxTemplates, {
    fields: [userLootboxes.templateId],
    references: [lootboxTemplates.id],
  }),
}));

export const tierClaimablesRelations = relations(tierClaimables, ({ one, many }) => ({
  item: one(inventoryItems, {
    fields: [tierClaimables.itemId],
    references: [inventoryItems.id],
  }),
  claims: many(tierClaimRecords),
}));

export const tierClaimRecordsRelations = relations(tierClaimRecords, ({ one }) => ({
  user: one(users, {
    fields: [tierClaimRecords.userId],
    references: [users.id],
  }),
  claimable: one(tierClaimables, {
    fields: [tierClaimRecords.tierClaimableId],
    references: [tierClaimables.id],
  }),
}));
