/**
 * Pages Router API route for admin support management.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { requireCreatorApi } from "@/src/db/api-auth";
import { db } from "@/src/db";
import {
  blogPosts,
  notifications,
  supporterNotifications,
  users,
  vaultFiles,
} from "@/src/db/schema";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { action, ...params } = req.body;

    switch (action) {
      case "getQuickStats": {
        await requireCreatorApi(req);
        const [tier1Count] = await db.select({ count: count() }).from(users).where(eq(users.tier, "tier1"));
        const [tier2Count] = await db.select({ count: count() }).from(users).where(eq(users.tier, "tier2"));
        const [totalUsers] = await db.select({ count: count() }).from(users);
        return res.json({ tier1: tier1Count.count, tier2: tier2Count.count, total: totalUsers.count });
      }

      case "listSuperLegends": {
        await requireCreatorApi(req);
        const conditions = params.tierFilter
          ? eq(users.tier, params.tierFilter)
          : sql`${users.tier} IN ('tier1', 'tier2')`;
        const legends = await db.query.users.findMany({
          where: conditions,
          columns: {
            id: true, clerkId: true, displayName: true, username: true, avatarUrl: true,
            tier: true, tierValidUntil: true, twitchSubTier: true, discordBooster: true,
            clerkPlan: true, clerkPlanStatus: true, founderNumber: true,
            supporterSyncedAt: true, linkedServices: true,
          },
          orderBy: [desc(users.tier), users.displayName],
        });
        return res.json(legends);
      }

      case "getSubscriberVerification": {
        await requireCreatorApi(req);
        const user = await db.query.users.findFirst({
          where: eq(users.id, params.userId),
          columns: {
            id: true, clerkId: true, displayName: true, tier: true, tierValidUntil: true,
            twitchSubTier: true, discordBooster: true, clerkPlan: true, clerkPlanStatus: true,
            discordHighestRole: true, supporterSyncedAt: true,
          },
        });
        return res.json(user ?? null);
      }

      case "getContentDeliveryStats": {
        await requireCreatorApi(req);
        const [postCount] = await db.select({ count: count() }).from(blogPosts).where(eq(blogPosts.status, "published"));
        const tier1Posts = await db.select({ count: count() }).from(blogPosts).where(and(eq(blogPosts.status, "published"), eq(blogPosts.visibility, "tier1")));
        const tier2Posts = await db.select({ count: count() }).from(blogPosts).where(and(eq(blogPosts.status, "published"), eq(blogPosts.visibility, "tier2")));
        const [vaultCount] = await db.select({ count: count() }).from(vaultFiles).where(eq(vaultFiles.isArchived, false));
        return res.json({
          totalPublished: postCount.count,
          tier1Posts: tier1Posts[0]?.count ?? 0,
          tier2Posts: tier2Posts[0]?.count ?? 0,
          vaultFiles: vaultCount.count,
        });
      }

      case "listNotifications": {
        await requireCreatorApi(req);
        return res.json(await db.query.supporterNotifications.findMany({
          orderBy: [desc(supporterNotifications.sentAt)],
          limit: 50,
        }));
      }

      case "sendNotification": {
        const creator = await requireCreatorApi(req);
        const tierCondition = params.targetTier === "all"
          ? sql`${users.tier} IN ('tier1', 'tier2')`
          : eq(users.tier, params.targetTier);
        const [recipientResult] = await db.select({ count: count() }).from(users).where(tierCondition);
        const [notification] = await db
          .insert(supporterNotifications)
          .values({
            title: params.title,
            message: params.message,
            targetTier: params.targetTier,
            sentBy: creator.id,
            recipientCount: recipientResult.count,
          })
          .returning();
        const recipients = await db.query.users.findMany({ where: tierCondition, columns: { id: true } });
        if (recipients.length > 0) {
          await db.insert(notifications).values(
            recipients.map((r) => ({
              userId: r.id,
              type: "supporter_notification",
              title: params.title,
              body: params.message,
            })),
          );
        }
        return res.json(notification);
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err: any) {
    if (err.message?.includes("required")) return res.status(401).json({ error: err.message });
    console.error("[/api/admin/support-actions] Error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
