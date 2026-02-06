/**
 * Pages Router auth helpers using getAuth(req).
 *
 * In Pages Router, Clerk's auth() (App Router only) is not available.
 * Use these helpers in pages/api/ routes instead.
 */
import { getAuth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import type { NextApiRequest } from "next";
import { db } from "./index";
import { users } from "./schema";
import { getOrCreateUserByClerkId } from "./auth";

export async function getCurrentUserApi(req: NextApiRequest) {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return null;
  return getOrCreateUserByClerkId(clerkId);
}

export async function requireUserApi(req: NextApiRequest) {
  const user = await getCurrentUserApi(req);
  if (!user) throw new Error("Authentication required");
  return user;
}

export async function requireCreatorApi(req: NextApiRequest) {
  const user = await requireUserApi(req);
  if (!user.isCreator) throw new Error("Creator access required");
  return user;
}

export async function requireStaffApi(req: NextApiRequest) {
  const user = await requireUserApi(req);
  if (!user.isCreator && (user.role ?? 0) < 1) {
    throw new Error("Staff access required");
  }
  return user;
}
