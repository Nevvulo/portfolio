import { ConvexHttpClient } from "convex/browser";
import type { NextApiRequest, NextApiResponse } from "next";
import { api } from "../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Admin API key auth
  const apiKey = req.headers["x-api-key"];
  if (apiKey !== process.env.INVENTORY_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { itemId, targetUserIds, targetTier } = req.body;

  if (!itemId) {
    return res.status(400).json({ error: "Missing itemId" });
  }

  if (!targetUserIds && !targetTier) {
    return res.status(400).json({ error: "Must specify targetUserIds or targetTier" });
  }

  try {
    // This endpoint proxies to the Convex admin mutation
    // Since ConvexHttpClient doesn't support auth tokens for admin mutations,
    // we use a scheduled internal action pattern instead
    // For now, return the parameters needed for the caller to use directly
    return res.status(200).json({
      action: "sendDirectItem",
      params: { itemId, targetUserIds, targetTier },
      message: "Use Convex admin mutation directly for server-side grants",
    });
  } catch (error) {
    console.error("[inventory/grant] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
