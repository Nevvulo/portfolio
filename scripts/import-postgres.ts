/**
 * Import Convex JSON exports into Postgres via Drizzle.
 *
 * Usage:
 *   DATABASE_URL=<your_neon_url> bun scripts/import-postgres.ts
 *
 * Reads JSON files from ./exports/ directory.
 * Builds an ID mapping from Convex document IDs → Postgres serial IDs.
 */

import { readFileSync, existsSync } from "node:fs";
import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/db/schema";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql, { schema });

const EXPORT_DIR = "./exports";

// ID mapping: convexId → postgresId
const idMap = {
  users: new Map<string, number>(),
  blogPosts: new Map<string, number>(),
  blogComments: new Map<string, number>(),
  projects: new Map<string, number>(),
  software: new Map<string, number>(),
  inventoryItems: new Map<string, number>(),
  contentHighlights: new Map<string, number>(),
  userFeedPosts: new Map<string, number>(),
  vaultFiles: new Map<string, number>(),
  lootboxTemplates: new Map<string, number>(),
  tierClaimables: new Map<string, number>(),
};

function loadExport(tableName: string): unknown[] {
  const path = `${EXPORT_DIR}/${tableName}.json`;
  if (!existsSync(path)) {
    console.warn(`  ${path} not found, skipping`);
    return [];
  }
  return JSON.parse(readFileSync(path, "utf-8"));
}

function convexTimestamp(ts: number | undefined): Date | undefined {
  if (ts == null) return undefined;
  return new Date(ts);
}

async function importUsers() {
  const data = loadExport("users") as any[];
  console.log(`Importing ${data.length} users...`);

  for (const doc of data) {
    const [row] = await db
      .insert(schema.users)
      .values({
        clerkId: doc.clerkId,
        discordId: doc.discordId,
        username: doc.username,
        displayName: doc.displayName,
        avatarUrl: doc.avatarUrl,
        tier: doc.tier || "free",
        tierValidUntil: convexTimestamp(doc.tierValidUntil),
        isCreator: doc.isCreator || false,
        role: doc.role || 0,
        status: doc.status || "offline",
        lastSeenAt: convexTimestamp(doc.lastSeenAt) || new Date(),
        emailDigest: doc.notificationPreferences?.emailDigest || "none",
        inAppNotifications: doc.notificationPreferences?.inAppNotifications ?? true,
        bannerUrl: doc.bannerUrl,
        bannerFocalY: doc.bannerFocalY,
        bio: doc.bio,
        discordHighestRole: doc.discordHighestRole,
        twitchSubTier: doc.twitchSubTier,
        discordBooster: doc.discordBooster,
        clerkPlan: doc.clerkPlan,
        clerkPlanStatus: doc.clerkPlanStatus,
        founderNumber: doc.founderNumber,
        supporterSyncedAt: convexTimestamp(doc.supporterSyncedAt),
        discordUsername: doc.discordUsername,
        twitchUsername: doc.twitchUsername,
        robloxUserId: doc.robloxUserId,
        robloxUsername: doc.robloxUsername,
        robloxVerifiedAt: convexTimestamp(doc.robloxVerifiedAt),
        isBanned: doc.isBanned || false,
        banReason: doc.banReason,
        bannedAt: convexTimestamp(doc.bannedAt),
        kickedAt: convexTimestamp(doc.kickedAt),
        // Merge XP from users + userStats (prefer userStats if available)
        level: doc.level || 1,
        experience: doc.experience || 0,
        totalExperience: doc.totalExperience || 0,
        profileLinks: doc.profileLinks,
        feedPrivacy: doc.feedPrivacy || "everyone",
        showOnCredits: doc.showOnCredits || false,
        isContributor: doc.isContributor || false,
        linkedServices: doc.linkedServices,
        createdAt: convexTimestamp(doc.createdAt) || new Date(),
      })
      .returning({ id: schema.users.id });

    if (row) {
      idMap.users.set(doc._id, row.id);
    }
  }

  // Overlay userStats XP values (they're the authoritative source)
  const statsData = loadExport("userStats") as any[];
  for (const stat of statsData) {
    const pgUserId = idMap.users.get(stat.userId);
    if (pgUserId) {
      await db
        .update(schema.users)
        .set({
          totalExperience: stat.totalExperience,
          level: stat.level,
          experience: stat.experience,
        })
        .where(eq(schema.users.id, pgUserId));
    }
  }
}

