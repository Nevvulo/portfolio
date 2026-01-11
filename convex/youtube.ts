import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";

// Get admin settings (or create default if none exists)
export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("adminSettings").first();
    return settings;
  },
});

// Get YouTube settings specifically
export const getYouTubeSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("adminSettings").first();
    return settings?.youtube ?? null;
  },
});

// Update YouTube settings
export const updateYouTubeSettings = mutation({
  args: {
    channelId: v.string(),
    autoPublish: v.boolean(),
    defaultLabels: v.array(v.string()),
    defaultVisibility: v.union(
      v.literal("public"),
      v.literal("members"),
      v.literal("tier1"),
      v.literal("tier2"),
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("adminSettings").first();

    const youtubeSettings = {
      channelId: args.channelId,
      autoPublish: args.autoPublish,
      defaultLabels: args.defaultLabels,
      defaultVisibility: args.defaultVisibility,
      subscriptionExpiresAt: existing?.youtube?.subscriptionExpiresAt,
      lastVideoProcessed: existing?.youtube?.lastVideoProcessed,
      callbackSecret: existing?.youtube?.callbackSecret ?? crypto.randomUUID(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, {
        youtube: youtubeSettings,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      return await ctx.db.insert("adminSettings", {
        youtube: youtubeSettings,
        updatedAt: Date.now(),
      });
    }
  },
});

// Internal mutation to update subscription expiry
export const updateSubscriptionExpiry = internalMutation({
  args: {
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db.query("adminSettings").first();
    if (!settings?.youtube) return;

    await ctx.db.patch(settings._id, {
      youtube: {
        ...settings.youtube,
        subscriptionExpiresAt: args.expiresAt,
      },
      updatedAt: Date.now(),
    });
  },
});

// Internal mutation to mark video as processed
export const markVideoProcessed = internalMutation({
  args: {
    videoId: v.string(),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db.query("adminSettings").first();
    if (!settings?.youtube) return;

    await ctx.db.patch(settings._id, {
      youtube: {
        ...settings.youtube,
        lastVideoProcessed: args.videoId,
      },
      updatedAt: Date.now(),
    });
  },
});

// Subscribe to YouTube channel via PubSubHubbub
export const subscribeToChannel = action({
  args: {
    callbackUrl: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    expiresAt: v.number(),
  }),
  handler: async (ctx, args): Promise<{ success: boolean; expiresAt: number }> => {
    const settings = await ctx.runQuery(internal.youtube.getSettingsInternal);
    if (!settings?.youtube?.channelId) {
      throw new Error("YouTube channel ID not configured");
    }

    const channelId = settings.youtube.channelId;
    const topic = `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channelId}`;

    // Subscribe to PubSubHubbub hub
    const response = await fetch("https://pubsubhubbub.appspot.com/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "hub.callback": args.callbackUrl,
        "hub.topic": topic,
        "hub.verify": "async",
        "hub.mode": "subscribe",
        "hub.lease_seconds": "432000", // 5 days
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to subscribe: ${response.status} ${text}`);
    }

    // Update expiry (5 days from now)
    const expiresAt = Date.now() + 5 * 24 * 60 * 60 * 1000;
    await ctx.runMutation(internal.youtube.updateSubscriptionExpiry, { expiresAt });

    return { success: true, expiresAt };
  },
});

// Internal query for actions
export const getSettingsInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("adminSettings").first();
  },
});

// Process incoming YouTube video notification
export const processVideoNotification = action({
  args: {
    videoId: v.string(),
    title: v.string(),
    channelId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    reason: v.optional(v.string()),
    videoId: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{ success: boolean; reason?: string; videoId?: string }> => {
    const settings = await ctx.runQuery(internal.youtube.getSettingsInternal);

    // Verify channel ID matches
    if (settings?.youtube?.channelId !== args.channelId) {
      console.log("Channel ID mismatch, ignoring notification");
      return { success: false, reason: "channel_mismatch" };
    }

    // Check if already processed
    if (settings.youtube.lastVideoProcessed === args.videoId) {
      console.log("Video already processed, ignoring");
      return { success: false, reason: "already_processed" };
    }

    // Fetch full video details from YouTube API
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error("YOUTUBE_API_KEY not configured");
    }

    const videoResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${args.videoId}&key=${apiKey}`,
    );

    if (!videoResponse.ok) {
      throw new Error(`YouTube API error: ${videoResponse.status}`);
    }

    const videoData = await videoResponse.json();
    const video = videoData.items?.[0];

    if (!video) {
      throw new Error("Video not found in YouTube API response");
    }

    // Parse duration (ISO 8601 format like PT4M13S)
    const duration = video.contentDetails?.duration || "PT0S";
    const durationMatch = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    const hours = parseInt(durationMatch?.[1] || "0");
    const minutes = parseInt(durationMatch?.[2] || "0");
    const seconds = parseInt(durationMatch?.[3] || "0");
    const totalMinutes = Math.ceil(hours * 60 + minutes + seconds / 60);

    // Create blog post
    await ctx.runMutation(internal.youtube.createVideoPost, {
      videoId: args.videoId,
      title: video.snippet.title,
      description: video.snippet.description || "",
      thumbnail:
        video.snippet.thumbnails?.maxres?.url ||
        video.snippet.thumbnails?.high?.url ||
        video.snippet.thumbnails?.default?.url ||
        "",
      durationMins: totalMinutes,
      autoPublish: settings.youtube.autoPublish,
      labels: settings.youtube.defaultLabels,
      visibility: settings.youtube.defaultVisibility,
    });

    // Mark as processed
    await ctx.runMutation(internal.youtube.markVideoProcessed, { videoId: args.videoId });

    return { success: true, videoId: args.videoId };
  },
});

// Internal mutation to create the blog post
export const createVideoPost = internalMutation({
  args: {
    videoId: v.string(),
    title: v.string(),
    description: v.string(),
    thumbnail: v.string(),
    durationMins: v.number(),
    autoPublish: v.boolean(),
    labels: v.array(v.string()),
    visibility: v.union(
      v.literal("public"),
      v.literal("members"),
      v.literal("tier1"),
      v.literal("tier2"),
    ),
  },
  handler: async (ctx, args) => {
    // Get creator user (isCreator = true)
    const creator = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("isCreator"), true))
      .first();

    if (!creator) {
      throw new Error("Creator user not found");
    }

    // Generate slug from title
    const baseSlug = args.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);

    // Check for existing slug and make unique if needed
    let slug = baseSlug;
    let counter = 1;
    while (
      await ctx.db
        .query("blogPosts")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first()
    ) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Shift all existing posts down by 1 to make room at the top
    const posts = await ctx.db.query("blogPosts").collect();
    for (const post of posts) {
      await ctx.db.patch(post._id, { bentoOrder: post.bentoOrder + 1 });
    }

    const now = Date.now();

    // Insert new video at the top (bentoOrder = 0)
    const postId = await ctx.db.insert("blogPosts", {
      slug,
      title: args.title,
      description: args.description.slice(0, 300) || "New video from YouTube",
      content: `Watch this video on YouTube!\n\n${args.description}`,
      contentType: "video",
      coverImage: args.thumbnail,
      youtubeId: args.videoId,
      authorId: creator._id,
      labels: args.labels,
      readTimeMins: args.durationMins,
      status: args.autoPublish ? "published" : "draft",
      visibility: args.visibility,
      bentoSize: "medium",
      bentoOrder: 0,
      viewCount: 0,
      publishedAt: args.autoPublish ? now : undefined,
      createdAt: now,
    });

    // If auto-published, also publish to Discord
    if (args.autoPublish) {
      await ctx.scheduler.runAfter(0, internal.blogDiscord.publishToDiscord, { postId });
    }

    return { slug };
  },
});

