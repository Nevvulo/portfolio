import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================
// QUERIES
// ============================================

/** Get featured items for a specific homepage slot */
export const getBySlot = query({
  args: {
    slot: v.union(
      v.literal("hero"),
      v.literal("carousel"),
      v.literal("spotlight"),
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const items = await ctx.db
      .query("featuredContent")
      .withIndex("by_slot", (q) =>
        q.eq("slot", args.slot).eq("isActive", true)
      )
      .collect();

    // Filter by scheduling (startsAt / expiresAt)
    return items.filter((item) => {
      if (item.startsAt && item.startsAt > now) return false;
      if (item.expiresAt && item.expiresAt < now) return false;
      return true;
    });
  },
});

/** List all active featured items */
export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const items = await ctx.db
      .query("featuredContent")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    return items.filter((item) => {
      if (item.startsAt && item.startsAt > now) return false;
      if (item.expiresAt && item.expiresAt < now) return false;
      return true;
    });
  },
});

/** List all featured items for admin (including inactive/expired) */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("featuredContent")
      .withIndex("by_active")
      .collect();
  },
});

// ============================================
// MUTATIONS (admin-only)
// ============================================

/** Create a new featured content entry */
export const create = mutation({
  args: {
    title: v.string(),
    subtitle: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("article"),
      v.literal("video"),
      v.literal("software"),
      v.literal("game"),
      v.literal("project"),
      v.literal("external"),
    ),
    linkUrl: v.string(),
    imageUrl: v.optional(v.string()),
    background: v.optional(v.string()),
    targetId: v.optional(v.string()),
    slot: v.union(
      v.literal("hero"),
      v.literal("carousel"),
      v.literal("spotlight"),
    ),
    order: v.number(),
    isActive: v.boolean(),
    startsAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("featuredContent", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

/** Update a featured content entry */
export const update = mutation({
  args: {
    id: v.id("featuredContent"),
    title: v.optional(v.string()),
    subtitle: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal("article"),
        v.literal("video"),
        v.literal("software"),
        v.literal("game"),
        v.literal("project"),
        v.literal("external"),
      ),
    ),
    linkUrl: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    background: v.optional(v.string()),
    targetId: v.optional(v.string()),
    slot: v.optional(
      v.union(
        v.literal("hero"),
        v.literal("carousel"),
        v.literal("spotlight"),
      ),
    ),
    order: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    startsAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const updates: Record<string, any> = {};

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates[key] = value;
      }
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(id, updates);
    }
  },
});

/** Delete a featured content entry */
export const remove = mutation({
  args: { id: v.id("featuredContent") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
