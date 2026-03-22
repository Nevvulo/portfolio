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

  const { customerId } = req.body;
  if (!customerId) {
    return res.status(400).json({ error: "No customer ID provided" });
  }

  const origin = req.headers.origin || "http://localhost:3002";

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/support`,
  });

  return res.status(200).json({ url: session.url });
}
