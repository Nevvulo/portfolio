import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
import { getCurrentUser, hasAccessToTier, requireCreator, userHasChannelAccess } from "./auth";

/**
 * List all channels the user has access to
 * Tier 1 users see tier 2 channels as locked
 */
export const list = query({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    const channels = await ctx.db
      .query("channels")
      .withIndex("by_order")
      .filter((q: any) => q.eq(q.field("isArchived"), false))
      .collect();

    // Map channels with access info
    return channels.map((channel: any) => {
      const hasAccess = userHasChannelAccess(user, channel);
      return {
        ...channel,
        hasAccess,
        isLocked: !hasAccess,
      };
    });
  },
});

/**
 * Get a single channel by slug
 */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const channel = await ctx.db
      .query("channels")
      .withIndex("by_slug", (q: any) => q.eq("slug", args.slug))
      .unique();

    if (!channel) {
      return null;
    }

    const hasAccess = userHasChannelAccess(user, channel);

    return {
      ...channel,
      hasAccess,
      isLocked: !hasAccess,
    };
  },
});

/**
 * Get a channel by ID
 */
export const get = query({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const channel = await ctx.db.get(args.channelId);
    if (!channel) {
      return null;
    }

    const hasAccess = userHasChannelAccess(user, channel);

    return {
      ...channel,
      hasAccess,
      isLocked: !hasAccess,
    };
  },
});

/**
 * Internal: Get a channel by ID (no auth required, for internal actions)
 */
export const getInternal = internalQuery({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.channelId);
  },
});

/**
 * Create a new channel (admin only)
 */
export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    type: v.union(v.literal("chat"), v.literal("announcements"), v.literal("content")),
    requiredTier: v.union(v.literal("free"), v.literal("tier1"), v.literal("tier2")),
    icon: v.optional(v.string()),
    discordChannelId: v.optional(v.string()),
    discordWebhookUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    // Get the highest order number
    const channels = await ctx.db.query("channels").collect();
    const maxOrder = channels.reduce((max: number, c: any) => Math.max(max, c.order), 0);

    const channelId = await ctx.db.insert("channels", {
      ...args,
      order: maxOrder + 1,
      isArchived: false,
      createdAt: Date.now(),
    });

    return channelId;
  },
});

/**
 * Update a channel (admin only)
 */
export const update = mutation({
  args: {
    channelId: v.id("channels"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(v.union(v.literal("chat"), v.literal("announcements"), v.literal("content"))),
    requiredTier: v.optional(v.union(v.literal("free"), v.literal("tier1"), v.literal("tier2"))),
    // Advanced access rules (set to null to remove and fall back to requiredTier)
    accessRules: v.optional(
      v.union(
        v.object({
          matchMode: v.optional(v.union(v.literal("any"), v.literal("all"))),
          twitchSubs: v.optional(v.boolean()),
          twitchSubTier: v.optional(v.union(v.literal(1), v.literal(2), v.literal(3))),
          superLegend: v.optional(v.boolean()),
          superLegendTier: v.optional(v.union(v.literal(1), v.literal(2))),
          discordBoosters: v.optional(v.boolean()),
        }),
        v.null(), // Allow setting to null to remove access rules
      ),
    ),
    icon: v.optional(v.string()),
    order: v.optional(v.number()),
    discordChannelId: v.optional(v.string()),
    discordWebhookUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const { channelId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined),
    );

    await ctx.db.patch(channelId, filteredUpdates);
  },
});

/**
 * Archive a channel (admin only)
 */
export const archive = mutation({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    await requireCreator(ctx);
    await ctx.db.patch(args.channelId, { isArchived: true });
  },
});

/** Seed default channels (can run from dashboard for initial setup). Creator only. */
export const seedDefaultChannels = mutation({
  handler: async (ctx) => {
    await requireCreator(ctx);

    // Check if channels already exist
    const existingChannels = await ctx.db.query("channels").collect();
    if (existingChannels.length > 0) {
      throw new Error("Channels already exist. Delete them first if you want to reseed.");
    }

    // Only allow seeding when no channels exist (initial setup)

    const defaultChannels = [
      {
        name: "lobby",
        slug: "lobby",
        type: "chat" as const,
        requiredTier: "free" as const,
        icon: "message-circle",
        order: 1,
      },
      {
        name: "announcements",
        slug: "announcements",
        type: "announcements" as const,
        requiredTier: "free" as const,
        icon: "megaphone",
        order: 2,
      },
      {
        name: "general",
        slug: "general",
        type: "chat" as const,
        requiredTier: "tier1" as const,
        icon: "message-circle",
        order: 3,
      },
      {
        name: "content-drops",
        slug: "content-drops",
        type: "content" as const,
        requiredTier: "tier1" as const,
        icon: "sparkles",
        order: 4,
      },
      {
        name: "vip-lounge",
        slug: "vip-lounge",
        type: "chat" as const,
        requiredTier: "tier2" as const,
        icon: "crown",
        order: 5,
      },
      {
        name: "exclusive-content",
        slug: "exclusive-content",
        type: "content" as const,
        requiredTier: "tier2" as const,
        icon: "star",
        order: 6,
      },
    ];

    for (const channel of defaultChannels) {
      await ctx.db.insert("channels", {
        ...channel,
        isArchived: false,
        createdAt: Date.now(),
      });
    }

    return defaultChannels.length;
  },
});

/**
 * Reorder channels (admin only)
 * Takes an array of channel IDs in their new order
 */
export const reorder = mutation({
  args: {
    channelIds: v.array(v.id("channels")),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    // Update each channel's order based on its position in the array
    for (let i = 0; i < args.channelIds.length; i++) {
      const channelId = args.channelIds[i];
      if (channelId) {
        await ctx.db.patch(channelId, { order: i + 1 });
      }
    }
  },
});

/**
 * List channels for mention autocomplete
 * Returns accessible channels with minimal data
 */
export const listForMention = query({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    // Get all non-archived channels
    const channels = await ctx.db
      .query("channels")
      .filter((q) => q.eq(q.field("isArchived"), false))
      .collect();

    // Filter by user access and return minimal data
    // Create a user-like object for access checking
    const userForAccess = user ?? {
      tier: "free" as const,
      twitchSubTier: null,
      discordBooster: null,
      clerkPlan: null,
      clerkPlanStatus: null,
    };

    return channels
      .filter((c) => userHasChannelAccess(userForAccess, c))
      .sort((a, b) => a.order - b.order)
      .map((c) => ({
        _id: c._id,
        name: c.name,
        slug: c.slug,
        icon: c.icon ?? "hash",
      }));
  },
});
