import type { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { stripe } from "../../../lib/stripe";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { priceId } = req.body;

  if (!priceId || typeof priceId !== "string" || !priceId.startsWith("price_")) {
    return res.status(400).json({ error: "Invalid price ID" });
  }

  // Look up the price to determine mode and plan_tier
  const price = await stripe.prices.retrieve(priceId, { expand: ["product"] });
  const isRecurring = price.type === "recurring";
  const planTier = (price.metadata?.plan_tier as string) ?? "unknown";

  const origin = req.headers.origin || "http://localhost:3002";

  const session = await stripe.checkout.sessions.create({
    ui_mode: "embedded",
    mode: isRecurring ? "subscription" : "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    return_url: `${origin}/support/thanks?session_id={CHECKOUT_SESSION_ID}`,
    metadata: {
      user_id: userId,
      platform: "clerk",
      plan_tier: planTier,
    },
    ...(isRecurring ? {
      subscription_data: {
        metadata: {
          user_id: userId,
          platform: "clerk",
        },
      },
    } : {}),
  });

  return res.status(200).json({ clientSecret: session.client_secret });
}
