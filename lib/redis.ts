import { Redis } from "@upstash/redis";
import type { DiscordRole, SupporterStatus } from "../types/supporter";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!redisUrl || !redisToken) {
  console.warn("[redis] Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN");
}

export const redis = new Redis({
  url: redisUrl || "",
  token: redisToken || "",
});

const SUPPORTER_KEY_PREFIX = "user:status:";
const DISCORD_TO_CLERK_PREFIX = "discord:clerk:";
const SUPPORTER_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

// Founder tracking keys (permanent, no TTL)
const FOUNDER_COUNT_KEY = "founders:count";
const FOUNDER_SLOT_PREFIX = "founders:slot:"; // founders:slot:1 -> clerkId
const FOUNDER_USER_PREFIX = "founders:user:"; // founders:user:{clerkId} -> slotNumber
export const MAX_FOUNDERS = 10;

export function getSupporterKey(clerkUserId: string): string {
  return `${SUPPORTER_KEY_PREFIX}${clerkUserId}`;
}

export async function getSupporterStatus(clerkUserId: string): Promise<SupporterStatus | null> {
  const key = getSupporterKey(clerkUserId);
  const data = await redis.hgetall(key);

  console.log("[redis] Raw data from hgetall:", JSON.stringify(data));

  if (!data || Object.keys(data).length === 0) {
    return null;
  }

  // Upstash returns values as-is (not always strings), handle both cases
  const getString = (val: unknown): string => {
    if (val === null || val === undefined) return "";
    if (typeof val === "string") return val;
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  };

  const rawDiscordBooster = data.discordBooster;
  const rawDiscordHighestRole = data.discordHighestRole;

  console.log("[redis] discordBooster raw:", rawDiscordBooster, typeof rawDiscordBooster);
  console.log(
    "[redis] discordHighestRole raw:",
    rawDiscordHighestRole,
    typeof rawDiscordHighestRole,
  );

  // Parse discordHighestRole
  let discordHighestRole: DiscordRole | null = null;
  if (rawDiscordHighestRole) {
    if (typeof rawDiscordHighestRole === "object") {
      discordHighestRole = rawDiscordHighestRole as DiscordRole;
    } else if (typeof rawDiscordHighestRole === "string" && rawDiscordHighestRole) {
      try {
        discordHighestRole = JSON.parse(rawDiscordHighestRole);
      } catch {
        discordHighestRole = null;
      }
    }
  }

  // Parse discordBooster - handle boolean or string
  const discordBooster = rawDiscordBooster === true || rawDiscordBooster === "true";

  const twitchSubTierRaw = getString(data.twitchSubTier);
  const founderNumberRaw = getString(data.founderNumber);
  const founderNumber = founderNumberRaw
    ? (Number.parseInt(founderNumberRaw, 10) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10)
    : null;

  return {
    twitchSubTier: twitchSubTierRaw ? (Number.parseInt(twitchSubTierRaw, 10) as 1 | 2 | 3) : null,
    discordBooster,
    discordHighestRole,
    twitchUserId: getString(data.twitchUserId) || undefined,
    discordUserId: getString(data.discordUserId) || undefined,
    clerkPlan: (getString(data.clerkPlan) as "super_legend" | "super_legend_2") || null,
    clerkPlanStatus:
      (getString(data.clerkPlanStatus) as "active" | "past_due" | "canceled") || null,
    founderNumber,
    lastSyncedAt: getString(data.lastSyncedAt) || new Date().toISOString(),
  };
}

export async function setSupporterStatus(
  clerkUserId: string,
  status: SupporterStatus,
): Promise<void> {
  const key = getSupporterKey(clerkUserId);

  const hashData: Record<string, string> = {
    twitchSubTier: status.twitchSubTier?.toString() ?? "",
    discordBooster: status.discordBooster.toString(),
    discordHighestRole: status.discordHighestRole ? JSON.stringify(status.discordHighestRole) : "",
    twitchUserId: status.twitchUserId ?? "",
    discordUserId: status.discordUserId ?? "",
    clerkPlan: status.clerkPlan ?? "",
    clerkPlanStatus: status.clerkPlanStatus ?? "",
    founderNumber: status.founderNumber?.toString() ?? "",
    lastSyncedAt: status.lastSyncedAt,
  };

  await redis.hset(key, hashData);
  await redis.expire(key, SUPPORTER_TTL_SECONDS);

  // Also set the reverse index: Discord ID → Clerk ID
  if (status.discordUserId) {
    await setDiscordToClerkMapping(status.discordUserId, clerkUserId);
  }
}

