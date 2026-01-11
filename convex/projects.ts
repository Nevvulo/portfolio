import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { requireCreator } from "./auth";

// Status validator
const statusValidator = v.union(v.literal("active"), v.literal("inactive"));

// Timeline validator
const timelineValidator = v.object({
  startYear: v.number(),
  endYear: v.optional(v.number()),
  startMonth: v.optional(v.number()),
  endMonth: v.optional(v.number()),
});

// Links validator
const linksValidator = v.optional(
  v.object({
    github: v.optional(v.string()),
    website: v.optional(v.string()),
  }),
);

// Content section validator
const contentSectionValidator = v.object({
  id: v.string(),
  emoji: v.optional(v.string()),
  header: v.string(),
  subheader: v.optional(v.string()),
  subheaderColor: v.optional(v.string()),
  text: v.string(),
});

// ============================================
// QUERIES
// ============================================

/**
 * List all projects (admin view)
 */
export const list = query({
  args: {
    status: v.optional(statusValidator),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const projects = await ctx.db.query("projects").withIndex("by_order").order("asc").collect();

    if (args.status) {
      return projects.filter((p) => p.status === args.status);
    }

    return projects;
  },
});

/**
 * List active projects for public view (timeline)
 */
export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // Sort by order
    return projects.sort((a, b) => a.order - b.order);
  },
});

/**
 * List active projects sorted by timeline (most recent first)
 */
export const listByTimeline = query({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // Sort by most recent first (endYear or current year if ongoing)
    return projects.sort((a, b) => {
      const aYear = a.timeline.endYear ?? new Date().getFullYear();
      const bYear = b.timeline.endYear ?? new Date().getFullYear();
      if (aYear !== bYear) return bYear - aYear;
      const aMonth = a.timeline.endMonth ?? a.timeline.startMonth ?? 1;
      const bMonth = b.timeline.endMonth ?? b.timeline.startMonth ?? 1;
      return bMonth - aMonth;
    });
  },
});

/**
 * Get a project by slug
 */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const project = await ctx.db
      .query("projects")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    return project;
  },
});

/**
 * Get a project by ID
 */
export const get = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.projectId);
  },
});

/**
 * Get all project slugs (for static paths)
 */
export const listSlugs = query({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    return projects.map((p) => p.slug);
  },
});

/**
 * Get unique timeline years from all active projects
 */
