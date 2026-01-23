import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, hasAccessToTier, requireCreator } from "./auth";

// File type validator
const fileTypeValidator = v.union(
  v.literal("pdf"),
  v.literal("video"),
  v.literal("document"),
  v.literal("image"),
  v.literal("archive"),
);

// Visibility validator
const visibilityValidator = v.union(
  v.literal("public"),
  v.literal("members"),
  v.literal("tier1"),
  v.literal("tier2"),
);

/**
 * Check if user has access to content based on visibility
 */
function canAccessContent(
  user: Doc<"users"> | null,
  visibility: "public" | "members" | "tier1" | "tier2",
): boolean {
  if (visibility === "public") return true;
  if (!user) return false;
  if (visibility === "members") return true; // Logged in
  return hasAccessToTier(user.tier, visibility);
}

/**
 * Get author info for a vault file
 */
async function getAuthorInfo(ctx: any, authorId: Id<"users">) {
  const author = await ctx.db.get(authorId);
  if (!author) return null;
  return {
    _id: author._id,
    displayName: author.displayName,
    username: author.username,
    avatarUrl: author.avatarUrl,
  };
}

// ============================================
// QUERIES
// ============================================

/**
 * List all vault files (admin view)
 */
export const list = query({
  args: {
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const files = await ctx.db.query("vaultFiles").order("desc").collect();

    let filtered = files;
    if (!args.includeArchived) {
      filtered = filtered.filter((f) => !f.isArchived);
    }

    // Add author info
    const filesWithAuthors = await Promise.all(
      filtered.map(async (file) => ({
        ...file,
        author: await getAuthorInfo(ctx, file.authorId),
      })),
    );

    return filesWithAuthors;
  },
});

/**
 * Paginated list of vault files for public view with tier filtering
 */
export const listPaginated = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const limit = args.limit ?? 20;
    const offset = args.offset ?? 0;

    // Get all non-archived files ordered by order field
    const files = await ctx.db.query("vaultFiles").withIndex("by_order").order("asc").collect();

    // Filter to non-archived and accessible files
    const accessible = files.filter((file) => {
      if (file.isArchived) return false;
      return canAccessContent(user, file.visibility);
    });

    const totalCount = accessible.length;
    const paginatedFiles = accessible.slice(offset, offset + limit);
    const hasMore = offset + limit < totalCount;

    // Add author info and access status
    const filesWithMeta = await Promise.all(
      paginatedFiles.map(async (file) => ({
        ...file,
        author: await getAuthorInfo(ctx, file.authorId),
        hasAccess: canAccessContent(user, file.visibility),
      })),
    );

    return {
      files: filesWithMeta,
      hasMore,
      totalCount,
      nextOffset: hasMore ? offset + limit : null,
    };
  },
});

/**
 * Get combined vault content: vault files + tier-restricted blog posts
 * This powers the unified /vault page showing all exclusive content
 */
