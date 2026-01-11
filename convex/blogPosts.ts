import { v } from "convex/values";
import { query, mutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { getCurrentUser, requireUser, requireCreator, hasAccessToTier, isCreator } from "./auth";
import { Doc, Id } from "./_generated/dataModel";

// Content type validator
const contentTypeValidator = v.union(
  v.literal("article"),
  v.literal("video"),
  v.literal("news")
);

// Status validator
const statusValidator = v.union(
  v.literal("draft"),
  v.literal("published"),
  v.literal("archived")
);

// Visibility validator
const visibilityValidator = v.union(
  v.literal("public"),
  v.literal("members"),
  v.literal("tier1"),
  v.literal("tier2")
);

// Bento size validator
const bentoSizeValidator = v.union(
  v.literal("small"),
  v.literal("medium"),
  v.literal("large"),
  v.literal("banner"),
  v.literal("featured")
);

// Difficulty validator
const difficultyValidator = v.union(
  v.literal("beginner"),
  v.literal("intermediate"),
  v.literal("advanced")
);

// AI disclosure status validator
const aiDisclosureStatusValidator = v.union(
  v.literal("none"),
  v.literal("llm-assisted"),
  v.literal("llm-reviewed")
);

/**
 * Check if user has access to a post based on visibility
 */
function canAccessPost(
  user: Doc<"users"> | null,
  visibility: "public" | "members" | "tier1" | "tier2"
): boolean {
  if (visibility === "public") return true;
  if (!user) return false;
  if (visibility === "members") return true; // Logged in
  return hasAccessToTier(user.tier, visibility);
}

/**
 * Fetch content from separate table (bandwidth optimization)
 * Falls back to post.content for backward compatibility during migration
 */
async function getPostContent(ctx: any, postId: Id<"blogPosts">, fallbackContent?: string): Promise<string> {
  const contentDoc = await ctx.db
    .query("blogPostContent")
    .withIndex("by_post", (q: any) => q.eq("postId", postId))
    .unique();
  return contentDoc?.content ?? fallbackContent ?? "";
}

/**
 * Get author info for a post
 */
async function getAuthorInfo(ctx: any, authorId: Id<"users">) {
  const author = await ctx.db.get(authorId);
  if (!author) return null;
  return {
    _id: author._id,
    displayName: author.displayName,
    username: author.username,
    avatarUrl: author.avatarUrl,
    tier: author.tier,
    isCreator: author.isCreator,
  };
}

/**
 * Batch fetch authors to avoid N+1 queries
 * Returns a Map of authorId -> author info for efficient lookup
 */
async function batchGetAuthors(ctx: any, authorIds: Id<"users">[]) {
  // Dedupe author IDs
  const uniqueIds = [...new Set(authorIds.map(id => id.toString()))].map(id => id as unknown as Id<"users">);

  // Fetch all authors in parallel
  const authors = await Promise.all(uniqueIds.map(id => ctx.db.get(id)));

  // Build lookup map
  const authorMap = new Map<string, {
    _id: Id<"users">;
    displayName: string;
    username?: string;
    avatarUrl?: string;
    tier?: string;
    isCreator?: boolean;
  } | null>();

  for (let i = 0; i < uniqueIds.length; i++) {
    const author = authors[i];
    if (author) {
      authorMap.set(uniqueIds[i].toString(), {
        _id: author._id,
        displayName: author.displayName,
        username: author.username,
        avatarUrl: author.avatarUrl,
        tier: author.tier,
        isCreator: author.isCreator,
      });
    } else {
      authorMap.set(uniqueIds[i].toString(), null);
    }
  }

  return authorMap;
}

// ============================================
// QUERIES
// ============================================

/**
 * List all blog posts (admin view)
 */
export const list = query({
  args: {
    status: v.optional(statusValidator),
    visibility: v.optional(visibilityValidator),
    contentType: v.optional(contentTypeValidator),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireCreator(ctx);

    let postsQuery = ctx.db
      .query("blogPosts")
      .order("desc");

    const posts = await postsQuery.collect();

    // Filter in JS for flexibility (Convex doesn't support multiple filters well)
    let filtered = posts;
    if (args.status) {
      filtered = filtered.filter((p) => p.status === args.status);
    }
    if (args.visibility) {
      filtered = filtered.filter((p) => p.visibility === args.visibility);
    }
    if (args.contentType) {
      filtered = filtered.filter((p) => p.contentType === args.contentType);
    }

    const limit = args.limit ?? 100;
    filtered = filtered.slice(0, limit);

    // Add author info
    const postsWithAuthors = await Promise.all(
      filtered.map(async (post) => ({
        ...post,
        author: await getAuthorInfo(ctx, post.authorId),
      }))
    );

    return postsWithAuthors;
  },
});

/**
 * List published posts for public view (bento grid)
 */
export const listPublished = query({
  args: {
    contentType: v.optional(contentTypeValidator),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const posts = await ctx.db
      .query("blogPosts")
      .withIndex("by_bentoOrder")
      .order("asc")
      .collect();

    // Filter to published only and accessible by user
    const accessible = posts.filter((post) => {
      if (post.status !== "published") return false;
      return canAccessPost(user, post.visibility);
    });

    // Filter by content type if specified
    let filtered = accessible;
    if (args.contentType) {
      filtered = filtered.filter((p) => p.contentType === args.contentType);
    }

    // Only apply limit if explicitly specified (no default - return all for admin)
    if (args.limit) {
      filtered = filtered.slice(0, args.limit);
    }

    // Add author info
    const postsWithAuthors = await Promise.all(
      filtered.map(async (post) => ({
        ...post,
        author: await getAuthorInfo(ctx, post.authorId),
      }))
    );

    return postsWithAuthors;
  },
});

/**
 * Get a single post by ID (includes content from separate table)
 */
export const get = query({
  args: { postId: v.id("blogPosts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) return null;

    const user = await getCurrentUser(ctx);

    // Check access
    if (post.status === "draft") {
      // Only creator can see drafts
      if (!user || !isCreator(user)) return null;
    } else if (post.status === "published") {
      if (!canAccessPost(user, post.visibility)) return null;
    } else {
      // Archived - only creator
      if (!user || !isCreator(user)) return null;
    }

    // Fetch content from separate table (bandwidth optimization)
    const content = await getPostContent(ctx, post._id, post.content);
    const author = await getAuthorInfo(ctx, post.authorId);
    return { ...post, content, author };
  },
});

// Cutoff timestamp: Nov 30, 2022 00:00:00 UTC (before LLMs became popular)
const PRE_LLM_CUTOFF = 1669766400000;

/**
 * Get posts published before LLMs became popular (Nov 30, 2022)
 * Used for AI disclosure page to show pre-AI content
 */
export const getPreLLMPosts = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("blogPosts")
      .collect();

    // Filter to published posts before the cutoff date
    const preLLMPosts = posts
      .filter((post) => {
        if (post.status !== "published") return false;
        const publishedAt = post.publishedAt ?? post.createdAt;
        return publishedAt < PRE_LLM_CUTOFF;
      })
      .sort((a, b) => (b.publishedAt ?? b.createdAt) - (a.publishedAt ?? a.createdAt))
      .slice(0, args.limit ?? 10);

    return preLLMPosts.map((post) => ({
      _id: post._id,
      slug: post.slug,
      title: post.title,
      description: post.description,
      publishedAt: post.publishedAt ?? post.createdAt,
      labels: post.labels,
      coverImage: post.coverImage,
    }));
  },
});

