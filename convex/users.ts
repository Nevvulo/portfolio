import { v } from "convex/values";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { getCurrentUser, requireUser, CREATOR_DISCORD_ID, requireCreator } from "./auth";

/**
 * Helper function to compute tier from supporter status (server-side)
 * This mirrors the client-side logic but is authoritative
 */
function computeTierFromStatus(status: {
  clerkPlan?: string;
  clerkPlanStatus?: string;
  discordHighestRole?: { name: string } | null;
  twitchSubTier?: number | null;
  discordBooster?: boolean | null;
}): "free" | "tier1" | "tier2" {
  // Check Clerk subscription first (highest priority)
  if (status.clerkPlan === "super_legend_2" && status.clerkPlanStatus === "active") {
    return "tier2";
  }
  if (status.clerkPlan === "super_legend" && status.clerkPlanStatus === "active") {
    return "tier1";
  }

  // Check Discord roles that grant tier access
  if (status.discordHighestRole) {
    const roleName = status.discordHighestRole.name.toLowerCase();
    if (roleName.includes("super legend ii") || roleName.includes("super legend 2")) {
      return "tier2";
    }
    if (roleName.includes("super legend")) {
      return "tier1";
    }
  }

  // Check Twitch subscription
  if (status.twitchSubTier) {
    return status.twitchSubTier >= 3 ? "tier2" : "tier1";
  }

  // Discord booster gets tier1
  if (status.discordBooster) {
    return "tier1";
  }

  return "free";
}

/**
 * SECURE: Get or create a user from Clerk identity
 * This action fetches verified discordId and tier from Clerk API
 * Never trusts client-provided discordId or tier
 */
