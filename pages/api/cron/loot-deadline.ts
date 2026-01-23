import { ConvexHttpClient } from "convex/browser";
import type { NextApiRequest, NextApiResponse } from "next";
import { api } from "../../../convex/_generated/api";
import { logger } from "../../../lib/observability";

// Discord webhook for emergency notifications
const SUPPORT_WEBHOOK_URL =
  "https://discord.com/api/webhooks/1464343392837439500/xw9H8NeA37ZVDjmjxPx7qoPsJdXWEGAo-3q9a9MvjTEZlgu9qBWLIDQiok49s7kzxEci";

/**
 * Cron endpoint that runs on the 2nd of each month
 * Checks if Super Legend II monthly loot boxes have been delivered
 * Sends emergency notification to Discord if not
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify cron secret (Vercel adds this header for cron jobs)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Also allow requests from Vercel cron (they use a different header)
    if (req.headers["x-vercel-cron"] !== "true" && process.env.NODE_ENV === "production") {
      logger.warn("Unauthorized cron request", { authHeader: !!authHeader });
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  try {
    // Initialize Convex client
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      throw new Error("NEXT_PUBLIC_CONVEX_URL not configured");
    }

    const client = new ConvexHttpClient(convexUrl);

    // Get current month
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Query loot box status (we'll need to expose this as an internal query)
    // For now, we'll check the scheduledDrops table directly via a query
    const lootStatus = await client.query(api.supportAdmin.getLootBoxStatus, {
      month: currentMonth,
    });

    // Check if we need to send emergency notification
    if (lootStatus.status !== "delivered" && lootStatus.isOverdue) {
      const daysOverdue = lootStatus.daysOverdue;

      // Send emergency Discord webhook
      const embed = {
        title: "🚨 EMERGENCY: Monthly Loot Box Not Delivered!",
        description: "Super Legends do not have their monthly box. This needs immediate attention!",
        color: 0xff0000, // Red
        fields: [
          {
            name: "Month",
            value: new Date(currentMonth + "-01").toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            }),
            inline: true,
          },
          {
            name: "Days Overdue",
            value: String(daysOverdue),
            inline: true,
          },
          {
            name: "Action Required",
            value: "[Deliver now](/admin/support)",
            inline: false,
          },
        ],
        timestamp: new Date().toISOString(),
      };

      await fetch(SUPPORT_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "@here",
          embeds: [embed],
        }),
      });

      logger.info("Sent loot box emergency notification", {
        month: currentMonth,
        daysOverdue,
      });

      return res.status(200).json({
        success: true,
        action: "emergency_notification_sent",
        month: currentMonth,
        daysOverdue,
      });
    }

    // Loot has been delivered or not yet overdue
    logger.info("Loot box check passed", {
      month: currentMonth,
      status: lootStatus.status,
      isOverdue: lootStatus.isOverdue,
    });

    return res.status(200).json({
      success: true,
      action: "none_required",
      month: currentMonth,
      status: lootStatus.status,
    });
  } catch (error) {
    logger.error("Loot deadline cron failed", { error });
    return res.status(500).json({ error: "Internal server error" });
  }
}
