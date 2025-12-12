/**
 * Discord Wormhole Bot
 *
 * Run with: bun bot.ts
 *
 * Listens for messages in Discord channels linked to the lounge
 * and posts them to Convex via the API.
 */

import { Client, GatewayIntentBits, type Message } from "discord.js";
import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api";

// Load from .env.local (Bun auto-loads this)
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN!;
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL!;
const WORMHOLE_SECRET = process.env.DISCORD_WORMHOLE_SECRET!;

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

const convex = new ConvexHttpClient(CONVEX_URL);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

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

  console.log(`📡 Listening for messages in linked channels...`);
});

client.on("messageCreate", async (message: Message) => {
  // Ignore bots (prevents loops from our own webhook messages)
  if (message.author.bot) return;

  // Ignore webhooks
  if (message.webhookId) return;

  // Ignore DMs
  if (!message.guild) return;

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
    console.log(`📨 [#${(message.channel as any).name}] ${message.author.username}: ${contentPreview}${attachmentCount > 0 ? ` [${attachmentCount} attachment(s)]` : ""}...`);

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

    console.log(`✅ Synced to lounge${attachmentCount > 0 ? ` with ${attachmentCount} attachment(s)` : ""}`);
  } catch (error) {
    console.error("❌ Failed to sync message:", error);
  }
});

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down wormhole bot...");
  client.destroy();
  process.exit(0);
});

// Connect to Discord
client.login(DISCORD_BOT_TOKEN);