export const getOrCreateUser = action({
  args: {
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<"users">> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const clerkId = identity.subject;

    // Fetch verified user data from Clerk API
    const clerkRes = await fetch(
      `https://api.clerk.com/v1/users/${clerkId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        },
      }
    );

    if (!clerkRes.ok) {
      throw new Error(`Failed to fetch from Clerk: ${clerkRes.status}`);
    }

    const clerkUser = await clerkRes.json();

    // Get verified Discord ID from Clerk's external accounts
    const discordAccount = clerkUser.external_accounts?.find(
      (a: { provider: string }) => a.provider === "oauth_discord"
    );
    const discordId = discordAccount?.provider_user_id || discordAccount?.external_id || undefined;

    // Get Discord username
    const discordUsername = discordAccount?.username;

    // Get Twitch account
    const twitchAccount = clerkUser.external_accounts?.find(
      (a: { provider: string }) => a.provider === "oauth_twitch"
    );
    const twitchUsername = twitchAccount?.username;

    // Fetch Clerk subscription for tier
    let clerkPlan: string | undefined;
    let clerkPlanStatus: string | undefined;
    try {
      const billingRes = await fetch(
        `https://api.clerk.com/v1/users/${clerkId}/billing/subscription`,
        {
          headers: {
            Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          },
        }
      );

      if (billingRes.ok) {
        const billingData = await billingRes.json();
        const item = billingData.subscription_items?.[0];
        const planSlug = item?.plan?.slug;
        const planName = item?.plan?.name?.toLowerCase().replace(/\s+/g, "_");
        const status = billingData.status;

        if (planSlug === "super_legend" || planName === "super_legend") {
          clerkPlan = "super_legend";
        } else if (planSlug === "super_legend_2" || planName === "super_legend_ii" || planName === "super_legend_2") {
          clerkPlan = "super_legend_2";
        }

        if (status === "active" || status === "past_due" || status === "canceled") {
          clerkPlanStatus = status;
        } else if (clerkPlan) {
          clerkPlanStatus = "active";
        }
      }
    } catch (error) {
      console.error("Error fetching Clerk subscription:", error);
    }

    // Fetch Discord supporter status if we have a Discord ID
    let discordHighestRole: { id: string; name: string; color: number; position: number } | undefined;
    let discordBooster: boolean | undefined;

    if (discordId) {
      try {
        const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;
        const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

        if (DISCORD_GUILD_ID && DISCORD_BOT_TOKEN) {
          const memberRes = await fetch(
            `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordId}`,
            {
              headers: {
                Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
              },
            }
          );

          if (memberRes.ok) {
            const member = await memberRes.json();
            discordBooster = !!member.premium_since;

            const rolesRes = await fetch(
              `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/roles`,
              {
                headers: {
                  Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
                },
              }
            );

            if (rolesRes.ok) {
              const allRoles = await rolesRes.json();
              const memberRoles = allRoles
                .filter((r: { id: string }) => member.roles.includes(r.id))
                .sort((a: { position: number }, b: { position: number }) => b.position - a.position);

              if (memberRoles.length > 0) {
                const highest = memberRoles[0];
                discordHighestRole = {
                  id: highest.id,
                  name: highest.name,
                  color: highest.color,
                  position: highest.position,
                };
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching Discord status:", error);
      }
    }

    // Compute tier server-side based on verified data
    const tier = computeTierFromStatus({
      clerkPlan,
      clerkPlanStatus,
      discordHighestRole,
      twitchSubTier: undefined, // Would need Twitch API call
      discordBooster,
    });

    // Determine isCreator from VERIFIED discordId
    const isCreator = discordId === CREATOR_DISCORD_ID;

    // Call internal mutation to create/update user
    const userId: Id<"users"> = await ctx.runMutation(internal.users.createOrUpdateUserInternal, {
      clerkId,
      displayName: args.displayName || clerkUser.first_name || clerkUser.username || "Anonymous",
      avatarUrl: args.avatarUrl || clerkUser.image_url,
      discordId,
      discordUsername,
      twitchUsername,
      tier,
      isCreator,
      discordHighestRole,
      discordBooster,
      clerkPlan,
      clerkPlanStatus,
    });

    return userId;
  },
});

/**
 * Internal mutation to create or update user (only called from secure action)
 */
export const createOrUpdateUserInternal = internalMutation({
  args: {
    clerkId: v.string(),
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
    discordId: v.optional(v.string()),
    discordUsername: v.optional(v.string()),
    twitchUsername: v.optional(v.string()),
    tier: v.union(v.literal("free"), v.literal("tier1"), v.literal("tier2")),
    isCreator: v.boolean(),
    discordHighestRole: v.optional(v.object({
      id: v.string(),
      name: v.string(),
      color: v.number(),
      position: v.number(),
    })),
    discordBooster: v.optional(v.boolean()),
    clerkPlan: v.optional(v.string()),
    clerkPlanStatus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existingUser) {
      // Update user info
      await ctx.db.patch(existingUser._id, {
        displayName: args.displayName,
        avatarUrl: args.avatarUrl,
        tier: args.tier,
        discordId: args.discordId,
        discordUsername: args.discordUsername,
        twitchUsername: args.twitchUsername,
        isCreator: args.isCreator,
        discordHighestRole: args.discordHighestRole,
        discordBooster: args.discordBooster,
        clerkPlan: args.clerkPlan,
        clerkPlanStatus: args.clerkPlanStatus,
        status: "online",
        lastSeenAt: Date.now(),
        supporterSyncedAt: Date.now(),
      });
      return existingUser._id;
    }

    // Create new user with verified data
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      discordId: args.discordId,
      discordUsername: args.discordUsername,
      twitchUsername: args.twitchUsername,
      displayName: args.displayName,
      avatarUrl: args.avatarUrl,
      tier: args.tier,
      isCreator: args.isCreator,
      discordHighestRole: args.discordHighestRole,
      discordBooster: args.discordBooster,
      clerkPlan: args.clerkPlan,
      clerkPlanStatus: args.clerkPlanStatus,
      status: "online",
      lastSeenAt: Date.now(),
      supporterSyncedAt: Date.now(),
      notificationPreferences: {
        emailDigest: "weekly",
        inAppNotifications: true,
      },
      createdAt: Date.now(),
    });

    return userId;
  },
});