async function importBlogPosts() {
  const posts = loadExport("blogPosts") as any[];
  const contentDocs = loadExport("blogPostContent") as any[];
  console.log(`Importing ${posts.length} blog posts...`);

  // Build content map
  const contentMap = new Map<string, string>();
  for (const c of contentDocs) {
    contentMap.set(c.postId, c.content);
  }

  for (const doc of posts) {
    const authorId = idMap.users.get(doc.authorId);
    if (!authorId) {
      console.warn(`  Skipping post ${doc.slug}: author ${doc.authorId} not found`);
      continue;
    }

    // Get body: prefer blogPostContent, fall back to inline content
    const body = contentMap.get(doc._id) || doc.content || "";

    const [row] = await db
      .insert(schema.blogPosts)
      .values({
        slug: doc.slug,
        title: doc.title,
        description: doc.description,
        body,
        contentType: doc.contentType,
        coverImage: doc.coverImage,
        coverAuthor: doc.coverAuthor,
        coverAuthorUrl: doc.coverAuthorUrl,
        coverGradientIntensity: doc.coverGradientIntensity,
        youtubeId: doc.youtubeId,
        authorId,
        collaborators: doc.collaborators?.map((c: string) => idMap.users.get(c)).filter(Boolean),
        labels: doc.labels || [],
        difficulty: doc.difficulty,
        readTimeMins: doc.readTimeMins,
        keyIdeas: doc.keyIdeas,
        location: doc.location,
        aiDisclosureStatus: doc.aiDisclosureStatus,
        status: doc.status,
        visibility: doc.visibility,
        bentoSize: doc.bentoSize || "medium",
        bentoOrder: doc.bentoOrder ?? 0,
        mediumUrl: doc.mediumUrl,
        hashnodeUrl: doc.hashnodeUrl,
        devToUrl: doc.devToUrl,
        discussionId: doc.discussionId,
        discussionNo: doc.discussionNo,
        discordThreadId: doc.discordThreadId,
        discordMessageId: doc.discordMessageId,
        discordChannelId: doc.discordChannelId,
        viewCount: doc.viewCount || 0,
        publishedAt: convexTimestamp(doc.publishedAt),
        createdAt: convexTimestamp(doc.createdAt) || new Date(),
        updatedAt: convexTimestamp(doc.updatedAt),
      })
      .returning({ id: schema.blogPosts.id });

    if (row) {
      idMap.blogPosts.set(doc._id, row.id);
    }
  }
}

async function importProjects() {
  const data = loadExport("projects") as any[];
  console.log(`Importing ${data.length} projects...`);

  for (const doc of data) {
    const [row] = await db
      .insert(schema.projects)
      .values({
        slug: doc.slug,
        name: doc.name,
        shortDescription: doc.shortDescription,
        background: doc.background,
        logoUrl: doc.logoUrl,
        logoDarkUrl: doc.logoDarkUrl,
        logoWidth: doc.logoWidth,
        logoHeight: doc.logoHeight,
        logoIncludesName: doc.logoIncludesName,
        status: doc.status,
        maintained: doc.maintained,
        timeline: doc.timeline,
        links: doc.links,
        technologies: doc.technologies || [],
        roles: doc.roles || [],
        contentSections: doc.contentSections || [],
        displayOrder: doc.order ?? 0,
        createdAt: convexTimestamp(doc.createdAt) || new Date(),
        updatedAt: convexTimestamp(doc.updatedAt),
      })
      .returning({ id: schema.projects.id });

    if (row) {
      idMap.projects.set(doc._id, row.id);
    }
  }
}

async function importSoftware() {
  const data = loadExport("software") as any[];
  console.log(`Importing ${data.length} software entries...`);

  for (const doc of data) {
    const [row] = await db
      .insert(schema.software)
      .values({
        slug: doc.slug,
        name: doc.name,
        shortDescription: doc.shortDescription,
        longDescription: doc.longDescription,
        type: doc.type,
        category: doc.category,
        status: doc.status,
        logoUrl: doc.logoUrl,
        bannerUrl: doc.bannerUrl,
        background: doc.background,
        links: doc.links,
        technologies: doc.technologies || [],
        platforms: doc.platforms || [],
        stats: doc.stats,
        robloxUniverseId: doc.robloxUniverseId,
        displayOrder: doc.order ?? 0,
        isFeatured: doc.isFeatured ?? false,
        accentColor: doc.accentColor,
        displaySize: doc.displaySize,
        openExternally: doc.openExternally,
        createdAt: convexTimestamp(doc.createdAt) || new Date(),
        updatedAt: convexTimestamp(doc.updatedAt),
      })
      .returning({ id: schema.software.id });

    if (row) {
      idMap.software.set(doc._id, row.id);
    }
  }
}

async function importBlogComments() {
  const data = loadExport("blogComments") as any[];
  console.log(`Importing ${data.length} blog comments...`);

  // First pass: insert all comments without parentId
  for (const doc of data) {
    const postId = idMap.blogPosts.get(doc.postId);
    if (!postId) continue;
    const authorId = doc.authorId ? idMap.users.get(doc.authorId) : null;

    const [row] = await db
      .insert(schema.blogComments)
      .values({
        postId,
        authorId,
        content: doc.content,
        parentId: null, // Set in second pass
        isEdited: doc.isEdited || false,
        isDeleted: doc.isDeleted || false,
        createdAt: convexTimestamp(doc.createdAt) || new Date(),
        editedAt: convexTimestamp(doc.editedAt),
        discordMessageId: doc.discordMessageId,
        discordAuthor: doc.discordAuthor,
        source: doc.source || "website",
      })
      .returning({ id: schema.blogComments.id });

    if (row) {
      idMap.blogComments.set(doc._id, row.id);
    }
  }

  // Second pass: set parentId for replies
  for (const doc of data) {
    if (!doc.parentId) continue;
    const commentId = idMap.blogComments.get(doc._id);
    const parentId = idMap.blogComments.get(doc.parentId);
    if (commentId && parentId) {
      await db
        .update(schema.blogComments)
        .set({ parentId })
        .where(eq(schema.blogComments.id, commentId));
    }
  }
}

