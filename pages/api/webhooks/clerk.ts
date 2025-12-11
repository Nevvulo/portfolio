import type { NextApiRequest, NextApiResponse } from "next";
import { Webhook } from "svix";
import { syncDiscordRoles } from "../discord/roles";
import { PLANS } from "../../../lib/clerk";
import { getSupporterKey, redis } from "../../../lib/redis";

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    console.error("Missing CLERK_WEBHOOK_SECRET");
    return res.status(500).json({ error: "Server misconfigured" });
  }

  // Verify the webhook signature
  const svix_id = req.headers["svix-id"] as string;
  const svix_timestamp = req.headers["svix-timestamp"] as string;
  const svix_signature = req.headers["svix-signature"] as string;

  if (!svix_id || !svix_timestamp || !svix_signature) {
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
    console.error("Webhook verification failed:", err);
    return res.status(400).json({ error: "Invalid signature" });
  }

  // Handle subscriptionItem events
  switch (event.type) {
    case "subscriptionItem.active": {
      const userId = event.data.user_id;
      const planId = event.data.plan?.id || event.data.plan_id;

      if (!userId) {
        console.error("No user_id in subscriptionItem event");
        break;
      }

      console.log(`Subscription active for user ${userId}, plan: ${planId}`);

      // Sync Discord roles
      const result = await syncDiscordRoles(userId, planId ?? null);
      if (!result.success) {
        console.error(`Failed to sync Discord role: ${result.error}`);
      }

      // Update Redis cache with subscription status
      const key = getSupporterKey(userId);
      const clerkPlan = planId === PLANS.SUPER_LEGEND ? "super_legend"
        : planId === PLANS.SUPER_LEGEND_2 ? "super_legend_2"
        : null;

      await redis.hset(key, {
        clerkPlan: clerkPlan ?? "",
        clerkPlanStatus: "active",
        lastSyncedAt: new Date().toISOString(),
      });
      console.log(`Updated Redis cache for user ${userId} with plan ${clerkPlan}`);
      break;
    }

    case "subscriptionItem.canceled":
    case "subscriptionItem.ended": {
      const userId = event.data.user_id;

      if (!userId) {
        console.error("No user_id in subscriptionItem event");
        break;
      }

      // Remove all supporter roles
      console.log(`Subscription ended/canceled for user ${userId}`);
      const result = await syncDiscordRoles(userId, null);
      if (!result.success) {
        console.error(`Failed to remove Discord roles: ${result.error}`);
      }

      // Update Redis cache with canceled status
      const key = getSupporterKey(userId);
      const status = event.type === "subscriptionItem.canceled" ? "canceled" : "canceled";
      await redis.hset(key, {
        clerkPlan: "",
        clerkPlanStatus: status,
        lastSyncedAt: new Date().toISOString(),
      });
      console.log(`Updated Redis cache for user ${userId} - subscription ${event.type}`);
      break;
    }

    default:
      console.log(`Unhandled webhook event: ${event.type}`);
  }

  return res.status(200).json({ received: true });
}
