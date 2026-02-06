"use server";

import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "../index";
import {
  articleWatchTime,
  blogCommentReactions,
  blogCommentReports,
  blogComments,
  blogPosts,
  blogReactions,
  blogViews,
  contentComments,
  contentHighlights,
  contentReactions,
  contentReports,
  notifications,
  users,
} from "../schema";
import { getCurrentUser, requireUser } from "../auth";
import { grantCommentXp, grantReactionXp } from "./experience";

// ============================================
// REACTIONS
// ============================================

const REACTION_POINTS: Record<string, number> = { like: 3, helpful: 4, insightful: 5 };
const MAX_REACTIONS_PER_POST = 50;
const MAX_REACTIONS_PER_24H = 100;

export async function toggleReaction(postId: number, type: "like" | "helpful" | "insightful") {
  const user = await requireUser();

  // Check existing reactions on this post by this user of this type
  const existing = await db.query.blogReactions.findFirst({
    where: and(
      eq(blogReactions.postId, postId),
      eq(blogReactions.userId, user.id),
      eq(blogReactions.type, type),
    ),
  });

  if (existing) {
    // Remove reaction
    await db.delete(blogReactions).where(eq(blogReactions.id, existing.id));
    revalidatePath(`/learn`);
    return { action: "removed", type };
  }

  // Check rate limits (unless staff/creator)
  if (!user.isCreator && (user.role ?? 0) < 1) {
    const [postCount] = await db
      .select({ count: count() })
      .from(blogReactions)
      .where(and(eq(blogReactions.postId, postId), eq(blogReactions.userId, user.id)));

    if ((postCount?.count ?? 0) >= MAX_REACTIONS_PER_POST) {
      return { action: "rate_limited", reason: "post_limit" };
    }
  }

  await db.insert(blogReactions).values({
    postId,
    userId: user.id,
    type,
  });

  // Grant reaction XP (first time only)
  await grantReactionXp(postId);

  revalidatePath(`/learn`);
  return { action: "added", type };
}

export async function addAnonymousReaction(
  postId: number,
  type: "like" | "helpful" | "insightful",
  ip: string,
) {
  // Check IP limit (5 per post)
  const [ipCount] = await db
    .select({ count: count() })
    .from(blogReactions)
    .where(and(eq(blogReactions.postId, postId), eq(blogReactions.ip, ip)));

  if ((ipCount?.count ?? 0) >= 5) {
    return { action: "rate_limited", reason: "anonymous_limit" };
  }

  await db.insert(blogReactions).values({
    postId,
    ip,
    type,
  });

  revalidatePath(`/learn`);
  return { action: "added", type };
}

// ============================================
// COMMENTS
// ============================================

export async function addComment(postId: number, content: string, parentId?: number) {
  const user = await requireUser();

  if (user.isBanned) {
    throw new Error("You are banned from commenting");
  }

  const trimmed = content.trim();
  if (trimmed.length < 1 || trimmed.length > 2000) {
    throw new Error("Comment must be between 1 and 2000 characters");
  }

  // If replying, verify parent exists and belongs to same post
  if (parentId) {
    const parent = await db.query.blogComments.findFirst({
      where: eq(blogComments.id, parentId),
    });
    if (!parent || parent.postId !== postId) {
      throw new Error("Parent comment not found");
    }
  }

  const [comment] = await db
    .insert(blogComments)
    .values({
      postId,
      authorId: user.id,
      content: trimmed,
      parentId: parentId ?? null,
      source: "website",
    })
    .returning();

  // Grant comment XP
  await grantCommentXp(postId);

  // Notify parent comment author (if replying and not self)
  if (parentId) {
    const parent = await db.query.blogComments.findFirst({
      where: eq(blogComments.id, parentId),
      columns: { authorId: true },
    });
    if (parent?.authorId && parent.authorId !== user.id) {
      await db.insert(notifications).values({
        userId: parent.authorId,
        type: "comment_reply",
        referenceType: "blogComment",
        referenceId: String(comment?.id),
        title: "New reply to your comment",
        body: `${user.displayName} replied to your comment`,
      });
    }
  }

  revalidatePath(`/learn`);
  return comment;
}

