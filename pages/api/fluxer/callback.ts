import { getAuth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import type { NextApiRequest, NextApiResponse } from "next";
import { parse } from "cookie";
import { serialize } from "cookie";
import { timingSafeEqual } from "crypto";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";

const FLUXER_CLIENT_ID = process.env.FLUXER_OAUTH_CLIENT_ID;
const FLUXER_CLIENT_SECRET = process.env.FLUXER_OAUTH_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_URL || "https://nev.so"}/api/fluxer/callback`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    return res.redirect("/sign-in?redirect_url=/account");
  }

  if (!FLUXER_CLIENT_ID || !FLUXER_CLIENT_SECRET) {
    return res.redirect("/account?fluxer=error&reason=not_configured");
  }

  const { code, state } = req.query;

  if (!code || !state || typeof code !== "string" || typeof state !== "string") {
    return res.redirect("/account?fluxer=error&reason=missing_params");
  }

  // Validate CSRF state
  const cookies = parse(req.headers.cookie || "");
  const storedState = cookies.fluxer_oauth_state;

  if (
    !storedState ||
    storedState.length !== state.length ||
    !timingSafeEqual(Buffer.from(storedState), Buffer.from(state))
  ) {
    return res.redirect("/account?fluxer=error&reason=invalid_state");
  }

  // Clear the state cookie
  res.setHeader(
    "Set-Cookie",
    serialize("fluxer_oauth_state", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/fluxer",
      maxAge: 0,
    }),
  );

  try {
    // Exchange code for token
    const tokenRes = await fetch("https://api.fluxer.app/v1/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
        client_id: FLUXER_CLIENT_ID,
        client_secret: FLUXER_CLIENT_SECRET,
      }),
    });

    if (!tokenRes.ok) {
      console.error("[fluxer/callback] Token exchange failed:", await tokenRes.text());
      return res.redirect("/account?fluxer=error&reason=token_exchange");
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Fetch Fluxer user info
    const userRes = await fetch("https://api.fluxer.app/v1/users/@me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      console.error("[fluxer/callback] User fetch failed:", await userRes.text());
      return res.redirect("/account?fluxer=error&reason=user_fetch");
    }

    const fluxerUser = await userRes.json();
    const fluxerId = fluxerUser.id;

    if (!fluxerId) {
      return res.redirect("/account?fluxer=error&reason=no_id");
    }

    // Store fluxerId on the authenticated user's row
    await db
      .update(users)
      .set({ fluxerId })
      .where(eq(users.clerkId, clerkId));

    return res.redirect("/account?fluxer=connected");
  } catch (error) {
    console.error("[fluxer/callback] Error:", error);
    return res.redirect("/account?fluxer=error&reason=unknown");
  }
}
