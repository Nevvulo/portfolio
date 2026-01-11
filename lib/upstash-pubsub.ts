import { Redis } from "@upstash/redis";

// Initialize Upstash Redis client from environment variables
// Uses REST API - perfect for serverless (Convex actions)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

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
 * Publish a message to a Redis channel
 * Bot subscribes to these channels and handles Discord operations
 */
export async function publishToChannel(channel: string, message: DiscordMessage): Promise<number> {
  const result = await redis.publish(channel, JSON.stringify(message));
  console.log(`Published to ${channel}:`, message.type);
  return result;
}

/**
 * Publish a post to Discord
 * Bot will receive this and create a Discord thread/message
 */
export async function publishPostToDiscord(
  postId: string,
  channelConfig: PublishPostMessage["channelConfig"],
  useUserToken: boolean,
): Promise<number> {
  return publishToChannel(DISCORD_CHANNELS.PUBLISH, {
    type: "publish_post",
    postId,
    channelConfig,
    useUserToken,
    timestamp: Date.now(),
  });
}

/**
 * Sync a website comment to Discord thread
 * Bot will receive this and post the comment to the Discord thread
 */
export async function syncCommentToDiscord(
  commentId: string,
  postId: string,
  threadId: string,
): Promise<number> {
  return publishToChannel(DISCORD_CHANNELS.SYNC_COMMENT, {
    type: "sync_comment",
    commentId,
    postId,
    threadId,
    timestamp: Date.now(),
  });
}

export { redis };