async function importExperienceEvents() {
  const data = loadExport("experienceEvents") as any[];
  console.log(`Importing ${data.length} experience events...`);

  for (const doc of data) {
    const userId = idMap.users.get(doc.userId);
    if (!userId) continue;

    await db.insert(schema.experienceEvents).values({
      userId,
      type: doc.type,
      referenceId: doc.referenceId,
      xpGranted: doc.xpGranted,
      date: doc.date,
      createdAt: convexTimestamp(doc.createdAt) || new Date(),
    });
  }
}

async function importBlogReactions() {
  const data = loadExport("blogReactions") as any[];
  console.log(`Importing ${data.length} blog reactions...`);

  for (const doc of data) {
    const postId = idMap.blogPosts.get(doc.postId);
    if (!postId) continue;
    const userId = doc.userId ? idMap.users.get(doc.userId) : null;

    await db.insert(schema.blogReactions).values({
      postId,
      userId,
      ip: doc.ip,
      type: doc.type,
      createdAt: convexTimestamp(doc.createdAt) || new Date(),
    });
  }
}

// ============================================
// REMAINING TABLE IMPORTS
// ============================================

async function importBlogViews() {
  const data = loadExport("blogViews") as any[];
  console.log(`Importing ${data.length} blog views...`);
  let skipped = 0;
  for (const doc of data) {
    const postId = idMap.blogPosts.get(doc.postId);
    const userId = idMap.users.get(doc.userId);
    if (!postId || !userId) { skipped++; continue; }
    await db.insert(schema.blogViews).values({
      postId,
      userId,
      viewedAt: convexTimestamp(doc.viewedAt ?? doc.createdAt) || new Date(),
    }).onConflictDoNothing();
  }
  if (skipped) console.log(`  Skipped ${skipped} orphaned blog views`);
}

async function importArticleWatchTime() {
  const data = loadExport("articleWatchTime") as any[];
  console.log(`Importing ${data.length} article watch time records...`);
  let skipped = 0;
  for (const doc of data) {
    const postId = idMap.blogPosts.get(doc.postId);
    const userId = idMap.users.get(doc.userId);
    if (!postId || !userId) { skipped++; continue; }
    await db.insert(schema.articleWatchTime).values({
      postId,
      userId,
      totalSeconds: doc.totalSeconds || 0,
      lastHeartbeat: convexTimestamp(doc.lastHeartbeat) || new Date(),
      sessionId: doc.sessionId || "migrated",
      createdAt: convexTimestamp(doc.createdAt) || new Date(),
      updatedAt: convexTimestamp(doc.updatedAt) || new Date(),
    });
  }
  if (skipped) console.log(`  Skipped ${skipped} orphaned records`);
}

async function importBlogCommentReactions() {
  const data = loadExport("blogCommentReactions") as any[];
  console.log(`Importing ${data.length} blog comment reactions...`);
  let skipped = 0;
  for (const doc of data) {
    const commentId = idMap.blogComments.get(doc.commentId);
    const postId = idMap.blogPosts.get(doc.postId);
    const userId = idMap.users.get(doc.userId);
    if (!commentId || !postId || !userId) { skipped++; continue; }
    await db.insert(schema.blogCommentReactions).values({
      commentId,
      postId,
      userId,
      type: doc.type,
      createdAt: convexTimestamp(doc.createdAt) || new Date(),
    });
  }
  if (skipped) console.log(`  Skipped ${skipped} orphaned reactions`);
}

async function importBlogInteractions() {
  const data = loadExport("blogInteractions") as any[];
  console.log(`Importing ${data.length} blog interactions...`);
  let skipped = 0;
  for (const doc of data) {
    const postId = idMap.blogPosts.get(doc.postId);
    const userId = idMap.users.get(doc.userId);
    if (!postId || !userId) { skipped++; continue; }
    await db.insert(schema.blogInteractions).values({
      postId,
      userId,
      score: doc.score || 0,
      lastInteraction: convexTimestamp(doc.lastInteraction) || new Date(),
    });
  }
  if (skipped) console.log(`  Skipped ${skipped} orphaned interactions`);
}

async function importNotifications() {
  const data = loadExport("notifications") as any[];
  console.log(`Importing ${data.length} notifications...`);
  let skipped = 0;
  for (const doc of data) {
    const userId = idMap.users.get(doc.userId);
    if (!userId) { skipped++; continue; }
    await db.insert(schema.notifications).values({
      userId,
      type: doc.type,
      referenceType: doc.referenceType,
      referenceId: doc.referenceId,
      channelId: doc.channelId,
      title: doc.title,
      body: doc.body,
      isRead: doc.isRead ?? false,
      createdAt: convexTimestamp(doc.createdAt) || new Date(),
    });
  }
  if (skipped) console.log(`  Skipped ${skipped} orphaned notifications`);
}

