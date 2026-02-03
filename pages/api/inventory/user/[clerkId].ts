import { ConvexHttpClient } from "convex/browser";
import type { NextApiRequest, NextApiResponse } from "next";
import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Server-to-server auth via API key
  const apiKey = req.headers["x-api-key"];
  if (apiKey !== process.env.INVENTORY_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { clerkId } = req.query;
  if (!clerkId || typeof clerkId !== "string") {
    return res.status(400).json({ error: "Missing clerkId" });
  }

  try {
    const inventory = await convex.query(api.inventory.getInventoryForUser, { clerkId });

    if (!inventory) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json(inventory);
  } catch (error) {
    console.error("[inventory/user] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
