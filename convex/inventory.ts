import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { getCurrentUser, requireCreator, requireUser } from "./auth";

// ============================================
// USER QUERIES
// ============================================

/**
 * Get all inventory items for the authenticated user
 * Joins userInventory with inventoryItems for full item details
 */
export const getMyInventory = query({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const entries = await ctx.db
      .query("userInventory")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const items = await Promise.all(
      entries.map(async (entry) => {
        const item = await ctx.db.get(entry.itemId);
        if (!item || item.isArchived) return null;
        return {
          ...entry,
          item,
        };
      }),
    );

    return items.filter(Boolean);
  },
});

/**
 * Get user's lootboxes
 */
export const getMyLootboxes = query({
  args: {
    opened: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    let q = ctx.db
      .query("userLootboxes")
      .withIndex("by_user", (q) => q.eq("userId", user._id));

    const boxes = await q.collect();

    if (args.opened !== undefined) {
      return boxes.filter((b) => b.isOpened === args.opened);
    }

    return boxes;
  },
});

/**
 * Get count of unopened lootboxes (for badge display)
 */
export const getUnopenedLootboxCount = query({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return 0;

    const boxes = await ctx.db
      .query("userLootboxes")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return boxes.filter((b) => !b.isOpened).length;
  },
});

/**
 * Get available tier claimables minus already-claimed
 */
export const getAvailableClaimables = query({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    // Get user's tier level
    const tierLevel = user.tier === "tier2" ? 2 : user.tier === "tier1" ? 1 : 0;
    if (tierLevel === 0) return [];

    const now = Date.now();

    // Get all active claimables for user's tier or lower
    const allClaimables = await ctx.db
      .query("tierClaimables")
      .collect();

    const activeClaimables = allClaimables.filter((c) => {
      if (!c.isActive) return false;
      const requiredLevel = c.requiredTier === "tier2" ? 2 : 1;
      if (tierLevel < requiredLevel) return false;
      if (c.availableFrom && c.availableFrom > now) return false;
      if (c.availableUntil && c.availableUntil < now) return false;
      return true;
    });

    // Get user's claim records
    const claimRecords = await ctx.db
      .query("tierClaimRecords")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const claimedIds = new Set(claimRecords.map((r) => r.tierClaimableId));

    // Filter out already-claimed and join with item data
    const available = await Promise.all(
      activeClaimables
        .filter((c) => !claimedIds.has(c._id))
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map(async (claimable) => {
          const item = await ctx.db.get(claimable.itemId);
          return { ...claimable, item };
        }),
    );

    return available.filter((c) => c.item && !c.item.isArchived);
  },
});

/**
 * Get inventory for a specific user by clerkId (internal/cross-service use)
 */
export const getInventoryForUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const targetUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!targetUser) return null;

    const entries = await ctx.db
      .query("userInventory")
      .withIndex("by_user", (q) => q.eq("userId", targetUser._id))
      .collect();

    const items = await Promise.all(
      entries.map(async (entry) => {
        const item = await ctx.db.get(entry.itemId);
        if (!item || item.isArchived) return null;
        return {
          slug: item.slug,
          name: item.name,
          type: item.type,
          rarity: item.rarity,
          services: item.services,
          iconUrl: item.iconUrl,
          quantity: entry.quantity,
          isUsed: entry.isUsed,
          acquiredAt: entry.acquiredAt,
          metadata: item.metadata,
        };
      }),
    );

    return {
      userId: targetUser._id,
      clerkId: targetUser.clerkId,
      items: items.filter(Boolean),
    };
  },
});

// ============================================
// ADMIN QUERIES
// ============================================

/**
 * Get public item catalog (non-archived items only, no auth required)
 * Used by API routes for cross-service access
 */
export const getPublicItemCatalog = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("inventoryItems").collect();
    return items.filter((i) => !i.isArchived);
  },
});

/**
 * Get full item catalog (admin)
 */
export const getItemCatalog = query({
  args: {
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const items = await ctx.db.query("inventoryItems").collect();

    if (!args.includeArchived) {
      return items.filter((i) => !i.isArchived);
    }

    return items;
  },
});

