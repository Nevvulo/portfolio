/**
 * Discord Wormhole Bot
 *
 * Run with: bun bot.ts
 *
 * Listens for messages in Discord channels linked to the lounge
 * and posts them to Convex via the API.
 *
 * Uses Upstash Redis Pub/Sub to receive commands from Convex:
 * - discord:publish - Create Discord thread/post for blog posts
 * - discord:sync_comment - Sync website comments to Discord threads
 */

import { ConvexHttpClient } from "convex/browser";
import { Client, GatewayIntentBits, type Message } from "discord.js";
import { createClient, type RedisClientType } from "redis";
import { api } from "./convex/_generated/api";
import type { Id } from "./convex/_generated/dataModel";

// Load from .env.local (Bun auto-loads this)
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN!;
const DISCORD_USER_TOKEN = process.env.DISCORD_USER_TOKEN;
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL!;
const WORMHOLE_SECRET = process.env.DISCORD_WORMHOLE_SECRET!;
const BOT_PORT = process.env.BOT_PORT || "3001";
const UPSTASH_REDIS_URL = process.env.UPSTASH_REDIS_URL;

if (!DISCORD_BOT_TOKEN) {
  console.error("Missing DISCORD_BOT_TOKEN in .env.local");
  process.exit(1);
}

if (!CONVEX_URL) {
  console.error("Missing NEXT_PUBLIC_CONVEX_URL in .env.local");
  process.exit(1);
}

if (!WORMHOLE_SECRET) {
  console.error("Missing DISCORD_WORMHOLE_SECRET in .env.local");
  console.error("Generate one with: openssl rand -hex 32");
  process.exit(1);
}

// Redis is optional - only needed for blog Discord integration
let redis: RedisClientType | null = null;

const convex = new ConvexHttpClient(CONVEX_URL);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Track blog thread IDs for comment sync
const blogThreadIds = new Set<string>();

// ============================================
// MESSAGE SPLITTING HELPER
// ============================================

const MAX_MESSAGE_LENGTH = 2000;
const BUFFER = 50; // Buffer for ellipsis and safety

/**
 * Split a message into chunks that fit Discord's 2000 char limit
 * Adds ellipsis at the end of chunks that continue
 */
function splitMessage(content: string): string[] {
  if (content.length <= MAX_MESSAGE_LENGTH) {
    return [content];
  }

  const chunks: string[] = [];
  let remaining = content;

  while (remaining.length > 0) {
    if (remaining.length <= MAX_MESSAGE_LENGTH) {
      chunks.push(remaining);
      break;
    }

    // Find a good break point (newline, space, or just cut)
    let cutPoint = MAX_MESSAGE_LENGTH - BUFFER;

    // Try to break at a newline first
    const newlineIndex = remaining.lastIndexOf("\n", cutPoint);
    if (newlineIndex > cutPoint - 500) {
      cutPoint = newlineIndex;
    } else {
      // Try to break at a space
      const spaceIndex = remaining.lastIndexOf(" ", cutPoint);
      if (spaceIndex > cutPoint - 200) {
        cutPoint = spaceIndex;
      }
    }

    const chunk = remaining.slice(0, cutPoint).trimEnd() + "...";
    chunks.push(chunk);
    remaining = remaining.slice(cutPoint).trimStart();
  }

  return chunks;
}