/**
 * Get current user
 */
export const getMe = query({
  handler: async (ctx) => {
    return getCurrentUser(ctx);
  },
});

/**
 * Update user presence (online/offline/away)
 */
export const updatePresence = mutation({
  args: {
    status: v.union(v.literal("online"), v.literal("offline"), v.literal("away")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return;

    await ctx.db.patch(user._id, {
      status: args.status,
      lastSeenAt: Date.now(),
    });
  },
});

/**
 * Heartbeat - update last seen time
 */
export const heartbeat = mutation({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return;

    await ctx.db.patch(user._id, {
      status: "online",
      lastSeenAt: Date.now(),
    });
  },
});

/**
 * Get online members
 */
export const getOnlineMembers = query({
  handler: async (ctx) => {
    // Consider users "online" if seen in the last 2 minutes
    const twoMinutesAgo = Date.now() - 2 * 60 * 1000;

    const onlineUsers = await ctx.db
      .query("users")
      .withIndex("by_status", (q) => q.eq("status", "online"))
      .filter((q) => q.gte(q.field("lastSeenAt"), twoMinutesAgo))
      .collect();

    return onlineUsers.map((user) => ({
      _id: user._id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      tier: user.tier,
      isCreator: user.isCreator,
      status: user.status,
      // Include Discord info for free users who might have role colors
      discordHighestRole: user.discordHighestRole,
      discordBooster: user.discordBooster,
    }));
  },
});

/**
 * Update notification preferences
 */
export const updateNotificationPreferences = mutation({
  args: {
    emailDigest: v.union(v.literal("daily"), v.literal("weekly"), v.literal("none")),
    inAppNotifications: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    await ctx.db.patch(user._id, {
      notificationPreferences: {
        emailDigest: args.emailDigest,
        inAppNotifications: args.inAppNotifications,
      },
    });
  },
});

/** Update user tier. Creator only. */
export const updateTier = mutation({
  args: {
    userId: v.optional(v.id("users")),
    clerkId: v.optional(v.string()),
    tier: v.union(v.literal("free"), v.literal("tier1"), v.literal("tier2")),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    let targetUser;

    if (args.userId) {
      targetUser = await ctx.db.get(args.userId);
    } else if (args.clerkId) {
      const clerkId = args.clerkId;
      targetUser = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q: any) => q.eq("clerkId", clerkId))
        .unique();
    }

    if (!targetUser) {
      throw new Error("User not found");
    }

    await ctx.db.patch(targetUser._id, {
      tier: args.tier,
    });

    return targetUser._id;
  },
});

/**
 * Get all users (admin only)
 */
export const listAll = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const limit = args.limit ?? 50;
    const users = await ctx.db
      .query("users")
      .order("desc")
      .take(limit);

    return users.map((user) => ({
      _id: user._id,
      clerkId: user.clerkId,
      discordId: user.discordId,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      tier: user.tier,
      isCreator: user.isCreator,
      isBanned: user.isBanned ?? false,
      banReason: user.banReason,
      status: user.status,
      lastSeenAt: user.lastSeenAt,
      createdAt: user.createdAt,
    }));
  },
});

/**
 * Ban a user (admin only)
 */
export const banUser = mutation({
  args: {
    userId: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    if (user.isCreator) throw new Error("Cannot ban the creator");

    await ctx.db.patch(args.userId, {
      isBanned: true,
      banReason: args.reason,
      bannedAt: Date.now(),
    });
  },
});

/**
 * Unban a user (admin only)
 */
export const unbanUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    await ctx.db.patch(args.userId, {
      isBanned: false,
      banReason: undefined,
      bannedAt: undefined,
    });
  },
});

/**
 * Kick a user (admin only) - sets them offline and clears session
 */
