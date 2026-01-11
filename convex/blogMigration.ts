import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  action,
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";

// GitHub raw content base URL
const GITHUB_BASE = "https://raw.githubusercontent.com/Nevvulo/blog/main";

// Blogmap type from GitHub
interface BlogmapPost {
  slug: string;
  title: string;
  description: string;
  image: string;
  createdAt: string;
  labels?: string[];
  location: string;
  difficulty?: string;
  reviewedBy?: string;
  author?: string;
  keyIdeas?: string[];
  coverAuthor?: string;
  coverAuthorUrl?: string;
  readTimeMins?: number;
  discussionId: string;
  discussionNo: string | number;
  mediumId: string;
  mediumUrl: string;
  hashnodeId: string;
  hashnodeUrl: string;
  devToUrl: string;
}

/**
 * Infer bento size based on post characteristics
 */
function inferBentoSize(
  post: BlogmapPost,
  index: number,
): "small" | "medium" | "large" | "banner" | "featured" {
  // First post is always featured
  if (index === 0) return "featured";

  // Long read time = large
  if (post.readTimeMins && post.readTimeMins >= 10) return "large";

  // Multiple labels = medium
  if (post.labels && post.labels.length >= 3) return "medium";

  // Has key ideas = medium
  if (post.keyIdeas && post.keyIdeas.length > 0) return "medium";

  // Default pattern: alternate between medium and small
  return index % 3 === 0 ? "large" : index % 2 === 0 ? "medium" : "small";
}

/**
 * Map difficulty string to valid enum
 */
function mapDifficulty(difficulty?: string): "beginner" | "intermediate" | "advanced" | undefined {
  if (!difficulty) return undefined;
  const lower = difficulty.toLowerCase();
  if (lower === "beginner") return "beginner";
  if (lower === "intermediate") return "intermediate";
  if (lower === "advanced") return "advanced";
  return undefined;
}

/**
 * Get the creator user's Clerk ID for migration
 */
export const getCreatorId = query({
  args: {},
  handler: async (ctx) => {
    // Find creator by Discord ID
    const creator = await ctx.db
      .query("users")
      .withIndex("by_discordId", (q) => q.eq("discordId", "246574843460321291"))
      .unique();

    if (!creator) {
      // Try by isCreator flag
      const users = await ctx.db.query("users").collect();
      const creatorUser = users.find((u) => u.isCreator);
      return creatorUser?.clerkId ?? null;
    }

    return creator.clerkId;
  },
});

/**
 * Internal query to get user by Clerk ID
 */
export const getUserByClerkId = internalQuery({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

/**
 * Check migration status
 */
export const getMigrationStatus = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db.query("blogPosts").collect();
    return {
      migratedCount: posts.length,
      posts: posts.map((p) => ({
        slug: p.slug,
        title: p.title,
        status: p.status,
      })),
    };
  },
});

/**
 * Migrate a single post (internal mutation)
 */
export const migrateSinglePost = internalMutation({
  args: {
    slug: v.string(),
    title: v.string(),
    description: v.string(),
    content: v.string(),
    coverImage: v.string(),
    coverAuthor: v.optional(v.string()),
    coverAuthorUrl: v.optional(v.string()),
    authorId: v.id("users"),
    labels: v.array(v.string()),
    difficulty: v.optional(
      v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
    ),
    readTimeMins: v.optional(v.number()),
    keyIdeas: v.optional(v.array(v.string())),
    location: v.optional(v.string()),
    bentoSize: v.union(
      v.literal("small"),
      v.literal("medium"),
      v.literal("large"),
      v.literal("banner"),
      v.literal("featured"),
    ),
    bentoOrder: v.number(),
    mediumUrl: v.optional(v.string()),
    hashnodeUrl: v.optional(v.string()),
    devToUrl: v.optional(v.string()),
    discussionId: v.optional(v.string()),
    discussionNo: v.optional(v.number()),
    publishedAt: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if already exists
    const existing = await ctx.db
      .query("blogPosts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (existing) {
      console.log(`Post ${args.slug} already exists, skipping`);
      return { status: "skipped", postId: existing._id };
    }

    const postId = await ctx.db.insert("blogPosts", {
      slug: args.slug,
      title: args.title,
      description: args.description,
      content: args.content,
      contentType: "article",
      coverImage: args.coverImage,
      coverAuthor: args.coverAuthor,
      coverAuthorUrl: args.coverAuthorUrl,
      authorId: args.authorId,
      labels: args.labels,
      difficulty: args.difficulty,
      readTimeMins: args.readTimeMins,
      keyIdeas: args.keyIdeas,
      location: args.location,
      status: "published",
      visibility: "public",
      bentoSize: args.bentoSize,
      bentoOrder: args.bentoOrder,
      mediumUrl: args.mediumUrl,
      hashnodeUrl: args.hashnodeUrl,
      devToUrl: args.devToUrl,
      discussionId: args.discussionId,
      discussionNo: args.discussionNo,
      viewCount: 0,
      publishedAt: args.publishedAt,
      createdAt: Date.now(),
    });

    console.log(`Migrated post: ${args.slug}`);
    return { status: "created", postId };
  },
});

