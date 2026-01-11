/**
 * Upstash Redis Pub/Sub helper for Convex actions
 * Uses REST API via fetch (works in serverless environment)
 */

// Channel names for Discord integration
export const DISCORD_CHANNELS = {
  PUBLISH: "discord:publish",
  SYNC_COMMENT: "discord:sync_comment",
} as const;

// Message types
export interface PublishPostMessage {
  type: "publish_post";
  postId: string;
  channelConfig: {
    channelId: string;
    channelType: "forum" | "text";
    webhookUrl?: string;
  };
  useUserToken: boolean;
  timestamp: number;
}

export interface SyncCommentMessage {
  type: "sync_comment";
  commentId: string;
  postId: string;
  threadId: string;
  timestamp: number;
}

export type DiscordMessage = PublishPostMessage | SyncCommentMessage;

/**
 * Publish a message to Upstash Redis channel via REST API
 * Returns the number of subscribers that received the message
 */
export async function publishToRedis(
  channel: string,
  message: DiscordMessage,
): Promise<{ success: boolean; subscribers: number; error?: string }> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.error("Upstash Redis credentials not configured");
    return { success: false, subscribers: 0, error: "redis_not_configured" };
  }

  try {
    // Upstash REST API: POST with command as JSON array
    const response = await fetch(`${url}/publish/${channel}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Upstash publish failed:", error);
      return { success: false, subscribers: 0, error };
    }

    const result = await response.json();
    console.log(`Published to ${channel}:`, message.type, "subscribers:", result.result);

    return { success: true, subscribers: result.result };
  } catch (error) {
    console.error("Upstash publish error:", error);
    return { success: false, subscribers: 0, error: String(error) };
  }
}

/**
 * Publish a post to Discord via pub/sub
 */
export async function publishPostMessage(
  postId: string,
  channelConfig: PublishPostMessage["channelConfig"],
  useUserToken: boolean,
) {
  return publishToRedis(DISCORD_CHANNELS.PUBLISH, {
    type: "publish_post",
    postId,
    channelConfig,
    useUserToken,
    timestamp: Date.now(),
  });
}

/**
 * Sync a comment to Discord via pub/sub
 */
export async function publishSyncCommentMessage(
  commentId: string,
  postId: string,
  threadId: string,
) {
  return publishToRedis(DISCORD_CHANNELS.SYNC_COMMENT, {
    type: "sync_comment",
    commentId,
    postId,
    threadId,
    timestamp: Date.now(),
  });
}
