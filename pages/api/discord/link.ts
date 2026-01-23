import { ConvexHttpClient } from "convex/browser";
import type { NextApiRequest, NextApiResponse } from "next";
import { api } from "../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Secret for bot-to-server authentication
const DISCORD_BOT_SECRET = process.env.DISCORD_BOT_LINK_SECRET;

export interface LinkResponse {
  success: boolean;
  error?: string;
  data?: {
    username: string | null;
    displayName: string;
    avatarUrl: string | null;
    tier: "free" | "tier1" | "tier2";
    clerkPlan: string | null;
    clerkPlanStatus: string | null;
    discordBooster: boolean;
    isCreator: boolean;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<LinkResponse>) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  // Verify bot secret
  const authHeader = req.headers["x-bot-secret"];
  if (!DISCORD_BOT_SECRET || authHeader !== DISCORD_BOT_SECRET) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const { discordId } = req.body;

  if (!discordId || typeof discordId !== "string") {
    return res.status(400).json({ success: false, error: "Missing discordId" });
  }

  try {
    // Look up user by Discord ID in Convex
    const user = await convex.query(api.discord.getUserByDiscordId, { discordId });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "No linked account found. Please link your Discord at https://nev.so/account first.",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        username: user.username ?? null,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl ?? null,
        tier: user.tier,
        clerkPlan: user.clerkPlan ?? null,
        clerkPlanStatus: user.clerkPlanStatus ?? null,
        discordBooster: user.discordBooster ?? false,
        isCreator: user.isCreator,
      },
    });
  } catch (error) {
    console.error("[discord/link] Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch user data",
    });
  }
}
