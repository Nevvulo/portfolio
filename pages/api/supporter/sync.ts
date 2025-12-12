import type { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import { setSupporterStatus } from "../../../lib/redis";
import { checkUserSubscription } from "../../../utils/twitch";
import { checkBoosterStatus, getMemberHighestRole } from "../../../utils/discord-member";
import type { SupporterStatus, DiscordRole } from "../../../types/supporter";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
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
		const twitchAccount = user.externalAccounts.find(
			(a) => a.provider === "oauth_twitch",
		);
		const discordAccount = user.externalAccounts.find(
			(a) => a.provider === "oauth_discord",
		);

		// Get Clerk subscription status via Clerk Billing API
		let clerkPlan: SupporterStatus["clerkPlan"] = null;
		let clerkPlanStatus: SupporterStatus["clerkPlanStatus"] = null;

		try {
			// Fetch user's billing subscription from Clerk
			const billingRes = await fetch(
				`https://api.clerk.com/v1/users/${userId}/billing/subscription`,
				{
					headers: {
						Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
					},
				}
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
				} else if (planSlug === "super_legend_2" || planName === "super_legend_ii" || planName === "super_legend_2") {
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

		let twitchSubTier: SupporterStatus["twitchSubTier"] = null;
		let twitchUserId: string | undefined;
		let discordBooster = false;
		let discordUserId: string | undefined;
		let discordHighestRole: DiscordRole | null = null;

		// Check Twitch subscription
		if (twitchAccount) {
			try {
				twitchUserId =
					(twitchAccount as unknown as { externalId?: string })
						.externalId || undefined;
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
					(discordAccount as unknown as { externalId?: string })
						.externalId || undefined;
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

		const supporterStatus: SupporterStatus = {
			twitchSubTier,
			discordBooster,
			discordHighestRole,
			twitchUserId,
			discordUserId,
			clerkPlan,
			clerkPlanStatus,
			lastSyncedAt: now,
		};

		console.log("[supporter/sync] Built status:", JSON.stringify(supporterStatus, null, 2));

		// Store in Redis
		console.log("[supporter/sync] Storing in Redis...");
		await setSupporterStatus(userId, supporterStatus);
		console.log("[supporter/sync] Stored successfully");

		// Update supporter status in Convex for UserPopout display
		try {
			// Get usernames from Clerk accounts
			const discordUsername = discordAccount?.username || undefined;
			const twitchUsername = twitchAccount?.username || undefined;

			await convex.mutation(api.users.updateSupporterStatus, {
				clerkId: userId,
				discordHighestRole: discordHighestRole || undefined,
				twitchSubTier: twitchSubTier || undefined,
				discordBooster: discordBooster || undefined,
				clerkPlan: clerkPlan || undefined,
				clerkPlanStatus: clerkPlanStatus || undefined,
				discordUsername,
				twitchUsername,
			});
			console.log("[supporter/sync] Updated supporter status in Convex");
		} catch (error) {
			console.error("[supporter/sync] Failed to update Convex supporter status:", error);
			// Don't fail the whole sync for this
		}

		// Also update Discord → Clerk mapping in Convex for wormhole linking
		if (discordUserId) {
			try {
				await convex.mutation(api.discord.upsertDiscordClerkMapping, {
					discordId: discordUserId,
					clerkId: userId,
				});
				console.log("[supporter/sync] Updated Discord→Clerk mapping in Convex");
			} catch (error) {
				console.error("[supporter/sync] Failed to update Convex mapping:", error);
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
			error:
				error instanceof Error
					? error.message
					: "Failed to sync supporter status",
		});
	}
}
