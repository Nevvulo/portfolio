import type { MutationCtx, QueryCtx } from "./_generated/server";

// Creator Discord ID for admin checks
export const CREATOR_DISCORD_ID = "246574843460321291";

/**
 * Get the current user from Clerk identity
 * Returns null if not authenticated
 */
export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  // Get user from our users table by Clerk ID
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
    .unique();

  return user;
}

/**
 * Get the current user or throw an error if not authenticated
 */
export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const user = await getCurrentUser(ctx);
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user;
}

/**
 * Check if user has access to a specific tier
 * Tier hierarchy: free < tier1 < tier2
 */
export function hasAccessToTier(
  userTier: "free" | "tier1" | "tier2",
  requiredTier: "free" | "tier1" | "tier2",
): boolean {
  const tierLevels = { free: 0, tier1: 1, tier2: 2 };
  return tierLevels[userTier] >= tierLevels[requiredTier];
}

/**
 * Access rules type - matches schema accessRules
 */
export type AccessRules = {
  matchMode?: "any" | "all"; // Default: "any" (OR logic)
  twitchSubs?: boolean; // Any Twitch subscriber
  twitchSubTier?: 1 | 2 | 3; // Minimum Twitch tier
  superLegend?: boolean; // Super Legend I or II
  superLegendTier?: 1 | 2; // 1 = SL I, 2 = SL II
  discordBoosters?: boolean; // Discord server boosters
};

/**
 * User supporter status - fields used for access rule checking
 */
type UserSupporterStatus = {
  tier: "free" | "tier1" | "tier2";
  twitchSubTier?: 1 | 2 | 3 | null;
  discordBooster?: boolean | null;
  clerkPlan?: string | null;
  clerkPlanStatus?: string | null;
  isCreator?: boolean;
  discordId?: string | null;
};

/**
 * Check if user matches access rules
 * Rules can be combined with matchMode: "any" (OR) or "all" (AND)
 * Returns true if no rules are specified (fallback to requiredTier)
 */
export function checkAccessRules(user: UserSupporterStatus, rules?: AccessRules | null): boolean {
  // Creator always has access
  if (user.isCreator || user.discordId === CREATOR_DISCORD_ID) {
    return true;
  }

  // No rules = no additional restrictions (use requiredTier fallback)
  if (!rules) {
    return true;
  }

  const matchMode = rules.matchMode ?? "any";
  const checks: boolean[] = [];

  // Check Twitch subscription
  if (rules.twitchSubs) {
    checks.push(user.twitchSubTier != null && user.twitchSubTier >= 1);
  }

  // Check minimum Twitch tier
  if (rules.twitchSubTier) {
    checks.push(user.twitchSubTier != null && user.twitchSubTier >= rules.twitchSubTier);
  }

  // Check Super Legend subscription
  if (rules.superLegend) {
    const isActiveSL =
      user.clerkPlanStatus === "active" &&
      (user.clerkPlan === "super_legend" || user.clerkPlan === "super_legend_2");
    checks.push(isActiveSL);
  }

  // Check minimum Super Legend tier
  if (rules.superLegendTier) {
    const slTier =
      user.clerkPlan === "super_legend_2" ? 2 : user.clerkPlan === "super_legend" ? 1 : 0;
    const isActiveSL =
      user.clerkPlanStatus === "active" &&
      (user.clerkPlan === "super_legend" || user.clerkPlan === "super_legend_2");
    checks.push(isActiveSL && slTier >= rules.superLegendTier);
  }

  // Check Discord booster
  if (rules.discordBoosters) {
    checks.push(user.discordBooster === true);
  }

  // If no checks were added (rules object was empty or had no matching fields)
  if (checks.length === 0) {
    return true;
  }

  // Apply match mode
  if (matchMode === "all") {
    return checks.every(Boolean);
  } else {
    // "any" - default OR logic
    return checks.some(Boolean);
  }
}

/**
 * Check if user is the creator (admin)
 */
export function isCreator(user: { isCreator: boolean; discordId?: string | null }): boolean {
  return user.isCreator || user.discordId === CREATOR_DISCORD_ID;
}

/**
 * Role levels:
 * 0 = normal member (default)
 * 1 = staff
 * 2 = creator only (reserved for future use)
 */
export const ROLE_NORMAL = 0;
export const ROLE_STAFF = 1;
export const ROLE_CREATOR_ONLY = 2;

/**
 * Check if user is staff or higher
 * Staff can moderate content, delete comments, etc.
 */
export function isStaff(user: {
  role?: number | null;
  isCreator?: boolean;
  discordId?: string | null;
}): boolean {
  // Creator is always considered staff
  if (user.isCreator || user.discordId === CREATOR_DISCORD_ID) {
    return true;
  }
  // Check role level
  return (user.role ?? 0) >= ROLE_STAFF;
}

/**
 * Check if user can moderate (staff or creator)
 */
export function canModerate(user: {
  role?: number | null;
  isCreator?: boolean;
  discordId?: string | null;
}): boolean {
  return isStaff(user);
}

/**
 * Require the user to be the creator, throw if not
 */
export async function requireCreator(ctx: QueryCtx | MutationCtx) {
  const user = await requireUser(ctx);
  if (!isCreator(user)) {
    throw new Error("Only the creator can perform this action");
  }
  return user;
}

/**
 * Require user to not be banned
 * Use this for all user-generated content mutations
 */
export async function requireNotBanned(ctx: QueryCtx | MutationCtx) {
  const user = await requireUser(ctx);
  if (user.isBanned) {
    throw new Error(
      user.banReason
        ? `Your account has been suspended: ${user.banReason}`
        : "Your account has been suspended from posting content.",
    );
  }
  return user;
}

/**
 * Require user to have access to a channel
 * Checks both tier-based access and advanced access rules
 */
export async function requireChannelAccess(ctx: QueryCtx | MutationCtx, channelId: string) {
  const user = await requireUser(ctx);
  const channel = (await ctx.db.get(channelId as any)) as {
    _id: any;
    requiredTier: "free" | "tier1" | "tier2";
    accessRules?: AccessRules | null;
    [key: string]: any;
  } | null;

  if (!channel) {
    throw new Error("Channel not found");
  }

  // If channel has access rules, use those instead of tier
  if (channel.accessRules) {
    if (!checkAccessRules(user, channel.accessRules)) {
      throw new Error("You don't have access to this channel.");
    }
  } else {
    // Fall back to tier-based access
    if (!hasAccessToTier(user.tier, channel.requiredTier)) {
      throw new Error("You don't have access to this channel. Upgrade to Tier 2!");
    }
  }

  return { user, channel };
}

/**
 * Check if a user has access to a channel (non-throwing version)
 * Useful for filtering channels in queries
 */
export function userHasChannelAccess(
  user: UserSupporterStatus,
  channel: { requiredTier: "free" | "tier1" | "tier2"; accessRules?: AccessRules | null },
): boolean {
  // If channel has access rules, use those
  if (channel.accessRules) {
    return checkAccessRules(user, channel.accessRules);
  }
  // Fall back to tier-based access
  return hasAccessToTier(user.tier, channel.requiredTier);
}
