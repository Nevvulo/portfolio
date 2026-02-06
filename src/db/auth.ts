import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { users } from "./schema";

/**
 * Look up a user by clerkId, auto-creating if not found.
 * Handles dev environments where Clerk webhooks aren't configured.
 * CREATOR_CLERK_ID env var designates the site creator.
 */
export async function getOrCreateUserByClerkId(clerkId: string) {
  const existing = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });
  if (existing) return existing;

  // Auto-create: pull profile from Clerk if available
  let displayName = "User";
  let username: string | undefined;
  let avatarUrl: string | undefined;
  try {
    const clerkUser = await currentUser();
    if (clerkUser) {
      displayName =
        [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
        clerkUser.username ||
        "User";
      username = clerkUser.username ?? undefined;
      avatarUrl = clerkUser.imageUrl ?? undefined;
    }
  } catch {
    // currentUser() may fail in Pages Router API routes — that's fine
  }

  const [newUser] = await db
    .insert(users)
    .values({
      clerkId,
      displayName,
      username,
      avatarUrl,
      isCreator: clerkId === process.env.CREATOR_CLERK_ID,
    })
    .onConflictDoUpdate({
      target: users.clerkId,
      set: { displayName, username, avatarUrl },
    })
    .returning();

  return newUser ?? null;
}

/**
 * Get the current user from the database (or null if not authenticated).
 * Auto-creates the user on first sign-in if they don't exist yet.
 */
export async function getCurrentUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;
  return getOrCreateUserByClerkId(clerkId);
}

/**
 * Require an authenticated user — throws if not logged in or not found.
 */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}

/**
 * Require the creator (admin) — throws if not the site creator.
 */
export async function requireCreator() {
  const user = await requireUser();
  if (!user.isCreator) {
    throw new Error("Creator access required");
  }
  return user;
}

/**
 * Require staff or creator — throws if not staff+.
 */
export async function requireStaff() {
  const user = await requireUser();
  if (!user.isCreator && (user.role ?? 0) < 1) {
    throw new Error("Staff access required");
  }
  return user;
}