export async function editComment(commentId: number, content: string) {
  const user = await requireUser();

  const comment = await db.query.blogComments.findFirst({
    where: eq(blogComments.id, commentId),
  });
  if (!comment) throw new Error("Comment not found");
  if (comment.authorId !== user.id && !user.isCreator) {
    throw new Error("Cannot edit this comment");
  }
  if (comment.isDeleted) throw new Error("Cannot edit deleted comment");

  const trimmed = content.trim();
  if (trimmed.length < 1 || trimmed.length > 2000) {
    throw new Error("Comment must be between 1 and 2000 characters");
  }

  await db
    .update(blogComments)
    .set({ content: trimmed, isEdited: true, editedAt: new Date() })
    .where(eq(blogComments.id, commentId));

  revalidatePath(`/learn`);
}

export async function deleteComment(commentId: number) {
  const user = await requireUser();

  const comment = await db.query.blogComments.findFirst({
    where: eq(blogComments.id, commentId),
  });
  if (!comment) throw new Error("Comment not found");
  if (comment.authorId !== user.id && !user.isCreator && (user.role ?? 0) < 1) {
    throw new Error("Cannot delete this comment");
  }

  await db
    .update(blogComments)
    .set({ isDeleted: true })
    .where(eq(blogComments.id, commentId));

  revalidatePath(`/learn`);
}

// ============================================
// COMMENT REACTIONS
// ============================================

export async function toggleCommentReaction(
  commentId: number,
  postId: number,
  type: "heart" | "thumbs_up" | "eyes" | "fire" | "thinking" | "laugh",
) {
  const user = await requireUser();

  const existing = await db.query.blogCommentReactions.findFirst({
    where: and(
      eq(blogCommentReactions.userId, user.id),
      eq(blogCommentReactions.commentId, commentId),
      eq(blogCommentReactions.type, type),
    ),
  });

  if (existing) {
    await db.delete(blogCommentReactions).where(eq(blogCommentReactions.id, existing.id));
    revalidatePath(`/learn`);
    return { action: "removed" };
  }

  await db.insert(blogCommentReactions).values({
    commentId,
    postId,
    userId: user.id,
    type,
  });

  revalidatePath(`/learn`);
  return { action: "added" };
}

// ============================================
// VIEW TRACKING
// ============================================

export async function recordView(postId: number) {
  const user = await requireUser();

  // Deduplicate: one view per user per post
  const existing = await db.query.blogViews.findFirst({
    where: and(eq(blogViews.postId, postId), eq(blogViews.userId, user.id)),
  });

  if (!existing) {
    await db.insert(blogViews).values({ postId, userId: user.id });
  }
}

// ============================================
// HIGHLIGHTS
// ============================================

export async function createHighlight(
  postId: number,
  highlightedText: string,
  prefix: string,
  suffix: string,
  isReactionOnly = false,
) {
  const user = await requireUser();

  const [highlight] = await db
    .insert(contentHighlights)
    .values({
      postId,
      userId: user.id,
      highlightedText,
      prefix,
      suffix,
      isReactionOnly,
    })
    .returning();

  revalidatePath(`/learn`);
  return highlight;
}

export async function deleteHighlight(highlightId: number) {
  const user = await requireUser();

  const highlight = await db.query.contentHighlights.findFirst({
    where: eq(contentHighlights.id, highlightId),
  });
  if (!highlight) throw new Error("Highlight not found");
  if (highlight.userId !== user.id && !user.isCreator) {
    throw new Error("Cannot delete this highlight");
  }

  await db.delete(contentHighlights).where(eq(contentHighlights.id, highlightId));
  revalidatePath(`/learn`);
}

// ============================================
// REPORT COMMENT
// ============================================

export async function reportComment(commentId: number, reason?: string) {
  const user = await requireUser();

  // Check if already reported by this user
  const existing = await db.query.blogCommentReports.findFirst({
    where: and(
      eq(blogCommentReports.commentId, commentId),
      eq(blogCommentReports.reporterId, user.id),
    ),
  });
  if (existing) {
    throw new Error("You have already reported this comment");
  }

  await db.insert(blogCommentReports).values({
    commentId,
    reporterId: user.id,
    reason: reason || null,
  });
}

// ============================================
// QUERY WRAPPERS (callable from Client Components)
// ============================================