/**
 * Get all lootbox templates (admin)
 */
export const getLootboxTemplates = query({
  handler: async (ctx) => {
    await requireCreator(ctx);
    return await ctx.db.query("lootboxTemplates").collect();
  },
});

/**
 * Get all tier claimables (admin)
 */
export const getTierClaimables = query({
  handler: async (ctx) => {
    await requireCreator(ctx);

    const claimables = await ctx.db.query("tierClaimables").collect();

    // Join with item data and claim counts
    return await Promise.all(
      claimables.map(async (c) => {
        const item = await ctx.db.get(c.itemId);
        const claims = await ctx.db
          .query("tierClaimRecords")
          .filter((q) => q.eq(q.field("tierClaimableId"), c._id))
          .collect();
        return { ...c, item, claimCount: claims.length };
      }),
    );
  },
});

/**
 * Inventory analytics (admin)
 */
export const getInventoryAnalytics = query({
  handler: async (ctx) => {
    await requireCreator(ctx);

    const allItems = await ctx.db.query("inventoryItems").collect();
    const allInventory = await ctx.db.query("userInventory").collect();
    const allLootboxes = await ctx.db.query("userLootboxes").collect();
    const allClaimRecords = await ctx.db.query("tierClaimRecords").collect();

    // Items in circulation by rarity
    const itemsByRarity: Record<string, number> = {};
    for (const entry of allInventory) {
      const item = allItems.find((i) => i._id === entry.itemId);
      if (item) {
        itemsByRarity[item.rarity] = (itemsByRarity[item.rarity] || 0) + entry.quantity;
      }
    }

    // Lootboxes shipped vs opened
    const totalLootboxes = allLootboxes.length;
    const openedLootboxes = allLootboxes.filter((b) => b.isOpened).length;

    // Top claimed tier items
    const claimCounts: Record<string, number> = {};
    for (const record of allClaimRecords) {
      claimCounts[record.tierClaimableId] = (claimCounts[record.tierClaimableId] || 0) + 1;
    }

    // Recent activity (last 50 inventory entries)
    const recentActivity = allInventory
      .sort((a, b) => b.acquiredAt - a.acquiredAt)
      .slice(0, 50);

    return {
      catalogSize: allItems.filter((i) => !i.isArchived).length,
      totalItemsInCirculation: allInventory.reduce((sum, e) => sum + e.quantity, 0),
      uniqueOwners: new Set(allInventory.map((e) => e.userId)).size,
      itemsByRarity,
      lootboxes: {
        total: totalLootboxes,
        opened: openedLootboxes,
        unopened: totalLootboxes - openedLootboxes,
      },
      totalClaims: allClaimRecords.length,
      recentActivity: recentActivity.slice(0, 20),
    };
  },
});

// ============================================
// USER MUTATIONS
// ============================================

/**
 * Open a lootbox - resolve random items via weights
 */
