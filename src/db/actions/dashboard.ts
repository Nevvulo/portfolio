"use server";

import { and, asc, eq } from "drizzle-orm";
import { db } from "../index";
import { featuredContent, tierClaimRecords, tierClaimables, users } from "../schema";
import { getCurrentUser, requireUser } from "../auth";
import { getUserWidgetInteractions } from "../queries/dashboard";
import { getTodayXpBreakdown } from "../queries/experience";

/** Get current user's widget interactions (for bento layout ordering). */
export async function getMyWidgetInteractions() {
  const user = await getCurrentUser();
  if (!user) return [];
  return getUserWidgetInteractions(user.id);
}

/** Get today's XP breakdown for current user. */
export async function getTodayXpBreakdownAction() {
  const user = await getCurrentUser();
  if (!user) return null;
  return getTodayXpBreakdown(user.id);
}

/** Get featured content by slot (e.g. "hero"). */
export async function getFeaturedContentBySlot(slot: string) {
  return db.query.featuredContent.findMany({
    where: eq(featuredContent.slot, slot),
    orderBy: [asc(featuredContent.displayOrder)],
  });
}

/** Get current user's full profile (more fields than getMe). */
export async function getMyProfile() {
  const user = await getCurrentUser();
  if (!user) return null;
  return {
    id: user.id,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    username: user.username,
    isCreator: user.isCreator,
    role: user.role,
    tier: user.tier,
    discordId: user.discordId,
    twitchUsername: user.twitchUsername,
    robloxUserId: user.robloxUserId,
  };
}

/** Get available tier claimables for the current user. */
export async function getAvailableClaimables() {
  const user = await requireUser();
  const tier = user.tier ?? "free";

  // Determine which tiers the user can claim
  const allowedTiers = tier === "tier2" ? ["tier1", "tier2"] : tier === "tier1" ? ["tier1"] : [];
  if (allowedTiers.length === 0) return [];

  const claimables = await db.query.tierClaimables.findMany({
    where: eq(tierClaimables.isActive, true),
    with: { item: true, claims: true },
    orderBy: [asc(tierClaimables.displayOrder)],
  });

  // Filter by allowed tiers and check if already claimed
  return claimables
    .filter((c) => allowedTiers.includes(c.requiredTier))
    .map((c) => ({
      id: c.id,
      headline: c.headline,
      requiredTier: c.requiredTier,
      item: c.item,
      claimed: c.claims.some((claim) => claim.userId === user.id),
    }));
}

/** Claim a tier item. */
export async function claimTierItem(tierClaimableId: number) {
  const user = await requireUser();

  // Verify claimable exists and user hasn't already claimed
  const claimable = await db.query.tierClaimables.findFirst({
    where: eq(tierClaimables.id, tierClaimableId),
  });
  if (!claimable) throw new Error("Claimable not found");

  const existingClaim = await db.query.tierClaimRecords.findFirst({
    where: and(
      eq(tierClaimRecords.tierClaimableId, tierClaimableId),
      eq(tierClaimRecords.userId, user.id),
    ),
  });
  if (existingClaim) throw new Error("Already claimed");

  await db.insert(tierClaimRecords).values({
    tierClaimableId,
    userId: user.id,
  });

  return { success: true };
}

/** Get linked services for the current user. */
export async function getLinkedServices() {
  const user = await getCurrentUser();
  if (!user) return [];
  const services = user.linkedServices as Array<{ slug: string; serviceUserId?: string; serviceUsername?: string; linkedAt: number }> | null;
  return services ?? [];
}

/** Link a service for the current user (persist to DB). */
export async function linkServiceAction(slug: string, serviceUserId?: string, serviceUsername?: string) {
  const user = await requireUser();
  const existing = (user.linkedServices as Array<{ slug: string; serviceUserId?: string; serviceUsername?: string; linkedAt: number }> | null) ?? [];

  // Check if already linked
  if (existing.some((s) => s.slug === slug)) return { success: true };

  const updated = [...existing, { slug, serviceUserId, serviceUsername, linkedAt: Date.now() }];
  await db.update(users).set({ linkedServices: updated }).where(eq(users.id, user.id));
  return { success: true };
}
