import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./auth";

// Max bio length - matches constants/word-filter.ts
const MAX_BIO_LENGTH = 200;

// Allowed service keys for profile links
const ALLOWED_SERVICE_KEYS = new Set([
  "youtube", "twitch", "tiktok", "x", "instagram", "discord", "github",
  "linkedin", "reddit", "spotify", "soundcloud", "kick", "facebook",
  "snapchat", "pinterest", "threads", "bluesky", "steam", "appleMusic", "website",
]);

const MAX_TOTAL_LINKS = 30;
const MAX_CUSTOM_LINKS = 10;

/**
 * Get a user's profile by ID (for popout display).
 * Returns public data; sensitive fields only returned for own profile.
 */
export const getUserProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    // Get current user to check if this is their own profile
    const currentUser = await getCurrentUser(ctx);
    const isOwnProfile = currentUser?._id.toString() === args.userId.toString();

    // Base public profile data
    const publicProfile = {
      _id: user._id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bannerUrl: user.bannerUrl,
      bannerFocalY: user.bannerFocalY ?? 50, // Default to center
      bio: user.bio,
      tier: user.tier,
      status: user.status,
      lastSeenAt: user.lastSeenAt,
      isCreator: user.isCreator,
      createdAt: user.createdAt,
      isOwnProfile,
      // Public supporter status (for displaying badges)
      discordHighestRole: user.discordHighestRole,
      twitchSubTier: user.twitchSubTier,
      discordBooster: user.discordBooster,
    };

    if (isOwnProfile) {
      return {
        ...publicProfile,
        clerkId: user.clerkId,
        discordId: user.discordId,
        clerkPlan: user.clerkPlan,
        clerkPlanStatus: user.clerkPlanStatus,
        discordUsername: user.discordUsername,
        twitchUsername: user.twitchUsername,
      };
    }

    return publicProfile;
  },
});

/**
 * Get current user's full profile (for editing)
 */
export const getMyProfile = query({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    return {
      _id: user._id,
      clerkId: user.clerkId,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bannerUrl: user.bannerUrl,
      bannerFocalY: user.bannerFocalY ?? 50,
      bio: user.bio,
      tier: user.tier,
      status: user.status,
      lastSeenAt: user.lastSeenAt,
      isCreator: user.isCreator,
      createdAt: user.createdAt,
      discordId: user.discordId,
      isOwnProfile: true,
    };
  },
});

/**
 * Update user's banner
 */
export const updateBanner = mutation({
  args: {
    bannerUrl: v.string(),
    bannerFocalY: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Validate focal Y is between 0-100
    const focalY = args.bannerFocalY ?? 50;
    if (focalY < 0 || focalY > 100) {
      throw new Error("Focal Y must be between 0 and 100");
    }

    await ctx.db.patch(user._id, {
      bannerUrl: args.bannerUrl,
      bannerFocalY: focalY,
    });

    return { success: true };
  },
});

/**
 * Remove user's banner
 */
export const removeBanner = mutation({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    await ctx.db.patch(user._id, {
      bannerUrl: undefined,
      bannerFocalY: undefined,
    });

    return { success: true };
  },
});

/**
 * Update user's bio
 * Note: Word filter validation happens on the API route before this mutation
 */
export const updateBio = mutation({
  args: {
    bio: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Validate length
    const trimmedBio = args.bio.trim();
    if (trimmedBio.length > MAX_BIO_LENGTH) {
      throw new Error(`Bio must be ${MAX_BIO_LENGTH} characters or less`);
    }

    await ctx.db.patch(user._id, {
      bio: trimmedBio || undefined, // Store undefined if empty
    });

    return { success: true };
  },
});

/**
 * Clear user's bio
 */
export const clearBio = mutation({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    await ctx.db.patch(user._id, {
      bio: undefined,
    });

    return { success: true };
  },
});

/**
 * Update profile links (Linktree-style)
 * Replaces the entire array — client sends the full ordered list.
 */
export const updateProfileLinks = mutation({
  args: {
    links: v.array(v.object({
      type: v.union(v.literal("service"), v.literal("custom")),
      serviceKey: v.optional(v.string()),
      url: v.string(),
      title: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    if (args.links.length > MAX_TOTAL_LINKS) {
      throw new Error(`Maximum ${MAX_TOTAL_LINKS} links allowed`);
    }

    const seenServiceKeys = new Set<string>();
    let customCount = 0;

    for (const link of args.links) {
      // Validate URL
      try {
        const parsed = new URL(link.url);
        if (parsed.protocol !== "https:") {
          throw new Error("Only HTTPS URLs are allowed");
        }
      } catch {
        throw new Error(`Invalid URL: ${link.url}`);
      }

      if (link.type === "service") {
        if (!link.serviceKey || !ALLOWED_SERVICE_KEYS.has(link.serviceKey)) {
          throw new Error(`Invalid service key: ${link.serviceKey}`);
        }
        if (seenServiceKeys.has(link.serviceKey)) {
          throw new Error(`Duplicate service: ${link.serviceKey}`);
        }
        seenServiceKeys.add(link.serviceKey);
      } else if (link.type === "custom") {
        // Custom links require tier1 or tier2
        if (user.tier !== "tier1" && user.tier !== "tier2") {
          throw new Error("Custom links are only available for Super Legends");
        }
        if (!link.title || link.title.trim().length === 0) {
          throw new Error("Custom links require a title");
        }
        customCount++;
        if (customCount > MAX_CUSTOM_LINKS) {
          throw new Error(`Maximum ${MAX_CUSTOM_LINKS} custom links allowed`);
        }
      }
    }

    await ctx.db.patch(user._id, { profileLinks: args.links });
    return { success: true };
  },
});

/**
 * Remove a single profile link by index
 */
export const removeProfileLink = mutation({
  args: { index: v.number() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const links = user.profileLinks ?? [];
    if (args.index < 0 || args.index >= links.length) {
      throw new Error("Invalid link index");
    }

    const updated = [...links];
    updated.splice(args.index, 1);
    await ctx.db.patch(user._id, { profileLinks: updated });
    return { success: true };
  },
});

/**
 * Get multiple user profiles by IDs (for batch loading)
 */
export const getUserProfiles = query({
  args: { userIds: v.array(v.id("users")) },
  handler: async (ctx, args) => {
    const profiles = await Promise.all(
      args.userIds.map(async (userId) => {
        const user = await ctx.db.get(userId);
        if (!user) return null;

        return {
          _id: user._id,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          bannerUrl: user.bannerUrl,
          bannerFocalY: user.bannerFocalY ?? 50,
          bio: user.bio,
          tier: user.tier,
          status: user.status,
          lastSeenAt: user.lastSeenAt,
          isCreator: user.isCreator,
          createdAt: user.createdAt,
        };
      }),
    );

    return profiles.filter(Boolean);
  },
});
