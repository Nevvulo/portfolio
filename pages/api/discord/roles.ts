import type { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { PLANS } from "../../../lib/clerk";

const DISCORD_API = "https://discord.com/api/v10";
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN!;
const GUILD_ID = process.env.DISCORD_GUILD_ID!;

const PLAN_TO_ROLE: Record<string, string> = {
  // Slug names (for webhook events)
  [PLANS.SUPER_LEGEND]: process.env.DISCORD_ROLE_SUPER_LEGEND!,
  [PLANS.SUPER_LEGEND_2]: process.env.DISCORD_ROLE_SUPER_LEGEND_2!,
  // Clerk internal plan IDs (dev)
  "cplan_36glMpITSsfy0ftlNNL2FYvKnGL": process.env.DISCORD_ROLE_SUPER_LEGEND!,
  "cplan_36gqZlOflmAmtcH5nGrMShDMO17": process.env.DISCORD_ROLE_SUPER_LEGEND_2!,
};

// All supporter roles (for removal when subscription ends)
const ALL_SUPPORTER_ROLES = [
  process.env.DISCORD_ROLE_SUPER_LEGEND!,
  process.env.DISCORD_ROLE_SUPER_LEGEND_2!,
];

async function getDiscordUserId(clerkUserId: string): Promise<string | null> {
  const client = await clerkClient();
  const user = await client.users.getUser(clerkUserId);

  // Find Discord OAuth account
  const discordAccount = user.externalAccounts.find(
    (account) => account.provider === "oauth_discord"
  );

  if (!discordAccount) return null;

  // Clerk stores Discord user ID in externalId, not providerUserId
  const externalId = (discordAccount as any).externalId;
  return externalId ?? null;
}

async function addRole(discordUserId: string, roleId: string): Promise<boolean> {
  const url = `${DISCORD_API}/guilds/${GUILD_ID}/members/${discordUserId}/roles/${roleId}`;
  console.log(`[Discord] Adding role: PUT ${url}`);

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  const text = await res.text();
  console.log(`[Discord] Add role response: ${res.status} ${res.statusText}`, text || "(empty)");

  return res.ok;
}

async function removeRole(discordUserId: string, roleId: string): Promise<boolean> {
  const url = `${DISCORD_API}/guilds/${GUILD_ID}/members/${discordUserId}/roles/${roleId}`;
  console.log(`[Discord] Removing role: DELETE ${url}`);

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`,
    },
  });

  const text = await res.text();
  console.log(`[Discord] Remove role response: ${res.status} ${res.statusText}`, text || "(empty)");

  return res.ok;
}

export async function syncDiscordRoles(
  clerkUserId: string,
  activePlanId: string | null
): Promise<{ success: boolean; error?: string }> {
  console.log(`[syncDiscordRoles] clerkUserId: ${clerkUserId}, planId: ${activePlanId}`);
  console.log(`[syncDiscordRoles] PLAN_TO_ROLE mapping:`, PLAN_TO_ROLE);

  const discordUserId = await getDiscordUserId(clerkUserId);
  console.log(`[syncDiscordRoles] discordUserId: ${discordUserId}`);

  if (!discordUserId) {
    return { success: false, error: "No Discord account linked" };
  }

  // Remove all supporter roles first
  for (const roleId of ALL_SUPPORTER_ROLES) {
    await removeRole(discordUserId, roleId);
  }

  // Add the role for their current plan (if any)
  if (activePlanId && PLAN_TO_ROLE[activePlanId]) {
    const roleId = PLAN_TO_ROLE[activePlanId];
    console.log(`[syncDiscordRoles] Adding role ${roleId} for plan ${activePlanId}`);
    const added = await addRole(discordUserId, roleId);
    if (!added) {
      return { success: false, error: "Failed to add role - user may not be in server" };
    }
  } else {
    console.log(`[syncDiscordRoles] No role to add - planId: ${activePlanId}, mapped: ${PLAN_TO_ROLE[activePlanId || ""]}`);
  }

  return { success: true };
}

// API endpoint for manual sync (user can trigger from account page)
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Get user's current subscription from Clerk
  // For now, we'll need the plan passed in or fetched from Clerk billing
  const { planId } = req.body as { planId?: string };

  const result = await syncDiscordRoles(userId, planId ?? null);

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  return res.status(200).json({ success: true });
}