/**
 * Get a post by slug for editing (checks edit access)
 * Used by /editor/content/[slug] for both creators and collaborators
 */
export const getBySlugForEdit = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const post = await ctx.db
      .query("blogPosts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!post) return null;

    const user = await getCurrentUser(ctx);

    // Check if user can edit (creator, author, or collaborator)
    const hasEditAccess =
      user &&
      (isCreator(user) ||
        post.authorId === user._id ||
        post.collaborators?.includes(user._id));

    if (!hasEditAccess) return null;

    // Fetch content from separate table (bandwidth optimization)
    const content = await getPostContent(ctx, post._id, post.content);
    const author = await getAuthorInfo(ctx, post.authorId);
    const collaborators = post.collaborators
      ? await Promise.all(
          post.collaborators.map((id) => getAuthorInfo(ctx, id))
        ).then((results) => results.filter(Boolean))
      : [];

    return { ...post, content, author, collaborators };
  },
});

/**
 * Get a post by slug (for public pages - includes content)
 */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const post = await ctx.db
      .query("blogPosts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!post) return null;

    const user = await getCurrentUser(ctx);

    // Check access
    if (post.status === "draft") {
      if (!user || !isCreator(user)) return null;
    } else if (post.status === "published") {
      if (!canAccessPost(user, post.visibility)) return null;
    } else {
      if (!user || !isCreator(user)) return null;
    }

    // Fetch content from separate table (bandwidth optimization)
    const content = await getPostContent(ctx, post._id, post.content);
    const author = await getAuthorInfo(ctx, post.authorId);

    // Fetch collaborator info
    const collaborators = post.collaborators
      ? await Promise.all(
          post.collaborators.map((id) => getAuthorInfo(ctx, id))
        ).then((results) => results.filter(Boolean))
      : [];

    return { ...post, content, author, collaborators };
  },
});

/**
 * Get all published slugs (for static generation)
 */
export const listSlugs = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("blogPosts")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();

    // Only return public posts for static paths
    return posts
      .filter((p) => p.visibility === "public")
      .map((p) => p.slug);
  },
});

/**
 * Get posts for bento grid with layout info
 * Can filter by contentType to separate news from articles/videos
 * OPTIMIZED: Minimal fields returned - no author/difficulty (not displayed on cards)
 */