export const kickUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    if (user.isCreator) throw new Error("Cannot kick the creator");

    await ctx.db.patch(args.userId, {
      status: "offline",
      kickedAt: Date.now(),
    });
  },
});

/**
 * Update user role/tier (admin only)
 */
export const setUserRole = mutation({
  args: {
    userId: v.id("users"),
    tier: v.union(v.literal("free"), v.literal("tier1"), v.literal("tier2")),
    isCreator: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const updates: Record<string, unknown> = { tier: args.tier };
    if (args.isCreator !== undefined) {
      updates.isCreator = args.isCreator;
    }

    await ctx.db.patch(args.userId, updates);
  },
});

/** Refresh a user's profile data from Clerk. Own profile or creator only. */
export const refreshUser = action({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if user is trying to refresh their own profile
    const isOwnProfile = identity.subject === args.clerkId;

    // If not their own profile, check if they're the creator
    if (!isOwnProfile) {
      // Fetch caller's Discord ID to check if they're the creator
      const callerClerkRes = await fetch(
        `https://api.clerk.com/v1/users/${identity.subject}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          },
        }
      );

      if (!callerClerkRes.ok) {
        throw new Error("Failed to verify identity");
      }

      const callerClerkUser = await callerClerkRes.json();
      const callerDiscordAccount = callerClerkUser.external_accounts?.find(
        (a: { provider: string }) => a.provider === "oauth_discord"
      );
      const callerDiscordId = callerDiscordAccount?.provider_user_id || callerDiscordAccount?.external_id;

      if (callerDiscordId !== CREATOR_DISCORD_ID) {
        throw new Error("You can only refresh your own profile");
      }
    }

    // Fetch from Clerk API
    const clerkRes = await fetch(
      `https://api.clerk.com/v1/users/${args.clerkId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        },
      }
    );

    if (!clerkRes.ok) {
      throw new Error(`Failed to fetch from Clerk: ${clerkRes.status}`);
    }

    const clerkUser = await clerkRes.json();

    // Find Discord external account
    const discordAccount = clerkUser.external_accounts?.find(
      (a: { provider: string }) => a.provider === "oauth_discord"
    );
    const discordId = discordAccount?.provider_user_id || discordAccount?.external_id;
    const discordUsername = discordAccount?.username;

    // Find Twitch external account
    const twitchAccount = clerkUser.external_accounts?.find(
      (a: { provider: string }) => a.provider === "oauth_twitch"
    );
    const twitchUsername = twitchAccount?.username;

    // Fetch Clerk subscription
    let clerkPlan: string | undefined;
    let clerkPlanStatus: string | undefined;
    try {
      const billingRes = await fetch(
        `https://api.clerk.com/v1/users/${args.clerkId}/billing/subscription`,
        {
          headers: {
            Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          },
        }
      );

      if (billingRes.ok) {
        const billingData = await billingRes.json();
        const item = billingData.subscription_items?.[0];
        const planSlug = item?.plan?.slug;
        const planName = item?.plan?.name?.toLowerCase().replace(/\s+/g, "_");
        const status = billingData.status;

        if (planSlug === "super_legend" || planName === "super_legend") {
          clerkPlan = "super_legend";
        } else if (planSlug === "super_legend_2" || planName === "super_legend_ii" || planName === "super_legend_2") {
          clerkPlan = "super_legend_2";
        }

        if (status === "active" || status === "past_due" || status === "canceled") {
          clerkPlanStatus = status;
        } else if (clerkPlan) {
          clerkPlanStatus = "active";
        }
      }
    } catch (error) {
      console.error("Error fetching Clerk subscription:", error);
    }

    // Fetch Discord supporter status if we have a Discord ID
    let discordHighestRole: { id: string; name: string; color: number; position: number } | undefined;
    let discordBooster: boolean | undefined;

    if (discordId) {
      try {
        // Use Discord Bot to fetch member info
        const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;
        const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

        if (DISCORD_GUILD_ID && DISCORD_BOT_TOKEN) {
          // Fetch member
          const memberRes = await fetch(
            `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordId}`,
            {
              headers: {
                Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
              },
            }
          );

          if (memberRes.ok) {
            const member = await memberRes.json();

            // Check booster status
            discordBooster = !!member.premium_since;

            // Fetch guild roles to get role details
            const rolesRes = await fetch(
              `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/roles`,
              {
                headers: {
                  Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
                },
              }
            );

            if (rolesRes.ok) {
              const allRoles = await rolesRes.json();
              // Filter to member's roles and find highest by position
              const memberRoles = allRoles
                .filter((r: { id: string }) => member.roles.includes(r.id))
                .sort((a: { position: number }, b: { position: number }) => b.position - a.position);

              if (memberRoles.length > 0) {
                const highest = memberRoles[0];
                discordHighestRole = {
                  id: highest.id,
                  name: highest.name,
                  color: highest.color,
                  position: highest.position,
                };
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching Discord status:", error);
      }
    }

    // Call internal mutation to update the database
    await ctx.runMutation(internal.users.updateUserFromClerk, {
      clerkId: args.clerkId,
      displayName: clerkUser.first_name || clerkUser.username,
      avatarUrl: clerkUser.image_url,
      discordId: discordId || undefined,
      discordHighestRole,
      discordBooster,
      clerkPlan,
      clerkPlanStatus,
      discordUsername,
      twitchUsername,
    });

    return {
      success: true,
      displayName: clerkUser.first_name || clerkUser.username,
      avatarUrl: clerkUser.image_url,
      discordId,
      discordHighestRole,
      discordBooster,
      clerkPlan,
      clerkPlanStatus,
      discordUsername,
      twitchUsername,
    };
  },
});

/**
 * Internal mutation to update user from Clerk data
 */
export const updateUserFromClerk = internalMutation({
  args: {
    clerkId: v.string(),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    discordId: v.optional(v.string()),
    // Supporter status fields
    discordHighestRole: v.optional(v.object({
      id: v.string(),
      name: v.string(),
      color: v.number(),
      position: v.number(),
    })),
    twitchSubTier: v.optional(v.union(v.literal(1), v.literal(2), v.literal(3))),
    discordBooster: v.optional(v.boolean()),
    clerkPlan: v.optional(v.string()),
    clerkPlanStatus: v.optional(v.string()),
    // Connection usernames
    discordUsername: v.optional(v.string()),
    twitchUsername: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found with that Clerk ID");

    // Build update object
    const updates: Record<string, unknown> = {
      displayName: args.displayName || user.displayName,
      avatarUrl: args.avatarUrl || user.avatarUrl,
      discordId: args.discordId || user.discordId,
    };

    // Add supporter status fields if provided
    if (args.discordHighestRole !== undefined) {
      updates.discordHighestRole = args.discordHighestRole;
    }
    if (args.twitchSubTier !== undefined) {
      updates.twitchSubTier = args.twitchSubTier;
    }
    if (args.discordBooster !== undefined) {
      updates.discordBooster = args.discordBooster;
    }
    if (args.clerkPlan !== undefined) {
      updates.clerkPlan = args.clerkPlan;
    }
    if (args.clerkPlanStatus !== undefined) {
      updates.clerkPlanStatus = args.clerkPlanStatus;
    }
    // Add usernames if provided
    if (args.discordUsername !== undefined) {
      updates.discordUsername = args.discordUsername;
    }
    if (args.twitchUsername !== undefined) {
      updates.twitchUsername = args.twitchUsername;
    }

    // Mark supporter sync time if any supporter fields were updated
    if (args.discordHighestRole !== undefined ||
        args.twitchSubTier !== undefined ||
        args.discordBooster !== undefined ||
        args.clerkPlan !== undefined) {
      updates.supporterSyncedAt = Date.now();
    }

    // Update user
    await ctx.db.patch(user._id, updates);

    // Also update discordClerkMapping if we have a Discord ID
    if (args.discordId) {
      const existingMapping = await ctx.db
        .query("discordClerkMapping")
        .withIndex("by_discordId", (q) => q.eq("discordId", args.discordId!))
        .unique();

      if (existingMapping) {
        await ctx.db.patch(existingMapping._id, {
          clerkId: args.clerkId,
          updatedAt: Date.now(),
        });
      } else {
        await ctx.db.insert("discordClerkMapping", {
          discordId: args.discordId,
          clerkId: args.clerkId,
          updatedAt: Date.now(),
        });
      }
    }
  },
});

/** Update supporter status for a user (called from sync API). Own profile only. */
export const updateSupporterStatus = mutation({
  args: {
    clerkId: v.string(),
    discordHighestRole: v.optional(v.object({
      id: v.string(),
      name: v.string(),
      color: v.number(),
      position: v.number(),
    })),
    twitchSubTier: v.optional(v.union(v.literal(1), v.literal(2), v.literal(3))),
    discordBooster: v.optional(v.boolean()),
    clerkPlan: v.optional(v.string()),
    clerkPlanStatus: v.optional(v.string()),
    discordUsername: v.optional(v.string()),
    twitchUsername: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Only allow updating your own status
    if (identity.subject !== args.clerkId) {
      throw new Error("You can only update your own supporter status");
    }

    // Find user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      console.log(`[updateSupporterStatus] User not found for clerkId: ${args.clerkId}`);
      return;
    }

    // Update supporter fields
    await ctx.db.patch(user._id, {
      discordHighestRole: args.discordHighestRole,
      twitchSubTier: args.twitchSubTier,
      discordBooster: args.discordBooster,
      clerkPlan: args.clerkPlan,
      clerkPlanStatus: args.clerkPlanStatus,
      discordUsername: args.discordUsername,
      twitchUsername: args.twitchUsername,
      supporterSyncedAt: Date.now(),
    });
  },
});

/**
 * Get analytics (admin only)
 */
export const getAnalytics = query({
  handler: async (ctx) => {
    await requireCreator(ctx);

    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    // Get all users
    const allUsers = await ctx.db.query("users").collect();

    // Get all messages (excluding deleted)
    const allMessages = await ctx.db.query("messages").collect();
    const visibleMessages = allMessages.filter((m) => !m.isDeleted);

    // Calculate stats
    const totalUsers = allUsers.length;
    const tier1Users = allUsers.filter((u) => u.tier === "tier1").length;
    const tier2Users = allUsers.filter((u) => u.tier === "tier2").length;
    const bannedUsers = allUsers.filter((u) => u.isBanned).length;

    const activeToday = allUsers.filter((u) => u.lastSeenAt && u.lastSeenAt > oneDayAgo).length;
    const activeWeek = allUsers.filter((u) => u.lastSeenAt && u.lastSeenAt > oneWeekAgo).length;

    const totalMessages = visibleMessages.length;
    const messagesToday = visibleMessages.filter((m) => m.createdAt > oneDayAgo).length;
    const messagesWeek = visibleMessages.filter((m) => m.createdAt > oneWeekAgo).length;
    const messagesMonth = visibleMessages.filter((m) => m.createdAt > oneMonthAgo).length;

    // New users
    const newUsersToday = allUsers.filter((u) => u.createdAt && u.createdAt > oneDayAgo).length;
    const newUsersWeek = allUsers.filter((u) => u.createdAt && u.createdAt > oneWeekAgo).length;
    const newUsersMonth = allUsers.filter((u) => u.createdAt && u.createdAt > oneMonthAgo).length;

    // Top contributors (most messages, excluding deleted)
    const messageCounts = visibleMessages.reduce((acc, msg) => {
      const authorId = msg.authorId?.toString() ?? "unknown";
      acc[authorId] = (acc[authorId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topContributors = Object.entries(messageCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id, count]) => {
        const user = allUsers.find((u) => u._id.toString() === id);
        return {
          userId: id,
          displayName: user?.displayName ?? "Unknown",
          avatarUrl: user?.avatarUrl,
          messageCount: count,
        };
      });

    return {
      users: {
        total: totalUsers,
        tier1: tier1Users,
        tier2: tier2Users,
        banned: bannedUsers,
        activeToday,
        activeWeek,
        newToday: newUsersToday,
        newWeek: newUsersWeek,
        newMonth: newUsersMonth,
      },
      messages: {
        total: totalMessages,
        today: messagesToday,
        week: messagesWeek,
        month: messagesMonth,
      },
      topContributors,
    };
  },
});

/**
 * Check if a username is available
 */
export const checkUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const username = args.username.toLowerCase().trim();

    // Basic validation
    if (username.length < 3) {
      return { available: false, reason: "Username must be at least 3 characters" };
    }
    if (username.length > 20) {
      return { available: false, reason: "Username must be 20 characters or less" };
    }
    if (!/^[a-z0-9_]+$/.test(username)) {
      return { available: false, reason: "Username can only contain letters, numbers, and underscores" };
    }

    // Reserved usernames (excluding nevulo/nev since you're the owner)
    const reserved = ["admin", "support", "help", "moderator", "mod", "staff", "official", "system"];
    if (reserved.includes(username)) {
      return { available: false, reason: "This username is reserved" };
    }

    // Check if taken
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();

    if (existing) {
      return { available: false, reason: "Username is already taken" };
    }

    return { available: true };
  },
});

/**
 * Set username for current user
 */
export const setUsername = mutation({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const username = args.username.toLowerCase().trim();

    // Validate username format
    if (username.length < 3 || username.length > 20) {
      throw new Error("Username must be 3-20 characters");
    }
    if (!/^[a-z0-9_]+$/.test(username)) {
      throw new Error("Username can only contain letters, numbers, and underscores");
    }

    // Check reserved (creator can use any username)
    const reserved = ["admin", "support", "help", "moderator", "mod", "staff", "official", "system"];
    if (reserved.includes(username) && !user.isCreator) {
      throw new Error("This username is reserved");
    }

    // Check if taken (by someone else)
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();

    if (existing && existing._id !== user._id) {
      throw new Error("Username is already taken");
    }

    // Set username
    await ctx.db.patch(user._id, { username });

    return { success: true, username };
  },
});

