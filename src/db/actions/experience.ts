"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "../index";
import { experienceEvents, timeTrackingSessions, users } from "../schema";
import { getCurrentUser, requireUser } from "../auth";
import { levelFromTotalXp } from "../queries/experience";

function todayStr() {
  return new Date().toISOString().split("T")[0]!;
}

async function grantXp(userId: number, amount: number) {
  const [updated] = await db
    .update(users)
    .set({
      totalExperience: sql`${users.totalExperience} + ${amount}`,
    })
    .where(eq(users.id, userId))
    .returning({ totalExperience: users.totalExperience });

  if (updated) {
    const info = levelFromTotalXp(updated.totalExperience ?? 0);
    await db
      .update(users)
      .set({ level: info.level, experience: info.currentXp })
      .where(eq(users.id, userId));
    return { newTotal: updated.totalExperience ?? 0, newLevel: info.level };
  }
  return null;
}

/** Grant XP for viewing a post (1-3 XP, once per post per day). */
export async function grantPostViewXp(postId: number) {
  const user = await requireUser();
  const today = todayStr();

  // Check if already granted today for this post
  const existing = await db.query.experienceEvents.findFirst({
    where: and(
      eq(experienceEvents.userId, user.id),
      eq(experienceEvents.type, "post_view"),
      eq(experienceEvents.referenceId, String(postId)),
      eq(experienceEvents.date, today),
    ),
  });
  if (existing) return { success: false, reason: "already_granted" };

  const xp = Math.floor(Math.random() * 3) + 1; // 1-3

  await db.insert(experienceEvents).values({
    userId: user.id,
    type: "post_view",
    referenceId: String(postId),
    xpGranted: xp,
    date: today,
  });

  const result = await grantXp(user.id, xp);
  return { success: true, xpGranted: xp, ...result };
}

/** Grant XP for first reaction on a post (1 XP, once per post ever). */
export async function grantReactionXp(postId: number) {
  const user = await requireUser();

  const existing = await db.query.experienceEvents.findFirst({
    where: and(
      eq(experienceEvents.userId, user.id),
      eq(experienceEvents.type, "reaction"),
      eq(experienceEvents.referenceId, String(postId)),
    ),
  });
  if (existing) return { success: false, reason: "already_granted" };

  await db.insert(experienceEvents).values({
    userId: user.id,
    type: "reaction",
    referenceId: String(postId),
    xpGranted: 1,
    date: todayStr(),
  });

  const result = await grantXp(user.id, 1);
  return { success: true, xpGranted: 1, ...result };
}

/** Grant XP for commenting (2-3 XP, max 5 per day). */
export async function grantCommentXp(postId: number) {
  const user = await requireUser();
  const today = todayStr();

  // Count today's comment XP events
  const todayComments = await db
    .select({ count: sql<number>`count(*)` })
    .from(experienceEvents)
    .where(
      and(
        eq(experienceEvents.userId, user.id),
        eq(experienceEvents.type, "comment"),
        eq(experienceEvents.date, today),
      ),
    );

  if ((todayComments[0]?.count ?? 0) >= 5) {
    return { success: false, reason: "daily_limit" };
  }

  const xp = Math.floor(Math.random() * 2) + 2; // 2-3

  await db.insert(experienceEvents).values({
    userId: user.id,
    type: "comment",
    referenceId: String(postId),
    xpGranted: xp,
    date: today,
  });

  const result = await grantXp(user.id, xp);
  return { success: true, xpGranted: xp, ...result };
}

/** Track time-on-site heartbeat (called every 180s from client). */
export async function trackTimeHeartbeat() {
  const user = await requireUser();
  const now = new Date();
  const today = todayStr();

  // Find or create today's session
  let session = await db.query.timeTrackingSessions.findFirst({
    where: and(eq(timeTrackingSessions.userId, user.id), eq(timeTrackingSessions.date, today)),
  });

  if (!session) {
    const [newSession] = await db
      .insert(timeTrackingSessions)
      .values({
        userId: user.id,
        sessionStart: now,
        lastHeartbeat: now,
        totalMinutes: 0,
        xpGrantedThisSession: 0,
        date: today,
      })
      .returning();
    session = newSession!;
  }

  // Calculate minutes since last heartbeat
  const lastBeat = new Date(session.lastHeartbeat);
  const gapMinutes = (now.getTime() - lastBeat.getTime()) / 60000;
  const minutesToAdd = gapMinutes > 5 ? 1 : Math.round(gapMinutes); // If gap > 5min, count as 1

  const newTotal = session.totalMinutes + minutesToAdd;

  // Check if we've crossed a 10-minute block
  const blocksBefore = Math.floor(session.totalMinutes / 10);
  const blocksAfter = Math.floor(newTotal / 10);
  let xpToGrant = 0;

  if (blocksAfter > blocksBefore) {
    xpToGrant = Math.floor(Math.random() * 8) + 3; // 3-10 XP per 10-min block
  }

  await db
    .update(timeTrackingSessions)
    .set({
      lastHeartbeat: now,
      totalMinutes: newTotal,
      xpGrantedThisSession: session.xpGrantedThisSession + xpToGrant,
    })
    .where(eq(timeTrackingSessions.id, session.id));

  if (xpToGrant > 0) {
    await db.insert(experienceEvents).values({
      userId: user.id,
      type: "time_on_site",
      xpGranted: xpToGrant,
      date: today,
    });
    await grantXp(user.id, xpToGrant);
  }

  return {
    success: true,
    minutesTracked: newTotal,
    xpGranted: xpToGrant,
    totalSessionXp: session.xpGrantedThisSession + xpToGrant,
  };
}

/** Get current user's experience/level data (client-callable wrapper). */
export async function getMyExperience() {
  const user = await getCurrentUser();
  if (!user) return null;

  const totalXp = user.totalExperience ?? 0;
  const info = levelFromTotalXp(totalXp);
  return {
    level: info.level,
    currentXp: info.currentXp,
    xpForNextLevel: info.xpForNextLevel,
    totalExperience: totalXp,
    progressPercent: info.xpForNextLevel > 0 ? Math.floor((info.currentXp / info.xpForNextLevel) * 100) : 0,
  };
}
