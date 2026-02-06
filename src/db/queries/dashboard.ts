import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "../index";
import {
  blogPosts,
  blogReactions,
  notifications,
  userInventory,
  userLootboxes,
  users,
  widgetInteractions,
} from "../schema";

/** Get user's unread notification count. */
export async function getUnreadNotificationCount(userId: number) {
  const [result] = await db
    .select({ count: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return result?.count ?? 0;
}

/** Get user's notifications (paginated). */
export async function getUserNotifications(userId: number, limit = 20, offset = 0) {
  return db.query.notifications.findMany({
    where: eq(notifications.userId, userId),
    orderBy: [desc(notifications.createdAt)],
    limit,
    offset,
  });
}

/** Get user's inventory items. */
export async function getUserInventoryItems(userId: number) {
  return db.query.userInventory.findMany({
    where: eq(userInventory.userId, userId),
    with: {
      item: true,
    },
    orderBy: [desc(userInventory.acquiredAt)],
  });
}

/** Get user's unopened lootboxes. */
export async function getUserLootboxes(userId: number) {
  return db.query.userLootboxes.findMany({
    where: and(eq(userLootboxes.userId, userId), eq(userLootboxes.isOpened, false)),
    orderBy: [desc(userLootboxes.deliveredAt)],
  });
}

/** Get user's widget interactions. */
export async function getUserWidgetInteractions(userId: number) {
  return db.query.widgetInteractions.findMany({
    where: eq(widgetInteractions.userId, userId),
  });
}

/** User analytics (creator only). */
export async function getUserAnalytics() {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [totalUsers] = await db.select({ count: count() }).from(users);
  const [activeLastDay] = await db
    .select({ count: count() })
    .from(users)
    .where(gte(users.lastSeenAt, oneDayAgo));
  const [activeLastWeek] = await db
    .select({ count: count() })
    .from(users)
    .where(gte(users.lastSeenAt, sevenDaysAgo));
  const [newLastDay] = await db
    .select({ count: count() })
    .from(users)
    .where(gte(users.createdAt, oneDayAgo));
  const [newLastWeek] = await db
    .select({ count: count() })
    .from(users)
    .where(gte(users.createdAt, sevenDaysAgo));
  const [newLastMonth] = await db
    .select({ count: count() })
    .from(users)
    .where(gte(users.createdAt, thirtyDaysAgo));

  // Tier breakdown
  const tierCounts = await db
    .select({ tier: users.tier, count: count() })
    .from(users)
    .groupBy(users.tier);

  return {
    totalUsers: totalUsers?.count ?? 0,
    activeLastDay: activeLastDay?.count ?? 0,
    activeLastWeek: activeLastWeek?.count ?? 0,
    newLastDay: newLastDay?.count ?? 0,
    newLastWeek: newLastWeek?.count ?? 0,
    newLastMonth: newLastMonth?.count ?? 0,
    tierBreakdown: Object.fromEntries(tierCounts.map((t) => [t.tier, t.count])),
  };
}

/** Get user profile by username. */
export async function getUserByUsername(username: string) {
  return db.query.users.findFirst({
    where: eq(users.username, username.toLowerCase().trim()),
  });
}

/** Get user profile by clerk ID. */
export async function getUserByClerkId(clerkId: string) {
  return db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });
}

/** Search users by display name. */
export async function searchUsers(query: string, limit = 20) {
  if (!query.trim()) return [];
  return db.query.users.findMany({
    where: and(
      eq(users.isBanned, false),
      sql`lower(${users.displayName}) LIKE ${`%${query.toLowerCase()}%`}`,
    ),
    limit,
    columns: {
      id: true,
      displayName: true,
      avatarUrl: true,
      username: true,
      tier: true,
      isCreator: true,
      role: true,
    },
  });
}
