"use server";

import { and, eq, desc } from "drizzle-orm";
import { db } from "../index";
import {
  inventoryItems,
  tierClaimRecords,
  tierClaimables,
  userInventory,
  userLootboxes,
} from "../schema";
import { getCurrentUser, requireUser } from "../auth";

/** Get the current user's inventory (items joined with item details). */
export async function getMyInventory() {
  const user = await getCurrentUser();
  if (!user) return null;

  return db.query.userInventory.findMany({
    where: eq(userInventory.userId, user.id),
    orderBy: [desc(userInventory.acquiredAt)],
    with: {
      item: true,
    },
  });
}

/** Get the current user's lootboxes (unopened or opened). */
export async function getMyLootboxes(opened: boolean) {
  const user = await getCurrentUser();
  if (!user) return null;

  return db.query.userLootboxes.findMany({
    where: and(
      eq(userLootboxes.userId, user.id),
      eq(userLootboxes.isOpened, opened),
    ),
    orderBy: [desc(userLootboxes.deliveredAt)],
  });
}

/** Get available claimable items for the current user's tier. */
export async function getAvailableClaimables() {
  const user = await getCurrentUser();
  if (!user) return null;

  const userTier = user.tier;
  if (userTier === "free") return [];

  // Get all active claimables for the user's tier or lower
  const tiers = userTier === "tier2" ? ["tier1", "tier2"] : ["tier1"];

  const claimableRows = await db.query.tierClaimables.findMany({
    where: eq(tierClaimables.isActive, true),
    orderBy: [tierClaimables.displayOrder],
    with: {
      item: true,
      claims: true,
    },
  });

  // Filter by required tier and check if user has already claimed
  return claimableRows
    .filter((c) => tiers.includes(c.requiredTier))
    .filter((c) => !c.claims.some((claim) => claim.userId === user.id))
    .map((c) => ({
      id: c.id,
      headline: c.headline,
      item: c.item,
    }));
}

/** Claim a tier item. */
export async function claimTierItem(tierClaimableId: number) {
  const user = await requireUser();

  const claimable = await db.query.tierClaimables.findFirst({
    where: eq(tierClaimables.id, tierClaimableId),
    with: { item: true },
  });

  if (!claimable || !claimable.isActive) {
    throw new Error("This item is no longer available");
  }

  // Check tier eligibility
  const userTier = user.tier;
  const requiredTier = claimable.requiredTier;
  if (requiredTier === "tier2" && userTier !== "tier2") {
    throw new Error("This item requires a higher tier");
  }
  if (requiredTier === "tier1" && userTier === "free") {
    throw new Error("This item requires a supporter tier");
  }

  // Check if already claimed
  const existingClaim = await db.query.tierClaimRecords.findFirst({
    where: and(
      eq(tierClaimRecords.userId, user.id),
      eq(tierClaimRecords.tierClaimableId, tierClaimableId),
    ),
  });

  if (existingClaim) {
    throw new Error("You have already claimed this item");
  }

  // Record the claim
  await db.insert(tierClaimRecords).values({
    userId: user.id,
    tierClaimableId,
  });

  // Add the item to inventory
  await db.insert(userInventory).values({
    userId: user.id,
    itemId: claimable.itemId,
    source: "tier_claim",
    sourceReferenceId: String(tierClaimableId),
  });

  return { success: true };
}

/** Use a consumable item. */
export async function useConsumableItem(inventoryEntryId: number) {
  const user = await requireUser();

  const entry = await db.query.userInventory.findFirst({
    where: and(
      eq(userInventory.id, inventoryEntryId),
      eq(userInventory.userId, user.id),
    ),
    with: { item: true },
  });

  if (!entry) throw new Error("Item not found in your inventory");
  if (entry.isUsed) throw new Error("This item has already been used");
  if (!entry.item.isConsumable) throw new Error("This item is not consumable");

  await db
    .update(userInventory)
    .set({ isUsed: true, usedAt: new Date() })
    .where(eq(userInventory.id, inventoryEntryId));

  return { success: true };
}

/** Open a lootbox. */
export async function openLootbox(lootboxId: number) {
  const user = await requireUser();

  const lootbox = await db.query.userLootboxes.findFirst({
    where: and(
      eq(userLootboxes.id, lootboxId),
      eq(userLootboxes.userId, user.id),
    ),
    with: { template: true },
  });

  if (!lootbox) throw new Error("Lootbox not found");
  if (lootbox.isOpened) throw new Error("This lootbox has already been opened");

  // Get items from template or custom items
  let itemIds: number[] = [];
  if (lootbox.customItems) {
    itemIds = lootbox.customItems as number[];
  } else if (lootbox.template) {
    const templateItems = lootbox.template.items as any[];
    // Simple random selection
    const rollCount = lootbox.template.rollCount ?? 1;
    for (let i = 0; i < rollCount; i++) {
      const idx = Math.floor(Math.random() * templateItems.length);
      const item = templateItems[idx];
      itemIds.push(typeof item === "number" ? item : item.itemId);
    }
  }

  // Add items to user's inventory
  for (const itemId of itemIds) {
    await db.insert(userInventory).values({
      userId: user.id,
      itemId,
      source: "lootbox",
      sourceReferenceId: String(lootboxId),
    });
  }

  // Mark lootbox as opened
  await db
    .update(userLootboxes)
    .set({
      isOpened: true,
      openedAt: new Date(),
      receivedItemIds: itemIds,
    })
    .where(eq(userLootboxes.id, lootboxId));

  return { receivedItemIds: itemIds };
}
