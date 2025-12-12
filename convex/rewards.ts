import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { requireUser, requireCreator } from "./auth";
import type { Id } from "./_generated/dataModel";

// Rarity validator for reuse
const rarityValidator = v.union(
  v.literal("common"),
  v.literal("uncommon"),
  v.literal("rare"),
  v.literal("epic"),
  v.literal("legendary")
);

// =============================================================================
// USER QUERIES
// =============================================================================

/**
 * Get all rewards for the current user
 */
export const getMyRewards = query({
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const rewards = await ctx.db
      .query("rewards")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return rewards;
  },
});

/**
 * Get unopened mystery boxes for current user
 */
export const getUnopenedBoxes = query({
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const rewards = await ctx.db
      .query("rewards")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    // Filter to only unrevealed boxes
    return rewards.filter((r: any) => !r.isRevealed);
  },
});

/**
 * Get user's full inventory (all items from revealed boxes)
 * Free users get empty inventory (they can't store items)
 * Users with expired plans have their inventory locked
 */
export const getInventory = query({
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    // Free users don't have inventory access
    if (user.tier === "free") {
      return [];
    }

    // Check if tier has expired (tierValidUntil is set and in the past)
    if (user.tierValidUntil && user.tierValidUntil < Date.now()) {
      // Return inventory but mark it as locked (handled on frontend)
      // For now, just return empty - frontend will show locked state
      return [];
    }

    const rewards = await ctx.db
      .query("rewards")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    // Flatten all items from revealed rewards
    const inventory = rewards
      .filter((r: any) => r.isRevealed)
      .flatMap((reward: any) =>
        reward.items.map((item: any) => ({
          ...item,
          rewardId: reward._id,
          rewardMonth: reward.month,
          rewardType: reward.type,
        }))
      );

    return inventory;
  },
});

/**
 * Get single reward by ID (for opening animation)
 */
export const getReward = query({
  args: { rewardId: v.id("rewards") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const reward = await ctx.db.get(args.rewardId);

    if (!reward || reward.userId !== user._id) {
      return null;
    }

    return reward;
  },
});

/**
 * Get count of unopened boxes (for sidebar badge)
 */
export const getUnopenedCount = query({
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const rewards = await ctx.db
      .query("rewards")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    return rewards.filter((r: any) => !r.isRevealed).length;
  },
});

// =============================================================================
// USER MUTATIONS
// =============================================================================

/**
 * Reveal/open a mystery box
 */
export const revealReward = mutation({
  args: { rewardId: v.id("rewards") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const reward = await ctx.db.get(args.rewardId);

    if (!reward) throw new Error("Reward not found");
    if (reward.userId !== user._id) throw new Error("Not your reward");

    // Idempotent - if already revealed, just return success
    if (reward.isRevealed) return { success: true, alreadyRevealed: true };

    await ctx.db.patch(args.rewardId, {
      isRevealed: true,
      revealedAt: Date.now(),
    });

    // Create notification
    await ctx.db.insert("notifications", {
      userId: user._id,
      type: "reward",
      referenceType: "reward",
      referenceId: args.rewardId as unknown as string,
      title: "Mystery Box Opened!",
      body: `You revealed ${reward.items.length} item(s) from your mystery box!`,
      isRead: false,
      createdAt: Date.now(),
    });

    return reward;
  },
});

/**
 * Claim an item (mark as used, reveals code if applicable)
 * Handles different claim types: shoutouts create posts, others can be emailed or stored
 * Free users can ONLY claim via email (no inventory storage)
 */