/**
 * Main migration action - fetches from GitHub and migrates all posts
 */
export const migrateFromGitHub = action({
  args: {
    clerkId: v.string(), // Accept Clerk ID, look up Convex user internally
  },
  handler: async (ctx, args) => {
    console.log("Starting migration from GitHub...");
    const results: { slug: string; status: string; error?: string }[] = [];

    // Look up user by Clerk ID
    const user = await ctx.runQuery(internal.blogMigration.getUserByClerkId, {
      clerkId: args.clerkId,
    });
    if (!user) {
      throw new Error(`User with Clerk ID ${args.clerkId} not found`);
    }
    const authorId = user._id;

    try {
      // 1. Fetch blogmap.json
      console.log("Fetching blogmap.json...");
      const blogmapRes = await fetch(`${GITHUB_BASE}/blogmap.json`);
      if (!blogmapRes.ok) {
        throw new Error(`Failed to fetch blogmap.json: ${blogmapRes.status}`);
      }
      const blogmap: BlogmapPost[] = await blogmapRes.json();
      console.log(`Found ${blogmap.length} posts to migrate`);

      // 2. Process each post
      for (let i = 0; i < blogmap.length; i++) {
        const post = blogmap[i];
        if (!post) continue;
        console.log(`Processing ${i + 1}/${blogmap.length}: ${post.slug}`);

        try {
          // Fetch MDX content
          const mdxRes = await fetch(`${GITHUB_BASE}/posts/${post.slug}.mdx`);
          if (!mdxRes.ok) {
            throw new Error(`Failed to fetch MDX: ${mdxRes.status}`);
          }
          let mdxContent = await mdxRes.text();

          // Strip PROPERTIES section
          mdxContent = mdxContent.replace(/<!--\[PROPERTIES\][\s\S]*?-->/, "").trim();

          // Build cover image URL (keep as GitHub URL for now)
          const coverImage = `${GITHUB_BASE}/posts/assets/${post.slug}/${post.image}`;

          // Migrate the post
          const result = await ctx.runMutation(internal.blogMigration.migrateSinglePost, {
            slug: post.slug,
            title: post.title,
            description: post.description,
            content: mdxContent,
            coverImage,
            coverAuthor: post.coverAuthor,
            coverAuthorUrl: post.coverAuthorUrl,
            authorId: authorId,
            labels: post.labels ?? [],
            difficulty: mapDifficulty(post.difficulty),
            readTimeMins: post.readTimeMins,
            keyIdeas: post.keyIdeas,
            location: post.location,
            bentoSize: inferBentoSize(post, i),
            bentoOrder: i,
            mediumUrl: post.mediumUrl,
            hashnodeUrl: post.hashnodeUrl,
            devToUrl: post.devToUrl,
            discussionId: post.discussionId,
            discussionNo: post.discussionNo ? Number(post.discussionNo) : undefined,
            publishedAt: new Date(post.createdAt).getTime(),
          });

          results.push({ slug: post.slug, status: result.status });
        } catch (error) {
          console.error(`Error migrating ${post.slug}:`, error);
          results.push({
            slug: post.slug,
            status: "error",
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    } catch (error) {
      console.error("Migration failed:", error);
      throw error;
    }

    // Summary
    const created = results.filter((r) => r.status === "created").length;
    const skipped = results.filter((r) => r.status === "skipped").length;
    const errors = results.filter((r) => r.status === "error").length;

    console.log(`Migration complete: ${created} created, ${skipped} skipped, ${errors} errors`);

    return {
      success: errors === 0,
      created,
      skipped,
      errors,
      results,
    };
  },
});

// ============================================
// CONTENT SPLITTING MIGRATION (Bandwidth Optimization)
// ============================================

/**
 * Migrate content from blogPosts.content to separate blogPostContent table
 * This reduces list query bandwidth by ~95% (content not read for list queries)
 */
export const migrateContentToSeparateTable = internalMutation({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db.query("blogPosts").collect();
    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const post of posts) {
      // Check if content already exists in separate table
      const existingContent = await ctx.db
        .query("blogPostContent")
        .withIndex("by_post", (q) => q.eq("postId", post._id))
        .unique();

      if (existingContent) {
        skipped++;
        continue;
      }

      // Only migrate if post has content
      if (!post.content) {
        console.log(`Post ${post.slug} has no content, skipping`);
        skipped++;
        continue;
      }

      try {
        // Insert content into separate table
        await ctx.db.insert("blogPostContent", {
          postId: post._id,
          content: post.content,
        });
        migrated++;
      } catch (error) {
        console.error(`Error migrating content for ${post.slug}:`, error);
        errors++;
      }
    }

    console.log(
      `Content migration complete: ${migrated} migrated, ${skipped} skipped, ${errors} errors`,
    );
    return { migrated, skipped, errors, total: posts.length };
  },
});

/**
 * Verify content migration is complete
 */
export const verifyContentMigration = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db.query("blogPosts").collect();
    const contentRecords = await ctx.db.query("blogPostContent").collect();

    const contentByPostId = new Map<string, boolean>();
    for (const record of contentRecords) {
      contentByPostId.set(record.postId.toString(), true);
    }

    const postsWithoutContent: string[] = [];
    for (const post of posts) {
      if (!contentByPostId.has(post._id.toString())) {
        postsWithoutContent.push(post.slug);
      }
    }

    return {
      totalPosts: posts.length,
      contentRecords: contentRecords.length,
      postsWithoutContent,
      migrationComplete: postsWithoutContent.length === 0,
    };
  },
});