export const getForBento = query({
  args: {
    contentType: v.optional(contentTypeValidator),
    excludeNews: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    // Use index for published posts only - more efficient than full scan + JS filter
    const posts = await ctx.db
      .query("blogPosts")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();

    // Sort by bentoOrder (can't use two indexes, so sort in memory)
    posts.sort((a, b) => a.bentoOrder - b.bentoOrder);

    // Filter to accessible posts
    let accessible = posts.filter((post) => canAccessPost(user, post.visibility));

    // Filter by content type if specified
    if (args.contentType) {
      accessible = accessible.filter((p) => p.contentType === args.contentType);
    }

    // Exclude news posts if requested (for articles grid)
    if (args.excludeNews) {
      accessible = accessible.filter((p) => p.contentType !== "news");
    }

    // Build result with MINIMAL fields (no author lookup - not displayed on cards)
    // Fields: only what BentoCard actually uses + viewCount for recommendations
    const bentoPosts = accessible.map((post) => ({
      _id: post._id,
      slug: post.slug,
      title: post.title,
      description: post.description,
      contentType: post.contentType,
      coverImage: post.coverImage,
      youtubeId: post.youtubeId,
      labels: post.labels,
      // difficulty removed - not displayed on BentoCard
      readTimeMins: post.readTimeMins,
      bentoSize: post.bentoSize,
      // bentoOrder removed - only needed for sorting (done server-side)
      viewCount: post.viewCount, // kept for recommendations API
      publishedAt: post.publishedAt,
      // author removed - not displayed on BentoCard
    }));

    return bentoPosts;
  },
});

export const getForBentoPersonalized = query({
  args: {
    excludeNews: v.optional(v.boolean()),
    recommendationScores: v.optional(v.array(v.object({
      slug: v.string(),
      score: v.number(),
    }))),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const posts = await ctx.db
      .query("blogPosts")
      .withIndex("by_bentoOrder")
      .order("asc")
      .collect();

    let accessible = posts.filter((post) => {
      if (post.status !== "published") return false;
      return canAccessPost(user, post.visibility);
    });

    if (args.excludeNews) {
      accessible = accessible.filter((p) => p.contentType !== "news");
    }

    const scoreMap = new Map<string, number>();
    if (args.recommendationScores) {
      for (const { slug, score } of args.recommendationScores) {
        scoreMap.set(slug, score);
      }
    }

    const hasPersonalization = scoreMap.size > 0 && user;

    let orderedPosts = accessible;

    if (hasPersonalization) {
      // STEP 1: Separate featured posts - they ALWAYS come first
      const featuredPosts: typeof accessible = [];
      const nonFeaturedPosts: { post: typeof accessible[0]; bentoIndex: number }[] = [];

      accessible.forEach((post, bentoIndex) => {
        if (post.bentoSize === "featured") {
          featuredPosts.push(post);
        } else {
          nonFeaturedPosts.push({ post, bentoIndex });
        }
      });

      // STEP 2: Apply bounded position shifts to non-featured posts only
      const maxRecScore = Math.max(...Array.from(scoreMap.values()), 0.01);
      const MAX_POSITION_SHIFT = 5;

      const scoredNonFeatured = nonFeaturedPosts.map(({ post, bentoIndex }) => {
        const recScore = scoreMap.get(post.slug) ?? 0;
        const normalizedRecScore = recScore / maxRecScore;

        // Can shift UP by max 5 positions based on rec score
        const adjustedIndex = bentoIndex - featuredPosts.length;
        const positionShift = -normalizedRecScore * MAX_POSITION_SHIFT;

        return { ...post, bentoIndex, recScore, sortKey: adjustedIndex + positionShift };
      });

      // Sort non-featured by adjusted sortKey
      scoredNonFeatured.sort((a, b) => a.sortKey - b.sortKey);

      // Size boost for highly recommended non-featured posts
      for (const post of scoredNonFeatured) {
        if (post.recScore > maxRecScore * 0.5) {
          if (post.bentoSize === "small") {
            (post as any).bentoSize = "medium";
          } else if (post.bentoSize === "medium") {
            (post as any).bentoSize = "large";
          }
        }
      }

      // STEP 3: Combine - featured posts FIRST, then sorted non-featured
      orderedPosts = [...featuredPosts, ...scoredNonFeatured];
    }

    // Build result with MINIMAL fields (no author lookup - not displayed on cards)
    const bentoPosts = orderedPosts.map((post) => ({
      _id: post._id,
      slug: post.slug,
      title: post.title,
      description: post.description,
      contentType: post.contentType,
      coverImage: post.coverImage,
      youtubeId: post.youtubeId,
      labels: post.labels,
      readTimeMins: post.readTimeMins,
      bentoSize: post.bentoSize,
      viewCount: post.viewCount,
      publishedAt: post.publishedAt,
    }));

    return bentoPosts;
  },
});

/**
 * Paginated version of getForBentoPersonalized for infinite scroll
 * Returns posts in batches with cursor-based pagination
 * OPTIMIZED: Minimal fields returned - no author/difficulty (not displayed on cards)
 */
