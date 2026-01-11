import { ConvexHttpClient } from "convex/browser";
import type { NextApiRequest, NextApiResponse } from "next";
import { api } from "../../../convex/_generated/api";
import { upsertArticleWithEmbedding, vectorIndex } from "../../../lib/upstash-vector";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET: Check vector DB status without syncing
  if (req.method === "GET") {
    try {
      const info = await vectorIndex.info();
      return res.status(200).json({
        vectorDb: info,
        envCheck: {
          hasVectorUrl: !!process.env.UPSTASH_VECTOR_REST_URL,
          hasVectorToken: !!process.env.UPSTASH_VECTOR_REST_TOKEN,
          hasConvexUrl: !!process.env.NEXT_PUBLIC_CONVEX_URL,
        },
      });
    } catch (error) {
      return res.status(500).json({
        error: "Failed to get vector DB info",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Optional: Add auth check here for production
  // const authHeader = req.headers.authorization;
  // if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
  //   return res.status(401).json({ error: "Unauthorized" });
  // }

  try {
    // First, check vector DB stats
    const info = await vectorIndex.info();
    console.log("[bulk-vector-sync] Vector DB info:", info);

    // Fetch all published posts from Convex using getForBento (no auth required)
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    const posts = await convex.query(api.blogPosts.getForBento, {});

    console.log(`[bulk-vector-sync] Found ${posts.length} published posts`);

    let synced = 0;
    let errors = 0;
    const results: { slug: string; status: string; error?: string }[] = [];

    for (const post of posts) {
      try {
        const textToEmbed = `${post.title}. ${post.description || ""}. Topics: ${(post.labels || []).join(", ")}`;

        await upsertArticleWithEmbedding(post.slug, textToEmbed, {
          slug: post.slug,
          title: post.title,
          labels: post.labels || [],
          difficulty: post.difficulty || "beginner",
          contentType: post.contentType || "article",
          publishedAt: post.publishedAt || Date.now(),
        });

        synced++;
        results.push({ slug: post.slug, status: "synced" });
        console.log(`[bulk-vector-sync] Synced: ${post.slug}`);
      } catch (error) {
        errors++;
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        results.push({ slug: post.slug, status: "error", error: errMsg });
        console.error(`[bulk-vector-sync] Error syncing ${post.slug}:`, error);
      }
    }

    // Get updated stats
    const updatedInfo = await vectorIndex.info();

    return res.status(200).json({
      success: true,
      total: posts.length,
      synced,
      errors,
      vectorDbBefore: info,
      vectorDbAfter: updatedInfo,
      results,
    });
  } catch (error) {
    console.error("[bulk-vector-sync] Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
