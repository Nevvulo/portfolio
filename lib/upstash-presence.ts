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
  PRESENCE: "presence", // presence:{clerkId}
  SESSION: "session", // session:{clerkId}:{date}
} as const;

// TTL values (in seconds)
const TTL = {
  WATCH_TIME: 86400, // 24 hours - buffer before flushing to Convex
  PRESENCE: 120, // 2 minutes - user is considered offline after this
  SESSION: 86400, // 24 hours - daily session tracking
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

// ============================================
// USER PRESENCE TRACKING
// ============================================

/**
 * Set user presence/online status
 * Much cheaper than Convex mutations for frequent updates
 */
export async function setUserPresence(
  clerkId: string,
  status: "online" | "away" | "offline" = "online",
): Promise<void> {
  const key = `${KEYS.PRESENCE}:${clerkId}`;
  await redis.setex(
    key,
    TTL.PRESENCE,
    JSON.stringify({
      status,
      lastSeen: Date.now(),
    }),
  );
}

/**
 * Get user presence status
 */
export async function getUserPresence(
  clerkId: string,
): Promise<{ status: string; lastSeen: number } | null> {
  const key = `${KEYS.PRESENCE}:${clerkId}`;
  const value = await redis.get<{ status: string; lastSeen: number }>(key);
  return value;
}

/**
 * Get all online users
 */
export async function getOnlineUsers(): Promise<string[]> {
  const keys: string[] = [];
  let cursor = 0;

  do {
    const result = await redis.scan(cursor, {
      match: `${KEYS.PRESENCE}:*`,
      count: 100,
    });
    cursor = result[0];
    keys.push(...result[1]);
  } while (cursor !== 0);

  // Extract clerk IDs from keys
  return keys.map((key) => key.replace(`${KEYS.PRESENCE}:`, ""));
}

// ============================================
// SESSION/EXPERIENCE TRACKING
// ============================================

interface SessionData {
  totalMinutes: number;
  lastHeartbeat: number;
  xpGrantedBlocks: number; // Number of 10-minute blocks for which XP was granted
}

/**
 * Track session time for XP purposes
 * Returns the session data after update
 */
export async function trackSessionTime(
  clerkId: string,
  date: string, // Format: YYYY-MM-DD
): Promise<SessionData> {
  const key = `${KEYS.SESSION}:${clerkId}:${date}`;
  const now = Date.now();

  // Get existing session data
  const existing = await redis.get<SessionData>(key);

  if (!existing) {
    // Create new session
    const newSession: SessionData = {
      totalMinutes: 0,
      lastHeartbeat: now,
      xpGrantedBlocks: 0,
    };
    await redis.setex(key, TTL.SESSION, JSON.stringify(newSession));
    return newSession;
  }

  // Calculate minutes since last heartbeat
  const minutesSinceLast = Math.floor((now - existing.lastHeartbeat) / 60000);

  // Cap at 5 minutes to prevent abuse from long gaps
  const minutesToAdd = Math.min(minutesSinceLast, 5);

  const updated: SessionData = {
    ...existing,
    totalMinutes: existing.totalMinutes + minutesToAdd,
    lastHeartbeat: now,
  };

  await redis.setex(key, TTL.SESSION, JSON.stringify(updated));
  return updated;
}

/**
 * Mark XP as granted for a session
 */
export async function markXpGranted(clerkId: string, date: string, blocks: number): Promise<void> {
  const key = `${KEYS.SESSION}:${clerkId}:${date}`;
  const existing = await redis.get<SessionData>(key);

  if (existing) {
    await redis.setex(
      key,
      TTL.SESSION,
      JSON.stringify({
        ...existing,
        xpGrantedBlocks: blocks,
      }),
    );
  }
}

export { redis };