async function importTimeTrackingSessions() {
  const data = loadExport("timeTrackingSessions") as any[];
  console.log(`Importing ${data.length} time tracking sessions...`);
  let skipped = 0;
  for (const doc of data) {
    const userId = idMap.users.get(doc.userId);
    if (!userId) { skipped++; continue; }
    await db.insert(schema.timeTrackingSessions).values({
      userId,
      sessionStart: convexTimestamp(doc.sessionStart) || new Date(),
      lastHeartbeat: convexTimestamp(doc.lastHeartbeat) || new Date(),
      totalMinutes: doc.totalMinutes || 0,
      xpGrantedThisSession: doc.xpGrantedThisSession || 0,
      date: doc.date,
    });
  }
  if (skipped) console.log(`  Skipped ${skipped} orphaned sessions`);
}

async function importContentHighlights() {
  const data = loadExport("contentHighlights") as any[];
  console.log(`Importing ${data.length} content highlights...`);
  let skipped = 0;
  for (const doc of data) {
    const postId = idMap.blogPosts.get(doc.postId);
    const userId = idMap.users.get(doc.userId);
    if (!postId || !userId) { skipped++; continue; }
    const [row] = await db.insert(schema.contentHighlights).values({
      postId,
      userId,
      highlightedText: doc.highlightedText,
      prefix: doc.prefix,
      suffix: doc.suffix,
      isReactionOnly: doc.isReactionOnly ?? false,
      createdAt: convexTimestamp(doc.createdAt) || new Date(),
    }).returning({ id: schema.contentHighlights.id });
    if (row) idMap.contentHighlights.set(doc._id, row.id);
  }
  if (skipped) console.log(`  Skipped ${skipped} orphaned highlights`);
}

async function importContentComments() {
  const data = loadExport("contentComments") as any[];
  console.log(`Importing ${data.length} content comments...`);
  let skipped = 0;
  for (const doc of data) {
    const highlightId = idMap.contentHighlights.get(doc.highlightId);
    const postId = idMap.blogPosts.get(doc.postId);
    const authorId = idMap.users.get(doc.authorId);
    if (!highlightId || !postId || !authorId) { skipped++; continue; }
    await db.insert(schema.contentComments).values({
      highlightId,
      postId,
      authorId,
      content: doc.content,
      parentId: doc.parentId ? null : null, // TODO: self-ref mapping
      isEdited: doc.isEdited ?? false,
      isDeleted: doc.isDeleted ?? false,
      createdAt: convexTimestamp(doc.createdAt) || new Date(),
      editedAt: convexTimestamp(doc.editedAt),
    });
  }
  if (skipped) console.log(`  Skipped ${skipped} orphaned content comments`);
}

async function importContentReactions() {
  const data = loadExport("contentReactions") as any[];
  console.log(`Importing ${data.length} content reactions...`);
  let skipped = 0;
  for (const doc of data) {
    const highlightId = idMap.contentHighlights.get(doc.highlightId);
    const postId = idMap.blogPosts.get(doc.postId);
    const userId = idMap.users.get(doc.userId);
    if (!highlightId || !postId || !userId) { skipped++; continue; }
    await db.insert(schema.contentReactions).values({
      highlightId,
      postId,
      userId,
      type: doc.type,
      createdAt: convexTimestamp(doc.createdAt) || new Date(),
    });
  }
  if (skipped) console.log(`  Skipped ${skipped} orphaned content reactions`);
}

async function importTechnologies() {
  const data = loadExport("technologies") as any[];
  console.log(`Importing ${data.length} technologies...`);
  for (const doc of data) {
    await db.insert(schema.technologies).values({
      key: doc.key,
      label: doc.label,
      color: doc.color,
    }).onConflictDoNothing();
  }
}

async function importRoles() {
  const data = loadExport("roles") as any[];
  console.log(`Importing ${data.length} roles...`);
  for (const doc of data) {
    await db.insert(schema.roles).values({
      key: doc.key,
      label: doc.label,
      description: doc.description,
      color: doc.color,
    }).onConflictDoNothing();
  }
}

async function importFeaturedContent() {
  const data = loadExport("featuredContent") as any[];
  console.log(`Importing ${data.length} featured content entries...`);
  for (const doc of data) {
    await db.insert(schema.featuredContent).values({
      title: doc.title,
      subtitle: doc.subtitle,
      description: doc.description,
      type: doc.type,
      linkUrl: doc.linkUrl,
      imageUrl: doc.imageUrl,
      background: doc.background,
      targetId: doc.targetId,
      slot: doc.slot,
      displayOrder: doc.displayOrder ?? 0,
      isActive: doc.isActive ?? true,
      startsAt: convexTimestamp(doc.startsAt),
      expiresAt: convexTimestamp(doc.expiresAt),
      createdAt: convexTimestamp(doc.createdAt) || new Date(),
    });
  }
}

async function importAdminSettings() {
  const data = loadExport("adminSettings") as any[];
  console.log(`Importing ${data.length} admin settings...`);
  for (const doc of data) {
    await db.insert(schema.adminSettings).values({
      youtube: doc.youtube,
      discord: doc.discord,
      stream: doc.stream,
      updatedAt: convexTimestamp(doc.updatedAt) || new Date(),
    });
  }
}

