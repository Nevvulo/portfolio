import type { TwitchSubscriptionResponse, TwitchTokenResponse } from "../types/twitch";

const TWITCH_USERNAME = "Nevvulo";
export const TWITCH_USER_ID = "92360014"; // Nevvulo's Twitch user ID

export const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const TWITCH_BROADCASTER_REFRESH_TOKEN = process.env.TWITCH_BROADCASTER_REFRESH_TOKEN;

let cachedToken: { access_token: string; expires_at: number } | null = null;
let broadcasterToken: { access_token: string; expires_at: number } | null = null;

export async function getTwitchAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && cachedToken.expires_at > Date.now()) {
    return cachedToken.access_token;
  }

  if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
    throw new Error("Twitch credentials not configured");
  }

  try {
    const response = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: TWITCH_CLIENT_ID,
        client_secret: TWITCH_CLIENT_SECRET,
        grant_type: "client_credentials",
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get Twitch access token: ${response.statusText}`);
    }

    const data = await response.json();

    // Cache the token (expires_in is in seconds, convert to milliseconds)
    cachedToken = {
      access_token: data.access_token,
      expires_at: Date.now() + data.expires_in * 1000 - 60000, // Subtract 1 minute for safety
    };

    return data.access_token;
  } catch (error) {
    console.error("Error getting Twitch access token:", error);
    throw error;
  }
}

export async function checkTwitchLiveStatus(): Promise<boolean> {
  try {
    if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
      console.warn("Twitch credentials not configured, using fallback method");
      // Fallback to decapi.me if credentials aren't configured
      const response = await fetch(`https://decapi.me/twitch/uptime/${TWITCH_USERNAME}`);
      const text = await response.text();
      return !text.includes("offline");
    }

    const accessToken = await getTwitchAccessToken();

    // Check if the user is currently streaming
    const response = await fetch(`https://api.twitch.tv/helix/streams?user_id=${TWITCH_USER_ID}`, {
      headers: {
        "Client-ID": TWITCH_CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Twitch API error: ${response.statusText}`);
    }

    const data = await response.json();

    // If data.data is not empty, the user is live
    return data.data && data.data.length > 0;
  } catch (error) {
    console.error("Error checking Twitch live status:", error);
    return false;
  }
}

/**
 * Get broadcaster access token using refresh token.
 * This token is used to check if users are subscribed to the channel.
 */
async function getBroadcasterAccessToken(): Promise<string> {
  if (broadcasterToken && broadcasterToken.expires_at > Date.now()) {
    return broadcasterToken.access_token;
  }

  if (!TWITCH_BROADCASTER_REFRESH_TOKEN || !TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
    throw new Error("Broadcaster refresh token or Twitch credentials not configured");
  }

  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: TWITCH_CLIENT_ID,
      client_secret: TWITCH_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: TWITCH_BROADCASTER_REFRESH_TOKEN,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to refresh broadcaster token: ${response.statusText} - ${errorText}`);
  }

  const data: TwitchTokenResponse = await response.json();
  broadcasterToken = {
    access_token: data.access_token,
    expires_at: Date.now() + data.expires_in * 1000 - 60000,
  };

  return data.access_token;
}

export interface UserSubscriptionResult {
  tier: 1 | 2 | 3 | null;
  isGift: boolean;
}

/**
 * Check if a user is subscribed to the broadcaster's channel.
 * Requires broadcaster OAuth token with channel:read:subscriptions scope.
 */
export async function checkUserSubscription(userId: string): Promise<UserSubscriptionResult> {
  if (!TWITCH_CLIENT_ID) {
    throw new Error("Twitch client ID not configured");
  }

  const accessToken = await getBroadcasterAccessToken();

  const response = await fetch(
    `https://api.twitch.tv/helix/subscriptions/user?broadcaster_id=${TWITCH_USER_ID}&user_id=${userId}`,
    {
      headers: {
        "Client-ID": TWITCH_CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    if (response.status === 404) {
      return { tier: null, isGift: false };
    }
    const errorText = await response.text();
    throw new Error(`Twitch API error: ${response.statusText} - ${errorText}`);
  }

  const data: TwitchSubscriptionResponse = await response.json();
  const sub = data.data?.[0];
  if (!sub) {
    return { tier: null, isGift: false };
  }

  const tierMap: Record<string, 1 | 2 | 3> = {
    "1000": 1,
    "2000": 2,
    "3000": 3,
  };

  return {
    tier: tierMap[sub.tier] || null,
    isGift: sub.is_gift,
  };
}
