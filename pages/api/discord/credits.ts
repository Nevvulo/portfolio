import { timingSafeEqual } from "crypto";
import { and, eq, gte, isNotNull, or } from "drizzle-orm";
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";

// Secret for bot-to-server authentication
const DISCORD_BOT_SECRET = process.env.DISCORD_BOT_LINK_SECRET;

type CreditUser = {
  id: number;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  tier: string;
  twitchSubTier?: number | null;
  discordBooster?: boolean | null;
  clerkPlan?: string | null;
  clerkPlanStatus?: string | null;
  isCreator?: boolean;
  role?: number | null;
  isContributor?: boolean | null;
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

function toPaginatedSection(items: CreditUser[], limit: number): PaginatedSection {
  return {
    items: items.slice(0, limit),
    hasMore: items.length > limit,
    total: items.length,
  };
}

function mapUser(u: typeof users.$inferSelect): CreditUser {
  return {
    id: u.id,
    displayName: u.displayName,
    username: u.username,
    avatarUrl: u.avatarUrl,
    tier: u.tier,
    twitchSubTier: u.twitchSubTier,
    discordBooster: u.discordBooster,
    clerkPlan: u.clerkPlan,
    clerkPlanStatus: u.clerkPlanStatus,
    isCreator: u.isCreator,
    role: u.role,
    isContributor: u.isContributor,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<CreditsResponse>) {
  if (req.method !== "GET") {
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

  const limit = 100;

  try {
    // Fetch all users who show on credits
    const allUsers = await db.query.users.findMany({
      where: eq(users.showOnCredits, true),
    });

    const mapped = allUsers.map(mapUser);

    // Staff: role >= 1 or isCreator
    const staff = mapped.filter((u) => u.isCreator || (u.role && u.role >= 1));

    // Super Legend II: clerkPlan = super_legend_2
    const superLegendII = mapped.filter(
      (u) => u.clerkPlan === "super_legend_2" && u.clerkPlanStatus === "active",
    );

    // Super Legend I: clerkPlan = super_legend
    const superLegendI = mapped.filter(
      (u) => u.clerkPlan === "super_legend" && u.clerkPlanStatus === "active",
    );

    // Twitch subs
    const twitchTier3 = mapped.filter((u) => u.twitchSubTier === 3);
    const twitchTier2 = mapped.filter((u) => u.twitchSubTier === 2);
    const twitchTier1 = mapped.filter((u) => u.twitchSubTier === 1);

    // Discord boosters
    const discordBoosters = mapped.filter((u) => u.discordBooster);

    // Contributors
    const contributors = mapped.filter((u) => u.isContributor);

    return res.status(200).json({
      success: true,
      data: {
        staff: toPaginatedSection(staff, limit),
        superLegendII: toPaginatedSection(superLegendII, limit),
        superLegendI: toPaginatedSection(superLegendI, limit),
        twitch: {
          tier3: toPaginatedSection(twitchTier3, limit),
          tier2: toPaginatedSection(twitchTier2, limit),
          tier1: toPaginatedSection(twitchTier1, limit),
        },
        discordBoosters: toPaginatedSection(discordBoosters, limit),
        contributors: toPaginatedSection(contributors, limit),
      },
    });
  } catch (error) {
    console.error("[discord/credits] Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch credits data",
    });
  }
}
