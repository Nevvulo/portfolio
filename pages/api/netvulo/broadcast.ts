import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Netvulo Event Broadcasting Endpoint
 *
 * Called from Convex scheduled actions to POST events to netvulo
 * for WebSocket broadcasting to connected clients.
 *
 * Event types:
 * - INVENTORY_ITEM_GRANTED
 * - LOOTBOX_DELIVERED
 * - LOOTBOX_OPENED
 * - TIER_ITEM_CLAIMED
 * - ITEM_USED
 */

const NETVULO_BROADCAST_URL =
  process.env.NETVULO_BROADCAST_URL || "https://net.nev.so/api/v1/events/broadcast";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Internal auth - only called from our own Convex actions
  const apiKey = req.headers["x-api-key"];
  if (apiKey !== process.env.INVENTORY_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { eventType, payload } = req.body;

  if (!eventType || !payload) {
    return res.status(400).json({ error: "Missing eventType or payload" });
  }

  const netvuloApiKey = process.env.NETVULO_API_KEY;
  if (!netvuloApiKey) {
    console.warn("[netvulo/broadcast] NETVULO_API_KEY not configured, skipping broadcast");
    return res.status(200).json({ skipped: true, reason: "netvulo not configured" });
  }

  try {
    const response = await fetch(NETVULO_BROADCAST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": netvuloApiKey,
      },
      body: JSON.stringify({
        event_type: eventType,
        data: payload,
        timestamp: Date.now(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[netvulo/broadcast] Failed: ${response.status} ${errorText}`);
      return res.status(502).json({ error: "Broadcast failed", status: response.status });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[netvulo/broadcast] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