export const getForBentoPaginated = query({
  args: {
    excludeNews: v.optional(v.boolean()),
    recommendationScores: v.optional(v.array(v.object({
      slug: v.string(),
      score: v.number(),
    }))),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const limit = args.limit ?? 20;
    const offset = args.offset ?? 0;

    const posts = await ctx.db
      .query("blogPosts")
      .withIndex("by_bentoOrder")
      .order("asc")
      .collect();

    let accessible = posts.filter((post) => {
      if (post.status !== "published") return false;
      return canAccessPost(user, post.visibility);
    });

    if (args.excludeNews) {
      accessible = accessible.filter((p) => p.contentType !== "news");
    }

    const scoreMap = new Map<string, number>();
    if (args.recommendationScores) {
      for (const { slug, score } of args.recommendationScores) {
        scoreMap.set(slug, score);
      }
    }

    const hasPersonalization = scoreMap.size > 0 && user;

    let orderedPosts = accessible;

    if (hasPersonalization) {
      // STEP 1: Separate featured posts - they ALWAYS come first
      const featuredPosts: typeof accessible = [];
      const nonFeaturedPosts: { post: typeof accessible[0]; bentoIndex: number }[] = [];

      accessible.forEach((post, bentoIndex) => {
        if (post.bentoSize === "featured") {
          featuredPosts.push(post);
        } else {
          nonFeaturedPosts.push({ post, bentoIndex });
        }
      });

      // STEP 2: Apply bounded position shifts to non-featured posts only
      const maxRecScore = Math.max(...Array.from(scoreMap.values()), 0.01);
      const MAX_POSITION_SHIFT = 5;

      const scoredNonFeatured = nonFeaturedPosts.map(({ post, bentoIndex }) => {
        const recScore = scoreMap.get(post.slug) ?? 0;
        const normalizedRecScore = recScore / maxRecScore;

        // Can shift UP by max 5 positions based on rec score
        const adjustedIndex = bentoIndex - featuredPosts.length;
        const positionShift = -normalizedRecScore * MAX_POSITION_SHIFT;

        return { ...post, bentoIndex, recScore, sortKey: adjustedIndex + positionShift };
      });

      // Sort non-featured by adjusted sortKey
      scoredNonFeatured.sort((a, b) => a.sortKey - b.sortKey);

      // Size boost for highly recommended non-featured posts
      for (const post of scoredNonFeatured) {
        if (post.recScore > maxRecScore * 0.5) {
          if (post.bentoSize === "small") {
            (post as any).bentoSize = "medium";
          } else if (post.bentoSize === "medium") {
            (post as any).bentoSize = "large";
          }
        }
      }

      // STEP 3: Combine - featured posts FIRST, then sorted non-featured
      orderedPosts = [...featuredPosts, ...scoredNonFeatured];
    }

    // Get total count before slicing
    const totalCount = orderedPosts.length;

    // Apply pagination
    const paginatedPosts = orderedPosts.slice(offset, offset + limit);
    const hasMore = offset + limit < totalCount;

    // Build result with MINIMAL fields (no author lookup - not displayed on cards)
    const bentoPosts = paginatedPosts.map((post) => ({
      _id: post._id,
      slug: post.slug,
      title: post.title,
      description: post.description,
      contentType: post.contentType,
      coverImage: post.coverImage,
      youtubeId: post.youtubeId,
      labels: post.labels,
      readTimeMins: post.readTimeMins,
      bentoSize: post.bentoSize,
      viewCount: post.viewCount,
      publishedAt: post.publishedAt,
    }));

    return {
      posts: bentoPosts,
      hasMore,
      totalCount,
      nextOffset: hasMore ? offset + limit : null,
    };
  },
});

/**
 * Debug query for ranking visibility - shows all scoring info
 * Only accessible to creators
 */
export const getForBentoDebug = query({
  args: {
    excludeNews: v.optional(v.boolean()),
    recommendationScores: v.optional(v.array(v.object({
      slug: v.string(),
      score: v.number(),
    }))),
  },
  handler: async (ctx, args) => {
    const user = await requireCreator(ctx);

    const posts = await ctx.db
      .query("blogPosts")
      .withIndex("by_bentoOrder")
      .order("asc")
      .collect();

    let accessible = posts.filter((post) => {
      if (post.status !== "published") return false;
      return canAccessPost(user, post.visibility);
    });

    if (args.excludeNews) {
      accessible = accessible.filter((p) => p.contentType !== "news");
    }

    const scoreMap = new Map<string, number>();
    if (args.recommendationScores) {
      for (const { slug, score } of args.recommendationScores) {
        scoreMap.set(slug, score);
      }
    }

    const hasPersonalization = scoreMap.size > 0;
    const maxRecScore = Math.max(...Array.from(scoreMap.values()), 0.01);
    const MAX_POSITION_SHIFT = 5;

    // Build debug info for all posts
    const debugPosts = accessible.map((post, bentoIndex) => {
      const recScore = scoreMap.get(post.slug) ?? 0;
      const normalizedRecScore = recScore / maxRecScore;
      const isFeatured = post.bentoSize === "featured";

      let sortKey: number;
      let positionShift: number;
      let reason: string;

      if (isFeatured) {
        sortKey = -1000 + bentoIndex;
        positionShift = 0;
        reason = "FEATURED - Locked at top, ignores recommendations";
      } else if (!hasPersonalization) {
        sortKey = bentoIndex;
        positionShift = 0;
        reason = "No personalization - using pure bento order";
      } else {
        positionShift = -normalizedRecScore * MAX_POSITION_SHIFT;
        sortKey = bentoIndex + positionShift;
        if (recScore === 0) {
          reason = "No recommendation data - stays at bento position";
        } else {
          reason = `Rec score ${recScore.toFixed(3)} (${(normalizedRecScore * 100).toFixed(1)}% of max) → shift up ${Math.abs(positionShift).toFixed(1)} positions`;
        }
      }

      return {
        _id: post._id,
        slug: post.slug,
        title: post.title,
        contentType: post.contentType,
        bentoSize: post.bentoSize,
        bentoOrder: post.bentoOrder,
        bentoIndex,
        viewCount: post.viewCount,
        publishedAt: post.publishedAt,
        // Debug info
        debug: {
          recScore,
          normalizedRecScore,
          maxRecScore,
          positionShift,
          sortKey,
          isFeatured,
          reason,
          hasPersonalization,
        },
      };
    });

    // Sort same as the real query
    debugPosts.sort((a, b) => a.debug.sortKey - b.debug.sortKey);

    // Add final rank
    const withRank = debugPosts.map((post, finalRank) => ({
      ...post,
      debug: {
        ...post.debug,
        finalRank,
        rankChange: post.bentoIndex - finalRank,
      },
    }));

    return {
      posts: withRank,
      meta: {
        totalPosts: withRank.length,
        featuredCount: withRank.filter(p => p.debug.isFeatured).length,
        hasPersonalization,
        maxRecScore,
        maxPositionShift: MAX_POSITION_SHIFT,
      },
    };
  },
});

