import { eq } from "drizzle-orm";
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/src/db";
import { inventoryItems, userInventory, users } from "@/src/db/schema";

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
    // Look up user by clerkId
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Fetch user's inventory with item details
    const inventory = await db
      .select({
        id: userInventory.id,
        itemId: userInventory.itemId,
        source: userInventory.source,
        sourceReferenceId: userInventory.sourceReferenceId,
        quantity: userInventory.quantity,
        isUsed: userInventory.isUsed,
        usedAt: userInventory.usedAt,
        acquiredAt: userInventory.acquiredAt,
        expiresAt: userInventory.expiresAt,
        metadata: userInventory.metadata,
        item: {
          slug: inventoryItems.slug,
          name: inventoryItems.name,
          description: inventoryItems.description,
          iconUrl: inventoryItems.iconUrl,
          previewUrl: inventoryItems.previewUrl,
          backgroundColor: inventoryItems.backgroundColor,
          rarity: inventoryItems.rarity,
          type: inventoryItems.type,
          services: inventoryItems.services,
          isStackable: inventoryItems.isStackable,
          isConsumable: inventoryItems.isConsumable,
          assetUrl: inventoryItems.assetUrl,
          code: inventoryItems.code,
          metadata: inventoryItems.metadata,
        },
      })
      .from(userInventory)
      .innerJoin(inventoryItems, eq(userInventory.itemId, inventoryItems.id))
      .where(eq(userInventory.userId, user.id));

    return res.status(200).json({
      userId: user.id,
      clerkId: user.clerkId,
      items: inventory,
    });
  } catch (error) {
    console.error("[inventory/user] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
