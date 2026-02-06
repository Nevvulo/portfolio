"use server";

import { and, eq, desc, sql, isNull, lt } from "drizzle-orm";
import { db } from "../index";
import { userFeedPosts, userFeedReactions, users, blogPosts } from "../schema";
import { getCurrentUser, requireUser } from "../auth";

/** List feed posts for a profile. */
export async function listFeedPosts(args: {
  profileUserId: number;
  limit: number;
  cursor?: number;
}) {
  const { profileUserId, limit, cursor } = args;

  const conditions = [
    eq(userFeedPosts.profileUserId, profileUserId),
    eq(userFeedPosts.isDeleted, false),
    isNull(userFeedPosts.parentId),
  ];

  if (cursor) {
    conditions.push(lt(userFeedPosts.id, cursor));
  }

  const posts = await db.query.userFeedPosts.findMany({
    where: and(...conditions),
    orderBy: [desc(userFeedPosts.createdAt)],
    limit: limit + 1,
    with: {
      author: {
        columns: {
          id: true,
          displayName: true,
          username: true,
          avatarUrl: true,
          tier: true,
          isCreator: true,
        },
      },
      reactions: true,
    },
  });

  const hasMore = posts.length > limit;
  const sliced = posts.slice(0, limit);

  // Build reaction summaries
  const postsWithReactions = sliced.map((post) => {
    const byType: Record<string, number> = {};
    let total = 0;
    for (const r of post.reactions) {
      byType[r.type] = (byType[r.type] || 0) + 1;
      total++;
    }
    return {
      ...post,
      reactions: { total, byType },
    };
  });

  return {
    posts: postsWithReactions,
    hasMore,
    nextCursor: hasMore && sliced.length > 0 ? sliced[sliced.length - 1].id : null,
  };
}

/** Get replies for a post. */
export async function getReplies(args: { parentId: number; limit: number }) {
  const { parentId, limit } = args;

  const replies = await db.query.userFeedPosts.findMany({
    where: and(
      eq(userFeedPosts.parentId, parentId),
      eq(userFeedPosts.isDeleted, false),
    ),
    orderBy: [userFeedPosts.createdAt],
    limit: limit + 1,
    with: {
      author: {
        columns: {
          id: true,
          displayName: true,
          username: true,
          avatarUrl: true,
          tier: true,
          isCreator: true,
        },
      },
      reactions: true,
    },
  });

  const hasMore = replies.length > limit;
  const sliced = replies.slice(0, limit);

  const repliesWithReactions = sliced.map((post) => {
    const byType: Record<string, number> = {};
    let total = 0;
    for (const r of post.reactions) {
      byType[r.type] = (byType[r.type] || 0) + 1;
      total++;
    }
    return {
      ...post,
      reactions: { total, byType },
    };
  });

  return { replies: repliesWithReactions, hasMore };
}

/** Create a feed post. */
export async function createFeedPost(args: {
  profileUserId: number;
  content: string;
  parentId?: number;
  media?: Array<{
    type: "image" | "video";
    url: string;
    filename: string;
    mimeType: string;
    fileSize: number;
    width?: number;
    height?: number;
  }>;
}) {
  const user = await requireUser();

  const [post] = await db
    .insert(userFeedPosts)
    .values({
      authorId: user.id,
      profileUserId: args.profileUserId,
      content: args.content,
      parentId: args.parentId ?? null,
      rootId: args.parentId ?? null,
      replyDepth: args.parentId ? 1 : 0,
      media: args.media ?? null,
    })
    .returning();

  // Increment parent reply count if this is a reply
  if (args.parentId) {
    await db
      .update(userFeedPosts)
      .set({
        replyCount: sql`${userFeedPosts.replyCount} + 1`,
      })
      .where(eq(userFeedPosts.id, args.parentId));
  }

  return post;
}

/** Toggle a reaction on a feed post. */
export async function toggleFeedReaction(args: {
  postId: number;
  type: "like" | "heart" | "fire";
}) {
  const user = await requireUser();

  const existing = await db.query.userFeedReactions.findFirst({
    where: and(
      eq(userFeedReactions.postId, args.postId),
      eq(userFeedReactions.userId, user.id),
    ),
  });

  if (existing) {
    if (existing.type === args.type) {
      await db.delete(userFeedReactions).where(eq(userFeedReactions.id, existing.id));
      return null;
    }
    // Change reaction type
    await db
      .update(userFeedReactions)
      .set({ type: args.type })
      .where(eq(userFeedReactions.id, existing.id));
    return args.type;
  }

  await db.insert(userFeedReactions).values({
    postId: args.postId,
    userId: user.id,
    type: args.type,
  });
  return args.type;
}

/** Get user's reaction on a specific post. */
export async function getUserReaction(postId: number) {
  const user = await getCurrentUser();
  if (!user) return null;

  const reaction = await db.query.userFeedReactions.findFirst({
    where: and(
      eq(userFeedReactions.postId, postId),
      eq(userFeedReactions.userId, user.id),
    ),
  });

  return reaction?.type ?? null;
}

/** Check if user has reposted a post. */
export async function hasUserReposted(postId: number) {
  const user = await getCurrentUser();
  if (!user) return false;

  const existing = await db.query.userFeedPosts.findFirst({
    where: and(
      eq(userFeedPosts.authorId, user.id),
      eq(userFeedPosts.repostOfFeedId, postId),
      eq(userFeedPosts.isDeleted, false),
    ),
  });

  return !!existing;
}

/** Delete a feed post (soft delete). */
export async function deleteFeedPost(postId: number) {
  const user = await requireUser();

  const post = await db.query.userFeedPosts.findFirst({
    where: eq(userFeedPosts.id, postId),
  });

  if (!post) throw new Error("Post not found");
  if (post.authorId !== user.id && post.profileUserId !== user.id && !user.isCreator) {
    throw new Error("Not authorized to delete this post");
  }

  await db
    .update(userFeedPosts)
    .set({ isDeleted: true })
    .where(eq(userFeedPosts.id, postId));
}

/** Repost a feed post to user's own feed. */
export async function repostFeedPost(originalPostId: number) {
  const user = await requireUser();

  const [post] = await db
    .insert(userFeedPosts)
    .values({
      authorId: user.id,
      profileUserId: user.id,
      content: "",
      repostOfFeedId: originalPostId,
    })
    .returning();

  return post;
}
