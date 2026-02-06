"use server";

import { and, count, desc, eq, gte, ilike, or, sql } from "drizzle-orm";
import { requireCreator } from "../auth";
import { db } from "../index";
import {
  blogComments,
  blogPosts,
  blogReactions,
  blogViews,
  users,
} from "../schema";

// ============================================
// BLOG POST MANAGEMENT
// ============================================

export async function listBlogPosts() {
  await requireCreator();
  return db.query.blogPosts.findMany({
    orderBy: [blogPosts.bentoOrder],
    with: {
      author: {
        columns: { id: true, displayName: true, avatarUrl: true, username: true },
      },
    },
  });
}

export async function getBlogPostContent(postId: number) {
  await requireCreator();
  const post = await db.query.blogPosts.findFirst({
    where: eq(blogPosts.id, postId),
  });
  return post?.body ?? null;
}

export async function createBlogPost(data: {
  slug: string;
  title: string;
  description: string;
  body?: string;
  contentType: string;
  coverImage?: string;
  coverAuthor?: string;
  coverAuthorUrl?: string;
  coverGradientIntensity?: number;
  youtubeId?: string;
  authorId: number;
  collaborators?: number[];
  labels?: string[];
  difficulty?: string;
  readTimeMins?: number;
  keyIdeas?: string[];
  location?: string;
  aiDisclosureStatus?: string;
  status?: string;
  visibility?: string;
  bentoSize?: string;
  bentoOrder?: number;
  mediumUrl?: string;
  hashnodeUrl?: string;
  devToUrl?: string;
}) {
  await requireCreator();
  const [created] = await db.insert(blogPosts).values(data).returning();
  return created;
}

export async function updateBlogPost(
  id: number,
  data: Partial<{
    slug: string;
    title: string;
    description: string;
    body: string | null;
    contentType: string;
    coverImage: string | null;
    coverAuthor: string | null;
    coverAuthorUrl: string | null;
    coverGradientIntensity: number | null;
    youtubeId: string | null;
    collaborators: number[] | null;
    labels: string[];
    difficulty: string | null;
    readTimeMins: number | null;
    keyIdeas: string[] | null;
    location: string | null;
    aiDisclosureStatus: string | null;
    visibility: string;
    bentoSize: string;
    bentoOrder: number;
    mediumUrl: string | null;
    hashnodeUrl: string | null;
    devToUrl: string | null;
  }>,
) {
  await requireCreator();
  await db
    .update(blogPosts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(blogPosts.id, id));
}

export async function updateBentoLayout(
  updates: Array<{ id: number; bentoSize: string; bentoOrder: number }>,
) {
  await requireCreator();
  for (const u of updates) {
    await db
      .update(blogPosts)
      .set({ bentoSize: u.bentoSize, bentoOrder: u.bentoOrder })
      .where(eq(blogPosts.id, u.id));
  }
}

export async function updateCollaborators(postId: number, collaboratorIds: number[]) {
  await requireCreator();
  await db
    .update(blogPosts)
    .set({ collaborators: collaboratorIds, updatedAt: new Date() })
    .where(eq(blogPosts.id, postId));
}

export async function deleteBlogPost(id: number) {
  await requireCreator();
  await db.delete(blogPosts).where(eq(blogPosts.id, id));
}

export async function publishBlogPost(id: number) {
  await requireCreator();
  await db
    .update(blogPosts)
    .set({ status: "published", publishedAt: new Date(), updatedAt: new Date() })
    .where(eq(blogPosts.id, id));
}

export async function unpublishBlogPost(id: number) {
  await requireCreator();
  await db
    .update(blogPosts)
    .set({ status: "draft", updatedAt: new Date() })
    .where(eq(blogPosts.id, id));
}

export async function archiveBlogPost(id: number) {
  await requireCreator();
  await db
    .update(blogPosts)
    .set({ status: "archived", updatedAt: new Date() })
    .where(eq(blogPosts.id, id));
}

