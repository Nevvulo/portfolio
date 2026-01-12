import type { NextApiRequest, NextApiResponse } from "next";
import { Webhook } from "svix";
import { PLANS } from "../../../lib/clerk";
import { logger, trackMetric } from "../../../lib/observability";
import { getSupporterKey, redis } from "../../../lib/redis";
import { syncDiscordRoles } from "../discord/roles";

// Disable body parsing - we need the raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req: NextApiRequest): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

type WebhookEvent = {
  type: string;
  data: {
    id: string;
    user_id?: string;
    plan_id?: string;
    plan?: {
      id?: string;
      name?: string;
    };
    status?: string;
    [key: string]: unknown;
  };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    logger.error("Clerk webhook secret not configured", { endpoint: "/api/webhooks/clerk" });
    return res.status(500).json({ error: "Server misconfigured" });
  }

  // Verify the webhook signature
  const svix_id = req.headers["svix-id"] as string;
  const svix_timestamp = req.headers["svix-timestamp"] as string;
  const svix_signature = req.headers["svix-signature"] as string;

  if (!svix_id || !svix_timestamp || !svix_signature) {
    logger.warn("Clerk webhook missing svix headers", { svix_id: !!svix_id });
    return res.status(400).json({ error: "Missing svix headers" });
  }

  const rawBody = await getRawBody(req);

  const wh = new Webhook(WEBHOOK_SECRET);
  let event: WebhookEvent;

  try {
    event = wh.verify(rawBody, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    logger.error("Clerk webhook signature verification failed", {
      error: err,
      svix_id,
    });
    trackMetric("webhook.clerk.verification_failed", 1);
    return res.status(400).json({ error: "Invalid signature" });
  }

  const userId = event.data.user_id;
  const planId = event.data.plan?.id || event.data.plan_id;

  logger.info("Clerk webhook received", {
    eventType: event.type,
    eventId: event.data.id,
    userId,
    planId,
  });

  // Handle subscriptionItem events
  switch (event.type) {
    case "subscriptionItem.active": {
      if (!userId) {
        logger.error("Clerk webhook missing user_id", { eventType: event.type, eventId: event.data.id });
        break;
      }

      logger.info("Processing subscription activation", { userId, planId });

      // Sync Discord roles
      const result = await syncDiscordRoles(userId, planId ?? null);
      if (!result.success) {
        logger.error("Failed to sync Discord roles on subscription active", {
          userId,
          planId,
          error: result.error,
        });
        trackMetric("webhook.clerk.discord_sync_failed", 1, { event: "active" });
      } else {
        trackMetric("webhook.clerk.discord_sync_success", 1, { event: "active" });
      }

      // Update Redis cache with subscription status
      const key = getSupporterKey(userId);
      const clerkPlan =
        planId === PLANS.SUPER_LEGEND
          ? "super_legend"
          : planId === PLANS.SUPER_LEGEND_2
            ? "super_legend_2"
            : null;

      try {
        await redis.hset(key, {
          clerkPlan: clerkPlan ?? "",
          clerkPlanStatus: "active",
          lastSyncedAt: new Date().toISOString(),
        });
        logger.info("Updated Redis cache for subscription", { userId, clerkPlan });
      } catch (redisError) {
        logger.error("Failed to update Redis cache", { userId, error: redisError });
        trackMetric("webhook.clerk.redis_update_failed", 1);
      }
      break;
    }

    case "subscriptionItem.canceled":
    case "subscriptionItem.ended": {
      if (!userId) {
        logger.error("Clerk webhook missing user_id", { eventType: event.type, eventId: event.data.id });
        break;
      }

      logger.info("Processing subscription cancellation", { userId, eventType: event.type });

      // Remove all supporter roles
      const result = await syncDiscordRoles(userId, null);
      if (!result.success) {
        logger.error("Failed to remove Discord roles on subscription end", {
          userId,
          error: result.error,
        });
        trackMetric("webhook.clerk.discord_sync_failed", 1, { event: "canceled" });
      } else {
        trackMetric("webhook.clerk.discord_sync_success", 1, { event: "canceled" });
      }

      // Update Redis cache with canceled status
      const key = getSupporterKey(userId);
      const status = event.type === "subscriptionItem.canceled" ? "canceled" : "ended";
      try {
        await redis.hset(key, {
          clerkPlan: "",
          clerkPlanStatus: status,
          lastSyncedAt: new Date().toISOString(),
        });
        logger.info("Updated Redis cache for cancellation", { userId, status });
      } catch (redisError) {
        logger.error("Failed to update Redis cache", { userId, error: redisError });
        trackMetric("webhook.clerk.redis_update_failed", 1);
      }
      break;
    }

    default:
      logger.debug("Unhandled Clerk webhook event", { eventType: event.type });
  }

  // Track webhook processing time
  trackMetric("webhook.clerk.duration", Date.now() - startTime, { eventType: event.type });
  trackMetric("webhook.clerk.processed", 1, { eventType: event.type });

  return res.status(200).json({ received: true });
}
