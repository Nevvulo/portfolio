const DISCORD_API = "https://discord.com/api/v10";
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

export interface GuildMember {
	user: {
		id: string;
		username: string;
		discriminator: string;
		avatar: string | null;
		global_name?: string;
	};
	nick: string | null;
	roles: string[];
	joined_at: string;
	premium_since: string | null; // ISO timestamp if boosting, null otherwise
	deaf: boolean;
	mute: boolean;
}

export async function getGuildMember(
	userId: string,
): Promise<GuildMember | null> {
	if (!BOT_TOKEN || !GUILD_ID) {
		throw new Error("Discord bot token or guild ID not configured");
	}

	const response = await fetch(
		`${DISCORD_API}/guilds/${GUILD_ID}/members/${userId}`,
		{
			headers: {
				Authorization: `Bot ${BOT_TOKEN}`,
			},
		},
	);

	if (!response.ok) {
		if (response.status === 404) {
			return null; // User not in guild
		}
		const errorText = await response.text();
		throw new Error(
			`Discord API error: ${response.statusText} - ${errorText}`,
		);
	}

	return response.json();
}

export interface BoosterStatus {
	isBooster: boolean;
	boostingSince: string | null;
}

export async function checkBoosterStatus(
	userId: string,
): Promise<BoosterStatus> {
	const member = await getGuildMember(userId);

	if (!member) {
		return { isBooster: false, boostingSince: null };
	}

	return {
		isBooster: member.premium_since !== null,
		boostingSince: member.premium_since,
	};
}
