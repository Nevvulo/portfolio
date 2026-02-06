"use server";

import { and, count, desc, eq, sql } from "drizzle-orm";
import { requireCreator } from "../auth";
import { db } from "../index";
import {
  inventoryItems,
  lootboxTemplates,
  tierClaimRecords,
  tierClaimables,
  userInventory,
  userLootboxes,
  users,
} from "../schema";

// ============================================
// ITEM CATALOG
// ============================================

export async function getItemCatalog(opts: { includeArchived: boolean }) {
  await requireCreator();
  const conditions = opts.includeArchived
    ? undefined
    : eq(inventoryItems.isArchived, false);
  return db.query.inventoryItems.findMany({
    where: conditions,
    orderBy: [inventoryItems.createdAt],
  });
}

export async function createItem(data: {
  slug: string;
  name: string;
  description: string;
  rarity: string;
  type: string;
  iconUrl?: string;
  previewUrl?: string;
  backgroundColor?: string;
  services?: string[];
  isStackable?: boolean;
  isConsumable?: boolean;
  maxPerUser?: number;
  assetUrl?: string;
  code?: string;
  metadata?: Record<string, any>;
  onClaimEffects?: any[];
}) {
  await requireCreator();
  const [created] = await db.insert(inventoryItems).values(data).returning();
  return created;
}

export async function updateItem(
  id: number,
  data: Partial<{
    slug: string;
    name: string;
    description: string;
    rarity: string;
    type: string;
    iconUrl: string | null;
    previewUrl: string | null;
    backgroundColor: string | null;
    services: string[] | null;
    isStackable: boolean;
    isConsumable: boolean;
    maxPerUser: number | null;
    assetUrl: string | null;
    code: string | null;
    metadata: Record<string, any> | null;
    onClaimEffects: any[] | null;
  }>,
) {
  await requireCreator();
  await db
    .update(inventoryItems)
    .set(data)
    .where(eq(inventoryItems.id, id));
}

export async function archiveItem(id: number) {
  await requireCreator();
  await db
    .update(inventoryItems)
    .set({ isArchived: true })
    .where(eq(inventoryItems.id, id));
}

export async function unarchiveItem(id: number) {
  await requireCreator();
  await db
    .update(inventoryItems)
    .set({ isArchived: false })
    .where(eq(inventoryItems.id, id));
}

// ============================================
// LOOTBOX TEMPLATES
// ============================================

export async function getLootboxTemplates() {
  await requireCreator();
  return db.query.lootboxTemplates.findMany({
    orderBy: [desc(lootboxTemplates.createdAt)],
  });
}

export async function createLootboxTemplate(data: {
  name: string;
  description?: string;
  items: any[];
  iconUrl?: string;
  boxStyle?: string;
  accentColor?: string;
  rollCount?: number;
  targetTiers?: string[];
}) {
  await requireCreator();
  const [created] = await db
    .insert(lootboxTemplates)
    .values(data)
    .returning();
  return created;
}

export async function updateLootboxTemplate(
  id: number,
  data: Partial<{
    name: string;
    description: string | null;
    items: any[];
    isActive: boolean;
    iconUrl: string | null;
    boxStyle: string | null;
    accentColor: string | null;
    rollCount: number | null;
    targetTiers: string[] | null;
  }>,
) {
  await requireCreator();
  await db
    .update(lootboxTemplates)
    .set(data)
    .where(eq(lootboxTemplates.id, id));
}

// ============================================
// SHIP LOOTBOX / DIRECT SEND
// ============================================

export async function shipLootbox(data: {
  userId: number;
  templateId?: number;
  customName?: string;
  customItems?: number[];
  boxStyle: string;
  displayName: string;
}) {
  await requireCreator();
  const [lootbox] = await db
    .insert(userLootboxes)
    .values({
      userId: data.userId,
      templateId: data.templateId ?? null,
      customName: data.customName ?? null,
      customItems: data.customItems ?? null,
      boxStyle: data.boxStyle,
      displayName: data.displayName,
    })
    .returning();
  return lootbox;
}

export async function sendDirectItem(data: {
  userId: number;
  itemId: number;
  quantity?: number;
}) {
  await requireCreator();
  const [entry] = await db
    .insert(userInventory)
    .values({
      userId: data.userId,
      itemId: data.itemId,
      source: "direct_send",
      quantity: data.quantity ?? 1,
    })
    .returning();
  return entry;
}

// ============================================
// TIER CLAIMABLES
// ============================================

export async function getTierClaimables() {
  await requireCreator();
  return db.query.tierClaimables.findMany({
    with: { item: true },
    orderBy: [tierClaimables.displayOrder],
  });
}

export async function createTierClaimable(data: {
  itemId: number;
  requiredTier: string;
  displayOrder?: number;
  headline?: string;
  availableFrom?: Date;
  availableUntil?: Date;
}) {
  await requireCreator();
  const [created] = await db
    .insert(tierClaimables)
    .values(data)
    .returning();
  return created;
}

export async function deactivateTierClaimable(id: number) {
  await requireCreator();
  await db
    .update(tierClaimables)
    .set({ isActive: false })
    .where(eq(tierClaimables.id, id));
}

// ============================================
// ANALYTICS
// ============================================

export async function getInventoryAnalytics() {
  await requireCreator();

  const [totalItems] = await db
    .select({ count: count() })
    .from(inventoryItems)
    .where(eq(inventoryItems.isArchived, false));

  const [totalOwned] = await db.select({ count: count() }).from(userInventory);

  const [totalLootboxes] = await db
    .select({ count: count() })
    .from(userLootboxes);

  const [unopenedLootboxes] = await db
    .select({ count: count() })
    .from(userLootboxes)
    .where(eq(userLootboxes.isOpened, false));

  const [totalClaims] = await db
    .select({ count: count() })
    .from(tierClaimRecords);

  // Most popular items
  const popularItems = await db
    .select({
      itemId: userInventory.itemId,
      count: count(),
    })
    .from(userInventory)
    .groupBy(userInventory.itemId)
    .orderBy(desc(count()))
    .limit(10);

  return {
    totalItems: totalItems.count,
    totalOwned: totalOwned.count,
    totalLootboxes: totalLootboxes.count,
    unopenedLootboxes: unopenedLootboxes.count,
    totalClaims: totalClaims.count,
    popularItems,
  };
}
