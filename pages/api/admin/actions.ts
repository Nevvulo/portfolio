/**
 * Pages Router API route for general admin actions.
 * Covers: staff management, settings (YouTube, Discord, stream), moderation.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { requireCreatorApi, requireStaffApi } from "@/src/db/api-auth";
import { db } from "@/src/db";
import {
  adminSettings,
  blogCommentReports,
  blogComments,
  blogPosts,
  contentReports,
  discordEvents,
  users,
} from "@/src/db/schema";

async function getOrCreateSettings() {
  const existing = await db.query.adminSettings.findFirst();
  if (existing) return existing;
  const [created] = await db
    .insert(adminSettings)
    .values({ youtube: {}, discord: {}, stream: {} })
    .returning();
  return created;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { action, ...params } = req.body;

    switch (action) {
      // ── Staff Management ──────────────────────────────
      case "getStaffMembers": {
        await requireCreatorApi(req);
        const staff = await db.query.users.findMany({
          where: or(eq(users.isCreator, true), sql`${users.role} >= 1`),
          columns: {
            id: true, clerkId: true, displayName: true, username: true,
            avatarUrl: true, role: true, isCreator: true,
          },
          orderBy: [desc(users.isCreator), desc(users.role)],
        });
        return res.json(staff);
      }

      case "searchUsers": {
        await requireCreatorApi(req);
        const query = params.query as string;
        if (!query || query.length < 2) return res.json([]);
        const results = await db.query.users.findMany({
          where: or(
            ilike(users.displayName, `%${query}%`),
            ilike(users.username, `%${query}%`),
          ),
          columns: {
            id: true, clerkId: true, displayName: true, username: true,
            avatarUrl: true, role: true, isCreator: true,
          },
          limit: 20,
        });
        return res.json(results);
      }

      case "addStaff": {
        await requireCreatorApi(req);
        await db.update(users).set({ role: params.role }).where(eq(users.id, params.userId));
        return res.json({ ok: true });
      }

      case "removeStaff": {
        await requireCreatorApi(req);
        await db.update(users).set({ role: 0 }).where(eq(users.id, params.userId));
        return res.json({ ok: true });
      }

      // ── Stream Settings ───────────────────────────────
      case "getStreamSettings": {
        const settings = await getOrCreateSettings();
        return res.json((settings.stream as Record<string, any>) ?? {});
      }

      case "updateStreamChance": {
        await requireCreatorApi(req);
        const settings = await getOrCreateSettings();
        const current = (settings.stream as Record<string, any>) ?? {};
        await db
          .update(adminSettings)
          .set({
            stream: {
              ...current,
              streamChance: params.streamChance,
              streamChanceMessage: params.streamChanceMessage ?? null,
              lastUpdated: new Date().toISOString(),
            },
            updatedAt: new Date(),
          })
          .where(eq(adminSettings.id, settings.id));
        return res.json({ ok: true });
      }

      case "getUpcomingEvents": {
        const events = await db.query.discordEvents.findMany({
          where: and(
            eq(discordEvents.status, "scheduled"),
            sql`${discordEvents.scheduledStartTime} > NOW()`,
          ),
          orderBy: [discordEvents.scheduledStartTime],
        });
        return res.json(events);
      }

      // ── YouTube Settings ──────────────────────────────
      case "getYouTubeSettings": {
        const settings = await getOrCreateSettings();
        return res.json((settings.youtube as Record<string, any>) ?? {});
      }

      case "updateYouTubeSettings": {
        await requireCreatorApi(req);
        const settings = await getOrCreateSettings();
        await db
          .update(adminSettings)
          .set({ youtube: params.data, updatedAt: new Date() })
          .where(eq(adminSettings.id, settings.id));
        return res.json({ ok: true });
      }

      // ── Discord Settings ──────────────────────────────
      case "getDiscordSettings": {
        const settings = await getOrCreateSettings();
        return res.json((settings.discord as Record<string, any>) ?? {});
      }

      case "updateDiscordSettings": {
        await requireCreatorApi(req);
        const settings = await getOrCreateSettings();
        await db
          .update(adminSettings)
          .set({ discord: params.data, updatedAt: new Date() })
          .where(eq(adminSettings.id, settings.id));
        return res.json({ ok: true });
      }

      // ── Moderation ────────────────────────────────────
      case "getCommentReports": {
        await requireStaffApi(req);
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
        return res.json(reports);
      }

      case "resolveCommentReport": {
        await requireStaffApi(req);
        await db
          .update(blogCommentReports)
          .set({ status: params.status, resolvedAt: new Date() })
          .where(eq(blogCommentReports.id, params.reportId));
        if (params.deleteComment) {
          const report = await db.query.blogCommentReports.findFirst({
            where: eq(blogCommentReports.id, params.reportId),
          });
          if (report) {
            await db
              .update(blogComments)
              .set({ isDeleted: true })
              .where(eq(blogComments.id, report.commentId));
          }
        }
        return res.json({ ok: true });
      }

      case "getContentReports": {
        await requireStaffApi(req);
        const reporters = alias(users, "reporters");
        const reports = await db
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
        return res.json(reports);
      }

      case "resolveContentReport": {
        await requireStaffApi(req);
        await db
          .update(contentReports)
          .set({ status: params.status, resolvedAt: new Date() })
          .where(eq(contentReports.id, params.reportId));
        return res.json({ ok: true });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err: any) {
    if (err.message?.includes("required")) return res.status(401).json({ error: err.message });
    console.error("[/api/admin/actions] Error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