export const openLootbox = mutation({
  args: { lootboxId: v.id("userLootboxes") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const lootbox = await ctx.db.get(args.lootboxId);
    if (!lootbox) throw new Error("Lootbox not found");
    if (lootbox.userId !== user._id) throw new Error("Not your lootbox");
    if (lootbox.isOpened) throw new Error("Already opened");

    // Check expiration
    if (lootbox.expiresAt && lootbox.expiresAt < Date.now()) {
      throw new Error("This lootbox has expired");
    }

    let itemsToGrant: Id<"inventoryItems">[] = [];

    if (lootbox.templateId) {
      // Template-based lootbox — grant ALL items
      const template = await ctx.db.get(lootbox.templateId);
      if (!template) throw new Error("Template not found");

      for (const entry of template.items) {
        // Backward compat: old format has {itemId, weight, guaranteed}, new format is just the ID
        const itemId = typeof entry === "string" ? entry : (entry as any).itemId;
        if (itemId) itemsToGrant.push(itemId);
      }
    } else if (lootbox.customItems) {
      // Custom one-off lootbox - grant all custom items
      itemsToGrant = [...lootbox.customItems];
    }

    // Create inventory entries for each granted item
    const receivedItemIds: Id<"inventoryItems">[] = [];
    for (const itemId of itemsToGrant) {
      const item = await ctx.db.get(itemId);
      if (!item || item.isArchived) continue;

      // Check if user already has this item and it's stackable
      if (item.isStackable) {
        const existing = await ctx.db
          .query("userInventory")
          .withIndex("by_user_item", (q) => q.eq("userId", user._id).eq("itemId", itemId))
          .first();

        if (existing) {
          // Check max per user
          if (item.maxPerUser && existing.quantity >= item.maxPerUser) continue;
          await ctx.db.patch(existing._id, {
            quantity: existing.quantity + 1,
          });
          receivedItemIds.push(itemId);
          continue;
        }
      } else {
        // Non-stackable: check if already owned
        const existing = await ctx.db
          .query("userInventory")
          .withIndex("by_user_item", (q) => q.eq("userId", user._id).eq("itemId", itemId))
          .first();

        if (existing) continue; // Already owns it
      }

      await ctx.db.insert("userInventory", {
        userId: user._id,
        itemId,
        source: "lootbox",
        sourceReferenceId: args.lootboxId,
        quantity: 1,
        isUsed: false,
        acquiredAt: Date.now(),
      });
      receivedItemIds.push(itemId);
    }

    // Mark lootbox as opened
    await ctx.db.patch(args.lootboxId, {
      isOpened: true,
      openedAt: Date.now(),
      receivedItemIds,
    });

    // Create notification
    const itemNames = await Promise.all(
      receivedItemIds.map(async (id) => {
        const item = await ctx.db.get(id);
        return item?.name ?? "Unknown Item";
      }),
    );

    await ctx.db.insert("notifications", {
      userId: user._id,
      type: "inventory_item",
      title: `Opened ${lootbox.displayName}`,
      body: `You received: ${itemNames.join(", ")}`,
      isRead: false,
      createdAt: Date.now(),
    });

    return { receivedItemIds };
  },
});

/**
 * Claim a tier item
 */
export const claimTierItem = mutation({
  args: { tierClaimableId: v.id("tierClaimables") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const claimable = await ctx.db.get(args.tierClaimableId);
    if (!claimable) throw new Error("Claimable not found");
    if (!claimable.isActive) throw new Error("No longer available");

    // Check tier
    const tierLevel = user.tier === "tier2" ? 2 : user.tier === "tier1" ? 1 : 0;
    const requiredLevel = claimable.requiredTier === "tier2" ? 2 : 1;
    if (tierLevel < requiredLevel) {
      throw new Error("Your tier is not high enough to claim this item");
    }

    // Check availability window
    const now = Date.now();
    if (claimable.availableFrom && claimable.availableFrom > now) {
      throw new Error("This item is not yet available");
    }
    if (claimable.availableUntil && claimable.availableUntil < now) {
      throw new Error("This item is no longer available");
    }

    // Check if already claimed
    const existingClaim = await ctx.db
      .query("tierClaimRecords")
      .withIndex("by_user_claimable", (q) =>
        q.eq("userId", user._id).eq("tierClaimableId", args.tierClaimableId),
      )
      .first();

    if (existingClaim) throw new Error("Already claimed");

    // Get the item
    const item = await ctx.db.get(claimable.itemId);
    if (!item || item.isArchived) throw new Error("Item no longer available");

    // Grant item to user
    const existing = await ctx.db
      .query("userInventory")
      .withIndex("by_user_item", (q) => q.eq("userId", user._id).eq("itemId", claimable.itemId))
      .first();

    if (existing && item.isStackable) {
      await ctx.db.patch(existing._id, {
        quantity: existing.quantity + 1,
      });
    } else if (!existing) {
      await ctx.db.insert("userInventory", {
        userId: user._id,
        itemId: claimable.itemId,
        source: "tier_claim",
        sourceReferenceId: args.tierClaimableId,
        quantity: 1,
        isUsed: false,
        acquiredAt: now,
      });
    }

    // Record the claim
    await ctx.db.insert("tierClaimRecords", {
      userId: user._id,
      tierClaimableId: args.tierClaimableId,
      claimedAt: now,
    });

    // Create notification
    await ctx.db.insert("notifications", {
      userId: user._id,
      type: "inventory_item",
      title: "Item Claimed!",
      body: `You claimed ${item.name}`,
      isRead: false,
      createdAt: now,
    });

    return { itemId: claimable.itemId };
  },
});

