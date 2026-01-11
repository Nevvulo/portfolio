import { clerkClient, getAuth } from "@clerk/nextjs/server";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  const accounts = user.externalAccounts.map((a) => ({
    provider: a.provider,
    providerUserId: (a as unknown as { providerUserId?: string }).providerUserId,
    externalId: (a as unknown as { externalId?: string }).externalId,
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
