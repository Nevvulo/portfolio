import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Step 1: Visit this endpoint to start the OAuth flow
 * GET /api/twitch/auth
 *
 * This will redirect you to Twitch to authorize your broadcaster account.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const clientId = process.env.TWITCH_CLIENT_ID;

  if (!clientId) {
    return res.status(500).json({ error: "TWITCH_CLIENT_ID not configured" });
  }

  // Use the callback URL for this app
  const redirectUri = `${req.headers.host?.includes("localhost") ? "http" : "https"}://${req.headers.host}/api/twitch/callback`;

  const authUrl = new URL("https://id.twitch.tv/oauth2/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "channel:read:subscriptions");

  res.redirect(authUrl.toString());
}
