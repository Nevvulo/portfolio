import { Redis } from "@upstash/redis";
import type { SupporterStatus } from "../types/supporter";

export const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL!,
	token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const SUPPORTER_KEY_PREFIX = "user:status:";
const SUPPORTER_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export function getSupporterKey(clerkUserId: string): string {
	return `${SUPPORTER_KEY_PREFIX}${clerkUserId}`;
}

export async function getSupporterStatus(
	clerkUserId: string,
): Promise<SupporterStatus | null> {
	const key = getSupporterKey(clerkUserId);
	const data = await redis.hgetall<Record<string, string>>(key);

	if (!data || Object.keys(data).length === 0) {
		return null;
	}

	return {
		twitchSubTier: data.twitchSubTier
			? (Number.parseInt(data.twitchSubTier, 10) as 1 | 2 | 3)
			: null,
		discordBooster: data.discordBooster === "true",
		twitchUserId: data.twitchUserId || undefined,
		discordUserId: data.discordUserId || undefined,
		clerkPlan:
			(data.clerkPlan as "super_legend" | "super_legend_2") || null,
		clerkPlanStatus:
			(data.clerkPlanStatus as "active" | "past_due" | "canceled") || null,
		lastSyncedAt: data.lastSyncedAt || new Date().toISOString(),
	};
}

export async function setSupporterStatus(
	clerkUserId: string,
	status: SupporterStatus,
): Promise<void> {
	const key = getSupporterKey(clerkUserId);

	const hashData: Record<string, string> = {
		twitchSubTier: status.twitchSubTier?.toString() ?? "",
		discordBooster: status.discordBooster.toString(),
		twitchUserId: status.twitchUserId ?? "",
		discordUserId: status.discordUserId ?? "",
		clerkPlan: status.clerkPlan ?? "",
		clerkPlanStatus: status.clerkPlanStatus ?? "",
		lastSyncedAt: status.lastSyncedAt,
	};

	await redis.hset(key, hashData);
	await redis.expire(key, SUPPORTER_TTL_SECONDS);
}

export async function updateSupporterField(
	clerkUserId: string,
	field: keyof SupporterStatus,
	value: string | number | boolean | null,
): Promise<void> {
	const key = getSupporterKey(clerkUserId);
	const stringValue =
		value === null || value === undefined ? "" : value.toString();

	await redis.hset(key, { [field]: stringValue });
	await redis.expire(key, SUPPORTER_TTL_SECONDS);
}

export async function deleteSupporterStatus(
	clerkUserId: string,
): Promise<void> {
	const key = getSupporterKey(clerkUserId);
	await redis.del(key);
}
