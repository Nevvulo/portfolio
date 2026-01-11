import { Search } from "@upstash/search";
import { ConvexHttpClient } from "convex/browser";
import type { NextApiRequest, NextApiResponse } from "next";
import { api } from "../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Use the SDK directly instead of Convex action
    const client = Search.fromEnv();
    const index = client.index("blog-posts");

    // Fetch all published public posts from Convex
    console.log("[sync] Fetching posts from Convex...");
    const posts = await convex.query(api.blogPosts.listPublished, {});
    console.log("[sync] Fetched posts:", posts?.length || 0);

    if (!posts || posts.length === 0) {
      return res.status(200).json({
        success: false,
        synced: 0,
        message: "No posts found from Convex",
        debug: { postsCount: 0 },
      });
    }

    // Transform posts to search documents
    const documents = posts
      .filter((post: any) => post.visibility === "public")
      .map((post: any) => ({
        id: post.slug,
        content: {
          title: post.title,
          description: post.description,
          labels: post.labels,
        },
        metadata: {
          slug: post.slug,
          difficulty: post.difficulty || "",
          contentType: post.contentType,
          coverImage: post.coverImage || "",
          readTimeMins: post.readTimeMins || 0,
          publishedAt: post.publishedAt || post.createdAt,
          authorName: post.author?.displayName || "",
          visibility: post.visibility,
        },
      }));

    console.log("[sync] Documents to sync:", documents.length);
    console.log("[sync] First doc:", JSON.stringify(documents[0], null, 2));

    if (documents.length === 0) {
      return res.status(200).json({
        success: false,
        synced: 0,
        message: "No public posts to sync",
        debug: {
          totalPosts: posts.length,
          publicPosts: 0,
          postVisibilities: posts.map((p: any) => ({ slug: p.slug, visibility: p.visibility })),
        },
      });
    }

    // Upsert to Upstash Search using SDK
    console.log("[sync] Upserting to Upstash Search...");
    const result = await index.upsert(documents);
    console.log("[sync] Upsert result:", result);

    // Check index info after upsert
    const info = await index.info();
    console.log("[sync] Index info after upsert:", info);

    return res.status(200).json({
      success: true,
      synced: documents.length,
      message: `Synced ${documents.length} posts to search index`,
      upsertResult: result,
      indexInfo: info,
      debug: {
        totalPosts: posts.length,
        publicPosts: documents.length,
        firstDoc: documents[0],
      },
    });
  } catch (error) {
    console.error("[sync-index] Error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Sync failed",
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}
