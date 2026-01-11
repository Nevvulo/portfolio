import type { NextApiRequest, NextApiResponse } from "next";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

// Disable body parsing - we need the raw body for XML
export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req: NextApiRequest): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

// Simple XML parser for YouTube Atom feed
function parseYouTubeAtom(xml: string): { videoId: string; title: string; channelId: string } | null {
  // Extract video ID
  const videoIdMatch = xml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
  if (!videoIdMatch) return null;

  // Extract title
  const titleMatch = xml.match(/<title>([^<]+)<\/title>/);

  // Extract channel ID
  const channelIdMatch = xml.match(/<yt:channelId>([^<]+)<\/yt:channelId>/);

  return {
    videoId: videoIdMatch[1],
    title: titleMatch?.[1] || "Untitled Video",
    channelId: channelIdMatch?.[1] || "",
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GET request = verification challenge from PubSubHubbub
  if (req.method === "GET") {
    const challenge = req.query["hub.challenge"];
    const mode = req.query["hub.mode"];
    const topic = req.query["hub.topic"];

    console.log(`YouTube webhook verification: mode=${mode}, topic=${topic}`);

    if (mode === "subscribe" && challenge) {
      // Return the challenge to verify the subscription
      console.log("Returning challenge for subscription verification");
      return res.status(200).send(challenge);
    }

    return res.status(400).json({ error: "Invalid verification request" });
  }

  // POST request = new video notification
  if (req.method === "POST") {
    try {
      const rawBody = await getRawBody(req);
      console.log("Received YouTube notification:", rawBody.slice(0, 500));

      // Parse the Atom feed
      const parsed = parseYouTubeAtom(rawBody);

      if (!parsed) {
        console.log("Could not parse video data from notification");
        return res.status(200).json({ received: true, processed: false });
      }

      console.log(`Parsed video: ${parsed.videoId} - ${parsed.title}`);

      // Check if this is a deletion notification (deleted entries have different format)
      if (rawBody.includes("<at:deleted-entry")) {
        console.log("Ignoring deletion notification");
        return res.status(200).json({ received: true, processed: false, reason: "deletion" });
      }

      // Process the video via Convex
      const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
      if (!convexUrl) {
        console.error("NEXT_PUBLIC_CONVEX_URL not configured");
        return res.status(500).json({ error: "Server misconfigured" });
      }

      const client = new ConvexHttpClient(convexUrl);

      const result = await client.action(api.youtube.processVideoNotification, {
        videoId: parsed.videoId,
        title: parsed.title,
        channelId: parsed.channelId,
      });

      console.log("Video processing result:", result);

      return res.status(200).json({ received: true, processed: true, result });
    } catch (error) {
      console.error("Error processing YouTube notification:", error);
      // Return 200 to prevent retries for permanent failures
      return res.status(200).json({ received: true, processed: false, error: String(error) });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
