import { desc, eq, isNotNull, sql } from "drizzle-orm";
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/src/db";
import { blogPosts, users } from "@/src/db/schema";

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

function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  const hours = parseInt(match?.[1] || "0");
  const minutes = parseInt(match?.[2] || "0");
  const seconds = parseInt(match?.[3] || "0");
  return Math.ceil(hours * 60 + minutes + seconds / 60);
}

async function fetchAllChannelVideos(channelId: string, apiKey: string): Promise<YouTubeVideo[]> {
  const allVideos: YouTubeVideo[] = [];
  let nextPageToken: string | undefined;

  // Get the uploads playlist ID
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

async function getChannelIdFromHandle(
  handle: string,
  apiKey: string,
): Promise<{ channelId: string; title: string }> {
  const cleanHandle = handle.startsWith("@") ? handle.slice(1) : handle;

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${cleanHandle}&key=${apiKey}`,
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`YouTube API error: ${response.status} ${text}`);
  }

  const data = await response.json();
  const channel = data.items?.[0];

  if (!channel) {
    throw new Error(`Channel not found for handle: @${cleanHandle}`);
  }

  return {
    channelId: channel.id,
    title: channel.snippet.title,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // SECURITY: Always require authentication - fail closed, not open
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    console.error("ADMIN_SECRET environment variable is not set");
    return res.status(500).json({ error: "Server misconfiguration" });
  }

  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${adminSecret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "YOUTUBE_API_KEY not configured" });
  }

  try {
    const { action: actionType, handle = "@Nevvulo", autoPublish = true } = req.body || {};

    // Support reorder action
    if (actionType === "reorder") {
      const allPosts = await db.query.blogPosts.findMany();

      // Separate videos and non-videos
      const videos = allPosts.filter((p) => p.contentType === "video");
      const nonVideos = allPosts.filter((p) => p.contentType !== "video");

      // Sort videos by publishedAt (newest first)
      videos.sort((a, b) => {
        const aTime = a.publishedAt?.getTime() || a.createdAt.getTime();
        const bTime = b.publishedAt?.getTime() || b.createdAt.getTime();
        return bTime - aTime;
      });

      // Sort non-videos by their current bentoOrder
      nonVideos.sort((a, b) => a.bentoOrder - b.bentoOrder);

      // Combine: videos first, then non-videos
      const ordered = [...videos, ...nonVideos];

      // Update bentoOrder for all posts
      for (let i = 0; i < ordered.length; i++) {
        const post = ordered[i];
        if (post) {
          await db.update(blogPosts).set({ bentoOrder: i }).where(eq(blogPosts.id, post.id));
        }
      }

      return res.status(200).json({
        reordered: ordered.length,
        videos: videos.length,
        nonVideos: nonVideos.length,
      });
    }

    // Default: sync videos from handle
    // Step 1: Get channel ID from handle
    const channelInfo = await getChannelIdFromHandle(handle, apiKey);
    console.log(`Found channel: ${channelInfo.title} (${channelInfo.channelId})`);

    // Step 2: Fetch all videos from YouTube
    const videos = await fetchAllChannelVideos(channelInfo.channelId, apiKey);
    console.log(`Found ${videos.length} videos on YouTube`);

    // Step 3: Get existing video IDs from Postgres
    const existingPosts = await db
      .select({ youtubeId: blogPosts.youtubeId })
      .from(blogPosts)
      .where(eq(blogPosts.contentType, "video"));
    const existingSet = new Set(existingPosts.map((p) => p.youtubeId).filter(Boolean));
    console.log(`Found ${existingSet.size} existing videos in database`);

    // Step 4: Get creator user
    const creator = await db.query.users.findFirst({
      where: eq(users.isCreator, true),
    });

    if (!creator) {
      return res.status(500).json({ error: "Creator user not found" });
    }

    const errors: string[] = [];
    let newVideos = 0;
    let skipped = 0;

    // Step 5: Process each video
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
        const youtubePublishedAt = video.snippet.publishedAt
          ? new Date(video.snippet.publishedAt)
          : null;

        // Generate unique slug
        const baseSlug = video.snippet.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 60);

        let slug = baseSlug;
        let counter = 1;
        while (
          await db.query.blogPosts.findFirst({
            where: eq(blogPosts.slug, slug),
          })
        ) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }

        await db.insert(blogPosts).values({
          slug,
          title: video.snippet.title,
          description: (video.snippet.description || "").slice(0, 300) || "New video from YouTube",
          body: `Watch this video on YouTube!\n\n${video.snippet.description || ""}`,
          contentType: "video",
          coverImage: thumbnail,
          youtubeId: video.id,
          authorId: creator.id,
          labels: isShort ? ["short"] : ["video"],
          readTimeMins: durationMins,
          status: autoPublish ? "published" : "draft",
          visibility: "public",
          bentoSize: "medium",
          bentoOrder: 0,
          publishedAt: autoPublish ? youtubePublishedAt : null,
          createdAt: youtubePublishedAt || new Date(),
        });

        newVideos++;
        console.log(`Created post for: ${video.snippet.title}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`${video.snippet.title}: ${message}`);
        console.error(`Error creating post for ${video.snippet.title}:`, error);
      }
    }

    return res.status(200).json({
      success: errors.length === 0,
      channelId: channelInfo.channelId,
      totalVideos: videos.length,
      newVideos,
      skipped,
      errors,
    });
  } catch (error) {
    console.error("YouTube sync error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