// Check if subscription needs renewal (called by cron)
export const checkSubscriptionRenewal = internalAction({
  args: {},
  handler: async (ctx): Promise<void> => {
    const settings = await ctx.runQuery(internal.youtube.getSettingsInternal);

    if (!settings?.youtube?.channelId) {
      console.log("YouTube not configured, skipping renewal check");
      return;
    }

    const expiresAt = settings.youtube.subscriptionExpiresAt;
    const twoDaysFromNow = Date.now() + 2 * 24 * 60 * 60 * 1000;

    if (!expiresAt || expiresAt < twoDaysFromNow) {
      console.log("Subscription expiring soon or expired, renewing...");

      // Get the callback URL from environment
      const baseUrl = process.env.NEXT_PUBLIC_URL || process.env.VERCEL_URL;
      if (!baseUrl) {
        console.error("No base URL configured for callback");
        return;
      }

      const callbackUrl = `${baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`}/api/webhooks/youtube`;

      await ctx.runAction(internal.youtube.subscribeToChannelInternal, { callbackUrl });
      console.log("Subscription renewed successfully");
    } else {
      console.log(`Subscription valid until ${new Date(expiresAt).toISOString()}`);
    }
  },
});

// Internal version of subscribe for cron job
export const subscribeToChannelInternal = internalAction({
  args: {
    callbackUrl: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; expiresAt: number }> => {
    const settings = await ctx.runQuery(internal.youtube.getSettingsInternal);
    if (!settings?.youtube?.channelId) {
      throw new Error("YouTube channel ID not configured");
    }

    const channelId = settings.youtube.channelId;
    const topic = `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channelId}`;

    const response = await fetch("https://pubsubhubbub.appspot.com/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "hub.callback": args.callbackUrl,
        "hub.topic": topic,
        "hub.verify": "async",
        "hub.mode": "subscribe",
        "hub.lease_seconds": "432000",
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to subscribe: ${response.status} ${text}`);
    }

    const expiresAt = Date.now() + 5 * 24 * 60 * 60 * 1000;
    await ctx.runMutation(internal.youtube.updateSubscriptionExpiry, { expiresAt });

    return { success: true, expiresAt };
  },
});

