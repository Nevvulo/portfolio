import { clerkClient, getAuth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { grantFounderStatus } from "../../../lib/founder";
import { setSupporterStatus } from "../../../lib/redis";
import type { DiscordRole, SupporterStatus } from "../../../types/supporter";
import { checkBoosterStatus, getMemberHighestRole } from "../../../utils/discord-member";
import { checkUserSubscription } from "../../../utils/twitch";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    // Get connected accounts
    const twitchAccount = user.externalAccounts.find((a) => a.provider === "oauth_twitch");
    const discordAccount = user.externalAccounts.find((a) => a.provider === "oauth_discord");

    // Get Clerk subscription status — check manual override first, then Clerk Billing API
    let clerkPlan: SupporterStatus["clerkPlan"] = null;
    let clerkPlanStatus: SupporterStatus["clerkPlanStatus"] = null;

    // Manual override via publicMetadata (for PayPal/external payments)
    const manualPlan = user.publicMetadata?.manualPlan as string | undefined;
    const manualStatus = user.publicMetadata?.manualPlanStatus as string | undefined;
    if (manualPlan === "super_legend" || manualPlan === "super_legend_2") {
      clerkPlan = manualPlan;
      clerkPlanStatus = (manualStatus as SupporterStatus["clerkPlanStatus"]) || "active";
      console.log(`[supporter/sync] Manual plan override: ${clerkPlan} (${clerkPlanStatus})`);
    }

    // If no manual override, check Clerk Billing API
    if (!clerkPlan) {
      try {
        // Fetch user's billing subscription from Clerk
        const billingRes = await fetch(
          `https://api.clerk.com/v1/users/${userId}/billing/subscription`,
          {
            headers: {
              Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
            },
          },
        );

        if (billingRes.ok) {
          const billingData = await billingRes.json();

          // Extract plan from subscription_items array (Clerk Billing structure)
          const item = billingData.subscription_items?.[0];
          const planSlug = item?.plan?.slug;
          const planName = item?.plan?.name?.toLowerCase().replace(/\s+/g, "_");
          const status = billingData.status;

          // Match against our plan identifiers
          if (planSlug === "super_legend" || planName === "super_legend") {
            clerkPlan = "super_legend";
          } else if (
            planSlug === "super_legend_2" ||
            planName === "super_legend_ii" ||
            planName === "super_legend_2"
          ) {
            clerkPlan = "super_legend_2";
          }

          if (status === "active" || status === "past_due" || status === "canceled") {
            clerkPlanStatus = status;
          } else if (clerkPlan) {
            clerkPlanStatus = "active";
          }
        }
      } catch (error) {
        console.error("Error fetching Clerk subscription:", error);
      }
    }

    let twitchSubTier: SupporterStatus["twitchSubTier"] = null;
    let twitchUserId: string | undefined;
    let discordBooster = false;
    let discordUserId: string | undefined;
    let discordHighestRole: DiscordRole | null = null;

    // Check Twitch subscription
    if (twitchAccount) {
      try {
        twitchUserId =
          (twitchAccount as unknown as { externalId?: string }).externalId || undefined;
        if (twitchUserId) {
          const sub = await checkUserSubscription(twitchUserId);
          twitchSubTier = sub.tier;
        }
      } catch (error) {
        console.error("Failed to check Twitch subscription:", error);
      }
    }

    // Check Discord booster status and highest role
    if (discordAccount) {
      try {
        discordUserId =
          (discordAccount as unknown as { externalId?: string }).externalId || undefined;
        if (discordUserId) {
          const boost = await checkBoosterStatus(discordUserId);
          discordBooster = boost.isBooster;

          // Fetch highest role
          const highestRole = await getMemberHighestRole(discordUserId);
          if (highestRole) {
            discordHighestRole = {
              id: highestRole.id,
              name: highestRole.name,
              color: highestRole.color,
              position: highestRole.position,
            };
          }
        }
      } catch (error) {
        console.error("Failed to check Discord status:", error);
      }
    }

    const now = new Date().toISOString();

    // If user has an active paid subscription, attempt to grant founder status
    let founderNumber: SupporterStatus["founderNumber"] = null;
    if (clerkPlan && clerkPlanStatus === "active") {
      try {
        console.log("[supporter/sync] User has active subscription, checking founder status...");
        const founderResult = await grantFounderStatus(userId);
        if (founderResult.success && founderResult.founderNumber) {
          founderNumber = founderResult.founderNumber;
          console.log(
            `[supporter/sync] Founder status: ${founderResult.alreadyFounder ? "already founder" : "newly granted"} #${founderNumber}`,
          );
        } else if (!founderResult.success) {
          console.log(
            `[supporter/sync] Founder slots full (${founderResult.slotsRemaining} remaining)`,
          );
        }
      } catch (error) {
        console.error("[supporter/sync] Failed to grant founder status:", error);
        // Don't fail the whole sync for this
      }
    }

    // Build supporter status with founder number
    const supporterStatus: SupporterStatus = {
      twitchSubTier,
      discordBooster,
      discordHighestRole,
      twitchUserId,
      discordUserId,
      clerkPlan,
      clerkPlanStatus,
      founderNumber,
      lastSyncedAt: now,
    };

    console.log("[supporter/sync] Built status:", JSON.stringify(supporterStatus, null, 2));

    // Store in Redis
    console.log("[supporter/sync] Storing in Redis...");
    await setSupporterStatus(userId, supporterStatus);
    console.log("[supporter/sync] Stored successfully");

    // Update supporter status in Postgres
    try {
      // Get usernames from Clerk accounts
      const discordUsername = discordAccount?.username || undefined;
      const twitchUsername = twitchAccount?.username || undefined;

      await db
        .update(users)
        .set({
          discordHighestRole: discordHighestRole || undefined,
          twitchSubTier: twitchSubTier || undefined,
          discordBooster: discordBooster || undefined,
          clerkPlan: clerkPlan || undefined,
          clerkPlanStatus: clerkPlanStatus || undefined,
          founderNumber: founderNumber ?? undefined,
          discordUsername,
          twitchUsername,
          supporterSyncedAt: new Date(),
        })
        .where(eq(users.clerkId, userId));

      console.log("[supporter/sync] Updated supporter status in Postgres");
    } catch (error) {
      console.error("[supporter/sync] Failed to update Postgres supporter status:", error);
      // Don't fail the whole sync for this
    }

    // Also update external account ID mappings in Postgres
    const idMappings: Record<string, string> = {};
    if (discordUserId) idMappings.discordId = discordUserId;

    const fluxerAccount = user.externalAccounts.find((a) => a.provider === "oauth_custom_fluxer");
    if (fluxerAccount) {
      const fluxerExternalId = (fluxerAccount as unknown as { externalId?: string }).externalId;
      if (fluxerExternalId) idMappings.fluxerId = fluxerExternalId;
    }

    const robloxAccount = user.externalAccounts.find((a) => a.provider === "oauth_custom_roblox");
    if (robloxAccount) {
      const robloxExternalId = (robloxAccount as unknown as { externalId?: string }).externalId;
      if (robloxExternalId) idMappings.robloxUserId = robloxExternalId;
      const robloxUsername = robloxAccount.username;
      if (robloxUsername) idMappings.robloxUsername = robloxUsername;
    }

    if (Object.keys(idMappings).length > 0) {
      try {
        await db
          .update(users)
          .set(idMappings)
          .where(eq(users.clerkId, userId));

        console.log("[supporter/sync] Updated external account ID mappings in Postgres:", Object.keys(idMappings));
      } catch (error) {
        console.error("[supporter/sync] Failed to update external account mappings:", error);
        // Don't fail the whole sync for this
      }
    }

    return res.status(200).json({
      success: true,
      status: supporterStatus,
    });
  } catch (error) {
    console.error("[supporter/sync] Failed to sync:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to sync supporter status",
    });
  }
}
