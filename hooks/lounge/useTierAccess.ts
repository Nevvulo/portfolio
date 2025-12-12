import { useUser } from "@clerk/nextjs";
import { useSupporterStatus } from "../useSupporterStatus";
import type { Tier } from "../../types/lounge";

/**
 * Hook to check user's tier access for the lounge
 * Combines Clerk auth with supporter status to determine tier
 */
export function useTierAccess() {
  const { user, isLoaded: isClerkLoaded, isSignedIn } = useUser();
  const { status, isLoading: isStatusLoading, hasBadges } = useSupporterStatus();

  // Determine user's tier based on their subscription
  const getUserTier = (): Tier => {
    if (!status) return "free";

    // Check Clerk subscription first (highest priority)
    if (status.clerkPlan === "super_legend_2" && status.clerkPlanStatus === "active") {
      return "tier2";
    }
    if (status.clerkPlan === "super_legend" && status.clerkPlanStatus === "active") {
      return "tier1";
    }

    // Check Discord roles that grant tier access
    // Super Legend / Super Legend II Discord roles
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
      // Twitch tier 3 = tier2, tier 1-2 = tier1
      return status.twitchSubTier >= 3 ? "tier2" : "tier1";
    }

    // Discord booster gets tier1
    if (status.discordBooster) {
      return "tier1";
    }

    // Default to free tier
    return "free";
  };

  const tier = getUserTier();

  /**
   * Check if user has access to a specific tier
   * Tier hierarchy: free < tier1 < tier2
   */
  const hasAccessToTier = (requiredTier: Tier): boolean => {
    const tierLevels = { free: 0, tier1: 1, tier2: 2 };
    return tierLevels[tier] >= tierLevels[requiredTier];
  };

  /**
   * Check if user is a paid supporter (tier1 or tier2)
   */
  const isSupporter = tier === "tier1" || tier === "tier2";

  /**
   * Check if user should show badges
   * Free users only show badges if they're a Discord booster or have a special role
   */
  const shouldShowBadges = (): boolean => {
    if (isSupporter) return true;
    // Free users show badges only if they're boosters or have a Discord role
    return !!(status?.discordBooster || status?.discordHighestRole);
  };

  /**
   * Get display color for user's name
   * Free users get grey unless they have a Discord role with color
   */
  const getNameColor = (): string | null => {
    if (isSupporter) return null; // Use tier color from component
    // Free users with Discord role use their role color, otherwise grey
    if (status?.discordHighestRole && status.discordHighestRole.color !== 0) {
      return `#${status.discordHighestRole.color.toString(16).padStart(6, "0")}`;
    }
    return null; // Will be styled as grey in components
  };

  /**
   * Check if user is the creator (admin)
   */
  const isCreator = (): boolean => {
    if (!user) return false;
    // Check Discord connection for creator ID
    const discordAccount = user.externalAccounts?.find(
      (account) => account.provider === "discord"
    );
    // Clerk stores Discord ID in providerUserId (preferred) or externalId
    return (discordAccount as any)?.providerUserId === "246574843460321291" ||
           (discordAccount as any)?.externalId === "246574843460321291";
  };

  return {
    // Auth state
    isLoading: !isClerkLoaded || isStatusLoading,
    isSignedIn: isSignedIn ?? false,
    isSupporter,
    isFreeUser: tier === "free",

    // Tier info
    tier,
    hasTier1Access: hasAccessToTier("tier1"),
    hasTier2Access: hasAccessToTier("tier2"),
    hasFreeAccess: true, // Everyone has free access
    hasAccessToTier,

    // Display helpers
    shouldShowBadges: shouldShowBadges(),
    nameColor: getNameColor(),

    // Admin
    isCreator: isCreator(),

    // User info
    user,
    displayName: user?.firstName || user?.username || "Anonymous",
    avatarUrl: user?.imageUrl,

    // Supporter status details
    supporterStatus: status,
    hasBadges,
  };
}

export type TierAccessState = ReturnType<typeof useTierAccess>;
