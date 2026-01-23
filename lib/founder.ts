/**
 * Founder System - Core Business Logic
 *
 * Handles the "Founder" badge for the first 10 subscribers.
 * - Uses Redis for atomic slot claiming (source of truth for count)
 * - Syncs to Convex for display purposes
 * - Founder status is PERMANENT (even if subscription is canceled)
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { logger, trackMetric } from "./observability";
import {
  claimFounderSlot,
  getFounderCount,
  getFounderSpotsRemaining,
  getSupporterKey,
  getUserFounderNumber,
  MAX_FOUNDERS,
  redis,
} from "./redis";

// Re-export Redis functions for convenience
export {
  claimFounderSlot,
  getFounderCount,
  getFounderSpotsRemaining,
  getUserFounderNumber,
  MAX_FOUNDERS,
};

// Convex client for syncing founder status
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null;

export type FounderNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface FounderClaimResult {
  success: boolean;
  founderNumber: FounderNumber | null;
  alreadyFounder: boolean;
  slotsRemaining: number;
  error?: string;
}

/**
 * Attempt to grant founder status to a user.
 * This is the main entry point called from the Clerk webhook.
 *
 * @param clerkUserId - The Clerk user ID
 * @returns Result object with claim status and founder number
 */
export async function grantFounderStatus(clerkUserId: string): Promise<FounderClaimResult> {
  const startTime = Date.now();

  try {
    // Check if already a founder (idempotent check)
    const existingSlot = await getUserFounderNumber(clerkUserId);
    if (existingSlot) {
      logger.info("User is already a founder", { clerkUserId, founderNumber: existingSlot });
      trackMetric("founder.claim.already_founder", 1);

      return {
        success: true,
        founderNumber: existingSlot,
        alreadyFounder: true,
        slotsRemaining: await getFounderSpotsRemaining(),
      };
    }

    // Attempt to claim a slot
    const founderNumber = await claimFounderSlot(clerkUserId);
    const slotsRemaining = await getFounderSpotsRemaining();

    if (!founderNumber) {
      logger.info("Founder slots full, user not granted founder status", {
        clerkUserId,
        slotsRemaining: 0,
      });
      trackMetric("founder.claim.slots_full", 1);

      return {
        success: false,
        founderNumber: null,
        alreadyFounder: false,
        slotsRemaining: 0,
      };
    }

    // Update the supporter status hash with founder number
    const supporterKey = getSupporterKey(clerkUserId);
    await redis.hset(supporterKey, {
      founderNumber: founderNumber.toString(),
    });

    // Sync to Convex for display
    await syncFounderToConvex(clerkUserId, founderNumber);

    logger.info("Founder status granted", {
      clerkUserId,
      founderNumber,
      slotsRemaining,
      duration: Date.now() - startTime,
    });
    trackMetric("founder.claim.success", 1, { slot: String(founderNumber) });

    return {
      success: true,
      founderNumber,
      alreadyFounder: false,
      slotsRemaining,
    };
  } catch (error) {
    logger.error("Error granting founder status", { clerkUserId, error });
    trackMetric("founder.claim.error", 1);

    return {
      success: false,
      founderNumber: null,
      alreadyFounder: false,
      slotsRemaining: await getFounderSpotsRemaining().catch(() => -1),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Sync founder status to Convex database for display purposes.
 * This is called after successfully claiming a founder slot.
 */
export async function syncFounderToConvex(
  clerkUserId: string,
  founderNumber: FounderNumber,
): Promise<void> {
  if (!convex) {
    logger.warn("Convex client not initialized, skipping founder sync", { clerkUserId });
    return;
  }

  try {
    await convex.mutation(api.users.updateFounderStatus, {
      clerkId: clerkUserId,
      founderNumber,
    });

    logger.info("Synced founder status to Convex", { clerkUserId, founderNumber });
    trackMetric("founder.convex_sync.success", 1);
  } catch (error) {
    // Log but don't fail - Redis is the source of truth
    logger.error("Failed to sync founder status to Convex", {
      clerkUserId,
      founderNumber,
      error,
    });
    trackMetric("founder.convex_sync.error", 1);
  }
}

/**
 * Get founder info for display purposes.
 * Combines data from Redis for a complete picture.
 */
export async function getFounderInfo(clerkUserId: string): Promise<{
  isFounder: boolean;
  founderNumber: FounderNumber | null;
  totalFounders: number;
  slotsRemaining: number;
}> {
  const [founderNumber, totalFounders] = await Promise.all([
    getUserFounderNumber(clerkUserId),
    getFounderCount(),
  ]);

  return {
    isFounder: founderNumber !== null,
    founderNumber,
    totalFounders,
    slotsRemaining: Math.max(0, MAX_FOUNDERS - totalFounders),
  };
}

/**
 * Check if founder slots are still available.
 * Useful for UI to decide whether to show the founder banner.
 */
export async function hasFounderSlotsAvailable(): Promise<boolean> {
  const remaining = await getFounderSpotsRemaining();
  return remaining > 0;
}
