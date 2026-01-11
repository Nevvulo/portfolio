import { clerkClient, getAuth } from "@clerk/nextjs/server";
import { AccessToken } from "livekit-server-sdk";
import type { NextApiRequest, NextApiResponse } from "next";

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

// The Jungle room name - single room for all listeners
const JUNGLE_ROOM = "jungle-stage";

// Creator's Discord ID for publisher permission check
const CREATOR_DISCORD_ID = "246574843460321291";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
    const { displayName } = req.body;

    // SECURITY: Use authenticated userId as identity, not client-provided
    const identity = userId;

    // SECURITY: Verify publisher permission server-side by checking if user is creator
    // Get user's Discord ID from Clerk to verify creator status
    let isPublisher = false;
    try {
      const clerk = await clerkClient();
      const clerkUser = await clerk.users.getUser(userId);
      const discordAccount = clerkUser.externalAccounts?.find(
        (a) => a.provider === "oauth_discord",
      );
      const discordId = discordAccount?.providerUserId || discordAccount?.externalId;
      isPublisher = discordId === CREATOR_DISCORD_ID;
    } catch (error) {
      console.error("Failed to verify publisher status:", error);
      // If we can't verify, default to non-publisher for safety
      isPublisher = false;
    }

    // Create access token with verified identity
    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity,
      name: displayName || identity,
      ttl: "4h", // 4 hour token validity
    });

    // Grant permissions based on verified role
    token.addGrant({
      room: JUNGLE_ROOM,
      roomJoin: true,
      canPublish: isPublisher, // SECURITY: Verified server-side
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