/**
 * Internal query to get post without auth (for migration/actions)
 * Includes content from separate table
 */
export const getInternal = internalQuery({
  args: { postId: v.id("blogPosts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) return null;
    const content = await getPostContent(ctx, post._id, post.content);
    return { ...post, content };
  },
});

/**
 * Get posts by slugs for recommendations
 * OPTIMIZED: Uses by_slug index for direct lookups instead of full table scan
 */
export const getPostsBySlugs = query({
  args: {
    slugs: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    // Use by_slug index for each slug - much more efficient than scanning all published posts
    const postPromises = args.slugs.map(slug =>
      ctx.db
        .query("blogPosts")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first()
    );

    const allPosts = await Promise.all(postPromises);

    // Filter to published, accessible posts (maintain original order from args.slugs)
    const posts = allPosts.filter((post): post is NonNullable<typeof post> =>
      post !== null &&
      post.status === "published" &&
      canAccessPost(user, post.visibility)
    );

    // Build result with MINIMAL fields (no author lookup - not needed for recommendations)
    const result = posts.map((post) => ({
      _id: post._id,
      slug: post.slug,
      title: post.title,
      description: post.description,
      contentType: post.contentType,
      coverImage: post.coverImage,
      labels: post.labels,
      readTimeMins: post.readTimeMins,
      viewCount: post.viewCount,
      publishedAt: post.publishedAt,
    }));

    return result;
  },
});

/**
 * Get analytics for admin
 */
export const getAnalytics = query({
  args: {},
  handler: async (ctx) => {
    await requireCreator(ctx);

    const allPosts = await ctx.db.query("blogPosts").collect();
    const views = await ctx.db.query("blogViews").collect();
    const comments = await ctx.db.query("blogComments").collect();
    const reactions = await ctx.db.query("blogReactions").collect();

    // Count by status
    const byStatus = {
      draft: allPosts.filter((p) => p.status === "draft").length,
      published: allPosts.filter((p) => p.status === "published").length,
      archived: allPosts.filter((p) => p.status === "archived").length,
    };

    // Count by content type
    const byContentType = {
      article: allPosts.filter((p) => p.contentType === "article").length,
      video: allPosts.filter((p) => p.contentType === "video").length,
      news: allPosts.filter((p) => p.contentType === "news").length,
    };

    // Total views
    const totalViews = allPosts.reduce((sum, p) => sum + p.viewCount, 0);

    // Top posts by views
    const topPosts = [...allPosts]
      .filter((p) => p.status === "published")
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 5)
      .map((p) => ({
        _id: p._id,
        title: p.title,
        slug: p.slug,
        viewCount: p.viewCount,
      }));

    return {
      totalPosts: allPosts.length,
      byStatus,
      byContentType,
      totalViews,
      totalComments: comments.filter((c) => !c.isDeleted).length,
      totalReactions: reactions.length,
      topPosts,
    };
  },
});

/**
 * Get posts by user (authored or collaborated on)
 * For profile page article contributions section
 * OPTIMIZED: Uses by_author index + batch author lookups
 */
export const getByUserContributions = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get posts where user is author using the by_author index (efficient)
    const authoredPosts = await ctx.db
      .query("blogPosts")
      .withIndex("by_author", (q) => q.eq("authorId", args.userId))
      .collect();

    // Filter to published only
    const publishedAuthored = authoredPosts.filter(p => p.status === "published");

    // For collaborator posts, we need to scan published posts (collaborators is an array)
    // This is less efficient but collaborators are rare
    const publishedPosts = await ctx.db
      .query("blogPosts")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();

    const collaboratedPosts = publishedPosts.filter(
      (post) =>
        post.authorId !== args.userId && // Not already in authored list
        post.collaborators?.includes(args.userId)
    );

    // Combine and dedupe
    const allUserPosts = [...publishedAuthored, ...collaboratedPosts];

    // Sort by publishedAt descending
    allUserPosts.sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0));

    // Batch fetch all authors at once (avoids N+1 queries)
    const authorIds = allUserPosts.map(p => p.authorId);
    const authorsMap = await batchGetAuthors(ctx, authorIds);

    const result = allUserPosts.map((post) => ({
      _id: post._id,
      slug: post.slug,
      title: post.title,
      description: post.description,
      contentType: post.contentType,
      coverImage: post.coverImage,
      readTimeMins: post.readTimeMins,
      publishedAt: post.publishedAt,
      isAuthor: post.authorId === args.userId,
      author: authorsMap.get(post.authorId.toString()) ?? null,
    }));

    return result;
  },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Create a new blog post (creator only)
 */
