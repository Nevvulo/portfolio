import { Redis } from "@upstash/redis";

// Initialize Upstash Redis client from environment variables
// Uses REST API - perfect for serverless/edge functions
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Key prefixes for organization
const KEYS = {
  WATCH_TIME: "watchtime", // watchtime:{clerkId}:{postId}
} as const;

// TTL values (in seconds)
const TTL = {
  WATCH_TIME: 86400, // 24 hours - buffer before flushing to Convex
} as const;

// ============================================
// ARTICLE WATCH TIME TRACKING
// ============================================

/**
 * Track watch time for an article in Redis
 * This buffers the heartbeat data - much cheaper than Convex mutations
 * @returns New total seconds for this session
 */
export async function trackWatchTime(
  clerkId: string,
  postId: string,
  secondsIncrement: number,
): Promise<number> {
  const key = `${KEYS.WATCH_TIME}:${clerkId}:${postId}`;

  // Use INCRBY for atomic increment
  const newTotal = await redis.incrby(key, secondsIncrement);

  // Reset TTL on each heartbeat
  await redis.expire(key, TTL.WATCH_TIME);

  return newTotal;
}

/**
 * Get buffered watch time for a specific user/post
 */
export async function getBufferedWatchTime(clerkId: string, postId: string): Promise<number> {
  const key = `${KEYS.WATCH_TIME}:${clerkId}:${postId}`;
  const value = await redis.get<number>(key);
  return value ?? 0;
}

/**
 * Get all buffered watch time data for flushing to Convex
 * Returns records that need to be persisted
 */
export async function getAllBufferedWatchTime(): Promise<
  Array<{ clerkId: string; postId: string; totalSeconds: number }>
> {
  // Scan for all watch time keys
  const keys: string[] = [];
  let cursor = 0;

  do {
    const result = await redis.scan(cursor, {
      match: `${KEYS.WATCH_TIME}:*`,
      count: 100,
    });
    cursor = result[0];
    keys.push(...result[1]);
  } while (cursor !== 0);

  if (keys.length === 0) return [];

  // Fetch all values
  const values = await redis.mget<number[]>(...keys);

  // Parse results
  const records: Array<{ clerkId: string; postId: string; totalSeconds: number }> = [];
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = values[i];
    if (value && value > 0) {
      const parts = key.split(":");
      if (parts.length === 3) {
        records.push({
          clerkId: parts[1],
          postId: parts[2],
          totalSeconds: value,
        });
      }
    }
  }

  return records;
}

/**
 * Clear a specific watch time record after flushing to Convex
 */
export async function clearWatchTime(clerkId: string, postId: string): Promise<void> {
  const key = `${KEYS.WATCH_TIME}:${clerkId}:${postId}`;
  await redis.del(key);
}

/**
 * Clear all buffered watch time (use after successful flush)
 */
export async function clearAllWatchTime(): Promise<void> {
  const keys: string[] = [];
  let cursor = 0;

  do {
    const result = await redis.scan(cursor, {
      match: `${KEYS.WATCH_TIME}:*`,
      count: 100,
    });
    cursor = result[0];
    keys.push(...result[1]);
  } while (cursor !== 0);

  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

export { redis };