/**
 * Get user by username (for public profiles)
 */
export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const username = args.username.toLowerCase().trim();

    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();

    if (!user) {
      return null;
    }

    // Return public profile data only
    return {
      _id: user._id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      tier: user.tier,
      isCreator: user.isCreator,
      bannerUrl: user.bannerUrl,
      bannerFocalY: user.bannerFocalY,
      bio: user.bio,
      createdAt: user.createdAt,
      // Include role info for badges
      discordHighestRole: user.discordHighestRole,
      discordBooster: user.discordBooster,
      // Feed privacy setting
      feedPrivacy: user.feedPrivacy,
    };
  },
});

/**
 * Resolve user mentions by Discord ID or Clerk ID
 * Used to render mentions in chat messages
 */
export const resolveMentions = query({
  args: {
    discordIds: v.array(v.string()),
    clerkIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const results: Record<string, {
      _id: string;
      displayName: string;
      avatarUrl: string | null;
      tier: string;
      isCreator: boolean;
    }> = {};

    // Resolve Discord IDs
    for (const discordId of args.discordIds) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_discordId", (q) => q.eq("discordId", discordId))
        .unique();

      if (user) {
        results[`discord:${discordId}`] = {
          _id: user._id,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl ?? null,
          tier: user.tier,
          isCreator: user.isCreator ?? false,
        };
      }
    }

    // Resolve Clerk IDs
    for (const clerkId of args.clerkIds) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
        .unique();

      if (user) {
        results[`clerk:${clerkId}`] = {
          _id: user._id,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl ?? null,
          tier: user.tier,
          isCreator: user.isCreator ?? false,
        };
      }
    }

    return results;
  },
});