export const create = mutation({
  args: {
    slug: v.string(),
    title: v.string(),
    description: v.string(),
    content: v.string(),
    contentType: contentTypeValidator,
    coverImage: v.optional(v.string()),
    coverAuthor: v.optional(v.string()),
    coverAuthorUrl: v.optional(v.string()),
    coverGradientIntensity: v.optional(v.number()),
    youtubeId: v.optional(v.string()),
    labels: v.array(v.string()),
    difficulty: v.optional(difficultyValidator),
    readTimeMins: v.optional(v.number()),
    keyIdeas: v.optional(v.array(v.string())),
    location: v.optional(v.string()),
    aiDisclosureStatus: v.optional(aiDisclosureStatusValidator),
    visibility: visibilityValidator,
    bentoSize: bentoSizeValidator,
    // Optional: publish immediately
    publish: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireCreator(ctx);

    // Check slug uniqueness
    const existing = await ctx.db
      .query("blogPosts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (existing) {
      throw new Error(`A post with slug "${args.slug}" already exists`);
    }

    // Validate video posts have youtubeId
    if (args.contentType === "video" && !args.youtubeId) {
      throw new Error("Video posts require a YouTube ID");
    }

    const status = args.publish ? "published" : "draft";
    const publishedAt = args.publish ? Date.now() : undefined;

    // For published posts, put at the front (bentoOrder: 0) and shift existing posts
    // For drafts, put at the end so they don't disrupt ordering when published later
    let bentoOrder: number;
    if (args.publish) {
      // Shift all existing posts' bentoOrder up by 1
      const allPosts = await ctx.db.query("blogPosts").collect();
      for (const post of allPosts) {
        await ctx.db.patch(post._id, { bentoOrder: post.bentoOrder + 1 });
      }
      bentoOrder = 0; // New published post goes to front
    } else {
      // For drafts, put at the end
      const allPosts = await ctx.db.query("blogPosts").collect();
      const maxOrder = allPosts.reduce((max, p) => Math.max(max, p.bentoOrder), -1);
      bentoOrder = maxOrder + 1;
    }

    // Create post without content (content goes to separate table)
    const postId = await ctx.db.insert("blogPosts", {
      slug: args.slug,
      title: args.title,
      description: args.description,
      // content NOT stored here - goes to blogPostContent table
      contentType: args.contentType,
      coverImage: args.coverImage,
      coverAuthor: args.coverAuthor,
      coverAuthorUrl: args.coverAuthorUrl,
      coverGradientIntensity: args.coverGradientIntensity,
      youtubeId: args.youtubeId,
      authorId: user._id,
      labels: args.labels,
      difficulty: args.difficulty,
      readTimeMins: args.readTimeMins,
      keyIdeas: args.keyIdeas,
      location: args.location,
      aiDisclosureStatus: args.aiDisclosureStatus,
      status,
      visibility: args.visibility,
      bentoSize: args.bentoSize,
      bentoOrder,
      viewCount: 0,
      publishedAt,
      createdAt: Date.now(),
    });

    // Store content in separate table (bandwidth optimization)
    await ctx.db.insert("blogPostContent", {
      postId,
      content: args.content,
    });

    return postId;
  },
});

/**
 * Update a blog post (creator only)
 */