async function importDiscordEvents() {
  const data = loadExport("discordEvents") as any[];
  console.log(`Importing ${data.length} discord events...`);
  for (const doc of data) {
    await db.insert(schema.discordEvents).values({
      eventId: doc.eventId,
      guildId: doc.guildId,
      name: doc.name,
      description: doc.description,
      scheduledStartTime: convexTimestamp(doc.scheduledStartTime) || new Date(),
      scheduledEndTime: convexTimestamp(doc.scheduledEndTime),
      entityType: doc.entityType,
      status: doc.status,
      coverImageUrl: doc.coverImageUrl,
      location: doc.location,
      userCount: doc.userCount,
      syncedAt: convexTimestamp(doc.syncedAt) || new Date(),
    }).onConflictDoNothing();
  }
}

async function importNewsItems() {
  const data = loadExport("newsItems") as any[];
  console.log(`Importing ${data.length} news items...`);
  let skipped = 0;
  for (const doc of data) {
    const authorId = idMap.users.get(doc.authorId);
    if (!authorId) { skipped++; continue; }
    await db.insert(schema.newsItems).values({
      title: doc.title,
      content: doc.content,
      authorId,
      isPublished: doc.isPublished ?? false,
      sentToDiscord: doc.sentToDiscord ?? false,
      discordMessageId: doc.discordMessageId,
      createdAt: convexTimestamp(doc.createdAt) || new Date(),
    });
  }
  if (skipped) console.log(`  Skipped ${skipped} orphaned news items`);
}

async function importBlogCommentReports() {
  const data = loadExport("blogCommentReports") as any[];
  console.log(`Importing ${data.length} comment reports...`);
  let skipped = 0;
  for (const doc of data) {
    const commentId = idMap.blogComments.get(doc.commentId);
    const reporterId = idMap.users.get(doc.reporterId);
    if (!commentId || !reporterId) { skipped++; continue; }
    await db.insert(schema.blogCommentReports).values({
      commentId,
      reporterId,
      reason: doc.reason,
      status: doc.status || "pending",
      createdAt: convexTimestamp(doc.createdAt) || new Date(),
      resolvedAt: convexTimestamp(doc.resolvedAt),
    });
  }
  if (skipped) console.log(`  Skipped ${skipped} orphaned reports`);
}

async function importContentReports() {
  const data = loadExport("contentReports") as any[];
  console.log(`Importing ${data.length} content reports...`);
  let skipped = 0;
  for (const doc of data) {
    const postId = idMap.blogPosts.get(doc.postId);
    const reporterId = idMap.users.get(doc.reporterId);
    if (!postId || !reporterId) { skipped++; continue; }
    await db.insert(schema.contentReports).values({
      postId,
      reporterId,
      category: doc.category,
      reason: doc.reason,
      status: doc.status || "pending",
      createdAt: convexTimestamp(doc.createdAt) || new Date(),
      resolvedAt: convexTimestamp(doc.resolvedAt),
    });
  }
  if (skipped) console.log(`  Skipped ${skipped} orphaned content reports`);
}

async function importUserFeedPosts() {
  const data = loadExport("userFeedPosts") as any[];
  console.log(`Importing ${data.length} user feed posts...`);
  let skipped = 0;
  for (const doc of data) {
    const authorId = idMap.users.get(doc.authorId);
    const profileUserId = idMap.users.get(doc.profileUserId);
    if (!authorId || !profileUserId) { skipped++; continue; }
    const [row] = await db.insert(schema.userFeedPosts).values({
      authorId,
      profileUserId,
      content: doc.content,
      parentId: null, // Set in second pass
      rootId: null,
      replyDepth: doc.replyDepth ?? 0,
      replyCount: doc.replyCount ?? 0,
      media: doc.media,
      repostOfPostId: doc.repostOfPostId ? idMap.blogPosts.get(doc.repostOfPostId) : null,
      repostOfFeedId: null,
      moderationScore: doc.moderationScore,
      moderationFlags: doc.moderationFlags,
      isHidden: doc.isHidden ?? false,
      isDeleted: doc.isDeleted ?? false,
      createdAt: convexTimestamp(doc.createdAt) || new Date(),
      editedAt: convexTimestamp(doc.editedAt),
    }).returning({ id: schema.userFeedPosts.id });
    if (row) idMap.userFeedPosts.set(doc._id, row.id);
  }
  // Second pass: set parentId/rootId
  for (const doc of data) {
    if (!doc.parentId && !doc.rootId) continue;
    const feedId = idMap.userFeedPosts.get(doc._id);
    if (!feedId) continue;
    const parentId = doc.parentId ? idMap.userFeedPosts.get(doc.parentId) : null;
    const rootId = doc.rootId ? idMap.userFeedPosts.get(doc.rootId) : null;
    if (parentId || rootId) {
      await db.update(schema.userFeedPosts).set({
        ...(parentId ? { parentId } : {}),
        ...(rootId ? { rootId } : {}),
      }).where(eq(schema.userFeedPosts.id, feedId));
    }
  }
  if (skipped) console.log(`  Skipped ${skipped} orphaned feed posts`);
}

