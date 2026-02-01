import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { universeId } = req.query;

  if (!universeId || typeof universeId !== "string") {
    return res.status(400).json({ error: "universeId query parameter is required" });
  }

  try {
    const response = await fetch(
      `https://games.roblox.com/v1/games?universeIds=${encodeURIComponent(universeId)}`,
    );

    if (!response.ok) {
      console.error(`Roblox API error: ${response.statusText}`);
      return res.status(200).json({ playing: 0, visits: 0, favoritedCount: 0, name: "" });
    }

    const data = await response.json();
    const game = data.data?.[0];

    if (!game) {
      return res.status(200).json({ playing: 0, visits: 0, favoritedCount: 0, name: "" });
    }

    res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=300");
    return res.status(200).json({
      playing: game.playing ?? 0,
      visits: game.visits ?? 0,
      favoritedCount: game.favoritedCount ?? 0,
      name: game.name ?? "",
    });
  } catch (error) {
    console.error("Error fetching Roblox stats:", error);
    return res.status(200).json({ playing: 0, visits: 0, favoritedCount: 0, name: "" });
  }
}
