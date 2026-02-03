import type { NextApiRequest, NextApiResponse } from "next";

export interface SuperLegendService {
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
}

interface CachedResponse {
  services: SuperLegendService[];
  fetchedAt: number;
}

// Simple in-memory cache (5 minute TTL)
let cachedServices: CachedResponse | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Check cache
  const now = Date.now();
  if (cachedServices && now - cachedServices.fetchedAt < CACHE_TTL_MS) {
    return res.status(200).json({ services: cachedServices.services });
  }

  const netvuloUrl = process.env.NETVULO_API_URL;
  if (!netvuloUrl) {
    return res.status(200).json({ services: [] });
  }

  try {
    const response = await fetch(`${netvuloUrl}/api/v1/services/super-legend`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`Netvulo API returned ${response.status}`);
      return res.status(200).json({ services: cachedServices?.services ?? [] });
    }

    const services: SuperLegendService[] = await response.json();

    // Update cache
    cachedServices = {
      services,
      fetchedAt: now,
    };

    return res.status(200).json({ services });
  } catch (error) {
    console.error("Failed to fetch Super Legend services:", error);
    // Return cached data if available, otherwise empty
    return res.status(200).json({ services: cachedServices?.services ?? [] });
  }
}