/**
 * Clear old content field from blogPosts after migration is verified
 * This is optional - the old content field is now ignored, but clearing it
 * could save some storage (though not bandwidth, since documents are still
 * read in full by Convex)
 */
export const clearOldContentField = internalMutation({
  args: { dryRun: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const posts = await ctx.db.query("blogPosts").collect();
    let cleared = 0;

    for (const post of posts) {
      if (post.content) {
        // Verify content exists in new table before clearing
        const contentRecord = await ctx.db
          .query("blogPostContent")
          .withIndex("by_post", (q) => q.eq("postId", post._id))
          .unique();

        if (!contentRecord) {
          console.log(`Skipping ${post.slug} - no content record exists`);
          continue;
        }

        if (!args.dryRun) {
          await ctx.db.patch(post._id, { content: undefined });
        }
        cleared++;
      }
    }

    return { cleared, dryRun: args.dryRun ?? false };
  },
});

/**
 * Run content migration action
 */
export const runContentMigration = action({
  args: {},
  handler: async (
    ctx,
  ): Promise<{ migrated: number; skipped: number; errors: number; total: number }> => {
    return await ctx.runMutation(internal.blogMigration.migrateContentToSeparateTable, {});
  },
});

/**
 * Clear all blog posts (for testing migration)
 * WARNING: This deletes all posts and associated data!
 */
export const clearAllPosts = action({
  args: {},
  handler: async (ctx): Promise<{ deleted: number }> => {
    // Use internal mutation to actually delete
    return await ctx.runMutation(internal.blogMigration.clearAllPostsInternal, {});
  },
});

/**
 * Internal mutation to clear posts
 */
export const clearAllPostsInternal = internalMutation({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db.query("blogPosts").collect();
    for (const post of posts) {
      // Delete associated data
      const views = await ctx.db
        .query("blogViews")
        .withIndex("by_post", (q) => q.eq("postId", post._id))
        .collect();
      for (const view of views) {
        await ctx.db.delete(view._id);
      }

      const comments = await ctx.db
        .query("blogComments")
        .withIndex("by_post", (q) => q.eq("postId", post._id))
        .collect();
      for (const comment of comments) {
        await ctx.db.delete(comment._id);
      }

      const reactions = await ctx.db
        .query("blogReactions")
        .withIndex("by_post", (q) => q.eq("postId", post._id))
        .collect();
      for (const reaction of reactions) {
        await ctx.db.delete(reaction._id);
      }

      const interactions = await ctx.db
        .query("blogInteractions")
        .withIndex("by_post", (q) => q.eq("postId", post._id))
        .collect();
      for (const interaction of interactions) {
        await ctx.db.delete(interaction._id);
      }

      await ctx.db.delete(post._id);
    }

    return { deleted: posts.length };
  },
});
