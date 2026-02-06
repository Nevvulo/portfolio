"use server";

import { and, eq, sql } from "drizzle-orm";
import { db } from "../index";
import { blogPosts, users } from "../schema";
import { getCurrentUser, requireUser } from "../auth";

/** Get a user by their username. */
export async function getUserByUsername(username: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
    columns: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bannerUrl: true,
      bannerFocalY: true,
      bio: true,
      tier: true,
      isCreator: true,
      discordHighestRole: true,
      discordBooster: true,
      profileLinks: true,
      createdAt: true,
    },
  });
  return user ?? null;
}

/** Get the current logged-in user (for profile comparison). */
export async function getMeForProfile() {
  const user = await getCurrentUser();
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    tier: user.tier,
    isCreator: user.isCreator,
    showOnCredits: user.showOnCredits,
  };
}

/** Get article contributions for a user. */
export async function getUserContributions(userId: number) {
  // Get posts where user is the author
  const authorPosts = await db.query.blogPosts.findMany({
    where: and(
      eq(blogPosts.authorId, userId),
      eq(blogPosts.status, "published"),
    ),
    columns: {
      id: true,
      slug: true,
      title: true,
      description: true,
      contentType: true,
      coverImage: true,
      readTimeMins: true,
      publishedAt: true,
    },
  });

  // Get posts where user is a collaborator
  const allPublished = await db.query.blogPosts.findMany({
    where: eq(blogPosts.status, "published"),
    columns: {
      id: true,
      slug: true,
      title: true,
      description: true,
      contentType: true,
      coverImage: true,
      readTimeMins: true,
      publishedAt: true,
      collaborators: true,
      authorId: true,
    },
  });

  const collabPosts = allPublished.filter((p) => {
    const collabs = p.collaborators as number[] | null;
    return collabs && collabs.includes(userId) && p.authorId !== userId;
  });

  return [
    ...authorPosts.map((p) => ({ ...p, isAuthor: true })),
    ...collabPosts.map((p) => ({ ...p, isAuthor: false })),
  ];
}

/** Update profile links for the current user. */
export async function updateProfileLinks(
  links: Array<{ type: string; serviceKey?: string; url: string; title?: string }>,
) {
  const user = await requireUser();
  await db
    .update(users)
    .set({ profileLinks: links })
    .where(eq(users.id, user.id));
}

/** Update showOnCredits preference. */
export async function updateShowOnCredits(showOnCredits: boolean) {
  const user = await requireUser();
  await db
    .update(users)
    .set({ showOnCredits })
    .where(eq(users.id, user.id));
}
