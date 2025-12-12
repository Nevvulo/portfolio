import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { AccessToken } from "livekit-server-sdk";

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

// The Jungle room name - single room for all listeners
const JUNGLE_ROOM = "jungle-stage";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    return res.status(500).json({ error: "LiveKit not configured" });
  }

  try {
    const { identity, isPublisher, displayName } = req.body;

    if (!identity) {
      return res.status(400).json({ error: "Identity required" });
    }

    // Create access token
    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity,
      name: displayName || identity,
      ttl: "4h", // 4 hour token validity
    });

    // Grant permissions based on role
    token.addGrant({
      room: JUNGLE_ROOM,
      roomJoin: true,
      canPublish: isPublisher === true, // Only creator can publish
      canSubscribe: true,
      canPublishData: true,
    });

    const jwt = await token.toJwt();

    return res.status(200).json({
      token: jwt,
      room: JUNGLE_ROOM,
      wsUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL,
    });
  } catch (error) {
    console.error("Failed to generate LiveKit token:", error);
    return res.status(500).json({ error: "Failed to generate token" });
  }
}
