import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Step 2: Twitch redirects here after you authorize
 * GET /api/twitch/callback?code=xxx
 *
 * This exchanges the code for tokens and displays them.
 * Copy the refresh_token and add it to your environment variables as:
 * TWITCH_BROADCASTER_REFRESH_TOKEN
 */
export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	const { code, error, error_description } = req.query;

	if (error) {
		return res.status(400).json({
			error,
			error_description,
		});
	}

	if (!code || typeof code !== "string") {
		return res.status(400).json({ error: "No code provided" });
	}

	const clientId = process.env.TWITCH_CLIENT_ID;
	const clientSecret = process.env.TWITCH_CLIENT_SECRET;

	if (!clientId || !clientSecret) {
		return res.status(500).json({
			error: "TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET not configured",
		});
	}

	const redirectUri = `${req.headers.host?.includes("localhost") ? "http" : "https"}://${req.headers.host}/api/twitch/callback`;

	try {
		const tokenResponse = await fetch("https://id.twitch.tv/oauth2/token", {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({
				client_id: clientId,
				client_secret: clientSecret,
				code,
				grant_type: "authorization_code",
				redirect_uri: redirectUri,
			}),
		});

		const tokenData = await tokenResponse.json();

		if (!tokenResponse.ok) {
			return res.status(400).json({
				error: "Failed to exchange code for tokens",
				details: tokenData,
			});
		}

		// Return HTML page with the tokens for easy copying
		res.setHeader("Content-Type", "text/html");
		res.send(`
<!DOCTYPE html>
<html>
<head>
	<title>Twitch OAuth Success</title>
	<style>
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			background: #0e0e10;
			color: #efeff1;
			padding: 2rem;
			max-width: 800px;
			margin: 0 auto;
		}
		h1 { color: #9147ff; }
		.token-box {
			background: #18181b;
			border: 1px solid #9147ff;
			border-radius: 8px;
			padding: 1rem;
			margin: 1rem 0;
			word-break: break-all;
		}
		.label {
			color: #9147ff;
			font-weight: bold;
			margin-bottom: 0.5rem;
		}
		.warning {
			background: #ff6b6b22;
			border: 1px solid #ff6b6b;
			border-radius: 8px;
			padding: 1rem;
			margin: 1rem 0;
		}
		code {
			background: #2d2d30;
			padding: 2px 6px;
			border-radius: 4px;
		}
	</style>
</head>
<body>
	<h1>Twitch OAuth Success!</h1>

	<div class="warning">
		<strong>Important:</strong> Copy the refresh_token below and add it to your Vercel environment variables as:<br>
		<code>TWITCH_BROADCASTER_REFRESH_TOKEN</code>
	</div>

	<div class="token-box">
		<div class="label">Refresh Token (save this!):</div>
		<div>${tokenData.refresh_token}</div>
	</div>

	<div class="token-box">
		<div class="label">Access Token (temporary, don't need to save):</div>
		<div>${tokenData.access_token}</div>
	</div>

	<div class="token-box">
		<div class="label">Expires In:</div>
		<div>${tokenData.expires_in} seconds</div>
	</div>

	<div class="token-box">
		<div class="label">Scopes:</div>
		<div>${tokenData.scope?.join(", ") || "N/A"}</div>
	</div>

	<p>After adding the refresh token to Vercel, you can delete these auth endpoints if you want.</p>
</body>
</html>
		`);
	} catch (err) {
		return res.status(500).json({
			error: "Failed to exchange code",
			details: err instanceof Error ? err.message : String(err),
		});
	}
}