/**
 * Use a consumable item
 */
export const useConsumableItem = mutation({
  args: { inventoryEntryId: v.id("userInventory") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const entry = await ctx.db.get(args.inventoryEntryId);
    if (!entry) throw new Error("Inventory entry not found");
    if (entry.userId !== user._id) throw new Error("Not your item");
    if (entry.isUsed) throw new Error("Already used");

    const item = await ctx.db.get(entry.itemId);
    if (!item) throw new Error("Item not found");
    if (!item.isConsumable) throw new Error("This item is not consumable");

    // Mark as used
    if (item.isStackable && entry.quantity > 1) {
      await ctx.db.patch(args.inventoryEntryId, {
        quantity: entry.quantity - 1,
      });
    } else {
      await ctx.db.patch(args.inventoryEntryId, {
        isUsed: true,
        usedAt: Date.now(),
      });
    }

    return {
      itemSlug: item.slug,
      onClaimEffects: item.onClaimEffects ?? [],
    };
  },
});

// ============================================
// ADMIN MUTATIONS
// ============================================

/**
 * Create a new item in the catalog
 */
export const createItem = mutation({
  args: {
    slug: v.string(),
    name: v.string(),
    description: v.string(),
    iconUrl: v.optional(v.string()),
    previewUrl: v.optional(v.string()),
    backgroundColor: v.optional(v.string()),
    rarity: v.union(
      v.literal("common"),
      v.literal("uncommon"),
      v.literal("rare"),
      v.literal("epic"),
      v.literal("legendary"),
    ),
    type: v.union(
      v.literal("cosmetic"),
      v.literal("wallpaper"),
      v.literal("consumable"),
      v.literal("download"),
      v.literal("code"),
      v.literal("role"),
      v.literal("collectible"),
    ),
    services: v.optional(v.array(v.string())),
    isStackable: v.boolean(),
    isConsumable: v.boolean(),
    maxPerUser: v.optional(v.number()),
    assetUrl: v.optional(v.string()),
    code: v.optional(v.string()),
    metadata: v.optional(v.any()),
    onClaimEffects: v.optional(
      v.array(
        v.object({
          service: v.string(),
          action: v.string(),
          payload: v.optional(v.any()),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    // Check slug uniqueness
    const existing = await ctx.db
      .query("inventoryItems")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) throw new Error(`Item with slug "${args.slug}" already exists`);

    const id = await ctx.db.insert("inventoryItems", {
      ...args,
      isArchived: false,
      createdAt: Date.now(),
    });

    return id;
  },
});

/**
 * Update an existing item
 */
export const updateItem = mutation({
  args: {
    id: v.id("inventoryItems"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    iconUrl: v.optional(v.string()),
    previewUrl: v.optional(v.string()),
    backgroundColor: v.optional(v.string()),
    rarity: v.optional(
      v.union(
        v.literal("common"),
        v.literal("uncommon"),
        v.literal("rare"),
        v.literal("epic"),
        v.literal("legendary"),
      ),
    ),
    type: v.optional(
      v.union(
        v.literal("cosmetic"),
        v.literal("wallpaper"),
        v.literal("consumable"),
        v.literal("download"),
        v.literal("code"),
        v.literal("role"),
        v.literal("collectible"),
      ),
    ),
    services: v.optional(v.array(v.string())),
    isStackable: v.optional(v.boolean()),
    isConsumable: v.optional(v.boolean()),
    maxPerUser: v.optional(v.number()),
    assetUrl: v.optional(v.string()),
    code: v.optional(v.string()),
    metadata: v.optional(v.any()),
    onClaimEffects: v.optional(
      v.array(
        v.object({
          service: v.string(),
          action: v.string(),
          payload: v.optional(v.any()),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const { id, ...updates } = args;
    const item = await ctx.db.get(id);
    if (!item) throw new Error("Item not found");

    // Build update object, only including provided fields
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        patch[key] = value;
      }
    }

    await ctx.db.patch(id, patch);
    return id;
  },
});

/**
 * Archive an item (soft delete)
 */
export const archiveItem = mutation({
  args: { id: v.id("inventoryItems") },
  handler: async (ctx, args) => {
    await requireCreator(ctx);
    await ctx.db.patch(args.id, { isArchived: true });
  },
});

/**
 * Unarchive an item
 */
export const unarchiveItem = mutation({
  args: { id: v.id("inventoryItems") },
  handler: async (ctx, args) => {
    await requireCreator(ctx);
    await ctx.db.patch(args.id, { isArchived: false });
  },
});

/**
 * Create a lootbox template
 */
export const createLootboxTemplate = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    items: v.array(v.id("inventoryItems")),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    return await ctx.db.insert("lootboxTemplates", {
      ...args,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

/**
 * Update a lootbox template
 */
export const updateLootboxTemplate = mutation({
  args: {
    id: v.id("lootboxTemplates"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    items: v.optional(v.array(v.id("inventoryItems"))),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const { id, ...updates } = args;
    const template = await ctx.db.get(id);
    if (!template) throw new Error("Template not found");

    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        patch[key] = value;
      }
    }

    await ctx.db.patch(id, patch);
    return id;
  },
});

/**
 * Ship a lootbox to users
 * Can target specific users, a tier, or all subscribers
 */
export const shipLootbox = mutation({
  args: {
    templateId: v.optional(v.id("lootboxTemplates")),
    customName: v.optional(v.string()),
    customItems: v.optional(v.array(v.id("inventoryItems"))),
    targetUserIds: v.optional(v.array(v.id("users"))),
    targetTier: v.optional(v.string()), // "tier1", "tier2", "all"
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    let template;
    let displayName = "Mystery Box";

    if (args.templateId) {
      template = await ctx.db.get(args.templateId);
      if (!template) throw new Error("Template not found");
      displayName = template.name;
    } else if (args.customName) {
      displayName = args.customName;
    }

    // Determine target users
    let targetUsers: { _id: Id<"users"> }[] = [];

    if (args.targetUserIds) {
      targetUsers = await Promise.all(
        args.targetUserIds.map(async (id) => {
          const user = await ctx.db.get(id);
          if (!user) throw new Error(`User ${id} not found`);
          return { _id: user._id };
        }),
      );
    } else if (args.targetTier) {
      const allUsers = await ctx.db.query("users").collect();
      targetUsers = allUsers.filter((u) => {
        if (u.isBanned) return false;
        if (args.targetTier === "all") return u.tier !== "free";
        return u.tier === args.targetTier || (args.targetTier === "tier1" && u.tier === "tier2");
      });
    }

    if (targetUsers.length === 0) throw new Error("No target users found");

    const now = Date.now();
    let shipped = 0;

    for (const targetUser of targetUsers) {
      await ctx.db.insert("userLootboxes", {
        userId: targetUser._id,
        templateId: args.templateId,
        customName: args.customName,
        customItems: args.customItems,
        isOpened: false,
        boxStyle: "mystery_box" as const,
        displayName,
        deliveredAt: now,
      });

      // Notification
      await ctx.db.insert("notifications", {
        userId: targetUser._id,
        type: "lootbox_received",
        title: "New Lootbox!",
        body: `You received: ${displayName}`,
        isRead: false,
        createdAt: now,
      });

      shipped++;
    }

    return { shipped };
  },
});

/**
 * Send an item directly to users
 */
export const sendDirectItem = mutation({
  args: {
    itemId: v.id("inventoryItems"),
    targetUserIds: v.optional(v.array(v.id("users"))),
    targetTier: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Item not found");

    // Determine target users
    let targetUsers: { _id: Id<"users"> }[] = [];

    if (args.targetUserIds) {
      targetUsers = await Promise.all(
        args.targetUserIds.map(async (id) => {
          const user = await ctx.db.get(id);
          if (!user) throw new Error(`User ${id} not found`);
          return { _id: user._id };
        }),
      );
    } else if (args.targetTier) {
      const allUsers = await ctx.db.query("users").collect();
      targetUsers = allUsers.filter((u) => {
        if (u.isBanned) return false;
        if (args.targetTier === "all") return u.tier !== "free";
        return u.tier === args.targetTier || (args.targetTier === "tier1" && u.tier === "tier2");
      });
    }

    if (targetUsers.length === 0) throw new Error("No target users found");

    const now = Date.now();
    let sent = 0;

    for (const targetUser of targetUsers) {
      // Check if stackable and already owned
      if (item.isStackable) {
        const existing = await ctx.db
          .query("userInventory")
          .withIndex("by_user_item", (q) =>
            q.eq("userId", targetUser._id).eq("itemId", args.itemId),
          )
          .first();

        if (existing) {
          if (item.maxPerUser && existing.quantity >= item.maxPerUser) continue;
          await ctx.db.patch(existing._id, {
            quantity: existing.quantity + 1,
          });
          sent++;
          continue;
        }
      } else {
        // Non-stackable: skip if already owned
        const existing = await ctx.db
          .query("userInventory")
          .withIndex("by_user_item", (q) =>
            q.eq("userId", targetUser._id).eq("itemId", args.itemId),
          )
          .first();

        if (existing) continue;
      }

      await ctx.db.insert("userInventory", {
        userId: targetUser._id,
        itemId: args.itemId,
        source: "direct_send",
        quantity: 1,
        isUsed: false,
        acquiredAt: now,
      });

      // Notification
      await ctx.db.insert("notifications", {
        userId: targetUser._id,
        type: "inventory_item",
        title: "New Item!",
        body: `You received: ${item.name}`,
        isRead: false,
        createdAt: now,
      });

      sent++;
    }

    return { sent };
  },
});

/**
 * Create a tier claimable
 */
export const createTierClaimable = mutation({
  args: {
    itemId: v.id("inventoryItems"),
    requiredTier: v.union(v.literal("tier1"), v.literal("tier2")),
    displayOrder: v.number(),
    headline: v.optional(v.string()),
    availableFrom: v.optional(v.number()),
    availableUntil: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Item not found");

    return await ctx.db.insert("tierClaimables", {
      ...args,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

/**
 * Update a tier claimable
 */
export const updateTierClaimable = mutation({
  args: {
    id: v.id("tierClaimables"),
    displayOrder: v.optional(v.number()),
    headline: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    availableFrom: v.optional(v.number()),
    availableUntil: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const { id, ...updates } = args;
    const claimable = await ctx.db.get(id);
    if (!claimable) throw new Error("Claimable not found");

    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        patch[key] = value;
      }
    }

    await ctx.db.patch(id, patch);
    return id;
  },
});

/**
 * Deactivate a tier claimable
 */
export const deactivateTierClaimable = mutation({
  args: { id: v.id("tierClaimables") },
  handler: async (ctx, args) => {
    await requireCreator(ctx);
    await ctx.db.patch(args.id, { isActive: false });
  },
});

/**
 * Fetch registered services from the Netvulo registry.
 * Used by admin UI to populate the service picker.
 */
export const getNetworkServices = action({
  handler: async () => {
    const apiUrl = process.env.NETVULO_API_URL;
    const apiKey = process.env.NETVULO_API_KEY;

    if (!apiUrl || !apiKey) {
      return [];
    }

    try {
      const res = await fetch(`${apiUrl}/api/v1/services`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!res.ok) return [];

      const data = await res.json();
      // Return slug + name pairs for the UI
      return (data.services ?? []).map((s: { slug: string; name: string }) => ({
        slug: s.slug,
        name: s.name,
      }));
    } catch {
      return [];
    }
  },
});