/**
 * Search users for mention autocomplete
 * Returns all non-banned users with basic info for display
 */
export const searchUsers = query({
  args: {
    query: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Require auth for searching users
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const limit = args.limit ?? 20;

    // Get all non-banned users
    const allUsers = await ctx.db
      .query("users")
      .filter((q) => q.neq(q.field("isBanned"), true))
      .collect();

    // Filter by query if provided (case-insensitive prefix match on displayName)
    let filteredUsers = allUsers;
    if (args.query && args.query.trim().length > 0) {
      const searchLower = args.query.toLowerCase().trim();
      filteredUsers = allUsers.filter((u) =>
        u.displayName.toLowerCase().startsWith(searchLower)
      );
    }

    // Sort by displayName and limit
    const sortedUsers = filteredUsers
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
      .slice(0, limit);

    // Return only the fields needed for mention autocomplete
    return sortedUsers.map((u) => ({
      _id: u._id,
      clerkId: u.clerkId,
      discordId: u.discordId ?? null,
      displayName: u.displayName,
      username: u.username ?? null,
      avatarUrl: u.avatarUrl ?? null,
      tier: u.tier,
      isCreator: u.isCreator ?? false,
    }));
  },
});

/**
 * Get users by their IDs
 * Used for displaying collaborator details in the editor
 */
