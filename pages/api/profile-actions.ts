/**
 * RPC-style API route for profile operations.
 * Pages Router cannot use "use server" actions.
 */
import { and, eq } from "drizzle-orm";
import type { NextApiRequest, NextApiResponse } from "next";
import { getCurrentUserApi, requireUserApi } from "@/src/db/api-auth";
import { db } from "@/src/db";
import { blogPosts, users } from "@/src/db/schema";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { action, ...params } = req.body;

    switch (action) {
      case "getUserByUsername": {
        const user = await db.query.users.findFirst({
          where: eq(users.username, params.username),
          columns: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bannerUrl: true,
            bannerFocalY: true,
            bio: true,
            tier: true,
            isCreator: true,
            discordHighestRole: true,
            discordBooster: true,
            profileLinks: true,
            createdAt: true,
          },
        });
        return res.json(user ?? null);
      }

      case "getMeForProfile": {
        const user = await getCurrentUserApi(req);
        if (!user) return res.json(null);
        return res.json({
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          tier: user.tier,
          isCreator: user.isCreator,
          showOnCredits: user.showOnCredits,
        });
      }

      case "getUserContributions": {
        const authorPosts = await db.query.blogPosts.findMany({
          where: and(
            eq(blogPosts.authorId, params.userId),
            eq(blogPosts.status, "published"),
          ),
          columns: {
            id: true,
            slug: true,
            title: true,
            description: true,
            contentType: true,
            coverImage: true,
            readTimeMins: true,
            publishedAt: true,
          },
        });
        const allPublished = await db.query.blogPosts.findMany({
          where: eq(blogPosts.status, "published"),
          columns: {
            id: true,
            slug: true,
            title: true,
            description: true,
            contentType: true,
            coverImage: true,
            readTimeMins: true,
            publishedAt: true,
            collaborators: true,
            authorId: true,
          },
        });
        const collabPosts = allPublished.filter((p) => {
          const collabs = p.collaborators as number[] | null;
          return (
            collabs &&
            collabs.includes(params.userId) &&
            p.authorId !== params.userId
          );
        });
        return res.json([
          ...authorPosts.map((p) => ({ ...p, isAuthor: true })),
          ...collabPosts.map((p) => ({ ...p, isAuthor: false })),
        ]);
      }

      case "updateProfileLinks": {
        const user = await requireUserApi(req);
        await db
          .update(users)
          .set({ profileLinks: params.links })
          .where(eq(users.id, user.id));
        return res.json({ ok: true });
      }

      case "updateShowOnCredits": {
        const user = await requireUserApi(req);
        await db
          .update(users)
          .set({ showOnCredits: params.showOnCredits })
          .where(eq(users.id, user.id));
        return res.json({ ok: true });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Authentication required")) {
      return res.status(401).json({ error: message });
    }
    console.error("[profile-actions]", error);
    return res.status(500).json({ error: message });
  }
}
