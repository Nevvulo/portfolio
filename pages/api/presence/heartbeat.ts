import { getAuth } from "@clerk/nextjs/server";
import type { NextApiRequest, NextApiResponse } from "next";
import { trackWatchTime } from "../../../lib/upstash-presence";

/**
 * API route for article watch time tracking using Redis
 * Buffers heartbeats in Redis, flushes to Convex periodically via cron
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { type, postId, secondsIncrement } = req.body;

    if (type !== "watchTime") {
      return res.status(400).json({ error: "Invalid type. Use: watchTime" });
    }

    if (!postId || typeof secondsIncrement !== "number") {
      return res.status(400).json({ error: "Missing postId or secondsIncrement" });
    }

    const totalSeconds = await trackWatchTime(userId, postId, secondsIncrement);
    return res.status(200).json({ success: true, totalSeconds });
  } catch (error) {
    console.error("[presence/heartbeat] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