export const update = mutation({
  args: {
    postId: v.id("blogPosts"),
    slug: v.optional(v.string()),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    content: v.optional(v.string()),
    contentType: v.optional(contentTypeValidator),
    coverImage: v.optional(v.string()),
    coverAuthor: v.optional(v.string()),
    coverAuthorUrl: v.optional(v.string()),
    coverGradientIntensity: v.optional(v.number()),
    youtubeId: v.optional(v.string()),
    labels: v.optional(v.array(v.string())),
    difficulty: v.optional(difficultyValidator),
    readTimeMins: v.optional(v.number()),
    keyIdeas: v.optional(v.array(v.string())),
    location: v.optional(v.string()),
    aiDisclosureStatus: v.optional(aiDisclosureStatusValidator),
    visibility: v.optional(visibilityValidator),
    bentoSize: v.optional(bentoSizeValidator),
    // Legacy external links
    mediumUrl: v.optional(v.string()),
    hashnodeUrl: v.optional(v.string()),
    devToUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    // Check slug uniqueness if changing
    if (args.slug && args.slug !== post.slug) {
      const newSlug = args.slug;
      const existing = await ctx.db
        .query("blogPosts")
        .withIndex("by_slug", (q) => q.eq("slug", newSlug))
        .unique();

      if (existing) {
        throw new Error(`A post with slug "${newSlug}" already exists`);
      }
    }

    // Build update object (only include defined fields)
    // NOTE: content is handled separately in blogPostContent table
    const updates: Partial<Doc<"blogPosts">> = {
      updatedAt: Date.now(),
    };

    if (args.slug !== undefined) updates.slug = args.slug;
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    // content is NOT updated here - handled below
    if (args.contentType !== undefined) updates.contentType = args.contentType;
    if (args.coverImage !== undefined) updates.coverImage = args.coverImage;
    if (args.coverAuthor !== undefined) updates.coverAuthor = args.coverAuthor;
    if (args.coverAuthorUrl !== undefined) updates.coverAuthorUrl = args.coverAuthorUrl;
    if (args.coverGradientIntensity !== undefined) updates.coverGradientIntensity = args.coverGradientIntensity;
    if (args.youtubeId !== undefined) updates.youtubeId = args.youtubeId;
    if (args.labels !== undefined) updates.labels = args.labels;
    if (args.difficulty !== undefined) updates.difficulty = args.difficulty;
    if (args.readTimeMins !== undefined) updates.readTimeMins = args.readTimeMins;
    if (args.keyIdeas !== undefined) updates.keyIdeas = args.keyIdeas;
    if (args.location !== undefined) updates.location = args.location;
    if (args.aiDisclosureStatus !== undefined) updates.aiDisclosureStatus = args.aiDisclosureStatus;
    if (args.visibility !== undefined) updates.visibility = args.visibility;
    if (args.bentoSize !== undefined) updates.bentoSize = args.bentoSize;
    if (args.mediumUrl !== undefined) updates.mediumUrl = args.mediumUrl;
    if (args.hashnodeUrl !== undefined) updates.hashnodeUrl = args.hashnodeUrl;
    if (args.devToUrl !== undefined) updates.devToUrl = args.devToUrl;

    await ctx.db.patch(args.postId, updates);

    // Update content in separate table if provided
    if (args.content !== undefined) {
      const existingContent = await ctx.db
        .query("blogPostContent")
        .withIndex("by_post", (q) => q.eq("postId", args.postId))
        .unique();

      if (existingContent) {
        await ctx.db.patch(existingContent._id, { content: args.content });
      } else {
        // Create content record if it doesn't exist (migration scenario)
        await ctx.db.insert("blogPostContent", {
          postId: args.postId,
          content: args.content,
        });
      }
    }
  },
});

/**
 * Publish a draft post (creator only)
 * Moves the post to the front of the bento grid
 */
export const publish = mutation({
  args: { postId: v.id("blogPosts") },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    if (post.status === "published") {
      throw new Error("Post is already published");
    }

    // Shift all existing posts' bentoOrder up by 1 to make room at the front
    const allPosts = await ctx.db.query("blogPosts").collect();
    for (const p of allPosts) {
      if (p._id !== args.postId) {
        await ctx.db.patch(p._id, { bentoOrder: p.bentoOrder + 1 });
      }
    }

    await ctx.db.patch(args.postId, {
      status: "published",
      publishedAt: Date.now(),
      updatedAt: Date.now(),
      bentoOrder: 0, // Put newly published post at the front
    });

    // Sync to search index
    await ctx.scheduler.runAfter(0, internal.search.syncPostToSearch, { postId: args.postId });

    // Publish to Discord (if enabled)
    await ctx.scheduler.runAfter(0, internal.blogDiscord.publishToDiscord, { postId: args.postId });

    // Invalidate bento cache (content changed)
    await ctx.scheduler.runAfter(0, internal.cache.invalidateBentoCache, {});
  },
});

/**
 * Unpublish a post (set to draft)
 */
export const unpublish = mutation({
  args: { postId: v.id("blogPosts") },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    await ctx.db.patch(args.postId, {
      status: "draft",
      updatedAt: Date.now(),
    });

    // Remove from search index
    await ctx.scheduler.runAfter(0, internal.search.removePostFromSearch, { slug: post.slug });

    // Invalidate bento cache (content changed)
    await ctx.scheduler.runAfter(0, internal.cache.invalidateBentoCache, {});
  },
});

/**
 * Archive a post
 */
export const archive = mutation({
  args: { postId: v.id("blogPosts") },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    await ctx.db.patch(args.postId, {
      status: "archived",
      updatedAt: Date.now(),
    });

    // Remove from search index
    await ctx.scheduler.runAfter(0, internal.search.removePostFromSearch, { slug: post.slug });

    // Invalidate bento cache (content changed)
    await ctx.scheduler.runAfter(0, internal.cache.invalidateBentoCache, {});
  },
});

/**
 * Delete a post permanently
 */
export const deletePost = mutation({
  args: { postId: v.id("blogPosts") },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    // Delete associated data
    const views = await ctx.db
      .query("blogViews")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
    for (const view of views) {
      await ctx.db.delete(view._id);
    }

    const comments = await ctx.db
      .query("blogComments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    const reactions = await ctx.db
      .query("blogReactions")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
    for (const reaction of reactions) {
      await ctx.db.delete(reaction._id);
    }

    const interactions = await ctx.db
      .query("blogInteractions")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
    for (const interaction of interactions) {
      await ctx.db.delete(interaction._id);
    }

    // Remove from search index before deleting
    await ctx.scheduler.runAfter(0, internal.search.removePostFromSearch, { slug: post.slug });

    await ctx.db.delete(args.postId);
  },
});

/**
 * Update bento layout (order and sizes)
 */
