import { getAuth } from "@clerk/nextjs/server";
import { randomBytes } from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { serialize } from "cookie";

const FLUXER_CLIENT_ID = process.env.FLUXER_OAUTH_CLIENT_ID;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_URL || "https://nev.so"}/api/fluxer/callback`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId } = getAuth(req);
  if (!userId) {
    return res.redirect("/sign-in?redirect_url=/account");
  }

  if (!FLUXER_CLIENT_ID) {
    return res.status(500).json({ error: "Fluxer OAuth not configured" });
  }

  const state = randomBytes(32).toString("hex");

  res.setHeader(
    "Set-Cookie",
    serialize("fluxer_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/fluxer",
      maxAge: 600, // 10 minutes
    }),
  );

  const params = new URLSearchParams({
    client_id: FLUXER_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "identify",
    state,
  });

  res.redirect(`https://fluxer.app/oauth2/authorize?${params.toString()}`);
}