export const getVaultContent = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const limit = args.limit ?? 20;
    const offset = args.offset ?? 0;

    // Get vault files
    const vaultFiles = await ctx.db
      .query("vaultFiles")
      .withIndex("by_order")
      .order("asc")
      .collect();

    const accessibleFiles = vaultFiles.filter((file) => {
      if (file.isArchived) return false;
      return canAccessContent(user, file.visibility);
    });

    // Get tier-restricted blog posts (not public)
    const blogPosts = await ctx.db.query("blogPosts").withIndex("by_visibility").collect();

    const tierRestrictedPosts = blogPosts.filter((post) => {
      if (post.status !== "published") return false;
      if (post.visibility === "public") return false; // Only show tier-restricted posts
      return canAccessContent(user, post.visibility);
    });

    // Combine and transform into unified format
    type VaultItem = {
      _id: string;
      type: "file" | "article" | "video";
      title: string;
      description?: string;
      slug: string;
      visibility: "public" | "members" | "tier1" | "tier2";
      thumbnailUrl?: string;
      fileUrl?: string;
      fileType?: string;
      mimeType?: string;
      fileSize?: number;
      coverImage?: string;
      contentType?: string;
      createdAt: number;
      hasAccess: boolean;
    };

    const combinedItems: VaultItem[] = [
      ...accessibleFiles.map((file) => ({
        _id: file._id,
        type: "file" as const,
        title: file.title,
        description: file.description,
        slug: file.slug,
        visibility: file.visibility,
        thumbnailUrl: file.thumbnailUrl,
        fileUrl: file.fileUrl,
        fileType: file.fileType,
        mimeType: file.mimeType,
        fileSize: file.fileSize,
        createdAt: file.createdAt,
        hasAccess: canAccessContent(user, file.visibility),
      })),
      ...tierRestrictedPosts.map((post) => ({
        _id: post._id,
        type: (post.contentType === "video" ? "video" : "article") as "article" | "video",
        title: post.title,
        description: post.description,
        slug: post.slug,
        visibility: post.visibility,
        coverImage: post.coverImage,
        contentType: post.contentType,
        createdAt: post.createdAt,
        hasAccess: canAccessContent(user, post.visibility),
      })),
    ];

    // Sort by creation date (newest first)
    combinedItems.sort((a, b) => b.createdAt - a.createdAt);

    const totalCount = combinedItems.length;
    const paginatedItems = combinedItems.slice(offset, offset + limit);
    const hasMore = offset + limit < totalCount;

    return {
      items: paginatedItems,
      hasMore,
      totalCount,
      nextOffset: hasMore ? offset + limit : null,
    };
  },
});

/**
 * Get a single vault file by slug
 */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const file = await ctx.db
      .query("vaultFiles")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!file) return null;

    const user = await getCurrentUser(ctx);

    // Check access
    if (file.isArchived) {
      // Only creator can see archived files
      if (!user || !user.isCreator) return null;
    }

    const hasAccess = canAccessContent(user, file.visibility);

    return {
      ...file,
      author: await getAuthorInfo(ctx, file.authorId),
      hasAccess,
    };
  },
});

/**
 * Get a single vault file by ID (admin)
 */
export const get = query({
  args: { fileId: v.id("vaultFiles") },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const file = await ctx.db.get(args.fileId);
    if (!file) return null;

    return {
      ...file,
      author: await getAuthorInfo(ctx, file.authorId),
    };
  },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Create a new vault file (creator only)
 */
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    slug: v.string(),
    fileType: fileTypeValidator,
    fileUrl: v.string(),
    thumbnailUrl: v.optional(v.string()),
    filename: v.string(),
    mimeType: v.string(),
    fileSize: v.number(),
    pageCount: v.optional(v.number()),
    duration: v.optional(v.number()),
    visibility: visibilityValidator,
  },
  handler: async (ctx, args) => {
    const user = await requireCreator(ctx);

    // Check slug uniqueness
    const existing = await ctx.db
      .query("vaultFiles")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (existing) {
      throw new Error(`A vault file with slug "${args.slug}" already exists`);
    }

    // Get next order number (put at end)
    const allFiles = await ctx.db.query("vaultFiles").collect();
    const maxOrder = allFiles.reduce((max, f) => Math.max(max, f.order), -1);

    const fileId = await ctx.db.insert("vaultFiles", {
      title: args.title,
      description: args.description,
      slug: args.slug,
      fileType: args.fileType,
      fileUrl: args.fileUrl,
      thumbnailUrl: args.thumbnailUrl,
      filename: args.filename,
      mimeType: args.mimeType,
      fileSize: args.fileSize,
      pageCount: args.pageCount,
      duration: args.duration,
      visibility: args.visibility,
      order: maxOrder + 1,
      authorId: user._id,
      downloadCount: 0,
      isArchived: false,
      createdAt: Date.now(),
    });

    return fileId;
  },
});

/**
 * Update a vault file (creator only)
 */
