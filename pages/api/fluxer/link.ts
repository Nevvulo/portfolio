import { timingSafeEqual } from "crypto";
import { eq } from "drizzle-orm";
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import type { LinkResponse } from "../discord/link";

const DISCORD_BOT_SECRET = process.env.DISCORD_BOT_LINK_SECRET;

export default async function handler(req: NextApiRequest, res: NextApiResponse<LinkResponse>) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  // Verify bot secret (timing-safe comparison)
  const authHeader = req.headers["x-bot-secret"] as string | undefined;
  if (
    !authHeader ||
    !DISCORD_BOT_SECRET ||
    authHeader.length !== DISCORD_BOT_SECRET.length ||
    !timingSafeEqual(Buffer.from(authHeader), Buffer.from(DISCORD_BOT_SECRET))
  ) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const { fluxerId } = req.body;

  if (!fluxerId || typeof fluxerId !== "string") {
    return res.status(400).json({ success: false, error: "Missing fluxerId" });
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.fluxerId, fluxerId),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "No linked account found. Please link your Fluxer account at https://nev.so/account first.",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        username: user.username ?? null,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl ?? null,
        tier: user.tier as "free" | "tier1" | "tier2",
        clerkPlan: user.clerkPlan ?? null,
        clerkPlanStatus: user.clerkPlanStatus ?? null,
        discordBooster: user.discordBooster ?? false,
        isCreator: user.isCreator,
      },
    });
  } catch (error) {
    console.error("[fluxer/link] Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch user data",
    });
  }
}
