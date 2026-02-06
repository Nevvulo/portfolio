/**
 * Pages Router API route for admin inventory management.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { count, desc, eq } from "drizzle-orm";
import { requireCreatorApi } from "@/src/db/api-auth";
import { db } from "@/src/db";
import {
  inventoryItems,
  lootboxTemplates,
  tierClaimRecords,
  tierClaimables,
  userInventory,
  userLootboxes,
} from "@/src/db/schema";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { action, ...params } = req.body;

    switch (action) {
      // Item catalog
      case "getItemCatalog": {
        await requireCreatorApi(req);
        const conditions = params.includeArchived ? undefined : eq(inventoryItems.isArchived, false);
        return res.json(await db.query.inventoryItems.findMany({ where: conditions, orderBy: [inventoryItems.createdAt] }));
      }

      case "createItem": {
        await requireCreatorApi(req);
        const [created] = await db.insert(inventoryItems).values(params.data).returning();
        return res.json(created);
      }

      case "updateItem": {
        await requireCreatorApi(req);
        await db.update(inventoryItems).set(params.data).where(eq(inventoryItems.id, params.id));
        return res.json({ ok: true });
      }

      case "archiveItem": {
        await requireCreatorApi(req);
        await db.update(inventoryItems).set({ isArchived: true }).where(eq(inventoryItems.id, params.id));
        return res.json({ ok: true });
      }

      case "unarchiveItem": {
        await requireCreatorApi(req);
        await db.update(inventoryItems).set({ isArchived: false }).where(eq(inventoryItems.id, params.id));
        return res.json({ ok: true });
      }

      // Lootbox templates
      case "getLootboxTemplates": {
        await requireCreatorApi(req);
        return res.json(await db.query.lootboxTemplates.findMany({ orderBy: [desc(lootboxTemplates.createdAt)] }));
      }

      case "createLootboxTemplate": {
        await requireCreatorApi(req);
        const [created] = await db.insert(lootboxTemplates).values(params.data).returning();
        return res.json(created);
      }

      case "updateLootboxTemplate": {
        await requireCreatorApi(req);
        await db.update(lootboxTemplates).set(params.data).where(eq(lootboxTemplates.id, params.id));
        return res.json({ ok: true });
      }

      // Ship lootbox / direct send
      case "shipLootbox": {
        await requireCreatorApi(req);
        const [lootbox] = await db
          .insert(userLootboxes)
          .values({
            userId: params.userId,
            templateId: params.templateId ?? null,
            customName: params.customName ?? null,
            customItems: params.customItems ?? null,
            boxStyle: params.boxStyle,
            displayName: params.displayName,
          })
          .returning();
        return res.json(lootbox);
      }

      case "sendDirectItem": {
        await requireCreatorApi(req);
        const [entry] = await db
          .insert(userInventory)
          .values({
            userId: params.userId,
            itemId: params.itemId,
            source: "direct_send",
            quantity: params.quantity ?? 1,
          })
          .returning();
        return res.json(entry);
      }

      // Tier claimables
      case "getTierClaimables": {
        await requireCreatorApi(req);
        return res.json(await db.query.tierClaimables.findMany({
          with: { item: true },
          orderBy: [tierClaimables.displayOrder],
        }));
      }

      case "createTierClaimable": {
        await requireCreatorApi(req);
        const [created] = await db.insert(tierClaimables).values(params.data).returning();
        return res.json(created);
      }

      case "deactivateTierClaimable": {
        await requireCreatorApi(req);
        await db.update(tierClaimables).set({ isActive: false }).where(eq(tierClaimables.id, params.id));
        return res.json({ ok: true });
      }

      // Analytics
      case "getInventoryAnalytics": {
        await requireCreatorApi(req);
        const [totalItems] = await db.select({ count: count() }).from(inventoryItems).where(eq(inventoryItems.isArchived, false));
        const [totalOwned] = await db.select({ count: count() }).from(userInventory);
        const [totalLootboxes] = await db.select({ count: count() }).from(userLootboxes);
        const [unopenedLootboxes] = await db.select({ count: count() }).from(userLootboxes).where(eq(userLootboxes.isOpened, false));
        const [totalClaims] = await db.select({ count: count() }).from(tierClaimRecords);
        const popularItems = await db
          .select({ itemId: userInventory.itemId, count: count() })
          .from(userInventory)
          .groupBy(userInventory.itemId)
          .orderBy(desc(count()))
          .limit(10);
        return res.json({
          totalItems: totalItems.count,
          totalOwned: totalOwned.count,
          totalLootboxes: totalLootboxes.count,
          unopenedLootboxes: unopenedLootboxes.count,
          totalClaims: totalClaims.count,
          popularItems,
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err: any) {
    if (err.message?.includes("required")) return res.status(401).json({ error: err.message });
    console.error("[/api/admin/inventory-actions] Error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
