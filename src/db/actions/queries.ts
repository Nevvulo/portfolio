"use server";

/**
 * Client-callable wrappers around server-only query functions.
 * These allow Client Components to call server-only queries via Server Actions.
 */

import { getPostsForBento, getPostBySlug } from "../queries/blog";
import { getStreamSettings, getUpcomingEvents, getLiveStat } from "../queries/stream";
import { getFeaturedGames, getFeaturedSoftware } from "../queries/software";
import { getCurrentUser } from "../auth";
import { eq, and } from "drizzle-orm";
import { db } from "../index";
import { blogPosts } from "../schema";

/** Get all published bento posts (client-callable). */
export async function getPostsForBentoAction() {
  return getPostsForBento();
}

/** Get stream settings (client-callable). */
export async function getStreamSettingsAction() {
  return getStreamSettings();
}

/** Get upcoming events (client-callable). */
export async function getUpcomingEventsAction() {
  return getUpcomingEvents();
}

/** Get featured games (client-callable). */
export async function getFeaturedGamesAction() {
  return getFeaturedGames();
}

/** Get featured software (non-games) (client-callable). */
export async function getFeaturedSoftwareAction() {
  return getFeaturedSoftware();
}

/** Get a live stat by key (client-callable). */
export async function getLiveStatAction(key: string) {
  return getLiveStat(key);
}

/** Get a post by slug (client-callable). */
export async function getPostBySlugAction(slug: string) {
  return getPostBySlug(slug);
}

/** Get a post by slug for editing (checks permission, client-callable). */
export async function getPostBySlugForEditAction(slug: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  const post = await db.query.blogPosts.findFirst({
    where: eq(blogPosts.slug, slug),
  });

  if (!post) return null;

  // Check edit permission: creator, staff, or author
  const canEdit = user.isCreator || (user.role ?? 0) >= 1 || post.authorId === user.id;
  if (!canEdit) return null;

  return post;
}

/** Get watch history for current user (client-callable). */
export async function getWatchHistoryAction(limit = 50) {
  const { getWatchHistoryForUser } = await import("./blog");
  return getWatchHistoryForUser();
}
