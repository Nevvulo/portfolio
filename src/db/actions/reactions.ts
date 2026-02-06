"use server";

import { and, count, eq, sql } from "drizzle-orm";
import { db } from "../index";
import { blogReactions, contentHighlights } from "../schema";
import { getCurrentUser, requireUser } from "../auth";

type ReactionType = "like" | "helpful" | "insightful";

const MAX_REACTIONS_PER_POST_AUTH = 50;
const MAX_REACTIONS_PER_POST_ANON = 5;

/** Get aggregated reaction counts for a post. */
export async function getReactionCounts(postId: number) {
  const rows = await db
    .select({
      type: blogReactions.type,
      count: count(),
    })
    .from(blogReactions)
    .where(eq(blogReactions.postId, postId))
    .groupBy(blogReactions.type);

  const counts: Record<ReactionType, number> = { like: 0, helpful: 0, insightful: 0 };
  for (const row of rows) {
    if (row.type in counts) {
      counts[row.type as ReactionType] = row.count;
    }
  }
  return counts;
}

/** Get the current user's reaction counts on a post. */
export async function getMyReactions(postId: number) {
  const user = await getCurrentUser();
  if (!user) return { like: 0, helpful: 0, insightful: 0, total: 0 };

  const rows = await db
    .select({
      type: blogReactions.type,
      count: count(),
    })
    .from(blogReactions)
    .where(and(eq(blogReactions.postId, postId), eq(blogReactions.userId, user.id)))
    .groupBy(blogReactions.type);

  const result: Record<ReactionType, number> = { like: 0, helpful: 0, insightful: 0 };
  let total = 0;
  for (const row of rows) {
    if (row.type in result) {
      result[row.type as ReactionType] = row.count;
      total += row.count;
    }
  }
  return { ...result, total };
}

/** Get remaining reaction budget for the current user on a post. */
export async function getMyReactionBudget(postId: number) {
  const user = await getCurrentUser();
  if (!user) return { postRemaining: 0 };

  const [postCount] = await db
    .select({ count: count() })
    .from(blogReactions)
    .where(and(eq(blogReactions.postId, postId), eq(blogReactions.userId, user.id)));

  return { postRemaining: Math.max(0, MAX_REACTIONS_PER_POST_AUTH - (postCount?.count ?? 0)) };
}

/** Get remaining reaction budget for an anonymous user (by IP). */
export async function getAnonymousReactionBudget(postId: number, ip: string) {
  const [ipCount] = await db
    .select({ count: count() })
    .from(blogReactions)
    .where(and(eq(blogReactions.postId, postId), eq(blogReactions.ip, ip)));

  return { postRemaining: Math.max(0, MAX_REACTIONS_PER_POST_ANON - (ipCount?.count ?? 0)) };
}

/** Add a single reaction. Returns status with remaining budget. */
export async function addReaction(
  postId: number,
  type: ReactionType,
  ip?: string,
) {
  const user = await getCurrentUser();
  const isAuth = !!user;
  const maxPerPost = isAuth ? MAX_REACTIONS_PER_POST_AUTH : MAX_REACTIONS_PER_POST_ANON;

  // Check rate limit
  const whereClause = isAuth
    ? and(eq(blogReactions.postId, postId), eq(blogReactions.userId, user!.id))
    : and(eq(blogReactions.postId, postId), eq(blogReactions.ip, ip!));

  const [postCount] = await db
    .select({ count: count() })
    .from(blogReactions)
    .where(whereClause);

  const currentCount = postCount?.count ?? 0;
  if (currentCount >= maxPerPost) {
    return {
      action: "rate_limited" as const,
      reason: "post_limit" as const,
      postTotal: currentCount,
      postRemaining: 0,
    };
  }

  await db.insert(blogReactions).values({
    postId,
    userId: isAuth ? user!.id : null,
    ip: isAuth ? null : ip,
    type,
  });

  const newTotal = currentCount + 1;
  return {
    action: "added" as const,
    postTotal: newTotal,
    postRemaining: maxPerPost - newTotal,
  };
}

/** Add reactions in batch. Returns aggregate result. */
export async function addReactionBatch(
  postId: number,
  reactions: { type: ReactionType; count: number }[],
  ip?: string,
) {
  const user = await getCurrentUser();
  const isAuth = !!user;
  const maxPerPost = isAuth ? MAX_REACTIONS_PER_POST_AUTH : MAX_REACTIONS_PER_POST_ANON;

  // Check current count
  const whereClause = isAuth
    ? and(eq(blogReactions.postId, postId), eq(blogReactions.userId, user!.id))
    : and(eq(blogReactions.postId, postId), eq(blogReactions.ip, ip!));

  const [postCount] = await db
    .select({ count: count() })
    .from(blogReactions)
    .where(whereClause);

  const currentCount = postCount?.count ?? 0;
  const totalRequested = reactions.reduce((sum, r) => sum + r.count, 0);
  const remaining = maxPerPost - currentCount;

  if (remaining <= 0) {
    return {
      action: "rate_limited" as const,
      reason: "post_limit" as const,
      postTotal: currentCount,
      postRemaining: 0,
      added: 0,
    };
  }

  // Insert as many as allowed
  const toAdd = Math.min(totalRequested, remaining);
  let added = 0;

  for (const { type, count: requestedCount } of reactions) {
    const canAdd = Math.min(requestedCount, toAdd - added);
    if (canAdd <= 0) break;

    const values = Array.from({ length: canAdd }, () => ({
      postId,
      userId: isAuth ? user!.id : null,
      ip: isAuth ? null : ip,
      type,
    }));

    await db.insert(blogReactions).values(values);
    added += canAdd;
  }

  const newTotal = currentCount + added;
  return {
    action: added < totalRequested ? ("partial" as const) : ("added" as const),
    postTotal: newTotal,
    postRemaining: maxPerPost - newTotal,
    added,
    reason: added < totalRequested ? ("post_limit" as const) : undefined,
  };
}

/** Remove all reactions from a post for the current user. */
export async function removeAllReactionsFromPost(postId: number) {
  const user = await requireUser();

  await db
    .delete(blogReactions)
    .where(and(eq(blogReactions.postId, postId), eq(blogReactions.userId, user.id)));
}

/** Remove all highlights from a post for the current user. */
export async function removeAllHighlightsFromPost(postId: number) {
  const user = await requireUser();

  await db
    .delete(contentHighlights)
    .where(and(eq(contentHighlights.postId, postId), eq(contentHighlights.userId, user.id)));
}