export const claimItem = mutation({
  args: {
    rewardId: v.id("rewards"),
    itemId: v.string(),
    deliveryMethod: v.union(v.literal("email"), v.literal("inventory")),
    email: v.optional(v.string()),
    // Shoutout specific
    shoutoutTitle: v.optional(v.string()),
    shoutoutImage: v.optional(v.string()),
    shoutoutLink: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const reward = await ctx.db.get(args.rewardId);

    if (!reward) throw new Error("Reward not found");
    if (reward.userId !== user._id) throw new Error("Not your reward");
    if (!reward.isRevealed) throw new Error("Open the box first!");

    // Free users can only use email delivery, not inventory storage
    if (user.tier === "free" && args.deliveryMethod === "inventory") {
      throw new Error("Free members cannot save to inventory. Please use email delivery or upgrade to Super Legend!");
    }

    const itemIndex = reward.items.findIndex((i: any) => i.id === args.itemId);
    if (itemIndex === -1) throw new Error("Item not found");

    const item = reward.items[itemIndex];
    if (!item) throw new Error("Item not found");
    if (item.isClaimed) throw new Error("Already claimed");
    if (item.expiresAt && item.expiresAt < Date.now()) {
      throw new Error("This item has expired");
    }

    // Handle shoutout type - create a chat message in #shoutouts channel
    if (item.type === "shoutout" && args.shoutoutTitle) {
      // Find the shoutouts channel by name
      const allChannels = await ctx.db.query("channels").collect();
      const shoutoutsChannel = allChannels.find(
        (c: any) =>
          c.name?.toLowerCase() === "shoutouts" ||
          c.name?.toLowerCase() === "shoutout" ||
          c.slug === "shoutouts" ||
          c.slug === "shoutout"
      );

      if (shoutoutsChannel) {
        // Build the message content
        let messageContent = `**${args.shoutoutTitle}**`;
        if (args.shoutoutLink) {
          messageContent += `\n\n${args.shoutoutLink}`;
        }

        // Build embeds for image if provided
        const embeds = args.shoutoutImage
          ? [
              {
                type: "image" as const,
                url: args.shoutoutImage,
              },
            ]
          : undefined;

        // Create a regular chat message authored by the user who claimed
        await ctx.db.insert("messages", {
          channelId: shoutoutsChannel._id,
          authorId: user._id,
          content: messageContent,
          embeds,
          isPinned: false,
          isEdited: false,
          isDeleted: false,
          createdAt: Date.now(),
        });
      }
    }

    // Update the specific item
    const updatedItems = [...reward.items];
    updatedItems[itemIndex] = {
      ...item,
      isClaimed: true,
      claimedAt: Date.now(),
    };

    await ctx.db.patch(args.rewardId, { items: updatedItems });

    // TODO: If deliveryMethod is 'email', queue an email with the asset/code
    // For now, we just store the claim and the user can access from inventory

    return {
      item,
      deliveryMethod: args.deliveryMethod,
      email: args.email,
    };
  },
});

// =============================================================================
// ADMIN QUERIES
// =============================================================================

/**
 * Admin: Get all reward templates
 */
export const getTemplates = query({
  handler: async (ctx) => {
    await requireCreator(ctx);
    return ctx.db.query("rewardTemplates").order("desc").collect();
  },
});

/**
 * Admin: Get all users for targeting
 */
export const getUsersForShipping = query({
  handler: async (ctx) => {
    await requireCreator(ctx);

    const users = await ctx.db.query("users").collect();

    return users.map((u: any) => ({
      _id: u._id,
      displayName: u.displayName,
      tier: u.tier,
      avatarUrl: u.avatarUrl,
    }));
  },
});

/**
 * Admin: Get rewards analytics
 */
export const getRewardsAnalytics = query({
  handler: async (ctx) => {
    await requireCreator(ctx);

    const allRewards = await ctx.db.query("rewards").collect();
    const templates = await ctx.db.query("rewardTemplates").collect();

    const totalBoxes = allRewards.length;
    const openedBoxes = allRewards.filter((r: any) => r.isRevealed).length;
    const pendingBoxes = totalBoxes - openedBoxes;

    // Count items by rarity
    const rarityStats = { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 };
    let totalItems = 0;
    let claimedItems = 0;

    allRewards.forEach((reward: any) => {
      reward.items.forEach((item: any) => {
        totalItems++;
        if (item.isClaimed) claimedItems++;
        if (item.rarity && rarityStats[item.rarity as keyof typeof rarityStats] !== undefined) {
          rarityStats[item.rarity as keyof typeof rarityStats]++;
        }
      });
    });

    return {
      totalBoxes,
      openedBoxes,
      pendingBoxes,
      totalTemplates: templates.length,
      totalItems,
      claimedItems,
      rarityStats,
    };
  },
});

/**
 * Admin: Get all rewards (for management view)
 */
export const getAllRewards = query({
  handler: async (ctx) => {
    await requireCreator(ctx);

    const rewards = await ctx.db.query("rewards").order("desc").take(100);

    // Populate user info
    const rewardsWithUsers = await Promise.all(
      rewards.map(async (reward: any) => {
        const user = await ctx.db.get(reward.userId as Id<"users">);
        return {
          ...reward,
          user: user
            ? {
                _id: user._id,
                displayName: (user as any).displayName,
                avatarUrl: (user as any).avatarUrl,
                tier: (user as any).tier,
              }
            : null,
        };
      })
    );

    return rewardsWithUsers;
  },
});

/**
 * Admin: Get scheduled drops
 */
export const getScheduledDrops = query({
  handler: async (ctx) => {
    await requireCreator(ctx);
    return ctx.db.query("scheduledDrops").order("desc").take(50);
  },
});

