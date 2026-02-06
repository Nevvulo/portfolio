import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../index";
import {
  articleWatchTime,
  blogCommentReactions,
  blogComments,
  blogPosts,
  blogReactions,
  blogViews,
  contentHighlights,
  users,
} from "../schema";

/** All published posts, sorted by bento order (for homepage grid). */
export async function getPostsForBento() {
  return db.query.blogPosts.findMany({
    where: and(eq(blogPosts.status, "published"), eq(blogPosts.visibility, "public")),
    orderBy: [blogPosts.bentoOrder],
    columns: {
      id: true,
      slug: true,
      title: true,
      description: true,
      contentType: true,
      coverImage: true,
      youtubeId: true,
      labels: true,
      difficulty: true,
      readTimeMins: true,
      bentoSize: true,
      bentoOrder: true,
      viewCount: true,
      publishedAt: true,
      visibility: true,
    },
  });
}

/** Full post data by slug (including body). */
export async function getPostBySlug(slug: string) {
  return db.query.blogPosts.findFirst({
    where: eq(blogPosts.slug, slug),
    with: {
      author: {
        columns: {
          id: true,
          displayName: true,
          avatarUrl: true,
          username: true,
          isCreator: true,
        },
      },
    },
  });
}

/** All published post slugs (for generateStaticParams). */
export async function getPublishedSlugs() {
  const posts = await db.query.blogPosts.findMany({
    where: and(eq(blogPosts.status, "published"), eq(blogPosts.visibility, "public")),
    columns: { slug: true },
  });
  return posts.map((p) => p.slug);
}

/** Reaction counts for a post (like, helpful, insightful). */
export async function getReactionCounts(postId: number) {
  const rows = await db
    .select({
      type: blogReactions.type,
      count: count(),
    })
    .from(blogReactions)
    .where(eq(blogReactions.postId, postId))
    .groupBy(blogReactions.type);

  const counts: Record<string, number> = { like: 0, helpful: 0, insightful: 0, total: 0 };
  for (const row of rows) {
    counts[row.type] = row.count;
    counts["total"] = (counts["total"] ?? 0) + row.count;
  }
  return counts;
}

/** User's reactions on a post. */
export async function getUserReactions(postId: number, userId: number) {
  const rows = await db
    .select({
      type: blogReactions.type,
      count: count(),
    })
    .from(blogReactions)
    .where(and(eq(blogReactions.postId, postId), eq(blogReactions.userId, userId)))
    .groupBy(blogReactions.type);

  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.type] = row.count;
  }
  return counts;
}

/** Comments for a post (top-level, with first 5 replies each). */
export async function getComments(postId: number, limit = 20, offset = 0) {
  const topLevel = await db.query.blogComments.findMany({
    where: and(
      eq(blogComments.postId, postId),
      sql`${blogComments.parentId} IS NULL`,
      eq(blogComments.isDeleted, false),
    ),
    orderBy: [blogComments.createdAt],
    limit: limit + 1,
    offset,
    with: {
      author: {
        columns: {
          id: true,
          displayName: true,
          avatarUrl: true,
          username: true,
          tier: true,
          isCreator: true,
          role: true,
        },
      },
      reactions: true,
    },
  });

  const hasMore = topLevel.length > limit;
  const comments = topLevel.slice(0, limit);

  // Fetch first 5 replies for each comment
  const commentIds = comments.map((c) => c.id);
  const replies =
    commentIds.length > 0
      ? await db.query.blogComments.findMany({
          where: and(
            inArray(blogComments.parentId, commentIds),
            eq(blogComments.isDeleted, false),
          ),
          orderBy: [blogComments.createdAt],
          with: {
            author: {
              columns: {
                id: true,
                displayName: true,
                avatarUrl: true,
                username: true,
                tier: true,
                isCreator: true,
                role: true,
              },
            },
            reactions: true,
          },
        })
      : [];

  // Group replies by parentId
  const repliesByParent = new Map<number, typeof replies>();
  for (const reply of replies) {
    if (reply.parentId == null) continue;
    const existing = repliesByParent.get(reply.parentId) ?? [];
    existing.push(reply);
    repliesByParent.set(reply.parentId, existing);
  }

  return {
    comments: comments.map((c) => {
      const cReplies = repliesByParent.get(c.id) ?? [];
      return {
        ...c,
        replies: cReplies.slice(0, 5),
        hasMoreReplies: cReplies.length > 5,
      };
    }),
    hasMore,
  };
}

/** Comment count for a post. */
export async function getCommentCount(postId: number) {
  const [result] = await db
    .select({ count: count() })
    .from(blogComments)
    .where(and(eq(blogComments.postId, postId), eq(blogComments.isDeleted, false)));
  return result?.count ?? 0;
}

/** User's watch history (articles they've read). */
export async function getUserWatchHistory(userId: number, limit = 50) {
  return db
    .select({
      totalSeconds: articleWatchTime.totalSeconds,
      lastHeartbeat: articleWatchTime.lastHeartbeat,
      postId: articleWatchTime.postId,
      postSlug: blogPosts.slug,
      postTitle: blogPosts.title,
      postCoverImage: blogPosts.coverImage,
    })
    .from(articleWatchTime)
    .innerJoin(blogPosts, eq(articleWatchTime.postId, blogPosts.id))
    .where(eq(articleWatchTime.userId, userId))
    .orderBy(desc(articleWatchTime.lastHeartbeat))
    .limit(limit);
}

/** Content highlights for a post. */
export async function getHighlightsForPost(postId: number) {
  return db.query.contentHighlights.findMany({
    where: eq(contentHighlights.postId, postId),
    with: {
      user: {
        columns: { id: true, displayName: true, avatarUrl: true, username: true },
      },
      comments: {
        with: {
          author: {
            columns: { id: true, displayName: true, avatarUrl: true, username: true },
          },
        },
      },
      reactions: true,
    },
  });
}

/** Blog analytics (creator only). */
export async function getBlogAnalytics() {
  const [postCounts] = await db
    .select({ count: count() })
    .from(blogPosts)
    .where(eq(blogPosts.status, "published"));

  const [commentCounts] = await db
    .select({ count: count() })
    .from(blogComments)
    .where(eq(blogComments.isDeleted, false));

  const [reactionCounts] = await db.select({ count: count() }).from(blogReactions);

  const topPosts = await db.query.blogPosts.findMany({
    where: eq(blogPosts.status, "published"),
    orderBy: [desc(blogPosts.viewCount)],
    limit: 5,
    columns: { id: true, slug: true, title: true, viewCount: true },
  });

  return {
    totalPosts: postCounts?.count ?? 0,
    totalComments: commentCounts?.count ?? 0,
    totalReactions: reactionCounts?.count ?? 0,
    topPosts,
  };
}
