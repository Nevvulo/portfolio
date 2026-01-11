import type { NextApiRequest, NextApiResponse } from "next";
import { getClerkIdByDiscordId } from "../../../lib/redis";

/**
 * API endpoint to look up Clerk user ID from Discord user ID
 * Used by Convex to link Discord wormhole messages to website users
 *
 * POST /api/lounge/discord-lookup
 * Body: { discordIds: string[] }
 * Response: { mappings: { [discordId: string]: string | null } }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Verify internal secret to prevent abuse
  const secret = req.headers["x-internal-secret"];
  if (secret !== process.env.DISCORD_WORMHOLE_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { discordIds } = req.body;

  if (!Array.isArray(discordIds)) {
    return res.status(400).json({ error: "discordIds must be an array" });
  }

  // Limit batch size
  if (discordIds.length > 50) {
    return res.status(400).json({ error: "Maximum 50 Discord IDs per request" });
  }

  try {
    const mappings: Record<string, string | null> = {};

    // Look up each Discord ID in parallel
    await Promise.all(
      discordIds.map(async (discordId: string) => {
        const clerkId = await getClerkIdByDiscordId(discordId);
        mappings[discordId] = clerkId;
      }),
    );

    return res.status(200).json({ mappings });
  } catch (error) {
    console.error("[discord-lookup] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
