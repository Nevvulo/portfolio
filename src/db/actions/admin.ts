"use server";

import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { requireCreator, requireStaff } from "../auth";
import { db } from "../index";
import {
  adminSettings,
  blogCommentReports,
  blogComments,
  blogPosts,
  contentReports,
  discordEvents,
  users,
} from "../schema";

// ============================================
// STAFF MANAGEMENT
// ============================================

export async function getStaffMembers() {
  await requireCreator();
  return db.query.users.findMany({
    where: or(eq(users.isCreator, true), sql`${users.role} >= 1`),
    columns: {
      id: true,
      clerkId: true,
      displayName: true,
      username: true,
      avatarUrl: true,
      role: true,
      isCreator: true,
    },
    orderBy: [desc(users.isCreator), desc(users.role)],
  });
}

export async function searchUsers(query: string) {
  await requireCreator();
  if (!query || query.length < 2) return [];
  return db.query.users.findMany({
    where: or(
      ilike(users.displayName, `%${query}%`),
      ilike(users.username, `%${query}%`),
    ),
    columns: {
      id: true,
      clerkId: true,
      displayName: true,
      username: true,
      avatarUrl: true,
      role: true,
      isCreator: true,
    },
    limit: 20,
  });
}

export async function addStaff(userId: number, role: number) {
  await requireCreator();
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function removeStaff(userId: number) {
  await requireCreator();
  await db.update(users).set({ role: 0 }).where(eq(users.id, userId));
}

// ============================================
// ADMIN SETTINGS (YouTube, Discord, Stream)
// ============================================

async function getOrCreateSettings() {
  const existing = await db.query.adminSettings.findFirst();
  if (existing) return existing;
  const [created] = await db
    .insert(adminSettings)
    .values({ youtube: {}, discord: {}, stream: {} })
    .returning();
  return created;
}

export async function getStreamSettings() {
  const settings = await getOrCreateSettings();
  return (settings.stream as Record<string, any>) ?? {};
}

export async function updateStreamChance(data: {
  streamChance: number;
  streamChanceMessage?: string;
}) {
  await requireCreator();
  const settings = await getOrCreateSettings();
  const current = (settings.stream as Record<string, any>) ?? {};
  await db
    .update(adminSettings)
    .set({
      stream: {
        ...current,
        streamChance: data.streamChance,
        streamChanceMessage: data.streamChanceMessage ?? null,
        lastUpdated: new Date().toISOString(),
      },
      updatedAt: new Date(),
    })
    .where(eq(adminSettings.id, settings.id));
}

export async function getUpcomingEvents() {
  return db.query.discordEvents.findMany({
    where: and(
      eq(discordEvents.status, "scheduled"),
      sql`${discordEvents.scheduledStartTime} > NOW()`,
    ),
    orderBy: [discordEvents.scheduledStartTime],
  });
}

export async function getYouTubeSettings() {
  const settings = await getOrCreateSettings();
  return (settings.youtube as Record<string, any>) ?? {};
}

export async function updateYouTubeSettings(data: Record<string, any>) {
  await requireCreator();
  const settings = await getOrCreateSettings();
  await db
    .update(adminSettings)
    .set({ youtube: data, updatedAt: new Date() })
    .where(eq(adminSettings.id, settings.id));
}

export async function getDiscordSettings() {
  const settings = await getOrCreateSettings();
  return (settings.discord as Record<string, any>) ?? {};
}

export async function updateDiscordSettings(data: Record<string, any>) {
  await requireCreator();
  const settings = await getOrCreateSettings();
  await db
    .update(adminSettings)
    .set({ discord: data, updatedAt: new Date() })
    .where(eq(adminSettings.id, settings.id));
}

// ============================================
// MODERATION
// ============================================

export async function getCommentReports() {
  await requireStaff();
  const commentAuthors = alias(users, "comment_authors");
  const reports = await db
    .select({
      id: blogCommentReports.id,
      commentId: blogCommentReports.commentId,
      reporterId: blogCommentReports.reporterId,
      reason: blogCommentReports.reason,
      status: blogCommentReports.status,
      createdAt: blogCommentReports.createdAt,
      resolvedAt: blogCommentReports.resolvedAt,
      comment: {
        id: blogComments.id,
        content: blogComments.content,
        postId: blogComments.postId,
        authorId: blogComments.authorId,
        author: {
          displayName: commentAuthors.displayName,
          username: commentAuthors.username,
        },
      },
      reporter: {
        id: users.id,
        displayName: users.displayName,
        username: users.username,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(blogCommentReports)
    .leftJoin(blogComments, eq(blogCommentReports.commentId, blogComments.id))
    .leftJoin(commentAuthors, eq(blogComments.authorId, commentAuthors.id))
    .leftJoin(users, eq(blogCommentReports.reporterId, users.id))
    .orderBy(desc(blogCommentReports.createdAt));
  return reports;
}

export async function resolveCommentReport(
  reportId: number,
  status: string,
  deleteComment: boolean,
) {
  await requireStaff();
  await db
    .update(blogCommentReports)
    .set({ status, resolvedAt: new Date() })
    .where(eq(blogCommentReports.id, reportId));

  if (deleteComment) {
    const report = await db.query.blogCommentReports.findFirst({
      where: eq(blogCommentReports.id, reportId),
    });
    if (report) {
      await db
        .update(blogComments)
        .set({ isDeleted: true })
        .where(eq(blogComments.id, report.commentId));
    }
  }
}

export async function getContentReports() {
  await requireStaff();
  const reporters = alias(users, "reporters");
  return db
    .select({
      id: contentReports.id,
      postId: contentReports.postId,
      reporterId: contentReports.reporterId,
      category: contentReports.category,
      reason: contentReports.reason,
      status: contentReports.status,
      createdAt: contentReports.createdAt,
      resolvedAt: contentReports.resolvedAt,
      post: {
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
      },
      reporter: {
        id: reporters.id,
        displayName: reporters.displayName,
        username: reporters.username,
      },
    })
    .from(contentReports)
    .leftJoin(blogPosts, eq(contentReports.postId, blogPosts.id))
    .leftJoin(reporters, eq(contentReports.reporterId, reporters.id))
    .orderBy(desc(contentReports.createdAt));
}

export async function resolveContentReport(reportId: number, status: string) {
  await requireStaff();
  await db
    .update(contentReports)
    .set({ status, resolvedAt: new Date() })
    .where(eq(contentReports.id, reportId));
}
