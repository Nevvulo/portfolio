import { internalAction } from "./_generated/server";

/**
 * Invalidate bento grid cache in Redis
 * Called when posts are published, unpublished, or reordered
 */
export const invalidateBentoCache = internalAction({
  args: {},
  handler: async (): Promise<{ success: boolean; deleted: number; error?: string }> => {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!redisUrl || !redisToken) {
      console.warn("[cache] Redis not configured, skipping cache invalidation");
      return { success: false, deleted: 0, error: "redis_not_configured" };
    }

    // All possible cache keys to delete
    // Pattern: bento:v1:{tier}[:type:{contentType}][:excludeNews]
    const keysToDelete = [
      // Base keys per tier
      "bento:v1:public",
      "bento:v1:members",
      "bento:v1:tier1",
      "bento:v1:tier2",
      // With excludeNews
      "bento:v1:public:excludeNews",
      "bento:v1:members:excludeNews",
      "bento:v1:tier1:excludeNews",
      "bento:v1:tier2:excludeNews",
      // News-specific
      "bento:v1:public:type:news",
      "bento:v1:members:type:news",
      "bento:v1:tier1:type:news",
      "bento:v1:tier2:type:news",
    ];

    try {
      // Use Redis DEL command via REST API
      const response = await fetch(`${redisUrl}/del/${keysToDelete.join("/")}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${redisToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("[cache] Failed to invalidate:", error);
        return { success: false, deleted: 0, error };
      }

      const result = await response.json();
      console.log("[cache] Invalidated bento cache, deleted:", result.result);
      return { success: true, deleted: result.result };
    } catch (error) {
      console.error("[cache] Error invalidating cache:", error);
      return { success: false, deleted: 0, error: String(error) };
    }
  },
});
