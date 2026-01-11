import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireCreator } from "./auth";

// ============================================
// QUERIES
// ============================================

/**
 * List all technologies
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const technologies = await ctx.db.query("technologies").collect();
    return technologies.sort((a, b) => a.label.localeCompare(b.label));
  },
});

/**
 * Get a technology by key
 */
export const getByKey = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("technologies")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
  },
});

/**
 * Get multiple technologies by keys
 */
export const getByKeys = query({
  args: { keys: v.array(v.string()) },
  handler: async (ctx, args) => {
    const technologies = await ctx.db.query("technologies").collect();
    const keySet = new Set(args.keys);
    return technologies.filter((t) => keySet.has(t.key));
  },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Create a new technology (creator only)
 */
export const create = mutation({
  args: {
    key: v.string(),
    label: v.string(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    // Check key uniqueness
    const existing = await ctx.db
      .query("technologies")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();

    if (existing) {
      throw new Error(`A technology with key "${args.key}" already exists`);
    }

    return await ctx.db.insert("technologies", {
      key: args.key,
      label: args.label,
      color: args.color,
    });
  },
});

/**
 * Update a technology (creator only)
 */
export const update = mutation({
  args: {
    id: v.id("technologies"),
    key: v.optional(v.string()),
    label: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const tech = await ctx.db.get(args.id);
    if (!tech) {
      throw new Error("Technology not found");
    }

    // Check key uniqueness if changing
    if (args.key && args.key !== tech.key) {
      const newKey = args.key;
      const existing = await ctx.db
        .query("technologies")
        .withIndex("by_key", (q) => q.eq("key", newKey))
        .unique();

      if (existing) {
        throw new Error(`A technology with key "${newKey}" already exists`);
      }
    }

    const updates: { key?: string; label?: string; color?: string } = {};
    if (args.key !== undefined) updates.key = args.key;
    if (args.label !== undefined) updates.label = args.label;
    if (args.color !== undefined) updates.color = args.color;

    await ctx.db.patch(args.id, updates);
  },
});

/**
 * Delete a technology (creator only)
 */
export const deleteTechnology = mutation({
  args: { id: v.id("technologies") },
  handler: async (ctx, args) => {
    await requireCreator(ctx);
    await ctx.db.delete(args.id);
  },
});

/**
 * Seed technology (for migration)
 */
export const seed = mutation({
  args: {
    key: v.string(),
    label: v.string(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    // Check if already exists
    const existing = await ctx.db
      .query("technologies")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();

    if (existing) {
      console.log(`Skipping existing technology: ${args.key}`);
      return existing._id;
    }

    return await ctx.db.insert("technologies", {
      key: args.key,
      label: args.label,
      color: args.color,
    });
  },
});
