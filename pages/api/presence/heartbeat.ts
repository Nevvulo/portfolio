import { getAuth } from "@clerk/nextjs/server";
import type { NextApiRequest, NextApiResponse } from "next";
import { setUserPresence, trackSessionTime, trackWatchTime } from "../../../lib/upstash-presence";

/**
 * API route for presence/heartbeat tracking using Redis
 * This replaces direct Convex mutations for much lower cost
 *
 * Supports:
 * - Article watch time tracking (buffers in Redis, flushes to Convex periodically)
 * - User presence/online status
 * - Session time tracking for XP
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

    switch (type) {
      case "watchTime": {
        // Track article watch time in Redis
        if (!postId || typeof secondsIncrement !== "number") {
          return res.status(400).json({ error: "Missing postId or secondsIncrement" });
        }

        const totalSeconds = await trackWatchTime(userId, postId, secondsIncrement);
        return res.status(200).json({ success: true, totalSeconds });
      }

      case "presence": {
        // Update user presence status
        await setUserPresence(userId, "online");
        return res.status(200).json({ success: true });
      }

      case "session": {
        // Track session time for XP purposes
        const today = new Date().toISOString().split("T")[0];
        const session = await trackSessionTime(userId, today);
        return res.status(200).json({
          success: true,
          totalMinutes: session.totalMinutes,
          xpGrantedBlocks: session.xpGrantedBlocks,
        });
      }

      default:
        return res
          .status(400)
          .json({ error: "Invalid type. Use: watchTime, presence, or session" });
    }
  } catch (error) {
    console.error("[presence/heartbeat] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
