import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalAction, internalQuery, query } from "./_generated/server";

const UPSTASH_SEARCH_URL = process.env.UPSTASH_SEARCH_REST_URL;
const UPSTASH_SEARCH_TOKEN = process.env.UPSTASH_SEARCH_REST_TOKEN;
const INDEX_NAME = "blog-posts";

/**
 * Internal query to get post data for syncing
 */
export const getPostForSync = internalQuery({
  args: { postId: v.id("blogPosts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) return null;

    // Get author info
    const author = await ctx.db.get(post.authorId);

    return {
      slug: post.slug,
      title: post.title,
      description: post.description,
      labels: post.labels,
      difficulty: post.difficulty,
      contentType: post.contentType,
      coverImage: post.coverImage,
      readTimeMins: post.readTimeMins,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      authorName: author?.displayName,
      visibility: post.visibility,
      status: post.status,
    };
  },
});

/**
 * Sync a single post to Upstash Search index
 */
export const syncPostToSearch = internalAction({
  args: { postId: v.id("blogPosts") },
  handler: async (ctx, args) => {
    if (!UPSTASH_SEARCH_URL || !UPSTASH_SEARCH_TOKEN) {
      console.warn("[search] Missing Upstash Search credentials, skipping sync");
      return;
    }

    // Fetch the post from Convex using internal query
    const post = await ctx.runQuery(internal.search.getPostForSync, { postId: args.postId });
    if (!post) {
      console.warn(`[search] Post ${args.postId} not found for sync`);
      return;
    }

    // Only sync published public posts
    if (post.status !== "published" || post.visibility !== "public") {
      console.log(`[search] Skipping non-public post: ${post.slug}`);
      return;
    }

    // Build document for Upstash Search
    const document = {
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
        authorName: post.authorName || "",
        visibility: post.visibility,
      },
    };

    try {
      const response = await fetch(`${UPSTASH_SEARCH_URL}/upsert/${INDEX_NAME}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${UPSTASH_SEARCH_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([document]),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`[search] Failed to sync post ${post.slug}:`, error);
      } else {
        console.log(`[search] Synced post to search index: ${post.slug}`);
      }
    } catch (error) {
      console.error(`[search] Error syncing post ${post.slug}:`, error);
    }

    // Sync to vector index for recommendations
    const vectorUrl = process.env.UPSTASH_VECTOR_REST_URL;
    const vectorToken = process.env.UPSTASH_VECTOR_REST_TOKEN;
    if (vectorUrl && vectorToken) {
      try {
        const textToEmbed = `${post.title}. ${post.description}. Topics: ${post.labels.join(", ")}`;
        const vectorResponse = await fetch(`${vectorUrl}/upsert`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${vectorToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify([
            {
              id: post.slug,
              data: textToEmbed,
              metadata: {
                slug: post.slug,
                title: post.title,
                labels: post.labels,
                difficulty: post.difficulty || "beginner",
                contentType: post.contentType,
                publishedAt: post.publishedAt || post.createdAt,
              },
            },
          ]),
        });

        if (!vectorResponse.ok) {
          const errText = await vectorResponse.text();
          console.error(`[search] Failed to sync post to vector: ${post.slug}`, errText);
        } else {
          console.log(`[search] Synced post to vector: ${post.slug}`);
        }
      } catch (err) {
        console.error(`[search] Vector sync error for ${post.slug}:`, err);
      }
    }
  },
});

/**
 * Remove a post from Upstash Search index
 */
export const removePostFromSearch = internalAction({
  args: { slug: v.string() },
  handler: async (_ctx, args) => {
    if (!UPSTASH_SEARCH_URL || !UPSTASH_SEARCH_TOKEN) {
      console.warn("[search] Missing Upstash Search credentials, skipping removal");
      return;
    }

    try {
      const response = await fetch(`${UPSTASH_SEARCH_URL}/delete/${INDEX_NAME}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${UPSTASH_SEARCH_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([args.slug]),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`[search] Failed to remove post ${args.slug}:`, error);
      } else {
        console.log(`[search] Removed post from search index: ${args.slug}`);
      }
    } catch (error) {
      console.error(`[search] Error removing post ${args.slug}:`, error);
    }
  },
});

/**
 * Get all unique labels from published posts
 *
 * TODO: This function scans all published posts which is inefficient.
 * Future optimization: Create a dedicated labelCache table that stores
 * aggregated labels, updated via trigger when posts are created/updated.
 * This would reduce bandwidth from ~40MB to <1KB per call.
 */
export const getAllLabels = query({
  args: {},
  handler: async (ctx) => {
    // Use compound index to filter published + public posts more efficiently
    // Note: Still fetches full documents - Convex doesn't support field projection
    const posts = await ctx.db
      .query("blogPosts")
      .withIndex("by_visibility", (q) => q.eq("visibility", "public").eq("status", "published"))
      .collect();

    // Aggregate unique labels
    const labelSet = new Set<string>();
    for (const post of posts) {
      for (const label of post.labels) {
        labelSet.add(label);
      }
    }

    return Array.from(labelSet).sort();
  },
});

/**
 * Sync all published public posts to search index
 * (Admin utility for initial indexing or re-indexing)
 */
export const syncAllPosts = action({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.runQuery(internal.search.getPublishedPublicPosts, {});

    let synced = 0;
    for (const post of posts) {
      await ctx.runAction(internal.search.syncPostToSearch, { postId: post._id });
      synced++;
    }

    return { synced };
  },
});

/**
 * Internal query to get all published public posts for sync
 */
export const getPublishedPublicPosts = internalQuery({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("blogPosts")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();

    return posts.filter((p) => p.visibility === "public");
  },
});
