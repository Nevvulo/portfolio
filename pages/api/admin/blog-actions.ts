/**
 * RPC-style API route for admin blog operations.
 *
 * Pages Router cannot use "use server" actions — those only work from App Router.
 * This route provides the same operations via POST { action, ...params }.
 */
import { and, count, desc, eq, gte, ilike, or, sql } from "drizzle-orm";
import type { NextApiRequest, NextApiResponse } from "next";
import { requireCreatorApi } from "@/src/db/api-auth";
import { db } from "@/src/db";
import {
  blogComments,
  blogPosts,
  blogReactions,
  blogViews,
  users,
} from "@/src/db/schema";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const creator = await requireCreatorApi(req);
    const { action, ...params } = req.body;

    switch (action) {
      // ===================== POSTS =====================
      case "listPosts": {
        const posts = await db.query.blogPosts.findMany({
          orderBy: [blogPosts.bentoOrder],
          with: {
            author: {
              columns: {
                id: true,
                displayName: true,
                avatarUrl: true,
                username: true,
              },
            },
          },
        });
        return res.json(posts);
      }

      case "getPostContent": {
        const post = await db.query.blogPosts.findFirst({
          where: eq(blogPosts.id, params.postId),
        });
        return res.json(post?.body ?? null);
      }

      case "createPost": {
        const [created] = await db
          .insert(blogPosts)
          .values(params.data)
          .returning();
        return res.json(created);
      }

      case "updatePost": {
        await db
          .update(blogPosts)
          .set({ ...params.data, updatedAt: new Date() })
          .where(eq(blogPosts.id, params.id));
        return res.json({ ok: true });
      }

      case "updateBentoLayout": {
        for (const u of params.updates) {
          await db
            .update(blogPosts)
            .set({ bentoSize: u.bentoSize, bentoOrder: u.bentoOrder })
            .where(eq(blogPosts.id, u.id));
        }
        return res.json({ ok: true });
      }

      case "updateCollaborators": {
        await db
          .update(blogPosts)
          .set({
            collaborators: params.collaboratorIds,
            updatedAt: new Date(),
          })
          .where(eq(blogPosts.id, params.postId));
        return res.json({ ok: true });
      }

      case "deletePost": {
        await db.delete(blogPosts).where(eq(blogPosts.id, params.id));
        return res.json({ ok: true });
      }

      case "publishPost": {
        await db
          .update(blogPosts)
          .set({
            status: "published",
            publishedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(blogPosts.id, params.id));
        return res.json({ ok: true });
      }

      case "unpublishPost": {
        await db
          .update(blogPosts)
          .set({ status: "draft", updatedAt: new Date() })
          .where(eq(blogPosts.id, params.id));
        return res.json({ ok: true });
      }

      case "archivePost": {
        await db
          .update(blogPosts)
          .set({ status: "archived", updatedAt: new Date() })
          .where(eq(blogPosts.id, params.id));
        return res.json({ ok: true });
      }

      // ===================== USERS =====================
      case "getUsersByIds": {
        if (!params.ids?.length) return res.json([]);
        const result = await db.query.users.findMany({
          where: sql`${users.id} = ANY(${params.ids})`,
          columns: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true,
          },
        });
        return res.json(result);
      }

      case "searchUsers": {
        const q = params.query;
        if (!q || q.length < 2) return res.json([]);
        const result = await db.query.users.findMany({
          where: or(
            ilike(users.displayName, `%${q}%`),
            ilike(users.username, `%${q}%`),
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
        return res.json(result);
      }

      case "getCreatorId": {
        return res.json(creator.id);
      }

      // ===================== ANALYTICS =====================
      case "getDetailedAnalytics": {
        const since = new Date(
          Date.now() - params.days * 24 * 60 * 60 * 1000,
        );
        const [viewsResult] = await db
          .select({ count: count() })
          .from(blogViews)
          .where(gte(blogViews.viewedAt, since));
        const [reactionsResult] = await db
          .select({ count: count() })
          .from(blogReactions)
          .where(gte(blogReactions.createdAt, since));
        const [commentsResult] = await db
          .select({ count: count() })
          .from(blogComments)
          .where(gte(blogComments.createdAt, since));
        const [postsResult] = await db
          .select({ count: count() })
          .from(blogPosts)
          .where(
            and(
              eq(blogPosts.status, "published"),
              gte(blogPosts.publishedAt, since),
            ),
          );
        return res.json({
          totalViews: viewsResult.count,
          totalReactions: reactionsResult.count,
          totalComments: commentsResult.count,
          newPosts: postsResult.count,
        });
      }

      case "getViewsOverTime": {
        const since = new Date(
          Date.now() - params.days * 24 * 60 * 60 * 1000,
        );
        const results = await db
          .select({
            date: sql<string>`DATE(${blogViews.viewedAt})`,
            count: count(),
          })
          .from(blogViews)
          .where(gte(blogViews.viewedAt, since))
          .groupBy(sql`DATE(${blogViews.viewedAt})`)
          .orderBy(sql`DATE(${blogViews.viewedAt})`);
        return res.json(results);
      }

      case "getReactionsOverTime": {
        const since = new Date(
          Date.now() - params.days * 24 * 60 * 60 * 1000,
        );
        const results = await db
          .select({
            date: sql<string>`DATE(${blogReactions.createdAt})`,
            count: count(),
          })
          .from(blogReactions)
          .where(gte(blogReactions.createdAt, since))
          .groupBy(sql`DATE(${blogReactions.createdAt})`)
          .orderBy(sql`DATE(${blogReactions.createdAt})`);
        return res.json(results);
      }

      case "getCommentsOverTime": {
        const since = new Date(
          Date.now() - params.days * 24 * 60 * 60 * 1000,
        );
        const results = await db
          .select({
            date: sql<string>`DATE(${blogComments.createdAt})`,
            count: count(),
          })
          .from(blogComments)
          .where(gte(blogComments.createdAt, since))
          .groupBy(sql`DATE(${blogComments.createdAt})`)
          .orderBy(sql`DATE(${blogComments.createdAt})`);
        return res.json(results);
      }

      case "getAllPostsAnalytics": {
        const since = new Date(
          Date.now() - params.days * 24 * 60 * 60 * 1000,
        );
        const viewCounts = await db
          .select({ postId: blogViews.postId, views: count() })
          .from(blogViews)
          .where(gte(blogViews.viewedAt, since))
          .groupBy(blogViews.postId);
        const reactionCounts = await db
          .select({ postId: blogReactions.postId, reactions: count() })
          .from(blogReactions)
          .where(gte(blogReactions.createdAt, since))
          .groupBy(blogReactions.postId);
        const commentCounts = await db
          .select({ postId: blogComments.postId, comments: count() })
          .from(blogComments)
          .where(gte(blogComments.createdAt, since))
          .groupBy(blogComments.postId);
        const posts = await db.query.blogPosts.findMany({
          where: eq(blogPosts.status, "published"),
          columns: { id: true, slug: true, title: true, viewCount: true, contentType: true },
        });
        const viewMap = Object.fromEntries(
          viewCounts.map((v) => [v.postId, v.views]),
        );
        const reactionMap = Object.fromEntries(
          reactionCounts.map((r) => [r.postId, r.reactions]),
        );
        const commentMap = Object.fromEntries(
          commentCounts.map((c) => [c.postId, c.comments]),
        );
        return res.json(
          posts.map((p) => ({
            ...p,
            recentViews: viewMap[p.id] ?? 0,
            recentReactions: reactionMap[p.id] ?? 0,
            recentComments: commentMap[p.id] ?? 0,
          })),
        );
      }

      // ===================== MIGRATION =====================
      case "getMigrationStatus": {
        const [postCount] = await db
          .select({ count: count() })
          .from(blogPosts);
        return res.json({ postCount: postCount.count, migrated: true });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Authentication required")) {
      return res.status(401).json({ error: message });
    }
    if (message.includes("Creator access required")) {
      return res.status(403).json({ error: message });
    }
    console.error("[blog-actions]", error);
    return res.status(500).json({ error: message });
  }
}
