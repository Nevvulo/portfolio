import { ConvexHttpClient } from "convex/browser";
import type { NextApiRequest, NextApiResponse } from "next";
import { api } from "../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Secret for bot-to-server authentication
const DISCORD_BOT_SECRET = process.env.DISCORD_BOT_LINK_SECRET;

type CreditUser = {
  _id: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  tier: string;
  twitchSubTier?: 1 | 2 | 3 | null;
  discordBooster?: boolean | null;
  clerkPlan?: string | null;
  clerkPlanStatus?: string | null;
  isCreator?: boolean;
  role?: number;
  isContributor?: boolean;
};

type PaginatedSection = {
  items: CreditUser[];
  hasMore: boolean;
  total: number;
};

export interface CreditsResponse {
  success: boolean;
  error?: string;
  data?: {
    staff: PaginatedSection;
    superLegendII: PaginatedSection;
    superLegendI: PaginatedSection;
    twitch: {
      tier3: PaginatedSection;
      tier2: PaginatedSection;
      tier1: PaginatedSection;
    };
    discordBoosters: PaginatedSection;
    contributors: PaginatedSection;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<CreditsResponse>) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  // Verify bot secret
  const authHeader = req.headers["x-bot-secret"];
  if (!DISCORD_BOT_SECRET || authHeader !== DISCORD_BOT_SECRET) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  try {
    // Fetch credits data from Convex
    const credits = await convex.query(api.users.getCreditsPage, { limit: 100 });

    return res.status(200).json({
      success: true,
      data: credits,
    });
  } catch (error) {
    console.error("[discord/credits] Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch credits data",
    });
  }
}
