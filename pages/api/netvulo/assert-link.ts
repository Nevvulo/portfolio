import type { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

type AssertLinkResponse = {
  linked: boolean;
  service_user_id?: string;
  service_username?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { slug } = req.body;
  if (!slug || typeof slug !== "string") {
    return res.status(400).json({ error: "Missing service slug" });
  }

  // Get authenticated user
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  // Get user's Discord ID from Clerk
  let discordId: string | undefined;
  try {
    const clerkRes = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      },
    });

    if (clerkRes.ok) {
      const clerkUser = await clerkRes.json();
      const discordAccount = clerkUser.external_accounts?.find(
        (a: { provider: string }) => a.provider === "oauth_discord"
      );
      discordId = discordAccount?.provider_user_id || discordAccount?.external_id;
    }
  } catch (error) {
    console.error("[assert-link] Failed to fetch Clerk user:", error);
  }

  // Call Netvulo assert-link endpoint
  const netvuloUrl = process.env.NETVULO_API_URL || "https://netvulo.nevulo.xyz";
  const assertLinkUrl = `${netvuloUrl}/api/v1/services/${slug}/assert-link`;

  try {
    const response = await fetch(assertLinkUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clerk_id: userId,
        discord_id: discordId,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[assert-link] Netvulo returned ${response.status}:`, text);
      return res.status(response.status).json({
        linked: false,
        error: `Service error: ${response.status}`,
      });
    }

    const data: AssertLinkResponse = await response.json();

    // If linked, persist to Convex
    if (data.linked) {
      try {
        // Get user's Convex auth token from Clerk
        const tokenRes = await fetch(
          `https://api.clerk.com/v1/users/${userId}/oauth_access_tokens/convex`,
          {
            headers: {
              Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
            },
          }
        );

        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          const convexToken = tokenData[0]?.token;

          if (convexToken) {
            convex.setAuth(convexToken);
            await convex.mutation(api.users.linkService, {
              slug,
              serviceUserId: data.service_user_id,
              serviceUsername: data.service_username,
            });
          }
        }
      } catch (convexError) {
        // Log but don't fail - the link was still successful
        console.error("[assert-link] Failed to persist to Convex:", convexError);
      }
    }

    return res.status(200).json({
      linked: data.linked,
      serviceUserId: data.service_user_id,
      serviceUsername: data.service_username,
      error: data.error,
    });
  } catch (error) {
    console.error("[assert-link] Request failed:", error);
    return res.status(500).json({
      linked: false,
      error: "Failed to connect to service",
    });
  }
}