export const getTimelineYears = query({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    const yearsSet = new Set<number>();
    const currentYear = new Date().getFullYear();

    for (const project of projects) {
      const startYear = project.timeline.startYear;
      const endYear = project.timeline.endYear ?? currentYear;

      for (let y = startYear; y <= endYear; y++) {
        yearsSet.add(y);
      }
    }

    // Sort descending (most recent first)
    return Array.from(yearsSet).sort((a, b) => b - a);
  },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Create a new project (creator only)
 */
export const create = mutation({
  args: {
    slug: v.string(),
    name: v.string(),
    shortDescription: v.string(),
    background: v.string(),
    logoUrl: v.optional(v.string()),
    logoDarkUrl: v.optional(v.string()),
    logoWidth: v.optional(v.number()),
    logoHeight: v.optional(v.number()),
    logoIncludesName: v.optional(v.boolean()),
    status: statusValidator,
    maintained: v.boolean(),
    timeline: timelineValidator,
    links: linksValidator,
    technologies: v.array(v.string()),
    roles: v.array(v.string()),
    contentSections: v.array(contentSectionValidator),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    // Check slug uniqueness
    const existing = await ctx.db
      .query("projects")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (existing) {
      throw new Error(`A project with slug "${args.slug}" already exists`);
    }

    // Get max order
    const allProjects = await ctx.db.query("projects").collect();
    const maxOrder = allProjects.reduce((max, p) => Math.max(max, p.order), -1);

    const projectId = await ctx.db.insert("projects", {
      slug: args.slug,
      name: args.name,
      shortDescription: args.shortDescription,
      background: args.background,
      logoUrl: args.logoUrl,
      logoDarkUrl: args.logoDarkUrl,
      logoWidth: args.logoWidth,
      logoHeight: args.logoHeight,
      logoIncludesName: args.logoIncludesName,
      status: args.status,
      maintained: args.maintained,
      timeline: args.timeline,
      links: args.links,
      technologies: args.technologies,
      roles: args.roles,
      contentSections: args.contentSections,
      order: maxOrder + 1,
      createdAt: Date.now(),
    });

    return projectId;
  },
});

/**
 * Update a project (creator only)
 */
export const update = mutation({
  args: {
    projectId: v.id("projects"),
    slug: v.optional(v.string()),
    name: v.optional(v.string()),
    shortDescription: v.optional(v.string()),
    background: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    logoDarkUrl: v.optional(v.string()),
    logoWidth: v.optional(v.number()),
    logoHeight: v.optional(v.number()),
    logoIncludesName: v.optional(v.boolean()),
    status: v.optional(statusValidator),
    maintained: v.optional(v.boolean()),
    timeline: v.optional(timelineValidator),
    links: linksValidator,
    technologies: v.optional(v.array(v.string())),
    roles: v.optional(v.array(v.string())),
    contentSections: v.optional(v.array(contentSectionValidator)),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check slug uniqueness if changing
    if (args.slug && args.slug !== project.slug) {
      const newSlug = args.slug;
      const existing = await ctx.db
        .query("projects")
        .withIndex("by_slug", (q) => q.eq("slug", newSlug))
        .unique();

      if (existing) {
        throw new Error(`A project with slug "${newSlug}" already exists`);
      }
    }

    // Build update object
    const updates: Partial<Doc<"projects">> = {
      updatedAt: Date.now(),
    };

    if (args.slug !== undefined) updates.slug = args.slug;
    if (args.name !== undefined) updates.name = args.name;
    if (args.shortDescription !== undefined) updates.shortDescription = args.shortDescription;
    if (args.background !== undefined) updates.background = args.background;
    if (args.logoUrl !== undefined) updates.logoUrl = args.logoUrl;
    if (args.logoDarkUrl !== undefined) updates.logoDarkUrl = args.logoDarkUrl;
    if (args.logoWidth !== undefined) updates.logoWidth = args.logoWidth;
    if (args.logoHeight !== undefined) updates.logoHeight = args.logoHeight;
    if (args.logoIncludesName !== undefined) updates.logoIncludesName = args.logoIncludesName;
    if (args.status !== undefined) updates.status = args.status;
    if (args.maintained !== undefined) updates.maintained = args.maintained;
    if (args.timeline !== undefined) updates.timeline = args.timeline;
    if (args.links !== undefined) updates.links = args.links;
    if (args.technologies !== undefined) updates.technologies = args.technologies;
    if (args.roles !== undefined) updates.roles = args.roles;
    if (args.contentSections !== undefined) updates.contentSections = args.contentSections;

    await ctx.db.patch(args.projectId, updates);
  },
});

/**
 * Update project order (for drag-drop reordering)
 */
export const updateOrder = mutation({
  args: {
    updates: v.array(
      v.object({
        projectId: v.id("projects"),
        order: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    for (const update of args.updates) {
      await ctx.db.patch(update.projectId, {
        order: update.order,
        updatedAt: Date.now(),
      });
    }
  },
});

/**
 * Toggle project status (active/inactive)
 */
export const toggleStatus = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    await ctx.db.patch(args.projectId, {
      status: project.status === "active" ? "inactive" : "active",
      updatedAt: Date.now(),
    });
  },
});

/**
 * Delete a project (creator only)
 */
export const deleteProject = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    await ctx.db.delete(args.projectId);
  },
});

/**
 * Seed project (for migration - allows creation without max order logic)
 */
export const seed = mutation({
  args: {
    slug: v.string(),
    name: v.string(),
    shortDescription: v.string(),
    background: v.string(),
    logoUrl: v.optional(v.string()),
    logoDarkUrl: v.optional(v.string()),
    logoWidth: v.optional(v.number()),
    logoHeight: v.optional(v.number()),
    logoIncludesName: v.optional(v.boolean()),
    status: statusValidator,
    maintained: v.boolean(),
    timeline: timelineValidator,
    links: linksValidator,
    technologies: v.array(v.string()),
    roles: v.array(v.string()),
    contentSections: v.array(contentSectionValidator),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    // Check if already exists
    const existing = await ctx.db
      .query("projects")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (existing) {
      // Update existing project with new data (in case seed data changed)
      await ctx.db.patch(existing._id, {
        logoIncludesName: args.logoIncludesName,
        updatedAt: Date.now(),
      });
      console.log(`Updated existing project: ${args.slug}`);
      return existing._id;
    }

    const projectId = await ctx.db.insert("projects", {
      slug: args.slug,
      name: args.name,
      shortDescription: args.shortDescription,
      background: args.background,
      logoUrl: args.logoUrl,
      logoDarkUrl: args.logoDarkUrl,
      logoWidth: args.logoWidth,
      logoHeight: args.logoHeight,
      logoIncludesName: args.logoIncludesName,
      status: args.status,
      maintained: args.maintained,
      timeline: args.timeline,
      links: args.links,
      technologies: args.technologies,
      roles: args.roles,
      contentSections: args.contentSections,
      order: args.order,
      createdAt: Date.now(),
    });

    return projectId;
  },
});