export const updateBentoLayout = mutation({
  args: {
    updates: v.array(
      v.object({
        postId: v.id("blogPosts"),
        bentoOrder: v.number(),
        bentoSize: v.optional(bentoSizeValidator),
      })
    ),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    for (const update of args.updates) {
      const patch: { bentoOrder: number; bentoSize?: "small" | "medium" | "large" | "banner" | "featured"; updatedAt: number } = {
        bentoOrder: update.bentoOrder,
        updatedAt: Date.now(),
      };

      if (update.bentoSize) {
        patch.bentoSize = update.bentoSize;
      }

      await ctx.db.patch(update.postId, patch);
    }

    // Invalidate bento cache (layout changed)
    await ctx.scheduler.runAfter(0, internal.cache.invalidateBentoCache, {});
  },
});

/**
 * Update collaborators for a post (author or creator only)
 */
export const updateCollaborators = mutation({
  args: {
    postId: v.id("blogPosts"),
    collaborators: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const post = await ctx.db.get(args.postId);

    if (!post) {
      throw new Error("Post not found");
    }

    // Only author or creator can update collaborators
    const userIsCreator = user.isCreator === true;
    const userIsAuthor = post.authorId === user._id;

    if (!userIsCreator && !userIsAuthor) {
      throw new Error("Only the author or site creator can manage collaborators");
    }

    // Find newly added collaborators (not in previous list, not self)
    const previousCollaborators = new Set(
      (post.collaborators || []).map((id) => id.toString())
    );
    const newCollaborators = args.collaborators.filter(
      (id) =>
        !previousCollaborators.has(id.toString()) &&
        id.toString() !== user._id.toString()
    );

    await ctx.db.patch(args.postId, {
      collaborators: args.collaborators,
      updatedAt: Date.now(),
    });

    // Notify each newly added collaborator
    for (const collaboratorId of newCollaborators) {
      const collaborator = await ctx.db.get(collaboratorId);
      if (collaborator?.notificationPreferences?.inAppNotifications) {
        await ctx.db.insert("notifications", {
          userId: collaboratorId,
          type: "collaborator_added",
          referenceType: "blogPost",
          referenceId: args.postId.toString(),
          title: `${user.displayName} added you as a collaborator`,
          body: `On "${post.title}"`,
          isRead: false,
          createdAt: Date.now(),
        });
      }
    }

    return { success: true };
  },
});

/**
 * Check if user can edit a post
 */
export const canEdit = query({
  args: {
    postId: v.id("blogPosts"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return false;

    const post = await ctx.db.get(args.postId);
    if (!post) return false;

    // Creator can edit any post
    if (user.isCreator) return true;

    // Author can edit their own posts
    if (post.authorId === user._id) return true;

    // Collaborators can edit
    if (post.collaborators?.includes(user._id)) return true;

    return false;
  },
});

/**
 * Internal mutation for migration - create post without auth
 */
export const createMigrated = mutation({
  args: {
    slug: v.string(),
    title: v.string(),
    description: v.string(),
    content: v.string(),
    contentType: contentTypeValidator,
    coverImage: v.optional(v.string()),
    coverAuthor: v.optional(v.string()),
    coverAuthorUrl: v.optional(v.string()),
    authorId: v.id("users"),
    labels: v.array(v.string()),
    difficulty: v.optional(difficultyValidator),
    readTimeMins: v.optional(v.number()),
    keyIdeas: v.optional(v.array(v.string())),
    location: v.optional(v.string()),
    status: statusValidator,
    visibility: visibilityValidator,
    bentoSize: bentoSizeValidator,
    bentoOrder: v.number(),
    mediumUrl: v.optional(v.string()),
    hashnodeUrl: v.optional(v.string()),
    devToUrl: v.optional(v.string()),
    discussionId: v.optional(v.string()),
    discussionNo: v.optional(v.number()),
    viewCount: v.number(),
    publishedAt: v.optional(v.number()),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    // This is for migration - check if we're in admin context
    const user = await getCurrentUser(ctx);
    if (user && !isCreator(user)) {
      throw new Error("Only creator can run migrations");
    }

    // Check slug uniqueness
    const existing = await ctx.db
      .query("blogPosts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (existing) {
      console.log(`Skipping existing post: ${args.slug}`);
      return existing._id;
    }

    const postId = await ctx.db.insert("blogPosts", {
      slug: args.slug,
      title: args.title,
      description: args.description,
      content: args.content,
      contentType: args.contentType,
      coverImage: args.coverImage,
      coverAuthor: args.coverAuthor,
      coverAuthorUrl: args.coverAuthorUrl,
      authorId: args.authorId,
      labels: args.labels,
      difficulty: args.difficulty,
      readTimeMins: args.readTimeMins,
      keyIdeas: args.keyIdeas,
      location: args.location,
      status: args.status,
      visibility: args.visibility,
      bentoSize: args.bentoSize,
      bentoOrder: args.bentoOrder,
      mediumUrl: args.mediumUrl,
      hashnodeUrl: args.hashnodeUrl,
      devToUrl: args.devToUrl,
      discussionId: args.discussionId,
      discussionNo: args.discussionNo,
      viewCount: args.viewCount,
      publishedAt: args.publishedAt,
      createdAt: args.createdAt,
    });

    return postId;
  },
});