export async function updateSupporterField(
  clerkUserId: string,
  field: keyof SupporterStatus,
  value: string | number | boolean | null,
): Promise<void> {
  const key = getSupporterKey(clerkUserId);
  const stringValue = value === null || value === undefined ? "" : value.toString();

  await redis.hset(key, { [field]: stringValue });
  await redis.expire(key, SUPPORTER_TTL_SECONDS);
}

export async function deleteSupporterStatus(clerkUserId: string): Promise<void> {
  const key = getSupporterKey(clerkUserId);
  await redis.del(key);
}

/**
 * Get Clerk user ID from Discord user ID using reverse index
 */
export async function getClerkIdByDiscordId(discordUserId: string): Promise<string | null> {
  const key = `${DISCORD_TO_CLERK_PREFIX}${discordUserId}`;
  const clerkId = await redis.get<string>(key);
  return clerkId || null;
}

/**
 * Set reverse index: Discord ID → Clerk ID
 */
export async function setDiscordToClerkMapping(
  discordUserId: string,
  clerkUserId: string,
): Promise<void> {
  const key = `${DISCORD_TO_CLERK_PREFIX}${discordUserId}`;
  await redis.set(key, clerkUserId, { ex: SUPPORTER_TTL_SECONDS });
}

// ============================================
// FOUNDER TRACKING (First 10 subscribers)
// ============================================

/**
 * Get the number of remaining founder spots (0-10)
 */
export async function getFounderSpotsRemaining(): Promise<number> {
  const count = (await redis.get<number>(FOUNDER_COUNT_KEY)) || 0;
  return Math.max(0, MAX_FOUNDERS - count);
}

/**
 * Get current founder count
 */
export async function getFounderCount(): Promise<number> {
  return (await redis.get<number>(FOUNDER_COUNT_KEY)) || 0;
}

/**
 * Check if a user is a founder and get their slot number
 * @returns Founder slot number (1-10) or null if not a founder
 */
export async function getUserFounderNumber(
  clerkUserId: string,
): Promise<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | null> {
  const slot = await redis.get<number>(`${FOUNDER_USER_PREFIX}${clerkUserId}`);
  if (slot && slot >= 1 && slot <= 10) {
    return slot as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  }
  return null;
}

/**
 * Get the Clerk user ID for a founder slot
 */
export async function getFounderBySlot(slot: number): Promise<string | null> {
  if (slot < 1 || slot > MAX_FOUNDERS) return null;
  return (await redis.get<string>(`${FOUNDER_SLOT_PREFIX}${slot}`)) || null;
}

/**
 * Atomically claim a founder slot for a user.
 * Uses Redis INCR for atomic counting to prevent race conditions.
 *
 * @param clerkUserId - The Clerk user ID to claim the slot for
 * @returns The founder slot number (1-10) if claimed, or null if all slots are taken
 */
export async function claimFounderSlot(
  clerkUserId: string,
): Promise<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | null> {
  // Check if user is already a founder (idempotent)
  const existingSlot = await getUserFounderNumber(clerkUserId);
  if (existingSlot) {
    return existingSlot;
  }

  // Atomically increment the counter
  const newCount = await redis.incr(FOUNDER_COUNT_KEY);

  // Check if we exceeded the limit
  if (newCount > MAX_FOUNDERS) {
    // Rollback the increment - we went over the limit
    await redis.decr(FOUNDER_COUNT_KEY);
    return null;
  }

  // Successfully claimed slot - persist the mapping (no TTL, permanent)
  const slotNumber = newCount as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

  // Use a pipeline for atomic writes
  await redis.set(`${FOUNDER_SLOT_PREFIX}${slotNumber}`, clerkUserId);
  await redis.set(`${FOUNDER_USER_PREFIX}${clerkUserId}`, slotNumber);

  return slotNumber;
}

/**
 * Get all founders with their slot numbers
 * @returns Array of { slot, clerkUserId } ordered by slot number
 */
export async function getAllFounders(): Promise<Array<{ slot: number; clerkUserId: string }>> {
  const founders: Array<{ slot: number; clerkUserId: string }> = [];

  for (let slot = 1; slot <= MAX_FOUNDERS; slot++) {
    const clerkUserId = await getFounderBySlot(slot);
    if (clerkUserId) {
      founders.push({ slot, clerkUserId });
    }
  }

  return founders;
}