async function importPendingFeedPosts() {
  const data = loadExport("pendingFeedPosts") as any[];
  console.log(`Importing ${data.length} pending feed posts...`);
  let skipped = 0;
  for (const doc of data) {
    const profileUserId = idMap.users.get(doc.profileUserId);
    const authorId = idMap.users.get(doc.authorId);
    if (!profileUserId || !authorId) { skipped++; continue; }
    await db.insert(schema.pendingFeedPosts).values({
      profileUserId,
      authorId,
      content: doc.content,
      parentId: doc.parentId ? idMap.userFeedPosts.get(doc.parentId) : null,
      media: doc.media,
      status: doc.status || "pending",
      rejectReason: doc.rejectReason,
      createdAt: convexTimestamp(doc.createdAt) || new Date(),
      reviewedAt: convexTimestamp(doc.reviewedAt),
    });
  }
  if (skipped) console.log(`  Skipped ${skipped} orphaned pending posts`);
}

async function importUserFeedReactions() {
  const data = loadExport("userFeedReactions") as any[];
  console.log(`Importing ${data.length} user feed reactions...`);
  let skipped = 0;
  for (const doc of data) {
    const postId = idMap.userFeedPosts.get(doc.postId);
    const userId = idMap.users.get(doc.userId);
    if (!postId || !userId) { skipped++; continue; }
    await db.insert(schema.userFeedReactions).values({
      postId,
      userId,
      type: doc.type,
      createdAt: convexTimestamp(doc.createdAt) || new Date(),
    }).onConflictDoNothing();
  }
  if (skipped) console.log(`  Skipped ${skipped} orphaned feed reactions`);
}

async function importVaultFiles() {
  const data = loadExport("vaultFiles") as any[];
  console.log(`Importing ${data.length} vault files...`);
  let skipped = 0;
  for (const doc of data) {
    const authorId = idMap.users.get(doc.authorId);
    if (!authorId) { skipped++; continue; }
    const [row] = await db.insert(schema.vaultFiles).values({
      title: doc.title,
      description: doc.description,
      slug: doc.slug,
      fileType: doc.fileType,
      fileUrl: doc.fileUrl,
      thumbnailUrl: doc.thumbnailUrl,
      filename: doc.filename,
      mimeType: doc.mimeType,
      fileSize: doc.fileSize,
      pageCount: doc.pageCount,
      duration: doc.duration,
      visibility: doc.visibility || "public",
      displayOrder: doc.displayOrder ?? 0,
      authorId,
      downloadCount: doc.downloadCount ?? 0,
      isArchived: doc.isArchived ?? false,
      createdAt: convexTimestamp(doc.createdAt) || new Date(),
    }).returning({ id: schema.vaultFiles.id });
    if (row) idMap.vaultFiles.set(doc._id, row.id);
  }
  if (skipped) console.log(`  Skipped ${skipped} orphaned vault files`);
}

async function importVaultDownloadLogs() {
  const data = loadExport("vaultDownloadLogs") as any[];
  console.log(`Importing ${data.length} vault download logs...`);
  let skipped = 0;
  for (const doc of data) {
    const userId = idMap.users.get(doc.userId);
    const fileId = idMap.vaultFiles.get(doc.fileId);
    if (!userId || !fileId) { skipped++; continue; }
    await db.insert(schema.vaultDownloadLogs).values({
      userId,
      fileId,
      downloadedAt: convexTimestamp(doc.downloadedAt) || new Date(),
      userTier: doc.userTier || "free",
    });
  }
  if (skipped) console.log(`  Skipped ${skipped} orphaned download logs`);
}

async function importSupporterNotifications() {
  const data = loadExport("supporterNotifications") as any[];
  console.log(`Importing ${data.length} supporter notifications...`);
  let skipped = 0;
  for (const doc of data) {
    const sentBy = idMap.users.get(doc.sentBy);
    if (!sentBy) { skipped++; continue; }
    await db.insert(schema.supporterNotifications).values({
      title: doc.title,
      message: doc.message,
      targetTier: doc.targetTier,
      sentAt: convexTimestamp(doc.sentAt) || new Date(),
      sentBy,
      recipientCount: doc.recipientCount ?? 0,
      discordWebhookSent: doc.discordWebhookSent ?? false,
    });
  }
  if (skipped) console.log(`  Skipped ${skipped} orphaned supporter notifications`);
}

async function importLiveStats() {
  const data = loadExport("liveStats") as any[];
  console.log(`Importing ${data.length} live stats...`);
  for (const doc of data) {
    await db.insert(schema.liveStats).values({
      key: doc.key,
      value: doc.value,
      source: doc.source,
      updatedAt: convexTimestamp(doc.updatedAt) || new Date(),
    }).onConflictDoNothing();
  }
}