// ============================================
// USER SEARCH (for collaborator picker, etc.)
// ============================================

export async function getUsersByIds(ids: number[]) {
  if (ids.length === 0) return [];
  return db.query.users.findMany({
    where: sql`${users.id} = ANY(${ids})`,
    columns: {
      id: true,
      displayName: true,
      username: true,
      avatarUrl: true,
    },
  });
}

// ============================================
// ANALYTICS
// ============================================

export async function getDetailedAnalytics(days: number) {
  await requireCreator();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

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

  return {
    totalViews: viewsResult.count,
    totalReactions: reactionsResult.count,
    totalComments: commentsResult.count,
    newPosts: postsResult.count,
  };
}

export async function getViewsOverTime(days: number) {
  await requireCreator();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const results = await db
    .select({
      date: sql<string>`DATE(${blogViews.viewedAt})`,
      count: count(),
    })
    .from(blogViews)
    .where(gte(blogViews.viewedAt, since))
    .groupBy(sql`DATE(${blogViews.viewedAt})`)
    .orderBy(sql`DATE(${blogViews.viewedAt})`);

  return results;
}

export async function getReactionsOverTime(days: number) {
  await requireCreator();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const results = await db
    .select({
      date: sql<string>`DATE(${blogReactions.createdAt})`,
      count: count(),
    })
    .from(blogReactions)
    .where(gte(blogReactions.createdAt, since))
    .groupBy(sql`DATE(${blogReactions.createdAt})`)
    .orderBy(sql`DATE(${blogReactions.createdAt})`);

  return results;
}

export async function getCommentsOverTime(days: number) {
  await requireCreator();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const results = await db
    .select({
      date: sql<string>`DATE(${blogComments.createdAt})`,
      count: count(),
    })
    .from(blogComments)
    .where(gte(blogComments.createdAt, since))
    .groupBy(sql`DATE(${blogComments.createdAt})`)
    .orderBy(sql`DATE(${blogComments.createdAt})`);

  return results;
}

export async function getAllPostsAnalytics(days: number) {
  await requireCreator();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Get view counts per post
  const viewCounts = await db
    .select({
      postId: blogViews.postId,
      views: count(),
    })
    .from(blogViews)
    .where(gte(blogViews.viewedAt, since))
    .groupBy(blogViews.postId);

  // Get reaction counts per post
  const reactionCounts = await db
    .select({
      postId: blogReactions.postId,
      reactions: count(),
    })
    .from(blogReactions)
    .where(gte(blogReactions.createdAt, since))
    .groupBy(blogReactions.postId);

  // Get comment counts per post
  const commentCounts = await db
    .select({
      postId: blogComments.postId,
      comments: count(),
    })
    .from(blogComments)
    .where(gte(blogComments.createdAt, since))
    .groupBy(blogComments.postId);

  // Combine
  const posts = await db.query.blogPosts.findMany({
    where: eq(blogPosts.status, "published"),
    columns: { id: true, slug: true, title: true, viewCount: true },
  });

  const viewMap = Object.fromEntries(viewCounts.map((v) => [v.postId, v.views]));
  const reactionMap = Object.fromEntries(reactionCounts.map((r) => [r.postId, r.reactions]));
  const commentMap = Object.fromEntries(commentCounts.map((c) => [c.postId, c.comments]));

  return posts.map((p) => ({
    ...p,
    recentViews: viewMap[p.id] ?? 0,
    recentReactions: reactionMap[p.id] ?? 0,
    recentComments: commentMap[p.id] ?? 0,
  }));
}

// ============================================
// MIGRATION (can be removed once migration is done)
// ============================================

export async function getMigrationStatus() {
  await requireCreator();
  const [postCount] = await db.select({ count: count() }).from(blogPosts);
  return {
    postCount: postCount.count,
    migrated: true,
  };
}

export async function getCreatorId() {
  const creator = await requireCreator();
  return creator.id;
}
