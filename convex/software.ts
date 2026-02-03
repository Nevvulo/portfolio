import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================
// QUERIES
// ============================================

/** List all active software projects */
export const listActive = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("software")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
  },
});

/** List software by category */
export const listByCategory = query({
  args: {
    category: v.union(
      v.literal("open-source"),
      v.literal("commercial"),
      v.literal("personal"),
      v.literal("game"),
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("software")
      .withIndex("by_category", (q) => q.eq("category", args.category).eq("status", "active"))
      .collect();
  },
});

/** List software by type */
export const listByType = query({
  args: {
    type: v.union(
      v.literal("app"),
      v.literal("tool"),
      v.literal("library"),
      v.literal("game"),
      v.literal("website"),
      v.literal("bot"),
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("software")
      .withIndex("by_type", (q) => q.eq("type", args.type).eq("status", "active"))
      .collect();
  },
});

/** List featured software for homepage */
export const listFeatured = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("software")
      .withIndex("by_featured", (q) => q.eq("isFeatured", true))
      .collect();
  },
});

/** List featured software (non-games) for homepage */
export const listFeaturedSoftware = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db
      .query("software")
      .withIndex("by_featured", (q) => q.eq("isFeatured", true))
      .collect();
    return all.filter((s) => s.type !== "game");
  },
});

/** List featured games for homepage */
export const listFeaturedGames = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db
      .query("software")
      .withIndex("by_featured", (q) => q.eq("isFeatured", true))
      .collect();
    return all.filter((s) => s.type === "game");
  },
});

/** Get a single software project by slug */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("software")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

/** List all publicly visible software (excludes archived) */
export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db
      .query("software")
      .withIndex("by_order")
      .collect();
    return all.filter((s) => s.status !== "archived");
  },
});

/** List all software (including non-active) for admin */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("software")
      .withIndex("by_order")
      .collect();
  },
});

// ============================================
// MUTATIONS (admin-only)
// ============================================

/** Create a new software entry */
export const create = mutation({
  args: {
    slug: v.string(),
    name: v.string(),
    shortDescription: v.string(),
    longDescription: v.optional(v.string()),
    type: v.union(
      v.literal("app"),
      v.literal("tool"),
      v.literal("library"),
      v.literal("game"),
      v.literal("website"),
      v.literal("bot"),
    ),
    category: v.union(
      v.literal("open-source"),
      v.literal("commercial"),
      v.literal("personal"),
      v.literal("game"),
    ),
    status: v.union(
      v.literal("active"),
      v.literal("coming-soon"),
      v.literal("archived"),
      v.literal("beta"),
    ),
    logoUrl: v.optional(v.string()),
    bannerUrl: v.optional(v.string()),
    background: v.optional(v.string()),
    links: v.optional(
      v.object({
        github: v.optional(v.string()),
        website: v.optional(v.string()),
        roblox: v.optional(v.string()),
        discord: v.optional(v.string()),
        appStore: v.optional(v.string()),
        playStore: v.optional(v.string()),
      }),
    ),
    technologies: v.array(v.string()),
    platforms: v.array(v.string()),
    stats: v.optional(
      v.object({
        players: v.optional(v.number()),
        downloads: v.optional(v.number()),
        stars: v.optional(v.number()),
      }),
    ),
    order: v.number(),
    isFeatured: v.boolean(),
    accentColor: v.optional(v.string()),
    displaySize: v.optional(v.union(v.literal("featured"), v.literal("medium"), v.literal("small"))),
    robloxUniverseId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("software", {
      ...args,
      createdAt: now,
    });
  },
});

/** Update an existing software entry */
export const update = mutation({
  args: {
    id: v.id("software"),
    slug: v.optional(v.string()),
    name: v.optional(v.string()),
    shortDescription: v.optional(v.string()),
    longDescription: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal("app"),
        v.literal("tool"),
        v.literal("library"),
        v.literal("game"),
        v.literal("website"),
        v.literal("bot"),
      ),
    ),
    category: v.optional(
      v.union(
        v.literal("open-source"),
        v.literal("commercial"),
        v.literal("personal"),
        v.literal("game"),
      ),
    ),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("coming-soon"),
        v.literal("archived"),
        v.literal("beta"),
      ),
    ),
    logoUrl: v.optional(v.string()),
    bannerUrl: v.optional(v.string()),
    background: v.optional(v.string()),
    links: v.optional(
      v.object({
        github: v.optional(v.string()),
        website: v.optional(v.string()),
        roblox: v.optional(v.string()),
        discord: v.optional(v.string()),
        appStore: v.optional(v.string()),
        playStore: v.optional(v.string()),
      }),
    ),
    technologies: v.optional(v.array(v.string())),
    platforms: v.optional(v.array(v.string())),
    stats: v.optional(
      v.object({
        players: v.optional(v.number()),
        downloads: v.optional(v.number()),
        stars: v.optional(v.number()),
      }),
    ),
    order: v.optional(v.number()),
    isFeatured: v.optional(v.boolean()),
    accentColor: v.optional(v.string()),
    displaySize: v.optional(v.union(v.literal("featured"), v.literal("medium"), v.literal("small"))),
    robloxUniverseId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const updates: Record<string, any> = { updatedAt: Date.now() };

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates[key] = value;
      }
    }

    await ctx.db.patch(id, updates);
  },
});

/** Delete a software entry */
export const remove = mutation({
  args: { id: v.id("software") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

/** Seed GolfQuest as the first software entry */
export const seedGolfQuest = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("software")
      .withIndex("by_slug", (q) => q.eq("slug", "golfquest"))
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("software", {
      slug: "golfquest",
      name: "GolfQuest",
      shortDescription: "A multiplayer mini-golf adventure on Roblox",
      longDescription: "GolfQuest is a multiplayer mini-golf game built on the Roblox platform, featuring creative courses and competitive gameplay.",
      type: "game",
      category: "game",
      status: "beta",
      background: "linear-gradient(135deg, #065f46, #047857, #059669, #10b981)",
      links: {
        roblox: "https://www.roblox.com/games/golfquest",
      },
      technologies: ["Luau", "Roblox Studio"],
      platforms: ["roblox"],
      order: 1,
      isFeatured: true,
      createdAt: Date.now(),
    });
  },
});
