import type { NextApiRequest, NextApiResponse } from "next";

interface RobloxUniverseStats {
  visits: number;
  playing: number;
  favoritedCount: number;
}

interface RobloxGameData {
  id: number;
  name: string;
  visits: number;
  playing: number;
  favoritedCount: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RobloxUniverseStats | { error: string }>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { universeId } = req.query;

  if (!universeId || typeof universeId !== "string") {
    return res.status(400).json({ error: "universeId is required" });
  }

  try {
    // Fetch universe details from Roblox API
    const response = await fetch(
      `https://games.roblox.com/v1/games?universeIds=${universeId}`
    );

    if (!response.ok) {
      console.error(`Roblox API error: ${response.status}`);
      return res.status(502).json({ error: "Failed to fetch from Roblox API" });
    }

    const data = await response.json();
    const game: RobloxGameData | undefined = data.data?.[0];

    if (!game) {
      return res.status(404).json({ error: "Universe not found" });
    }

    // Cache for 60 seconds
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");

    return res.status(200).json({
      visits: game.visits,
      playing: game.playing,
      favoritedCount: game.favoritedCount,
    });
  } catch (error) {
    console.error("[roblox/universe-stats] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
