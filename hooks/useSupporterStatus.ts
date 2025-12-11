import { useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import type { SupporterStatus } from "../types/supporter";

interface UseSupporterStatusReturn {
	status: SupporterStatus | null;
	isLoading: boolean;
	isSyncing: boolean;
	syncError: string | null;
	needsSync: boolean;
	syncStatus: () => Promise<void>;
	hasBadges: boolean;
}

export function useSupporterStatus(): UseSupporterStatusReturn {
	const { isSignedIn, isLoaded } = useUser();
	const [status, setStatus] = useState<SupporterStatus | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSyncing, setIsSyncing] = useState(false);
	const [syncError, setSyncError] = useState<string | null>(null);
	const [needsSync, setNeedsSync] = useState(false);

	const fetchStatus = useCallback(async () => {
		if (!isSignedIn) {
			setStatus(null);
			setIsLoading(false);
			return;
		}

		try {
			const res = await fetch("/api/supporter/status");
			if (!res.ok) {
				throw new Error("Failed to fetch supporter status");
			}
			const data = await res.json();
			setStatus(data.status);
			setNeedsSync(data.needsSync);
		} catch (error) {
			console.error("Error fetching supporter status:", error);
			setStatus(null);
		} finally {
			setIsLoading(false);
		}
	}, [isSignedIn]);

	const syncStatus = useCallback(async () => {
		if (!isSignedIn) return;

		setIsSyncing(true);
		setSyncError(null);

		try {
			const res = await fetch("/api/supporter/sync", { method: "POST" });
			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || "Failed to sync supporter status");
			}

			setStatus(data.status);
			setNeedsSync(false);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Sync failed";
			setSyncError(message);
			console.error("Error syncing supporter status:", error);
		} finally {
			setIsSyncing(false);
		}
	}, [isSignedIn]);

	useEffect(() => {
		if (isLoaded) {
			fetchStatus();
		}
	}, [isLoaded, fetchStatus]);

	// Auto-sync if data is stale
	useEffect(() => {
		if (needsSync && isSignedIn && !isSyncing && !syncError) {
			syncStatus();
		}
	}, [needsSync, isSignedIn, isSyncing, syncError, syncStatus]);

	const hasBadges =
		status !== null &&
		(status.twitchSubTier !== null ||
			status.discordBooster ||
			(status.clerkPlan !== null && status.clerkPlanStatus === "active"));

	return {
		status,
		isLoading: !isLoaded || isLoading,
		isSyncing,
		syncError,
		needsSync,
		syncStatus,
		hasBadges,
	};
}
