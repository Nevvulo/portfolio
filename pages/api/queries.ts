/**
 * Pages Router API route for query operations.
 * Replaces "use server" action imports that don't work in Pages Router.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { desc, eq, and, sql } from "drizzle-orm";
import { getPostsForBento, getPostBySlug } from "@/src/db/queries/blog";
import { getCurrentUserApi } from "@/src/db/api-auth";
import { db } from "@/src/db";
import { articleWatchTime, blogPosts } from "@/src/db/schema";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const body = req.method === "POST" ? req.body : req.query;
    const { action, ...params } = body;

    switch (action) {
      // ── Public (no auth) ──────────────────────────────────

      case "getPostsForBento": {
        const posts = await getPostsForBento();
        return res.json(posts);
      }

      case "getCreditsPage": {
        // Inline to avoid pulling auth transitive deps at call time
        const { getCreditsPage } = await import("@/src/db/actions/blog");
        return res.json(await getCreditsPage());
      }

      case "getPreLLMPosts": {
        const { getPreLLMPosts } = await import("@/src/db/actions/blog");
        const limit = params.limit ? Number(params.limit) : 6;
        return res.json(await getPreLLMPosts(limit));
      }

      case "getAllLabels": {
        const { getAllLabels } = await import("@/src/db/actions/blog");
        return res.json(await getAllLabels());
      }

      case "getPostBySlug": {
        const slug = params.slug as string;
        if (!slug) return res.status(400).json({ error: "slug is required" });
        const post = await getPostBySlug(slug);
        return res.json(post ?? null);
      }

      // ── Auth required ─────────────────────────────────────

      case "getWatchHistory": {
        const user = await getCurrentUserApi(req);
        if (!user) return res.status(401).json({ error: "Not authenticated" });

        const history = await db
          .select({
            slug: blogPosts.slug,
            totalSeconds: articleWatchTime.totalSeconds,
          })
          .from(articleWatchTime)
          .innerJoin(blogPosts, eq(articleWatchTime.postId, blogPosts.id))
          .where(eq(articleWatchTime.userId, user.id))
          .orderBy(desc(articleWatchTime.lastHeartbeat));

        return res.json(history);
      }

      case "getPostBySlugForEdit": {
        const user = await getCurrentUserApi(req);
        if (!user) return res.status(401).json({ error: "Not authenticated" });

        const slug = params.slug as string;
        if (!slug) return res.status(400).json({ error: "slug is required" });

        const post = await db.query.blogPosts.findFirst({
          where: eq(blogPosts.slug, slug),
        });

        if (!post) return res.json(null);

        const canEdit = user.isCreator || (user.role ?? 0) >= 1 || post.authorId === user.id;
        if (!canEdit) return res.json(null);

        return res.json(post);
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err: any) {
    console.error("[/api/queries] Error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