// =============================================================================
// ADMIN MUTATIONS
// =============================================================================

/**
 * Admin: Create a reward template
 */
export const createTemplate = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    type: v.union(v.literal("monthly_drop"), v.literal("special")),
    revealType: v.union(v.literal("scratch"), v.literal("mystery_box")),
    items: v.array(
      v.object({
        type: v.string(),
        name: v.string(),
        description: v.string(),
        rarity: rarityValidator,
        assetUrl: v.optional(v.string()),
        code: v.optional(v.string()),
        expiresAfterDays: v.optional(v.number()),
      })
    ),
    targetTiers: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    return ctx.db.insert("rewardTemplates", {
      name: args.name,
      description: args.description,
      type: args.type,
      revealType: args.revealType,
      items: args.items,
      targetTiers: args.targetTiers as ("tier1" | "tier2" | "all")[],
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

/**
 * Admin: Update a reward template
 */
export const updateTemplate = mutation({
  args: {
    templateId: v.id("rewardTemplates"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(v.union(v.literal("monthly_drop"), v.literal("special"))),
    revealType: v.optional(v.union(v.literal("scratch"), v.literal("mystery_box"))),
    items: v.optional(
      v.array(
        v.object({
          type: v.string(),
          name: v.string(),
          description: v.string(),
          rarity: rarityValidator,
          assetUrl: v.optional(v.string()),
          code: v.optional(v.string()),
          expiresAfterDays: v.optional(v.number()),
        })
      )
    ),
    targetTiers: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const { templateId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    await ctx.db.patch(templateId, filteredUpdates);
  },
});

/**
 * Admin: Delete a template
 */
export const deleteTemplate = mutation({
  args: { templateId: v.id("rewardTemplates") },
  handler: async (ctx, args) => {
    await requireCreator(ctx);
    await ctx.db.delete(args.templateId);
  },
});

/**
 * Admin: Ship rewards to users
 */
export const shipRewards = mutation({
  args: {
    templateId: v.optional(v.id("rewardTemplates")),
    // Or manual item creation:
    items: v.optional(
      v.array(
        v.object({
          type: v.string(),
          name: v.string(),
          description: v.string(),
          rarity: rarityValidator,
          assetUrl: v.optional(v.string()),
          code: v.optional(v.string()),
          expiresAfterDays: v.optional(v.number()),
        })
      )
    ),
    type: v.union(v.literal("monthly_drop"), v.literal("special")),
    revealType: v.union(v.literal("scratch"), v.literal("mystery_box")),
    targetUserIds: v.optional(v.array(v.id("users"))),
    targetTier: v.optional(v.union(v.literal("tier1"), v.literal("tier2"), v.literal("all"))),
    month: v.string(),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    // Get items from template or args
    let itemsToShip = args.items;
    if (args.templateId) {
      const template = await ctx.db.get(args.templateId);
      if (!template) throw new Error("Template not found");
      itemsToShip = template.items;
    }

    if (!itemsToShip || itemsToShip.length === 0) {
      throw new Error("No items to ship");
    }

    // Determine target users
    let targetUsers: any[] = [];

    if (args.targetUserIds && args.targetUserIds.length > 0) {
      // Ship to specific users
      const users = await Promise.all(args.targetUserIds.map((id) => ctx.db.get(id)));
      targetUsers = users.filter(Boolean);
    } else if (args.targetTier) {
      // Ship to tier
      const allUsers = await ctx.db.query("users").collect();
      if (args.targetTier === "all") {
        targetUsers = allUsers;
      } else {
        targetUsers = allUsers.filter((u: any) => u.tier === args.targetTier);
      }
    }

    if (targetUsers.length === 0) {
      throw new Error("No users to ship to");
    }

    // Create rewards for each user
    const createdRewards: Id<"rewards">[] = [];
    for (const user of targetUsers) {
      // Generate unique IDs for items and calculate expiration
      const itemsWithIds = itemsToShip.map((item, index) => ({
        id: `${user._id}_${Date.now()}_${index}`,
        type: item.type,
        name: item.name,
        description: item.description,
        rarity: item.rarity,
        assetUrl: item.assetUrl,
        code: item.code,
        isClaimed: false,
        expiresAt: item.expiresAfterDays
          ? Date.now() + item.expiresAfterDays * 24 * 60 * 60 * 1000
          : undefined,
      }));

      const rewardId = await ctx.db.insert("rewards", {
        userId: user._id,
        type: args.type,
        month: args.month,
        items: itemsWithIds,
        isRevealed: false,
        revealType: args.revealType,
        deliveredAt: Date.now(),
      });

      // Create notification for user
      await ctx.db.insert("notifications", {
        userId: user._id,
        type: "reward",
        referenceType: "reward",
        referenceId: rewardId as unknown as string,
        title: "New Mystery Box!",
        body: "You've received a new mystery box. Open it to see what's inside!",
        isRead: false,
        createdAt: Date.now(),
      });

      createdRewards.push(rewardId);
    }

    return { shippedCount: createdRewards.length };
  },
});

/**
 * Admin: Delete a reward
 */
export const deleteReward = mutation({
  args: { rewardId: v.id("rewards") },
  handler: async (ctx, args) => {
    await requireCreator(ctx);
    await ctx.db.delete(args.rewardId);
  },
});

/**
 * Admin: Schedule a monthly drop
 */
export const scheduleMonthlyDrop = mutation({
  args: {
    templateId: v.optional(v.id("rewardTemplates")),
    month: v.string(),
    targetTier: v.union(v.literal("tier1"), v.literal("tier2"), v.literal("all")),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    // Count target users
    const allUsers = await ctx.db.query("users").collect();
    let targetCount = allUsers.length;
    if (args.targetTier !== "all") {
      targetCount = allUsers.filter((u: any) => u.tier === args.targetTier).length;
    }

    return ctx.db.insert("scheduledDrops", {
      templateId: args.templateId,
      month: args.month,
      targetTier: args.targetTier,
      status: "pending",
      processedCount: 0,
      totalCount: targetCount,
      scheduledAt: Date.now(),
    });
  },
});

/**
 * Admin: Cancel a scheduled drop
 */
export const cancelScheduledDrop = mutation({
  args: { dropId: v.id("scheduledDrops") },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const drop = await ctx.db.get(args.dropId);
    if (!drop) throw new Error("Drop not found");
    if (drop.status !== "pending") throw new Error("Can only cancel pending drops");

    await ctx.db.delete(args.dropId);
  },
});

// =============================================================================
// INTERNAL MUTATIONS (for cron jobs)
// =============================================================================

/**
 * Internal: Process monthly drops (called by cron)
 */
export const processMonthlyDrops = internalMutation({
  handler: async (ctx) => {
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Find pending drops for this month
    const pendingDrops = await ctx.db
      .query("scheduledDrops")
      .withIndex("by_status", (q: any) => q.eq("status", "pending"))
      .collect();

    const dropsToProcess = pendingDrops.filter((d: any) => d.month === monthStr);

    for (const drop of dropsToProcess) {
      // Mark as processing
      await ctx.db.patch(drop._id, { status: "processing" });

      try {
        // Get template items if using a template
        let itemsToShip: any[] = [];
        if (drop.templateId) {
          const template = await ctx.db.get(drop.templateId);
          if (template) {
            itemsToShip = template.items;
          }
        }

        if (itemsToShip.length === 0) {
          throw new Error("No items in template");
        }

        // Get target users
        const allUsers = await ctx.db.query("users").collect();
        let targetUsers = allUsers;
        if (drop.targetTier !== "all") {
          targetUsers = allUsers.filter((u: any) => u.tier === drop.targetTier);
        }

        // Ship to each user
        let processedCount = 0;
        for (const user of targetUsers) {
          const itemsWithIds = itemsToShip.map((item: any, index: number) => ({
            id: `${user._id}_${Date.now()}_${index}`,
            type: item.type,
            name: item.name,
            description: item.description,
            rarity: item.rarity,
            assetUrl: item.assetUrl,
            code: item.code,
            isClaimed: false,
            expiresAt: item.expiresAfterDays
              ? Date.now() + item.expiresAfterDays * 24 * 60 * 60 * 1000
              : undefined,
          }));

          const rewardId = await ctx.db.insert("rewards", {
            userId: user._id,
            type: "monthly_drop",
            month: monthStr,
            items: itemsWithIds,
            isRevealed: false,
            revealType: "mystery_box",
            deliveredAt: Date.now(),
          });

          await ctx.db.insert("notifications", {
            userId: user._id,
            type: "reward",
            referenceType: "reward",
            referenceId: rewardId as unknown as string,
            title: "Monthly Mystery Box!",
            body: "Your monthly mystery box has arrived! Open it to see what's inside!",
            isRead: false,
            createdAt: Date.now(),
          });

          processedCount++;
        }

        await ctx.db.patch(drop._id, {
          status: "completed",
          processedCount,
          processedAt: Date.now(),
        });
      } catch (error: any) {
        await ctx.db.patch(drop._id, {
          status: "failed",
          errorMessage: error.message,
        });
      }
    }
  },
});
