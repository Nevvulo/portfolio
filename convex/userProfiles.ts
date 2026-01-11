import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./auth";

// Max bio length - matches constants/word-filter.ts
const MAX_BIO_LENGTH = 200;

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