// Helper function for Discord API calls with token swap support
async function discordApiCall(
  endpoint: string,
  method: string,
  body?: object,
  useUserToken = false,
): Promise<Response> {
  const token = useUserToken && DISCORD_USER_TOKEN ? DISCORD_USER_TOKEN : DISCORD_BOT_TOKEN;
  const authHeader = useUserToken && DISCORD_USER_TOKEN ? token : `Bot ${token}`;

  return fetch(`https://discord.com/api/v10${endpoint}`, {
    method,
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

client.once("ready", async () => {
  console.log(`🌀 Wormhole bot online as ${client.user?.tag}`);

  // Sync guild emojis to Convex
  try {
    const guild = client.guilds.cache.first();
    if (guild) {
      const emojis = guild.emojis.cache.map((e) => ({
        id: e.id,
        name: e.name || "unknown",
        animated: e.animated || false,
      }));

      await convex.mutation(api.discord.syncGuildEmojis, {
        secret: WORMHOLE_SECRET,
        emojis,
      });

      console.log(`✨ Synced ${emojis.length} custom emojis from ${guild.name}`);
    }
  } catch (error) {
    console.error("❌ Failed to sync emojis:", error);
  }

  // Load existing blog thread IDs from Convex
  try {
    const posts = await convex.query(api.blogDiscord.getPostsWithThreads);
    for (const post of posts) {
      if (post.discordThreadId) {
        blogThreadIds.add(post.discordThreadId);
      }
    }
    console.log(`📚 Loaded ${blogThreadIds.size} blog thread mappings`);
  } catch (error) {
    console.error("❌ Failed to load blog threads:", error);
  }

  // Setup Redis Pub/Sub for blog Discord integration
  if (UPSTASH_REDIS_URL) {
    await setupRedisPubSub();
  } else {
    console.log("⚠️ UPSTASH_REDIS_URL not set - blog Discord integration disabled");
  }

  console.log(`📡 Listening for messages in linked channels...`);
});

// ============================================
// REDIS PUB/SUB FOR BLOG DISCORD INTEGRATION
// ============================================

async function setupRedisPubSub() {
  try {
    redis = createClient({ url: UPSTASH_REDIS_URL });

    redis.on("error", (err) => {
      console.error("❌ Redis error:", err);
    });

    await redis.connect();
    console.log("🔴 Connected to Upstash Redis");

    // Subscribe to Discord command channels
    await redis.subscribe("discord:publish", async (message) => {
      try {
        const data = JSON.parse(message);
        console.log(`📥 Received publish command:`, data.type);

        if (data.type === "publish_post") {
          await handlePublishPost(data);
        }
      } catch (error) {
        console.error("❌ Error handling publish message:", error);
      }
    });

    await redis.subscribe("discord:sync_comment", async (message) => {
      try {
        const data = JSON.parse(message);
        console.log(`📥 Received sync_comment command`);

        if (data.type === "sync_comment") {
          await handleSyncComment(data);
        }
      } catch (error) {
        console.error("❌ Error handling sync_comment message:", error);
      }
    });

    console.log("📡 Subscribed to Redis channels: discord:publish, discord:sync_comment");
  } catch (error) {
    console.error("❌ Failed to setup Redis pub/sub:", error);
  }
}

// Handle publish_post command from Convex
interface PublishPostData {
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

async function handlePublishPost(data: PublishPostData) {
  try {
    // Fetch post data from Convex
    const post = await convex.query(api.blogDiscord.getPostForPublish, {
      postId: data.postId as Id<"blogPosts">,
    });

    if (!post) {
      console.error("❌ Post not found:", data.postId);
      return;
    }

    console.log(`📤 Publishing post to Discord: ${post.title}`);

    const description =
      post.description.length > 300 ? post.description.slice(0, 297) + "..." : post.description;

    if (data.channelConfig.channelType === "forum") {
      // Build full content
      const fullContent = `**${post.title}**\n\n${description}${post.url ? `\n\n[Read more](${post.url})` : ""}`;
      const chunks = splitMessage(fullContent);

      // Create forum thread with first chunk
      const threadResponse = await discordApiCall(
        `/channels/${data.channelConfig.channelId}/threads`,
        "POST",
        {
          name: post.title.slice(0, 100),
          message: {
            content: chunks[0],
            embeds: post.coverImage
              ? [{ type: "image", image: { url: post.coverImage } }]
              : undefined,
          },
          type: 11, // GUILD_PUBLIC_THREAD for forum posts
        },
        data.useUserToken,
      );

      if (!threadResponse.ok) {
        const errorText = await threadResponse.text();
        console.error("❌ Failed to create thread:", errorText);
        return;
      }

      const thread = await threadResponse.json();
      blogThreadIds.add(thread.id);

      // Post remaining chunks as follow-up messages
      for (let i = 1; i < chunks.length; i++) {
        await discordApiCall(
          `/channels/${thread.id}/messages`,
          "POST",
          { content: chunks[i] },
          data.useUserToken,
        );
      }

      console.log(
        `✅ Created Discord forum thread: ${thread.name} (${thread.id}) [${chunks.length} message(s)]`,
      );

      // Report back to Convex
      await convex.mutation(api.blogDiscord.reportPostPublished, {
        secret: WORMHOLE_SECRET,
        postId: data.postId as Id<"blogPosts">,
        discordThreadId: thread.id,
        discordMessageId: thread.id,
        discordChannelId: data.channelConfig.channelId,
      });
    } else {
      // Post to text channel (announcement only)
      let messageId: string;

      if (data.channelConfig.webhookUrl) {
        // Use webhook
        const webhookResponse = await fetch(`${data.channelConfig.webhookUrl}?wait=true`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            embeds: [
              {
                title: post.title,
                description,
                url: post.url,
                color: 0x9074f2,
                image: post.coverImage ? { url: post.coverImage } : undefined,
              },
            ],
            allowed_mentions: { parse: [] },
          }),
        });

        if (!webhookResponse.ok) {
          const errorText = await webhookResponse.text();
          console.error("❌ Failed to post via webhook:", errorText);
          return;
        }

        const message = await webhookResponse.json();
        messageId = message.id;
        console.log(`✅ Posted announcement via webhook: ${messageId}`);
      } else {
        // Use Discord API directly
        const messageResponse = await discordApiCall(
          `/channels/${data.channelConfig.channelId}/messages`,
          "POST",
          {
            embeds: [
              {
                title: post.title,
                description,
                url: post.url,
                color: 0x9074f2,
                image: post.coverImage ? { url: post.coverImage } : undefined,
              },
            ],
          },
          data.useUserToken,
        );

        if (!messageResponse.ok) {
          const errorText = await messageResponse.text();
          console.error("❌ Failed to post to channel:", errorText);
          return;
        }

        const message = await messageResponse.json();
        messageId = message.id;
        console.log(`✅ Posted announcement to channel: ${messageId}`);
      }

      // Report back to Convex
      await convex.mutation(api.blogDiscord.reportPostPublished, {
        secret: WORMHOLE_SECRET,
        postId: data.postId as Id<"blogPosts">,
        discordMessageId: messageId,
        discordChannelId: data.channelConfig.channelId,
      });
    }
  } catch (error) {
    console.error("❌ Error publishing post:", error);
  }
}

// Handle sync_comment command from Convex
interface SyncCommentData {
  type: "sync_comment";
  commentId: string;
  postId: string;
  threadId: string;
  timestamp: number;
}

async function handleSyncComment(data: SyncCommentData) {
  try {
    // Fetch comment data from Convex
    const comment = await convex.query(api.blogDiscord.getCommentForSync, {
      commentId: data.commentId as Id<"blogComments">,
    });

    if (!comment) {
      console.error("❌ Comment not found:", data.commentId);
      return;
    }

    if (!comment.discordThreadId) {
      console.error("❌ No Discord thread for comment:", data.commentId);
      return;
    }

    console.log(`💬 Syncing comment to Discord thread: ${comment.discordThreadId}`);

    // Format content with author info
    const authorName = comment.author?.displayName || "Website User";
    const fullContent = `**${authorName}** (via website)\n${comment.content}`;
    const chunks = splitMessage(fullContent);

    // Get useUserToken setting
    const settings = await convex.query(api.blogDiscord.getDiscordSettings);
    const useUserToken = settings?.useUserToken ?? false;

    // Post first chunk (with reply reference if applicable)
    const messageResponse = await discordApiCall(
      `/channels/${comment.discordThreadId}/messages`,
      "POST",
      {
        content: chunks[0],
        message_reference: comment.replyToDiscordMessageId
          ? { message_id: comment.replyToDiscordMessageId, fail_if_not_exists: false }
          : undefined,
      },
      useUserToken,
    );

    if (!messageResponse.ok) {
      const errorText = await messageResponse.text();
      console.error("❌ Failed to sync comment:", errorText);
      return;
    }

    const message = await messageResponse.json();

    // Post remaining chunks
    for (let i = 1; i < chunks.length; i++) {
      await discordApiCall(
        `/channels/${comment.discordThreadId}/messages`,
        "POST",
        { content: chunks[i] },
        useUserToken,
      );
    }

    console.log(`✅ Synced comment to Discord: ${message.id} [${chunks.length} message(s)]`);

    // Report back to Convex
    await convex.mutation(api.blogDiscord.reportCommentSynced, {
      secret: WORMHOLE_SECRET,
      commentId: data.commentId as Id<"blogComments">,
      discordMessageId: message.id,
      discordThreadId: comment.discordThreadId,
      postId: data.postId as Id<"blogPosts">,
    });
  } catch (error) {
    console.error("❌ Error syncing comment:", error);
  }
}

client.on("messageCreate", async (message: Message) => {
  // Ignore bots (prevents loops from our own webhook messages)
  if (message.author.bot) return;

  // Ignore webhooks
  if (message.webhookId) return;

  // Ignore DMs
  if (!message.guild) return;

  // Check if this is a blog thread message
  if (message.channel.isThread() && blogThreadIds.has(message.channel.id)) {
    await handleBlogThreadMessage(message);
    return;
  }

  // Check if there's content or attachments (allow image-only messages)
  const hasContent = message.content.trim().length > 0;
  const hasAttachments = message.attachments.size > 0;

  if (!hasContent && !hasAttachments) return;

  try {
    // Check if this Discord channel is linked to a lounge channel
    const channel = await convex.query(api.discord.getChannelByDiscordId, {
      discordChannelId: message.channel.id,
    });

    if (!channel) {
      // Not a linked channel, ignore
      return;
    }

    const attachmentCount = message.attachments.size;
    const contentPreview = message.content.slice(0, 50) || "(no text)";
    console.log(
      `📨 [#${(message.channel as any).name}] ${message.author.username}: ${contentPreview}${attachmentCount > 0 ? ` [${attachmentCount} attachment(s)]` : ""}...`,
    );

    // Build avatar URL
    const avatarUrl = message.author.displayAvatarURL({ size: 128 });

    // Extract attachments (images, videos, etc.)
    const attachments = message.attachments.map((att) => {
      // Determine type from content type or filename
      let type = "image";
      if (att.contentType?.startsWith("video/")) {
        type = "video";
      } else if (att.contentType?.startsWith("audio/")) {
        type = "audio";
      } else if (att.contentType?.startsWith("image/")) {
        type = "image";
      }

      return {
        type,
        url: att.url,
        proxyUrl: att.proxyURL,
        filename: att.name || undefined,
        width: att.width || undefined,
        height: att.height || undefined,
        mimeType: att.contentType || undefined,
        fileSize: att.size || undefined,
      };
    });

    // Post to Convex
    await convex.mutation(api.discord.createMessageFromDiscord, {
      secret: WORMHOLE_SECRET,
      channelId: channel._id,
      content: message.content,
      discordMessageId: message.id,
      discordAuthor: {
        id: message.author.id,
        username: message.author.displayName || message.author.username,
        discriminator: message.author.discriminator,
        avatarUrl,
      },
      replyToDiscordMessageId: message.reference?.messageId,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    console.log(
      `✅ Synced to lounge${attachmentCount > 0 ? ` with ${attachmentCount} attachment(s)` : ""}`,
    );
  } catch (error) {
    console.error("❌ Failed to sync message:", error);
  }
});

// Handle messages in blog discussion threads
async function handleBlogThreadMessage(message: Message) {
  const hasContent = message.content.trim().length > 0;
  if (!hasContent) return;

  try {
    const avatarUrl = message.author.displayAvatarURL({ size: 128 });

    await convex.mutation(api.blogDiscord.createCommentFromDiscord, {
      secret: WORMHOLE_SECRET,
      discordThreadId: message.channel.id,
      discordMessageId: message.id,
      content: message.content,
      discordAuthor: {
        id: message.author.id,
        username: message.author.displayName || message.author.username,
        discriminator: message.author.discriminator,
        avatarUrl,
      },
      replyToDiscordMessageId: message.reference?.messageId,
    });

    console.log(`💬 Synced blog comment from ${message.author.username}`);
  } catch (error) {
    console.error("❌ Failed to sync blog comment:", error);
  }
}

// ============================================
// HTTP SERVER (Health Check Only)
// ============================================

const httpServer = Bun.serve({
  port: parseInt(BOT_PORT),
  fetch(req) {
    const url = new URL(req.url);

    // GET /health - Health check
    if (url.pathname === "/health" && req.method === "GET") {
      return Response.json({
        status: "ok",
        discordConnected: client.isReady(),
        redisConnected: redis?.isOpen ?? false,
        blogThreadsTracked: blogThreadIds.size,
      });
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`🌐 Bot HTTP server running on port ${BOT_PORT} (health check only)`);

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down wormhole bot...");
  httpServer.stop();
  if (redis?.isOpen) {
    await redis.quit();
  }
  client.destroy();
  process.exit(0);
});

// Connect to Discord
client.login(DISCORD_BOT_TOKEN);
