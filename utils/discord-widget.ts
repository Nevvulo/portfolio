import type { DiscordWidget } from "../types/discord";

const GUILD_ID = "363516708062756886";
const WIDGET_URL = `https://discord.com/api/guilds/${GUILD_ID}/widget.json`;

export async function fetchDiscordWidget(): Promise<DiscordWidget | null> {
  try {
    const response = await fetch(WIDGET_URL);
    if (!response.ok) {
      console.error("Failed to fetch Discord widget:", response.statusText);
      return null;
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching Discord widget:", error);
    return null;
  }
}