/** Get current user info (for client components). */
export async function getMe() {
  const user = await getCurrentUser();
  if (!user) return null;
  return {
    id: user.id,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    username: user.username,
    isCreator: user.isCreator,
    role: user.role,
  };
}

/** Get paginated comments for a post (callable from client). */
export async function getCommentsForPost(postId: number, limit = 20, offset = 0) {
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
    },
  });

  const hasMore = topLevel.length > limit;
  const comments = topLevel.slice(0, limit);

  // Fetch replies for each comment
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
    comments: comments.map((c) => ({
      ...c,
      replies: (repliesByParent.get(c.id) ?? []).slice(0, 5),
    })),
    hasMore,
    nextCursor: hasMore ? offset + limit : null,
  };
}

/** Get comment count for a post (callable from client). */
export async function getCommentCountForPost(postId: number) {
  const [result] = await db
    .select({ count: count() })
    .from(blogComments)
    .where(and(eq(blogComments.postId, postId), eq(blogComments.isDeleted, false)));
  return result?.count ?? 0;
}

/** Get aggregated comment reactions for all comments in a post. */
export async function getCommentReactionsForPost(postId: number) {
  const rows = await db
    .select({
      commentId: blogCommentReactions.commentId,
      type: blogCommentReactions.type,
      count: count(),
    })
    .from(blogCommentReactions)
    .where(eq(blogCommentReactions.postId, postId))
    .groupBy(blogCommentReactions.commentId, blogCommentReactions.type);

  const result: Record<string, { counts: Record<string, number>; total: number }> = {};
  for (const row of rows) {
    const key = String(row.commentId);
    if (!result[key]) result[key] = { counts: {}, total: 0 };
    result[key].counts[row.type] = row.count;
    result[key].total += row.count;
  }
  return result;
}

/** Get current user's reactions on comments in a post. */
export async function getMyCommentReactionsForPost(postId: number) {
  const user = await getCurrentUser();
  if (!user) return {};

  const rows = await db.query.blogCommentReactions.findMany({
    where: and(
      eq(blogCommentReactions.postId, postId),
      eq(blogCommentReactions.userId, user.id),
    ),
    columns: { commentId: true, type: true },
  });

  const result: Record<string, string> = {};
  for (const row of rows) {
    result[String(row.commentId)] = row.type;
  }
  return result;
}

// ============================================
// BLOG DATA HELPERS (callable from Client Components)
// ============================================

/** Get all unique labels from published, public blog posts. */
export async function getAllLabels(): Promise<string[]> {
  const rows = await db
    .select({ labels: blogPosts.labels })
    .from(blogPosts)
    .where(and(eq(blogPosts.status, "published"), eq(blogPosts.visibility, "public")));

  const labelSet = new Set<string>();
  for (const row of rows) {
    const arr = row.labels as string[] | null;
    if (Array.isArray(arr)) {
      for (const label of arr) {
        labelSet.add(label);
      }
    }
  }
  return Array.from(labelSet).sort();
}

/** Get the current user's watch history (slug + totalSeconds). */
export async function getWatchHistoryForUser(): Promise<
  { slug: string; totalSeconds: number }[]
> {
  const user = await getCurrentUser();
  if (!user) return [];

  return db
    .select({
      slug: blogPosts.slug,
      totalSeconds: articleWatchTime.totalSeconds,
    })
    .from(articleWatchTime)
    .innerJoin(blogPosts, eq(articleWatchTime.postId, blogPosts.id))
    .where(eq(articleWatchTime.userId, user.id))
    .orderBy(desc(articleWatchTime.lastHeartbeat));
}

