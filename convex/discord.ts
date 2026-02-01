import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Upsert Discord → Clerk ID mapping
 * Called from the website when a user syncs their supporter status
 */
export const upsertDiscordClerkMapping = mutation({
  args: {
    discordId: v.string(),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if mapping already exists
    const existing = await ctx.db
      .query("discordClerkMapping")
      .withIndex("by_discordId", (q) => q.eq("discordId", args.discordId))
      .unique();

    if (existing) {
      // Update if Clerk ID changed
      if (existing.clerkId !== args.clerkId) {
        await ctx.db.patch(existing._id, {
          clerkId: args.clerkId,
          updatedAt: Date.now(),
        });
      }
    } else {
      // Create new mapping
      await ctx.db.insert("discordClerkMapping", {
        discordId: args.discordId,
        clerkId: args.clerkId,
        updatedAt: Date.now(),
      });
    }
  },
});

/**
 * Get user by Discord ID for slash commands
 * Returns public profile data + supporter status for linked users
 */
export const getUserByDiscordId = query({
  args: {
    discordId: v.string(),
  },
  handler: async (ctx, args) => {
    // First try: Look up user directly by discordId field
    let user = await ctx.db
      .query("users")
      .withIndex("by_discordId", (q) => q.eq("discordId", args.discordId))
      .unique();

    // Second try: Check discordClerkMapping for linked accounts
    if (!user) {
      const mapping = await ctx.db
        .query("discordClerkMapping")
        .withIndex("by_discordId", (q) => q.eq("discordId", args.discordId))
        .unique();

      if (mapping) {
        user = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", mapping.clerkId))
          .unique();
      }
    }

    if (!user) {
      return null; // Not linked
    }

    return {
      _id: user._id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      tier: user.tier,
      isCreator: user.isCreator,
      // Supporter status for badges
      discordHighestRole: user.discordHighestRole,
      twitchSubTier: user.twitchSubTier,
      discordBooster: user.discordBooster,
      clerkPlan: user.clerkPlan,
      clerkPlanStatus: user.clerkPlanStatus,
    };
  },
});
