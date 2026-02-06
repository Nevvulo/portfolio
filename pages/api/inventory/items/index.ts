import { eq } from "drizzle-orm";
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/src/db";
import { inventoryItems } from "@/src/db/schema";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Server-to-server auth via API key
  const apiKey = req.headers["x-api-key"];
  if (apiKey !== process.env.INVENTORY_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const items = await db.query.inventoryItems.findMany({
      where: eq(inventoryItems.isArchived, false),
    });

    // Cache for 5 minutes
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
    return res.status(200).json({ items });
  } catch (error) {
    console.error("[inventory/items] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