async function importNetvuloEvents() {
  const data = loadExport("netvuloEvents") as any[];
  console.log(`Importing ${data.length} netvulo events...`);
  for (const doc of data) {
    await db.insert(schema.netvuloEvents).values({
      eventType: doc.eventType,
      eventId: doc.eventId,
      source: doc.source,
      data: doc.data,
      receivedAt: convexTimestamp(doc.receivedAt) || new Date(),
    });
  }
}

async function importWidgetInteractions() {
  const data = loadExport("widgetInteractions") as any[];
  console.log(`Importing ${data.length} widget interactions...`);
  let skipped = 0;
  for (const doc of data) {
    const userId = idMap.users.get(doc.userId);
    if (!userId) { skipped++; continue; }
    await db.insert(schema.widgetInteractions).values({
      userId,
      widgetId: doc.widgetId,
      interactionCount: doc.interactionCount ?? 0,
      lastInteractedAt: convexTimestamp(doc.lastInteractedAt) || new Date(),
    }).onConflictDoNothing();
  }
  if (skipped) console.log(`  Skipped ${skipped} orphaned widget interactions`);
}

async function importRobloxVerifications() {
  const data = loadExport("robloxVerifications") as any[];
  console.log(`Importing ${data.length} roblox verifications...`);
  for (const doc of data) {
    await db.insert(schema.robloxVerifications).values({
      clerkId: doc.clerkId,
      robloxUserId: doc.robloxUserId,
      robloxUsername: doc.robloxUsername,
      verificationCode: doc.verificationCode,
      status: doc.status || "pending",
      createdAt: convexTimestamp(doc.createdAt) || new Date(),
      expiresAt: convexTimestamp(doc.expiresAt) || new Date(),
      verifiedAt: convexTimestamp(doc.verifiedAt),
    });
  }
}

async function importInventoryItems() {
  const data = loadExport("inventoryItems") as any[];
  console.log(`Importing ${data.length} inventory items...`);
  for (const doc of data) {
    const [row] = await db.insert(schema.inventoryItems).values({
      slug: doc.slug,
      name: doc.name,
      description: doc.description,
      iconUrl: doc.iconUrl,
      previewUrl: doc.previewUrl,
      backgroundColor: doc.backgroundColor,
      rarity: doc.rarity,
      type: doc.type,
      services: doc.services,
      isStackable: doc.isStackable ?? false,
      isConsumable: doc.isConsumable ?? false,
      maxPerUser: doc.maxPerUser,
      assetUrl: doc.assetUrl,
      code: doc.code,
      metadata: doc.metadata,
      onClaimEffects: doc.onClaimEffects,
      isArchived: doc.isArchived ?? false,
      createdAt: convexTimestamp(doc.createdAt) || new Date(),
    }).returning({ id: schema.inventoryItems.id });
    if (row) idMap.inventoryItems.set(doc._id, row.id);
  }
}

async function importUserInventory() {
  const data = loadExport("userInventory") as any[];
  console.log(`Importing ${data.length} user inventory entries...`);
  let skipped = 0;
  for (const doc of data) {
    const userId = idMap.users.get(doc.userId);
    const itemId = idMap.inventoryItems.get(doc.itemId);
    if (!userId || !itemId) { skipped++; continue; }
    await db.insert(schema.userInventory).values({
      userId,
      itemId,
      source: doc.source || "migration",
      sourceReferenceId: doc.sourceReferenceId,
      quantity: doc.quantity ?? 1,
      isUsed: doc.isUsed ?? false,
      usedAt: convexTimestamp(doc.usedAt),
      acquiredAt: convexTimestamp(doc.acquiredAt) || new Date(),
      expiresAt: convexTimestamp(doc.expiresAt),
      metadata: doc.metadata,
    });
  }
  if (skipped) console.log(`  Skipped ${skipped} orphaned inventory entries`);
}

async function importLootboxTemplates() {
  const data = loadExport("lootboxTemplates") as any[];
  console.log(`Importing ${data.length} lootbox templates...`);
  for (const doc of data) {
    const [row] = await db.insert(schema.lootboxTemplates).values({
      name: doc.name,
      description: doc.description,
      items: doc.items || [],
      isActive: doc.isActive ?? true,
      iconUrl: doc.iconUrl,
      boxStyle: doc.boxStyle,
      accentColor: doc.accentColor,
      rollCount: doc.rollCount,
      targetTiers: doc.targetTiers,
      createdAt: convexTimestamp(doc.createdAt) || new Date(),
    }).returning({ id: schema.lootboxTemplates.id });
    if (row) idMap.lootboxTemplates.set(doc._id, row.id);
  }
}

async function importUserLootboxes() {
  const data = loadExport("userLootboxes") as any[];
  console.log(`Importing ${data.length} user lootboxes...`);
  let skipped = 0;
  for (const doc of data) {
    const userId = idMap.users.get(doc.userId);
    if (!userId) { skipped++; continue; }
    const templateId = doc.templateId ? idMap.lootboxTemplates.get(doc.templateId) : null;
    await db.insert(schema.userLootboxes).values({
      userId,
      templateId,
      customName: doc.customName,
      customItems: doc.customItems,
      isOpened: doc.isOpened ?? false,
      openedAt: convexTimestamp(doc.openedAt),
      receivedItemIds: doc.receivedItemIds,
      boxStyle: doc.boxStyle || "mystery_box",
      displayName: doc.displayName || doc.customName || "Lootbox",
      deliveredAt: convexTimestamp(doc.deliveredAt) || new Date(),
      expiresAt: convexTimestamp(doc.expiresAt),
    });
  }
  if (skipped) console.log(`  Skipped ${skipped} orphaned lootboxes`);
}

