import { eq, inArray } from "drizzle-orm";
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/src/db";
import { inventoryItems, userInventory, users } from "@/src/db/schema";

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

  if (!itemId || typeof itemId !== "number") {
    return res.status(400).json({ error: "Missing or invalid itemId" });
  }

  if (!targetUserIds && !targetTier) {
    return res.status(400).json({ error: "Must specify targetUserIds or targetTier" });
  }

  try {
    // Verify the item exists
    const item = await db.query.inventoryItems.findFirst({
      where: eq(inventoryItems.id, itemId),
    });

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    // Determine target users
    let targetUsers: { id: number }[];

    if (targetUserIds && Array.isArray(targetUserIds)) {
      targetUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(inArray(users.id, targetUserIds));
    } else if (targetTier) {
      targetUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.tier, targetTier));
    } else {
      return res.status(400).json({ error: "Invalid target specification" });
    }

    if (targetUsers.length === 0) {
      return res.status(200).json({ success: true, granted: 0, message: "No matching users" });
    }

    // Grant the item to all target users
    const insertValues = targetUsers.map((u) => ({
      userId: u.id,
      itemId,
      source: "direct_send" as const,
      quantity: 1,
    }));

    await db.insert(userInventory).values(insertValues);

    return res.status(200).json({
      success: true,
      granted: targetUsers.length,
      itemSlug: item.slug,
    });
  } catch (error) {
    console.error("[inventory/grant] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