export const getUsersByIds = query({
  args: {
    userIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const users = await Promise.all(
      args.userIds.map((id) => ctx.db.get(id))
    );

    return users
      .filter((u): u is NonNullable<typeof u> => u !== null)
      .map((u) => ({
        _id: u._id,
        displayName: u.displayName,
        username: u.username ?? null,
        avatarUrl: u.avatarUrl ?? null,
        tier: u.tier,
      }));
  },
});

// ============================================
// STAFF MANAGEMENT
// ============================================

// Role constants (keep in sync with auth.ts)
const ROLE_NORMAL = 0;
const ROLE_STAFF = 1;

/**
 * Get all staff members (role >= ROLE_STAFF or isCreator)
 * Creator only
 */
export const getStaffMembers = query({
  handler: async (ctx) => {
    await requireCreator(ctx);

    const allUsers = await ctx.db.query("users").collect();

    // Filter to staff members (role >= 1 or isCreator)
    const staffMembers = allUsers.filter(
      (u) => u.isCreator || (u.role ?? 0) >= ROLE_STAFF
    );

    return staffMembers.map((u) => ({
      _id: u._id,
      displayName: u.displayName,
      username: u.username ?? null,
      avatarUrl: u.avatarUrl ?? null,
      tier: u.tier,
      role: u.role ?? ROLE_NORMAL,
      isCreator: u.isCreator ?? false,
    }));
  },
});

/**
 * Set a user's staff role (creator only)
 * role: 0 = normal, 1 = staff, 2 = creator-only (reserved)
 */
export const setRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.number(),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Don't allow changing creator's role
    if (user.isCreator) {
      throw new Error("Cannot modify the creator's role");
    }

    // Validate role value (0, 1, or 2)
    if (args.role < 0 || args.role > 2) {
      throw new Error("Invalid role value");
    }

    await ctx.db.patch(args.userId, {
      role: args.role,
    });

    return { success: true };
  },
});

/**
 * Add a user as staff (shorthand for setRole with ROLE_STAFF)
 */
export const addStaff = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.isCreator) {
      throw new Error("Creator is already staff");
    }

    await ctx.db.patch(args.userId, {
      role: ROLE_STAFF,
    });

    return { success: true };
  },
});

/**
 * Remove a user from staff (set role to normal)
 */
export const removeStaff = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.isCreator) {
      throw new Error("Cannot remove creator from staff");
    }

    await ctx.db.patch(args.userId, {
      role: ROLE_NORMAL,
    });

    return { success: true };
  },
});