async function importTierClaimables() {
  const data = loadExport("tierClaimables") as any[];
  console.log(`Importing ${data.length} tier claimables...`);
  let skipped = 0;
  for (const doc of data) {
    const itemId = idMap.inventoryItems.get(doc.itemId);
    if (!itemId) { skipped++; continue; }
    const [row] = await db.insert(schema.tierClaimables).values({
      itemId,
      requiredTier: doc.requiredTier,
      displayOrder: doc.displayOrder ?? 0,
      headline: doc.headline,
      isActive: doc.isActive ?? true,
      availableFrom: convexTimestamp(doc.availableFrom),
      availableUntil: convexTimestamp(doc.availableUntil),
      createdAt: convexTimestamp(doc.createdAt) || new Date(),
    }).returning({ id: schema.tierClaimables.id });
    if (row) idMap.tierClaimables.set(doc._id, row.id);
  }
  if (skipped) console.log(`  Skipped ${skipped} orphaned tier claimables`);
}

async function importTierClaimRecords() {
  const data = loadExport("tierClaimRecords") as any[];
  console.log(`Importing ${data.length} tier claim records...`);
  let skipped = 0;
  for (const doc of data) {
    const userId = idMap.users.get(doc.userId);
    const tierClaimableId = idMap.tierClaimables.get(doc.tierClaimableId);
    if (!userId || !tierClaimableId) { skipped++; continue; }
    await db.insert(schema.tierClaimRecords).values({
      userId,
      tierClaimableId,
      claimedAt: convexTimestamp(doc.claimedAt) || new Date(),
    }).onConflictDoNothing();
  }
  if (skipped) console.log(`  Skipped ${skipped} orphaned claim records`);
}

// ============================================
// MAIN
// ============================================

const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  console.log(`Starting Convex → Postgres import...${DRY_RUN ? " (DRY RUN)" : ""}\n`);

  if (DRY_RUN) {
    console.log("Dry run mode: will validate data but not insert.\n");
    // In dry run, just load and count orphans
    // For now, just run the full import — dry-run validation would need
    // a separate code path. TODO: implement proper dry-run.
    console.log("Full dry-run validation not yet implemented.");
    console.log("Run without --dry-run to import data.");
    return;
  }

  // Phase 1: Core entities (no FK dependencies beyond themselves)
  await importUsers();

  // Phase 2: Primary content (depends on users)
  await importBlogPosts();
  await importProjects();
  await importSoftware();
  await importTechnologies();
  await importRoles();

  // Phase 3: Blog engagement (depends on users + blogPosts)
  await importBlogComments();
  await importBlogReactions();
  await importBlogViews();
  await importArticleWatchTime();
  await importBlogInteractions();
  await importBlogCommentReactions();
  await importBlogCommentReports();
  await importContentReports();

  // Phase 4: Content highlights (depends on users + blogPosts)
  await importContentHighlights();
  await importContentComments();
  await importContentReactions();

  // Phase 5: Experience & time tracking
  await importExperienceEvents();
  await importTimeTrackingSessions();

  // Phase 6: User feed system
  await importUserFeedPosts();
  await importPendingFeedPosts();
  await importUserFeedReactions();

  // Phase 7: Vault
  await importVaultFiles();
  await importVaultDownloadLogs();

  // Phase 8: Inventory & rewards
  await importInventoryItems();
  await importUserInventory();
  await importLootboxTemplates();
  await importUserLootboxes();
  await importTierClaimables();
  await importTierClaimRecords();

  // Phase 9: Admin & misc
  await importAdminSettings();
  await importDiscordEvents();
  await importFeaturedContent();
  await importNewsItems();
  await importNotifications();
  await importSupporterNotifications();
  await importLiveStats();
  await importNetvuloEvents();
  await importWidgetInteractions();
  await importRobloxVerifications();

  // Summary
  console.log("\nImport complete!");
  console.log(`  Users: ${idMap.users.size}`);
  console.log(`  Blog Posts: ${idMap.blogPosts.size}`);
  console.log(`  Blog Comments: ${idMap.blogComments.size}`);
  console.log(`  Projects: ${idMap.projects.size}`);
  console.log(`  Software: ${idMap.software.size}`);
  console.log(`  Content Highlights: ${idMap.contentHighlights.size}`);
  console.log(`  User Feed Posts: ${idMap.userFeedPosts.size}`);
  console.log(`  Vault Files: ${idMap.vaultFiles.size}`);
  console.log(`  Inventory Items: ${idMap.inventoryItems.size}`);
  console.log(`  Lootbox Templates: ${idMap.lootboxTemplates.size}`);
  console.log(`  Tier Claimables: ${idMap.tierClaimables.size}`);
}

main().catch(console.error);
