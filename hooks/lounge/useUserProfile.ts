import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { useState, useCallback } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { UserProfile, ConnectedAccount } from "../../types/user-popout";

/**
 * Hook to fetch and manage a user's profile for the popout
 */
export function useUserProfile(userId: Id<"users"> | null) {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();

  // Fetch profile from Convex
  const profile = useQuery(
    api.userProfiles.getUserProfile,
    userId ? { userId } : "skip"
  );

  // Mutations
  const clearBioMutation = useMutation(api.userProfiles.clearBio);

  // Local state for optimistic updates
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Check if this is the current user's profile
  const isOwnProfile = profile?.isOwnProfile ?? false;

  // Get connected accounts from Clerk (for own profile) or Convex (for others)
  const getConnectedAccounts = useCallback((): ConnectedAccount[] => {
    if (!isOwnProfile) {
      // For other users, use usernames stored in Convex
      const accounts: ConnectedAccount[] = [];

      if (profile?.discordId) {
        accounts.push({
          provider: "discord",
          username: profile.discordUsername || "",
          profileUrl: `https://discord.com/users/${profile.discordId}`,
        });
      }

      if (profile?.twitchUsername) {
        accounts.push({
          provider: "twitch",
          username: profile.twitchUsername,
          profileUrl: `https://twitch.tv/${profile.twitchUsername}`,
        });
      }

      return accounts;
    }

    // For own profile, use Clerk data
    if (!clerkUser) return [];

    const accounts: ConnectedAccount[] = [];

    // Get Discord account
    const discordAccount = clerkUser.externalAccounts?.find(
      (acc) => acc.provider === "discord"
    );
    if (discordAccount) {
      const discordId = (discordAccount as any).providerUserId || (discordAccount as any).externalId;
      accounts.push({
        provider: "discord",
        username: discordAccount.username || "",
        profileUrl: `https://discord.com/users/${discordId}`,
      });
    }

    // Get Twitch account
    const twitchAccount = clerkUser.externalAccounts?.find(
      (acc) => acc.provider === "twitch"
    );
    if (twitchAccount) {
      accounts.push({
        provider: "twitch",
        username: twitchAccount.username || "",
        profileUrl: `https://twitch.tv/${twitchAccount.username}`,
      });
    }

    // Note: Google is intentionally NOT included per requirements

    return accounts;
  }, [clerkUser, isOwnProfile, profile?.discordId, profile?.discordUsername, profile?.twitchUsername]);

  // Update bio
  const updateBio = useCallback(
    async (bio: string) => {
      if (!isOwnProfile) return;

      setIsUpdating(true);
      setUpdateError(null);

      try {
        // Call API route for word filter validation
        const res = await fetch("/api/user/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bio }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to update bio");
        }
      } catch (error) {
        setUpdateError(error instanceof Error ? error.message : "Failed to update bio");
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [isOwnProfile]
  );

  // Clear bio
  const clearBio = useCallback(async () => {
    if (!isOwnProfile) return;

    setIsUpdating(true);
    setUpdateError(null);

    try {
      await clearBioMutation();
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : "Failed to clear bio");
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [isOwnProfile, clearBioMutation]);

  // Toggle privacy setting
  const togglePrivacy = useCallback(async () => {
    if (!isOwnProfile || !clerkUser) return;

    setIsUpdating(true);
    setUpdateError(null);

    try {
      const currentSetting = (clerkUser.publicMetadata as any)?.showConnections ?? true;
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showConnections: !currentSetting }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update privacy");
      }

      // Refresh Clerk user to get updated metadata
      await clerkUser.reload();
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : "Failed to update privacy");
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [isOwnProfile, clerkUser]);

  // Get showConnections from Clerk metadata
  const showConnections = isOwnProfile
    ? (clerkUser?.publicMetadata as any)?.showConnections ?? true
    : true; // Default to showing for others (they control their own)

  // Build the full profile object - supporter data now comes from profile itself
  const fullProfile: UserProfile | null = profile
    ? {
        ...profile,
        showConnections,
        discordUsername: getConnectedAccounts().find((a) => a.provider === "discord")?.username,
        twitchUsername: getConnectedAccounts().find((a) => a.provider === "twitch")?.username,
      }
    : null;

  return {
    profile: fullProfile,
    isLoading: profile === undefined || !isClerkLoaded,
    isOwnProfile,
    isUpdating,
    updateError,

    // Actions
    updateBio,
    clearBio,
    togglePrivacy,

    // Connected accounts
    connectedAccounts: getConnectedAccounts(),
    showConnections,
  };
}
