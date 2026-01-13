import { Redis } from "@upstash/redis";
import type { DiscordRole, SupporterStatus } from "../types/supporter";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const isRedisConfigured = !!(redisUrl && redisToken);

if (!isRedisConfigured) {
  console.warn("[redis] Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN - Redis disabled");
}

// Only create Redis client if configured, otherwise use a dummy that returns null
export const redis = isRedisConfigured
  ? new Redis({ url: redisUrl, token: redisToken })
  : (null as unknown as Redis);

const SUPPORTER_KEY_PREFIX = "user:status:";
const DISCORD_TO_CLERK_PREFIX = "discord:clerk:";
const SUPPORTER_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export function getSupporterKey(clerkUserId: string): string {
  return `${SUPPORTER_KEY_PREFIX}${clerkUserId}`;
}

export async function getSupporterStatus(clerkUserId: string): Promise<SupporterStatus | null> {
  if (!redis) {
    console.warn("[redis] Redis not configured, returning null for supporter status");
    return null;
  }

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

  return {
    twitchSubTier: twitchSubTierRaw ? (Number.parseInt(twitchSubTierRaw, 10) as 1 | 2 | 3) : null,
    discordBooster,
    discordHighestRole,
    twitchUserId: getString(data.twitchUserId) || undefined,
    discordUserId: getString(data.discordUserId) || undefined,
    clerkPlan: (getString(data.clerkPlan) as "super_legend" | "super_legend_2") || null,
    clerkPlanStatus:
      (getString(data.clerkPlanStatus) as "active" | "past_due" | "canceled") || null,
    lastSyncedAt: getString(data.lastSyncedAt) || new Date().toISOString(),
  };
}

export async function setSupporterStatus(
  clerkUserId: string,
  status: SupporterStatus,
): Promise<void> {
  if (!redis) {
    console.warn("[redis] Redis not configured, skipping setSupporterStatus");
    return;
  }

  const key = getSupporterKey(clerkUserId);

  const hashData: Record<string, string> = {
    twitchSubTier: status.twitchSubTier?.toString() ?? "",
    discordBooster: status.discordBooster.toString(),
    discordHighestRole: status.discordHighestRole ? JSON.stringify(status.discordHighestRole) : "",
    twitchUserId: status.twitchUserId ?? "",
    discordUserId: status.discordUserId ?? "",
    clerkPlan: status.clerkPlan ?? "",
    clerkPlanStatus: status.clerkPlanStatus ?? "",
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
  if (!redis) return;

  const key = getSupporterKey(clerkUserId);
  const stringValue = value === null || value === undefined ? "" : value.toString();

  await redis.hset(key, { [field]: stringValue });
  await redis.expire(key, SUPPORTER_TTL_SECONDS);
}

export async function deleteSupporterStatus(clerkUserId: string): Promise<void> {
  if (!redis) return;

  const key = getSupporterKey(clerkUserId);
  await redis.del(key);
}

/**
 * Get Clerk user ID from Discord user ID using reverse index
 */
export async function getClerkIdByDiscordId(discordUserId: string): Promise<string | null> {
  if (!redis) return null;

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
  if (!redis) return;

  const key = `${DISCORD_TO_CLERK_PREFIX}${discordUserId}`;
  await redis.set(key, clerkUserId, { ex: SUPPORTER_TTL_SECONDS });
}
