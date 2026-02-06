import { getAuth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    return res.status(200).json(null);
  }

  let user = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });

  // Auto-create on first auth (dev environments where webhooks aren't set up)
  if (!user) {
    const [newUser] = await db
      .insert(users)
      .values({
        clerkId,
        displayName: "User",
        isCreator: clerkId === process.env.CREATOR_CLERK_ID,
      })
      .onConflictDoUpdate({
        target: users.clerkId,
        set: { clerkId },
      })
      .returning();
    user = newUser ?? null;
  }

  if (!user) {
    return res.status(200).json(null);
  }

  return res.status(200).json({
    id: user.id,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    username: user.username,
    isCreator: user.isCreator,
    role: user.role,
  });
}
