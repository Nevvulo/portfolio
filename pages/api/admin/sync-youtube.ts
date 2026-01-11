import { ConvexHttpClient } from "convex/browser";
import type { NextApiRequest, NextApiResponse } from "next";
import { api } from "../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // SECURITY: Always require authentication - fail closed, not open
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    console.error("ADMIN_SECRET environment variable is not set");
    return res.status(500).json({ error: "Server misconfiguration" });
  }

  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${adminSecret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { action: actionType, handle = "@Nevvulo", autoPublish = true } = req.body || {};

    // Support reorder action
    if (actionType === "reorder") {
      const result = await convex.action(api.youtube.reorderPosts, {});
      return res.status(200).json(result);
    }

    // Default: sync videos
    const result = await convex.action(api.youtube.syncFromHandle, {
      handle,
      autoPublish,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("YouTube sync error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