export const update = mutation({
  args: {
    fileId: v.id("vaultFiles"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    slug: v.optional(v.string()),
    fileType: v.optional(fileTypeValidator),
    fileUrl: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    filename: v.optional(v.string()),
    mimeType: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    pageCount: v.optional(v.number()),
    duration: v.optional(v.number()),
    visibility: v.optional(visibilityValidator),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const file = await ctx.db.get(args.fileId);
    if (!file) {
      throw new Error("Vault file not found");
    }

    // Check slug uniqueness if changing
    if (args.slug && args.slug !== file.slug) {
      const newSlug = args.slug;
      const existing = await ctx.db
        .query("vaultFiles")
        .withIndex("by_slug", (q) => q.eq("slug", newSlug))
        .unique();

      if (existing) {
        throw new Error(`A vault file with slug "${newSlug}" already exists`);
      }
    }

    // Build update object
    const updates: Partial<Doc<"vaultFiles">> = {};

    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.slug !== undefined) updates.slug = args.slug;
    if (args.fileType !== undefined) updates.fileType = args.fileType;
    if (args.fileUrl !== undefined) updates.fileUrl = args.fileUrl;
    if (args.thumbnailUrl !== undefined) updates.thumbnailUrl = args.thumbnailUrl;
    if (args.filename !== undefined) updates.filename = args.filename;
    if (args.mimeType !== undefined) updates.mimeType = args.mimeType;
    if (args.fileSize !== undefined) updates.fileSize = args.fileSize;
    if (args.pageCount !== undefined) updates.pageCount = args.pageCount;
    if (args.duration !== undefined) updates.duration = args.duration;
    if (args.visibility !== undefined) updates.visibility = args.visibility;
    if (args.order !== undefined) updates.order = args.order;

    await ctx.db.patch(args.fileId, updates);
  },
});

/**
 * Archive a vault file (creator only)
 */
export const archive = mutation({
  args: { fileId: v.id("vaultFiles") },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const file = await ctx.db.get(args.fileId);
    if (!file) {
      throw new Error("Vault file not found");
    }

    await ctx.db.patch(args.fileId, { isArchived: true });
  },
});

/**
 * Unarchive a vault file (creator only)
 */
export const unarchive = mutation({
  args: { fileId: v.id("vaultFiles") },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const file = await ctx.db.get(args.fileId);
    if (!file) {
      throw new Error("Vault file not found");
    }

    await ctx.db.patch(args.fileId, { isArchived: false });
  },
});

/**
 * Delete a vault file permanently (creator only)
 */
export const deleteFile = mutation({
  args: { fileId: v.id("vaultFiles") },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const file = await ctx.db.get(args.fileId);
    if (!file) {
      throw new Error("Vault file not found");
    }

    await ctx.db.delete(args.fileId);
  },
});

/**
 * Increment download count (authenticated users only)
 * Also logs the download for analytics
 */
export const incrementDownload = mutation({
  args: { fileId: v.id("vaultFiles") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Must be logged in to download files");
    }

    const file = await ctx.db.get(args.fileId);
    if (!file) {
      throw new Error("Vault file not found");
    }

    // Check access
    if (!canAccessContent(user, file.visibility)) {
      throw new Error("You don't have access to this file");
    }

    // Increment the download count
    await ctx.db.patch(args.fileId, {
      downloadCount: file.downloadCount + 1,
    });

    // Log the download for analytics
    await ctx.db.insert("vaultDownloadLogs", {
      userId: user._id,
      fileId: args.fileId,
      downloadedAt: Date.now(),
      userTier: user.tier,
    });
  },
});

/**
 * Update order of multiple files (creator only)
 */
export const updateOrder = mutation({
  args: {
    updates: v.array(
      v.object({
        fileId: v.id("vaultFiles"),
        order: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    for (const update of args.updates) {
      await ctx.db.patch(update.fileId, { order: update.order });
    }
  },
});
