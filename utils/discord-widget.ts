import type { DiscordWidget } from "../types/discord";

const GUILD_ID = "363516708062756886";
const WIDGET_URL = `https://discord.com/api/guilds/${GUILD_ID}/widget.json`;

// Cache Discord widget for 5 minutes to avoid redundant fetches across SSR requests
let cachedWidget: DiscordWidget | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function fetchDiscordWidget(): Promise<DiscordWidget | null> {
  if (cachedWidget && Date.now() < cacheExpiry) {
    return cachedWidget;
  }

  try {
    const response = await fetch(WIDGET_URL);
    if (!response.ok) {
      console.error("Failed to fetch Discord widget:", response.statusText);
      return cachedWidget; // Return stale cache if available
    }
    const data = await response.json();
    cachedWidget = data;
    cacheExpiry = Date.now() + CACHE_TTL_MS;
    return data;
  } catch (error) {
    console.error("Error fetching Discord widget:", error);
    return cachedWidget; // Return stale cache if available
  }
}