/** Get multiple posts by their slugs (same shape as getPostsForBento + author). */
export async function getPostsBySlugs(slugs: string[]) {
  if (slugs.length === 0) return [];

  return db.query.blogPosts.findMany({
    where: inArray(blogPosts.slug, slugs),
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

// ============================================
// CONTENT HIGHLIGHTS — Query wrappers for Client Components
// ============================================

/** Get highlights for a post (overlay rendering). */
export async function getHighlightsForPostAction(postId: number) {
  return db.query.contentHighlights.findMany({
    where: eq(contentHighlights.postId, postId),
    columns: {
      id: true,
      highlightedText: true,
      prefix: true,
      suffix: true,
      userId: true,
      isReactionOnly: true,
    },
    with: {
      user: {
        columns: { id: true, displayName: true, avatarUrl: true },
      },
    },
  });
}

/** Get highlight counts for a post. */
export async function getHighlightCountsForPost(postId: number) {
  const highlights = await db
    .select({ userId: contentHighlights.userId })
    .from(contentHighlights)
    .where(eq(contentHighlights.postId, postId));

  const uniqueUsers = new Set(highlights.map((h) => h.userId)).size;
  return { total: highlights.length, uniqueUsers };
}

/** Get highlights with user details, grouped by user. */
export async function getHighlightsWithDetailsForPost(postId: number) {
  const highlights = await db.query.contentHighlights.findMany({
    where: eq(contentHighlights.postId, postId),
    with: {
      user: {
        columns: { id: true, displayName: true, avatarUrl: true, username: true },
      },
    },
  });

  const byUserMap = new Map<
    number,
    {
      user: NonNullable<(typeof highlights)[number]["user"]>;
      highlights: typeof highlights;
    }
  >();
  for (const h of highlights) {
    if (!h.user) continue;
    const existing = byUserMap.get(h.user.id);
    if (existing) {
      existing.highlights.push(h);
    } else {
      byUserMap.set(h.user.id, { user: h.user, highlights: [h] });
    }
  }

  return {
    highlights,
    byUser: Array.from(byUserMap.values()),
  };
}

/** Get reactions on highlights for a post, grouped by highlightId. */
export async function getHighlightReactionsForPost(postId: number) {
  const rows = await db
    .select({
      highlightId: contentReactions.highlightId,
      type: contentReactions.type,
      count: count(),
    })
    .from(contentReactions)
    .where(eq(contentReactions.postId, postId))
    .groupBy(contentReactions.highlightId, contentReactions.type);

  const result: Record<string, { counts: Record<string, number>; total: number }> = {};
  for (const row of rows) {
    const key = String(row.highlightId);
    if (!result[key]) result[key] = { counts: {}, total: 0 };
    result[key].counts[row.type] = row.count;
    result[key].total += row.count;
  }
  return result;
}

/** Get comment counts per highlight for a post. */
export async function getHighlightCommentCountsForPost(postId: number) {
  const rows = await db
    .select({
      highlightId: contentComments.highlightId,
      count: count(),
    })
    .from(contentComments)
    .where(and(eq(contentComments.postId, postId), eq(contentComments.isDeleted, false)))
    .groupBy(contentComments.highlightId);

  const result: Record<string, number> = {};
  for (const row of rows) {
    result[String(row.highlightId)] = row.count;
  }
  return result;
}

/** Get comments for a specific highlight. */
export async function getCommentsForHighlight(highlightId: number) {
  return db.query.contentComments.findMany({
    where: and(
      eq(contentComments.highlightId, highlightId),
      eq(contentComments.isDeleted, false),
    ),
    orderBy: [contentComments.createdAt],
    with: {
      author: {
        columns: {
          id: true,
          displayName: true,
          avatarUrl: true,
          username: true,
          tier: true,
          isCreator: true,
        },
      },
    },
  });
}

/** Create a comment on a highlight. */
export async function createContentComment(highlightId: number, content: string) {
  const user = await requireUser();

  const highlight = await db.query.contentHighlights.findFirst({
    where: eq(contentHighlights.id, highlightId),
    columns: { postId: true },
  });
  if (!highlight) throw new Error("Highlight not found");

  const trimmed = content.trim();
  if (trimmed.length < 1 || trimmed.length > 2000) {
    throw new Error("Comment must be between 1 and 2000 characters");
  }

  const [comment] = await db
    .insert(contentComments)
    .values({
      highlightId,
      postId: highlight.postId,
      authorId: user.id,
      content: trimmed,
    })
    .returning();

  revalidatePath(`/learn`);
  return comment;
}

/** React to a highlight (toggle). */
export async function reactToHighlight(
  highlightId: number,
  type: "fire" | "heart" | "plus1" | "eyes" | "question",
) {
  const user = await requireUser();

  const existing = await db.query.contentReactions.findFirst({
    where: and(
      eq(contentReactions.highlightId, highlightId),
      eq(contentReactions.userId, user.id),
      eq(contentReactions.type, type),
    ),
  });

  if (existing) {
    await db.delete(contentReactions).where(eq(contentReactions.id, existing.id));
    revalidatePath(`/learn`);
    return { action: "removed" };
  }

  const highlight = await db.query.contentHighlights.findFirst({
    where: eq(contentHighlights.id, highlightId),
    columns: { postId: true },
  });
  if (!highlight) throw new Error("Highlight not found");

  await db.insert(contentReactions).values({
    highlightId,
    postId: highlight.postId,
    userId: user.id,
    type,
  });

  revalidatePath(`/learn`);
  return { action: "added" };
}

// ============================================
// CONTENT REPORTS
// ============================================

/** Submit a content report. Throws if already reported by this user. */
export async function submitContentReport(
  postId: number,
  category: string,
  reason?: string,
) {
  const user = await requireUser();

  // Check if already reported by this user
  const existing = await db.query.contentReports.findFirst({
    where: and(
      eq(contentReports.postId, postId),
      eq(contentReports.reporterId, user.id),
    ),
  });
  if (existing) {
    throw new Error("You have already reported this content");
  }

  await db.insert(contentReports).values({
    postId,
    reporterId: user.id,
    category,
    reason: reason || null,
  });
}

// ============================================
// POST PERMISSIONS
// ============================================

/** Check if the current user can edit a post. */
export async function canEditPost(postId: number): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  if (user.isCreator || (user.role ?? 0) >= 1) return true;

  const post = await db.query.blogPosts.findFirst({
    where: eq(blogPosts.id, postId),
    columns: { authorId: true },
  });
  return post?.authorId === user.id;
}

// ============================================
// PUBLIC DATA QUERIES
// ============================================

/** Get posts published before ChatGPT (Nov 30, 2022) for AI disclosure page. */
export async function getPreLLMPosts(limit = 6) {
  const cutoff = new Date("2022-11-30");
  return db.query.blogPosts.findMany({
    where: and(
      eq(blogPosts.status, "published"),
      eq(blogPosts.visibility, "public"),
      sql`${blogPosts.publishedAt} < ${cutoff}`,
    ),
    columns: { id: true, slug: true, title: true, publishedAt: true },
    orderBy: [desc(blogPosts.publishedAt)],
    limit,
  });
}

/** Get credits page data - supporters grouped by tier. */
export async function getCreditsPage() {
  const allUsers = await db.query.users.findMany({
    columns: {
      id: true,
      displayName: true,
      username: true,
      avatarUrl: true,
      tier: true,
      twitchSubTier: true,
      discordBooster: true,
      clerkPlan: true,
      clerkPlanStatus: true,
      isCreator: true,
      role: true,
    },
  });

  const LIMIT = 50;

  function paginate(items: typeof allUsers) {
    return {
      items: items.slice(0, LIMIT),
      hasMore: items.length > LIMIT,
      total: items.length,
    };
  }

  const staff = allUsers.filter((u) => u.isCreator || (u.role ?? 0) >= 1);
  const superLegendII = allUsers.filter(
    (u) => u.tier === "tier2" && !u.isCreator && (u.role ?? 0) < 1,
  );
  const superLegendI = allUsers.filter(
    (u) => u.tier === "tier1" && !u.isCreator && (u.role ?? 0) < 1,
  );
  const twitchT3 = allUsers.filter((u) => u.twitchSubTier === 3);
  const twitchT2 = allUsers.filter((u) => u.twitchSubTier === 2);
  const twitchT1 = allUsers.filter((u) => u.twitchSubTier === 1);
  const discordBoosters = allUsers.filter((u) => u.discordBooster);
  const contributors = allUsers.filter((u) => false); // placeholder — no isContributor column in Postgres

  return {
    staff: paginate(staff),
    superLegendII: paginate(superLegendII),
    superLegendI: paginate(superLegendI),
    twitch: {
      tier3: paginate(twitchT3),
      tier2: paginate(twitchT2),
      tier1: paginate(twitchT1),
    },
    discordBoosters: paginate(discordBoosters),
    contributors: paginate(contributors),
  };
}

/** Update founder status in Postgres (replaces Convex sync). */
export async function updateFounderStatus(clerkId: string, founderNumber: number) {
  await db
    .update(users)
    .set({ founderNumber })
    .where(eq(users.clerkId, clerkId));
}
