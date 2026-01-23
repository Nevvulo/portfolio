import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SupporterStatus } from "../types/supporter";

/**
 * Check if a supporter status has any displayable badges
 */
function hasAnyBadge(status: SupporterStatus | null): boolean {
  if (!status) return false;

  // Founder badge (first 10 supporters)
  if (status.founderNumber) return true;

  // Twitch subscription badge
  if (status.twitchSubTier) return true;

  // Discord server booster
  if (status.discordBooster) return true;

  // Discord role badge
  if (status.discordHighestRole) return true;

  // Active Clerk subscription (Super Legend I or II)
  if (status.clerkPlan && status.clerkPlanStatus === "active") return true;

  return false;
}

interface SupporterStatusResponse {
  status: SupporterStatus | null;
  needsSync: boolean;
}

interface SyncResponse {
  status: SupporterStatus;
}

async function fetchSupporterStatus(): Promise<SupporterStatusResponse> {
  console.log("[useSupporterStatus] Fetching status...");

  const res = await fetch("/api/supporter/status");
  console.log("[useSupporterStatus] Response status:", res.status);

  const data = await res.json();
  console.log("[useSupporterStatus] Response data:", data);

  if (!res.ok) {
    console.error("[useSupporterStatus] API error:", data.error);
    throw new Error(data.error || "Failed to fetch supporter status");
  }

  return data;
}

async function syncSupporterStatus(): Promise<SyncResponse> {
  console.log("[useSupporterStatus] Syncing status...");

  const res = await fetch("/api/supporter/sync", { method: "POST" });
  console.log("[useSupporterStatus] Sync response status:", res.status);

  const data = await res.json();
  console.log("[useSupporterStatus] Sync response data:", data);

  if (!res.ok) {
    console.error("[useSupporterStatus] Sync error:", data.error);
    throw new Error(data.error || "Failed to sync supporter status");
  }

  return data;
}

export function useSupporterStatus() {
  const { isSignedIn, isLoaded } = useUser();
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error: fetchError,
  } = useQuery({
    queryKey: ["supporterStatus"],
    queryFn: fetchSupporterStatus,
    enabled: isLoaded && isSignedIn,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  const syncMutation = useMutation({
    mutationFn: syncSupporterStatus,
    onSuccess: (data) => {
      console.log("[useSupporterStatus] Sync succeeded, updating cache");
      queryClient.setQueryData(["supporterStatus"], {
        status: data.status,
        needsSync: false,
      });
    },
    onError: (error) => {
      console.error("[useSupporterStatus] Sync mutation error:", error);
    },
  });

  const status = data?.status ?? null;
  const needsSync = data?.needsSync ?? false;

  const hasBadges = hasAnyBadge(status);

  const syncStatus = async () => {
    await syncMutation.mutateAsync();
  };

  return {
    status,
    isLoading: !isLoaded || (isSignedIn && isLoading),
    isSyncing: syncMutation.isPending,
    syncError: syncMutation.error?.message ?? null,
    fetchError: fetchError?.message ?? null,
    needsSync,
    syncStatus,
    hasBadges,
  };
}
