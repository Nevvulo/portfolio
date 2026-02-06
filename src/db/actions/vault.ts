"use server";

import { and, eq, sql, desc } from "drizzle-orm";
import { db } from "../index";
import { vaultFiles } from "../schema";
import { getCurrentUser } from "../auth";
import { canAccessTier } from "../auth-utils";

/** Get paginated vault content. */
export async function getVaultContent(limit: number, offset: number) {
  const user = await getCurrentUser();
  const userTier = user?.tier ?? null;

  const allFiles = await db.query.vaultFiles.findMany({
    where: eq(vaultFiles.isArchived, false),
    orderBy: [desc(vaultFiles.displayOrder), desc(vaultFiles.createdAt)],
  });

  // Filter by visibility based on user tier
  const accessible = allFiles.filter((f) =>
    canAccessTier(userTier, f.visibility),
  );

  const items = accessible.slice(offset, offset + limit);
  const hasMore = accessible.length > offset + limit;

  return { items, hasMore };
}