// ============================================
// SYNC ALL VIDEOS FROM CHANNEL
// ============================================

interface YouTubeVideo {
  id: string;
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    thumbnails: {
      maxres?: { url: string };
      high?: { url: string };
      default?: { url: string };
    };
  };
  contentDetails: {
    duration: string;
  };
}

// Get channel ID from handle (e.g., @Nevvulo)
export const getChannelIdFromHandle = action({
  args: {
    handle: v.string(), // e.g., "@Nevvulo" or "Nevvulo"
  },
  returns: v.object({
    channelId: v.string(),
    title: v.string(),
    subscriberCount: v.string(),
  }),
  handler: async (
    _ctx,
    args,
  ): Promise<{ channelId: string; title: string; subscriberCount: string }> => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error("YOUTUBE_API_KEY not configured");
    }

    // Remove @ if present
    const handle = args.handle.startsWith("@") ? args.handle.slice(1) : args.handle;

    // Search for channel by handle
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${handle}&key=${apiKey}`,
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`YouTube API error: ${response.status} ${text}`);
    }

    const data = await response.json();
    const channel = data.items?.[0];

    if (!channel) {
      throw new Error(`Channel not found for handle: @${handle}`);
    }

    return {
      channelId: channel.id,
      title: channel.snippet.title,
      subscriberCount: channel.statistics.subscriberCount,
    };
  },
});

// Fetch all videos from a channel
async function fetchAllChannelVideos(channelId: string, apiKey: string): Promise<YouTubeVideo[]> {
  const allVideos: YouTubeVideo[] = [];
  let nextPageToken: string | undefined;

  // First, get the uploads playlist ID
  const channelResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`,
  );

  if (!channelResponse.ok) {
    throw new Error(`Failed to get channel: ${channelResponse.status}`);
  }

  const channelData = await channelResponse.json();
  const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

  if (!uploadsPlaylistId) {
    throw new Error("Could not find uploads playlist");
  }

  // Fetch all video IDs from the uploads playlist
  const videoIds: string[] = [];

  do {
    const playlistUrl = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    playlistUrl.searchParams.set("part", "contentDetails");
    playlistUrl.searchParams.set("playlistId", uploadsPlaylistId);
    playlistUrl.searchParams.set("maxResults", "50");
    playlistUrl.searchParams.set("key", apiKey);
    if (nextPageToken) {
      playlistUrl.searchParams.set("pageToken", nextPageToken);
    }

    const playlistResponse = await fetch(playlistUrl.toString());
    if (!playlistResponse.ok) {
      throw new Error(`Failed to get playlist items: ${playlistResponse.status}`);
    }

    const playlistData = await playlistResponse.json();

    for (const item of playlistData.items || []) {
      videoIds.push(item.contentDetails.videoId);
    }

    nextPageToken = playlistData.nextPageToken;
  } while (nextPageToken);

  // Fetch full video details in batches of 50
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    videosUrl.searchParams.set("part", "snippet,contentDetails");
    videosUrl.searchParams.set("id", batch.join(","));
    videosUrl.searchParams.set("key", apiKey);

    const videosResponse = await fetch(videosUrl.toString());
    if (!videosResponse.ok) {
      throw new Error(`Failed to get video details: ${videosResponse.status}`);
    }

    const videosData = await videosResponse.json();
    allVideos.push(...(videosData.items || []));
  }

  return allVideos;
}

