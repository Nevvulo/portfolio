import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Admin API key auth
  const apiKey = req.headers["x-api-key"];
  if (apiKey !== process.env.INVENTORY_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { templateId, customName, customItems, targetUserIds, targetTier } = req.body;

  if (!templateId && !customItems) {
    return res.status(400).json({ error: "Must specify templateId or customItems" });
  }

  if (!targetUserIds && !targetTier) {
    return res.status(400).json({ error: "Must specify targetUserIds or targetTier" });
  }

  try {
    return res.status(200).json({
      action: "shipLootbox",
      params: { templateId, customName, customItems, targetUserIds, targetTier },
      message: "Use Convex admin mutation directly for lootbox delivery",
    });
  } catch (error) {
    console.error("[inventory/lootbox/deliver] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
