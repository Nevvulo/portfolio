import type { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { setSupporterStatus } from "../../../lib/redis";
import { checkUserSubscription } from "../../../utils/twitch";
import { checkBoosterStatus } from "../../../utils/discord-member";
import type { SupporterStatus } from "../../../types/supporter";

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

		// Get Clerk subscription status
		let clerkPlan: SupporterStatus["clerkPlan"] = null;
		let clerkPlanStatus: SupporterStatus["clerkPlanStatus"] = null;

		// Check for active subscription in user metadata or billing
		const publicMetadata = user.publicMetadata as {
			subscriptionPlan?: string;
			subscriptionStatus?: string;
		};
		if (publicMetadata.subscriptionPlan) {
			clerkPlan = publicMetadata.subscriptionPlan as typeof clerkPlan;
			clerkPlanStatus =
				(publicMetadata.subscriptionStatus as typeof clerkPlanStatus) ||
				"active";
		}

		let twitchSubTier: SupporterStatus["twitchSubTier"] = null;
		let twitchUserId: string | undefined;
		let discordBooster = false;
		let discordUserId: string | undefined;

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

		// Check Discord booster status
		if (discordAccount) {
			try {
				discordUserId =
					(discordAccount as unknown as { externalId?: string })
						.externalId || undefined;
				if (discordUserId) {
					const boost = await checkBoosterStatus(discordUserId);
					discordBooster = boost.isBooster;
				}
			} catch (error) {
				console.error("Failed to check Discord booster status:", error);
			}
		}

		const now = new Date().toISOString();

		const supporterStatus: SupporterStatus = {
			twitchSubTier,
			discordBooster,
			twitchUserId,
			discordUserId,
			clerkPlan,
			clerkPlanStatus,
			lastSyncedAt: now,
		};

		// Store in Redis
		await setSupporterStatus(userId, supporterStatus);

		return res.status(200).json({
			success: true,
			status: supporterStatus,
		});
	} catch (error) {
		console.error("Failed to sync supporter status:", error);
		return res.status(500).json({
			error:
				error instanceof Error
					? error.message
					: "Failed to sync supporter status",
		});
	}
}