// Parse YouTube duration format (PT4M13S) to minutes
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  const hours = parseInt(match?.[1] || "0");
  const minutes = parseInt(match?.[2] || "0");
  const seconds = parseInt(match?.[3] || "0");
  return Math.ceil(hours * 60 + minutes + seconds / 60);
}

// Check which videos already exist in the database
export const getExistingYouTubeIds = internalQuery({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("blogPosts")
      .filter((q) => q.eq(q.field("contentType"), "video"))
      .collect();

    return posts.filter((p) => p.youtubeId).map((p) => p.youtubeId as string);
  },
});

// Sync all videos from YouTube channel to database
export const syncAllVideos = action({
  args: {
    channelId: v.optional(v.string()), // Use stored channelId if not provided
    autoPublish: v.optional(v.boolean()),
    defaultLabels: v.optional(v.array(v.string())),
    visibility: v.optional(
      v.union(v.literal("public"), v.literal("members"), v.literal("tier1"), v.literal("tier2")),
    ),
  },
  returns: v.object({
    success: v.boolean(),
    totalVideos: v.number(),
    newVideos: v.number(),
    skipped: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{
    success: boolean;
    totalVideos: number;
    newVideos: number;
    skipped: number;
    errors: string[];
  }> => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error("YOUTUBE_API_KEY not configured in Convex environment");
    }

    // Get channel ID from settings or args
    let channelId = args.channelId;
    if (!channelId) {
      const settings = await ctx.runQuery(internal.youtube.getSettingsInternal);
      channelId = settings?.youtube?.channelId;
    }

    if (!channelId) {
      throw new Error("No channel ID provided and none configured in settings");
    }

    console.log(`Fetching all videos from channel: ${channelId}`);

    // Fetch all videos from YouTube
    const videos = await fetchAllChannelVideos(channelId, apiKey);
    console.log(`Found ${videos.length} videos on YouTube`);

    // Get existing video IDs to avoid duplicates
    const existingIds = await ctx.runQuery(internal.youtube.getExistingYouTubeIds);
    const existingSet = new Set(existingIds);
    console.log(`Found ${existingIds.length} existing videos in database`);

    const errors: string[] = [];
    let newVideos = 0;
    let skipped = 0;

    // Process each video
    for (const video of videos) {
      try {
        // Skip if already exists
        if (existingSet.has(video.id)) {
          skipped++;
          continue;
        }

        const thumbnail =
          video.snippet.thumbnails?.maxres?.url ||
          video.snippet.thumbnails?.high?.url ||
          video.snippet.thumbnails?.default?.url ||
          "";

        const durationMins = parseDuration(video.contentDetails?.duration || "PT0S");

        // Determine if it's a Short (under 60 seconds)
        const isShort = durationMins <= 1;

        await ctx.runMutation(internal.youtube.createVideoPost, {
          videoId: video.id,
          title: video.snippet.title,
          description: video.snippet.description || "",
          thumbnail,
          durationMins,
          autoPublish: args.autoPublish ?? true,
          labels: args.defaultLabels ?? (isShort ? ["short"] : ["video"]),
          visibility: args.visibility ?? "public",
        });

        newVideos++;
        console.log(`Created post for: ${video.snippet.title}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`${video.snippet.title}: ${message}`);
        console.error(`Error creating post for ${video.snippet.title}:`, error);
      }
    }

    console.log(`Sync complete: ${newVideos} new, ${skipped} skipped, ${errors.length} errors`);

    return {
      success: errors.length === 0,
      totalVideos: videos.length,
      newVideos,
      skipped,
      errors,
    };
  },
});

// Quick sync for a specific channel handle (one-liner convenience)
export const syncFromHandle = action({
  args: {
    handle: v.string(), // e.g., "@Nevvulo"
    autoPublish: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    channelId: v.string(),
    totalVideos: v.number(),
    newVideos: v.number(),
    skipped: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{
    success: boolean;
    channelId: string;
    totalVideos: number;
    newVideos: number;
    skipped: number;
    errors: string[];
  }> => {
    // First get the channel ID from the handle
    const channelInfo = await ctx.runAction(internal.youtube.getChannelIdFromHandleInternal, {
      handle: args.handle,
    });

    console.log(`Found channel: ${channelInfo.title} (${channelInfo.channelId})`);

    // Now sync all videos
    const result = await ctx.runAction(internal.youtube.syncAllVideosInternal, {
      channelId: channelInfo.channelId,
      autoPublish: args.autoPublish ?? true,
    });

    return {
      ...result,
      channelId: channelInfo.channelId,
    };
  },
});

// Internal versions for chaining
export const getChannelIdFromHandleInternal = internalAction({
  args: {
    handle: v.string(),
  },
  handler: async (
    _ctx,
    args,
  ): Promise<{ channelId: string; title: string; subscriberCount: string }> => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error("YOUTUBE_API_KEY not configured");
    }

    const handle = args.handle.startsWith("@") ? args.handle.slice(1) : args.handle;

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${handle}&key=${apiKey}`,
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`YouTube API error: ${response.status} ${text}`);
    }

    const data = await response.json();
    const channel = data.items?.[0];

    if (!channel) {
      throw new Error(`Channel not found for handle: @${handle}`);
    }

    return {
      channelId: channel.id,
      title: channel.snippet.title,
      subscriberCount: channel.statistics.subscriberCount,
    };
  },
});

// Reorder posts to put videos at the top, sorted by publishedAt
export const reorderPostsVideosFirst = internalMutation({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db.query("blogPosts").collect();

    // Separate videos and non-videos
    const videos = posts.filter((p) => p.contentType === "video");
    const nonVideos = posts.filter((p) => p.contentType !== "video");

    // Sort videos by publishedAt (newest first)
    videos.sort((a, b) => (b.publishedAt || b.createdAt) - (a.publishedAt || a.createdAt));

    // Sort non-videos by their current bentoOrder
    nonVideos.sort((a, b) => a.bentoOrder - b.bentoOrder);

    // Combine: videos first, then non-videos
    const ordered = [...videos, ...nonVideos];

    // Update bentoOrder for all posts
    for (let i = 0; i < ordered.length; i++) {
      await ctx.db.patch(ordered[i]._id, { bentoOrder: i });
    }

    return { reordered: ordered.length, videos: videos.length, nonVideos: nonVideos.length };
  },
});

