import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireCreator } from "./auth";

// ============================================
// QUERIES
// ============================================

/**
 * List all roles
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const roles = await ctx.db.query("roles").collect();
    return roles.sort((a, b) => a.label.localeCompare(b.label));
  },
});

/**
 * Get a role by key
 */
export const getByKey = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("roles")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
  },
});

/**
 * Get multiple roles by keys
 */
export const getByKeys = query({
  args: { keys: v.array(v.string()) },
  handler: async (ctx, args) => {
    const roles = await ctx.db.query("roles").collect();
    const keySet = new Set(args.keys);
    return roles.filter((r) => keySet.has(r.key));
  },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Create a new role (creator only)
 */
export const create = mutation({
  args: {
    key: v.string(),
    label: v.string(),
    description: v.string(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    // Check key uniqueness
    const existing = await ctx.db
      .query("roles")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();

    if (existing) {
      throw new Error(`A role with key "${args.key}" already exists`);
    }

    return await ctx.db.insert("roles", {
      key: args.key,
      label: args.label,
      description: args.description,
      color: args.color,
    });
  },
});

/**
 * Update a role (creator only)
 */
export const update = mutation({
  args: {
    id: v.id("roles"),
    key: v.optional(v.string()),
    label: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const role = await ctx.db.get(args.id);
    if (!role) {
      throw new Error("Role not found");
    }

    // Check key uniqueness if changing
    if (args.key && args.key !== role.key) {
      const newKey = args.key;
      const existing = await ctx.db
        .query("roles")
        .withIndex("by_key", (q) => q.eq("key", newKey))
        .unique();

      if (existing) {
        throw new Error(`A role with key "${newKey}" already exists`);
      }
    }

    const updates: { key?: string; label?: string; description?: string; color?: string } = {};
    if (args.key !== undefined) updates.key = args.key;
    if (args.label !== undefined) updates.label = args.label;
    if (args.description !== undefined) updates.description = args.description;
    if (args.color !== undefined) updates.color = args.color;

    await ctx.db.patch(args.id, updates);
  },
});

/**
 * Delete a role (creator only)
 */
export const deleteRole = mutation({
  args: { id: v.id("roles") },
  handler: async (ctx, args) => {
    await requireCreator(ctx);
    await ctx.db.delete(args.id);
  },
});

/**
 * Seed role (for migration)
 */
export const seed = mutation({
  args: {
    key: v.string(),
    label: v.string(),
    description: v.string(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    // Check if already exists
    const existing = await ctx.db
      .query("roles")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();

    if (existing) {
      console.log(`Skipping existing role: ${args.key}`);
      return existing._id;
    }

    return await ctx.db.insert("roles", {
      key: args.key,
      label: args.label,
      description: args.description,
      color: args.color,
    });
  },
});
