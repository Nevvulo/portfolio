import { clerkClient, getAuth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { filterBio } from "../../../lib/word-filter";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow PATCH
  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Check auth
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { bio, showConnections } = req.body;

  try {
    // Handle bio update
    if (bio !== undefined) {
      // Run word filter
      const filterResult = filterBio(bio);
      if (!filterResult.isValid) {
        return res.status(400).json({ error: filterResult.reason });
      }

      // Update bio in Postgres
      await db
        .update(users)
        .set({ bio: filterResult.filtered || "" })
        .where(eq(users.clerkId, userId));
    }

    // Handle privacy toggle (stored in Clerk publicMetadata)
    if (showConnections !== undefined) {
      const client = await clerkClient();
      await client.users.updateUserMetadata(userId, {
        publicMetadata: {
          showConnections: Boolean(showConnections),
        },
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Profile update error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to update profile",
    });
  }
}