// Public action to trigger reorder
export const reorderPosts = action({
  args: {
    videosFirst: v.optional(v.boolean()),
  },
  returns: v.object({
    reordered: v.number(),
    videos: v.number(),
    nonVideos: v.number(),
  }),
  handler: async (
    ctx,
    _args,
  ): Promise<{ reordered: number; videos: number; nonVideos: number }> => {
    return await ctx.runMutation(internal.youtube.reorderPostsVideosFirst);
  },
});

export const syncAllVideosInternal = internalAction({
  args: {
    channelId: v.string(),
    autoPublish: v.optional(v.boolean()),
    defaultLabels: v.optional(v.array(v.string())),
    visibility: v.optional(
      v.union(v.literal("public"), v.literal("members"), v.literal("tier1"), v.literal("tier2")),
    ),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    success: boolean;
    totalVideos: number;
    newVideos: number;
    skipped: number;
    errors: string[];
  }> => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error("YOUTUBE_API_KEY not configured");
    }

    const videos = await fetchAllChannelVideos(args.channelId, apiKey);
    const existingIds = await ctx.runQuery(internal.youtube.getExistingYouTubeIds);
    const existingSet = new Set(existingIds);

    const errors: string[] = [];
    let newVideos = 0;
    let skipped = 0;

    for (const video of videos) {
      try {
        if (existingSet.has(video.id)) {
          skipped++;
          continue;
        }

        const thumbnail =
          video.snippet.thumbnails?.maxres?.url ||
          video.snippet.thumbnails?.high?.url ||
          video.snippet.thumbnails?.default?.url ||
          "";

        const durationMins = parseDuration(video.contentDetails?.duration || "PT0S");
        const isShort = durationMins <= 1;

        await ctx.runMutation(internal.youtube.createVideoPost, {
          videoId: video.id,
          title: video.snippet.title,
          description: video.snippet.description || "",
          thumbnail,
          durationMins,
          autoPublish: args.autoPublish ?? true,
          labels: args.defaultLabels ?? (isShort ? ["short"] : ["video"]),
          visibility: args.visibility ?? "public",
        });

        newVideos++;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`${video.snippet.title}: ${message}`);
      }
    }

    return {
      success: errors.length === 0,
      totalVideos: videos.length,
      newVideos,
      skipped,
      errors,
    };
  },
});
