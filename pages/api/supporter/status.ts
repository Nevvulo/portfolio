import { getAuth } from "@clerk/nextjs/server";
import type { NextApiRequest, NextApiResponse } from "next";
import { getSupporterStatus } from "../../../lib/redis";
import type { SupporterStatusResponse } from "../../../types/supporter";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SupporterStatusResponse | { error: string }>,
) {
  console.log("[supporter/status] Request received", { method: req.method });

  if (req.method !== "GET") {
    console.log("[supporter/status] Method not allowed:", req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId } = getAuth(req);
  console.log("[supporter/status] Auth check:", { userId: userId ?? "null" });

  if (!userId) {
    console.log("[supporter/status] Unauthorized - no userId");
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    console.log("[supporter/status] Fetching status for user:", userId);
    const status = await getSupporterStatus(userId);
    console.log("[supporter/status] Got status:", status);

    // Check if data is stale (older than 24 hours)
    const needsSync =
      !status || Date.now() - new Date(status.lastSyncedAt).getTime() > 24 * 60 * 60 * 1000;

    console.log("[supporter/status] Returning success", { status, needsSync });
    return res.status(200).json({
      status,
      needsSync,
    });
  } catch (error) {
    console.error("[supporter/status] Error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get supporter status",
    });
  }
}
