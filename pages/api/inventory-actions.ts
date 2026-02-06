/**
 * RPC-style API route for inventory, vault, and lootbox operations.
 * Pages Router cannot use "use server" actions.
 */
import { and, eq, desc } from "drizzle-orm";
import type { NextApiRequest, NextApiResponse } from "next";
import { getCurrentUserApi, requireUserApi } from "@/src/db/api-auth";
import { db } from "@/src/db";
import {
  inventoryItems,
  tierClaimRecords,
  tierClaimables,
  userInventory,
  userLootboxes,
  vaultFiles,
} from "@/src/db/schema";
import { canAccessTier } from "@/src/db/auth-utils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { action, ...params } = req.body;

    switch (action) {
      // ===================== VAULT =====================
      case "getVaultContent": {
        const user = await getCurrentUserApi(req);
        const userTier = user?.tier ?? null;
        const allFiles = await db.query.vaultFiles.findMany({
          where: eq(vaultFiles.isArchived, false),
          orderBy: [desc(vaultFiles.displayOrder), desc(vaultFiles.createdAt)],
        });
        const accessible = allFiles.filter((f) =>
          canAccessTier(userTier, f.visibility),
        );
        const items = accessible.slice(
          params.offset,
          params.offset + params.limit,
        );
        const hasMore = accessible.length > params.offset + params.limit;
        return res.json({ items, hasMore });
      }

      // ===================== INVENTORY =====================
      case "getMyInventory": {
        const user = await getCurrentUserApi(req);
        if (!user) return res.json(null);
        const result = await db.query.userInventory.findMany({
          where: eq(userInventory.userId, user.id),
          orderBy: [desc(userInventory.acquiredAt)],
          with: { item: true },
        });
        return res.json(result);
      }

      case "getMyLootboxes": {
        const user = await getCurrentUserApi(req);
        if (!user) return res.json(null);
        const result = await db.query.userLootboxes.findMany({
          where: and(
            eq(userLootboxes.userId, user.id),
            eq(userLootboxes.isOpened, params.opened),
          ),
          orderBy: [desc(userLootboxes.deliveredAt)],
        });
        return res.json(result);
      }

      case "getAvailableClaimables": {
        const user = await getCurrentUserApi(req);
        if (!user) return res.json(null);
        const userTier = user.tier;
        if (userTier === "free") return res.json([]);
        const tiers =
          userTier === "tier2" ? ["tier1", "tier2"] : ["tier1"];
        const claimableRows = await db.query.tierClaimables.findMany({
          where: eq(tierClaimables.isActive, true),
          orderBy: [tierClaimables.displayOrder],
          with: { item: true, claims: true },
        });
        const result = claimableRows
          .filter((c) => tiers.includes(c.requiredTier))
          .filter((c) => !c.claims.some((claim) => claim.userId === user.id))
          .map((c) => ({ id: c.id, headline: c.headline, item: c.item }));
        return res.json(result);
      }

      case "claimTierItem": {
        const user = await requireUserApi(req);
        const claimable = await db.query.tierClaimables.findFirst({
          where: eq(tierClaimables.id, params.tierClaimableId),
          with: { item: true },
        });
        if (!claimable || !claimable.isActive) {
          return res
            .status(400)
            .json({ error: "This item is no longer available" });
        }
        const userTier = user.tier;
        const requiredTier = claimable.requiredTier;
        if (requiredTier === "tier2" && userTier !== "tier2") {
          return res
            .status(403)
            .json({ error: "This item requires a higher tier" });
        }
        if (requiredTier === "tier1" && userTier === "free") {
          return res
            .status(403)
            .json({ error: "This item requires a supporter tier" });
        }
        const existingClaim = await db.query.tierClaimRecords.findFirst({
          where: and(
            eq(tierClaimRecords.userId, user.id),
            eq(tierClaimRecords.tierClaimableId, params.tierClaimableId),
          ),
        });
        if (existingClaim) {
          return res
            .status(400)
            .json({ error: "You have already claimed this item" });
        }
        await db.insert(tierClaimRecords).values({
          userId: user.id,
          tierClaimableId: params.tierClaimableId,
        });
        await db.insert(userInventory).values({
          userId: user.id,
          itemId: claimable.itemId,
          source: "tier_claim",
          sourceReferenceId: String(params.tierClaimableId),
        });
        return res.json({ success: true });
      }

      case "useConsumableItem": {
        const user = await requireUserApi(req);
        const entry = await db.query.userInventory.findFirst({
          where: and(
            eq(userInventory.id, params.inventoryEntryId),
            eq(userInventory.userId, user.id),
          ),
          with: { item: true },
        });
        if (!entry)
          return res
            .status(404)
            .json({ error: "Item not found in your inventory" });
        if (entry.isUsed)
          return res
            .status(400)
            .json({ error: "This item has already been used" });
        if (!entry.item.isConsumable)
          return res
            .status(400)
            .json({ error: "This item is not consumable" });
        await db
          .update(userInventory)
          .set({ isUsed: true, usedAt: new Date() })
          .where(eq(userInventory.id, params.inventoryEntryId));
        return res.json({ success: true });
      }

      case "openLootbox": {
        const user = await requireUserApi(req);
        const lootbox = await db.query.userLootboxes.findFirst({
          where: and(
            eq(userLootboxes.id, params.lootboxId),
            eq(userLootboxes.userId, user.id),
          ),
          with: { template: true },
        });
        if (!lootbox)
          return res.status(404).json({ error: "Lootbox not found" });
        if (lootbox.isOpened)
          return res
            .status(400)
            .json({ error: "This lootbox has already been opened" });
        let itemIds: number[] = [];
        if (lootbox.customItems) {
          itemIds = lootbox.customItems as number[];
        } else if (lootbox.template) {
          const templateItems = lootbox.template.items as any[];
          const rollCount = lootbox.template.rollCount ?? 1;
          for (let i = 0; i < rollCount; i++) {
            const idx = Math.floor(Math.random() * templateItems.length);
            const item = templateItems[idx];
            itemIds.push(typeof item === "number" ? item : item.itemId);
          }
        }
        for (const itemId of itemIds) {
          await db.insert(userInventory).values({
            userId: user.id,
            itemId,
            source: "lootbox",
            sourceReferenceId: String(params.lootboxId),
          });
        }
        await db
          .update(userLootboxes)
          .set({
            isOpened: true,
            openedAt: new Date(),
            receivedItemIds: itemIds,
          })
          .where(eq(userLootboxes.id, params.lootboxId));
        return res.json({ receivedItemIds: itemIds });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Authentication required")) {
      return res.status(401).json({ error: message });
    }
    console.error("[inventory-actions]", error);
    return res.status(500).json({ error: message });
  }
}
