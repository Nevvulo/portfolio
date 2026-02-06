"use server";

import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { requireCreator } from "../auth";
import { db } from "../index";
import {
  blogPosts,
  blogViews,
  notifications,
  supporterNotifications,
  users,
  vaultDownloadLogs,
  vaultFiles,
} from "../schema";

// ============================================
// QUICK STATS
// ============================================

export async function getQuickStats() {
  await requireCreator();

  const [tier1Count] = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.tier, "tier1"));

  const [tier2Count] = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.tier, "tier2"));

  const [totalUsers] = await db.select({ count: count() }).from(users);

  return {
    tier1: tier1Count.count,
    tier2: tier2Count.count,
    total: totalUsers.count,
  };
}

// ============================================
// SUPER LEGENDS LIST
// ============================================

export async function listSuperLegends(tierFilter?: string) {
  await requireCreator();

  const conditions = tierFilter
    ? eq(users.tier, tierFilter)
    : sql`${users.tier} IN ('tier1', 'tier2')`;

  return db.query.users.findMany({
    where: conditions,
    columns: {
      id: true,
      clerkId: true,
      displayName: true,
      username: true,
      avatarUrl: true,
      tier: true,
      tierValidUntil: true,
      twitchSubTier: true,
      discordBooster: true,
      clerkPlan: true,
      clerkPlanStatus: true,
      founderNumber: true,
      supporterSyncedAt: true,
      linkedServices: true,
    },
    orderBy: [desc(users.tier), users.displayName],
  });
}

// ============================================
// SUBSCRIBER VERIFICATION
// ============================================

export async function getSubscriberVerification(userId: number) {
  await requireCreator();
  return db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      clerkId: true,
      displayName: true,
      tier: true,
      tierValidUntil: true,
      twitchSubTier: true,
      discordBooster: true,
      clerkPlan: true,
      clerkPlanStatus: true,
      discordHighestRole: true,
      supporterSyncedAt: true,
    },
  });
}

// ============================================
// CONTENT DELIVERY STATS
// ============================================

export async function getContentDeliveryStats() {
  await requireCreator();

  const [postCount] = await db
    .select({ count: count() })
    .from(blogPosts)
    .where(eq(blogPosts.status, "published"));

  const tier1Posts = await db
    .select({ count: count() })
    .from(blogPosts)
    .where(
      and(
        eq(blogPosts.status, "published"),
        eq(blogPosts.visibility, "tier1"),
      ),
    );

  const tier2Posts = await db
    .select({ count: count() })
    .from(blogPosts)
    .where(
      and(
        eq(blogPosts.status, "published"),
        eq(blogPosts.visibility, "tier2"),
      ),
    );

  const [vaultCount] = await db
    .select({ count: count() })
    .from(vaultFiles)
    .where(eq(vaultFiles.isArchived, false));

  return {
    totalPublished: postCount.count,
    tier1Posts: tier1Posts[0]?.count ?? 0,
    tier2Posts: tier2Posts[0]?.count ?? 0,
    vaultFiles: vaultCount.count,
  };
}

// ============================================
// NOTIFICATIONS
// ============================================

export async function listNotifications() {
  await requireCreator();
  return db.query.supporterNotifications.findMany({
    orderBy: [desc(supporterNotifications.sentAt)],
    limit: 50,
  });
}

export async function sendNotification(data: {
  title: string;
  message: string;
  targetTier: string;
}) {
  const creator = await requireCreator();

  // Count recipients
  const tierCondition =
    data.targetTier === "all"
      ? sql`${users.tier} IN ('tier1', 'tier2')`
      : eq(users.tier, data.targetTier);

  const [recipientResult] = await db
    .select({ count: count() })
    .from(users)
    .where(tierCondition);

  // Create the notification record
  const [notification] = await db
    .insert(supporterNotifications)
    .values({
      title: data.title,
      message: data.message,
      targetTier: data.targetTier,
      sentBy: creator.id,
      recipientCount: recipientResult.count,
    })
    .returning();

  // Create individual notifications for each recipient
  const recipients = await db.query.users.findMany({
    where: tierCondition,
    columns: { id: true },
  });

  if (recipients.length > 0) {
    await db.insert(notifications).values(
      recipients.map((r) => ({
        userId: r.id,
        type: "supporter_notification",
        title: data.title,
        body: data.message,
      })),
    );
  }

  return notification;
}
