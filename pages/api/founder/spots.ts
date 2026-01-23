import type { NextApiRequest, NextApiResponse } from "next";
import { getFounderCount, getFounderSpotsRemaining, MAX_FOUNDERS } from "../../../lib/redis";

export interface FounderSpotsResponse {
  spotsRemaining: number;
  totalSpots: number;
  claimedSpots: number;
}

/**
 * GET /api/founder/spots
 *
 * Returns the number of remaining founder spots.
 * This is a public endpoint (no auth required) used by the support page banner.
 *
 * Response:
 * {
 *   spotsRemaining: number (0-10)
 *   totalSpots: 10
 *   claimedSpots: number (0-10)
 * }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FounderSpotsResponse | { error: string }>,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const [spotsRemaining, claimedSpots] = await Promise.all([
      getFounderSpotsRemaining(),
      getFounderCount(),
    ]);

    // Cache for 30 seconds (short TTL since spots can change)
    res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");

    return res.status(200).json({
      spotsRemaining,
      totalSpots: MAX_FOUNDERS,
      claimedSpots,
    });
  } catch (error) {
    console.error("[founder/spots] Error fetching founder spots:", error);
    return res.status(500).json({ error: "Failed to fetch founder spots" });
  }
}
