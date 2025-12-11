import type { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  const accounts = user.externalAccounts.map((a) => ({
    provider: a.provider,
    providerUserId: a.providerUserId,
    externalId: (a as any).externalId,
    id: a.id,
    username: a.username,
    emailAddress: a.emailAddress,
    verification: a.verification?.status,
    raw: JSON.stringify(a),
  }));

  return res.status(200).json({
    userId,
    externalAccounts: accounts,
  });
}
