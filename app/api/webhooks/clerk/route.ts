import { Webhook } from "svix";
import { headers } from "next/headers";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    throw new Error("Missing CLERK_WEBHOOK_SECRET environment variable");
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let event: WebhookEvent;

  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return new Response("Webhook verification failed", { status: 400 });
  }

  const eventType = event.type;

  if (eventType === "user.created" || eventType === "user.updated") {
    const { id: clerkId, first_name, last_name, username, image_url } = event.data;
    const displayName =
      [first_name, last_name].filter(Boolean).join(" ") || username || "User";

    await db
      .insert(users)
      .values({
        clerkId,
        username: username ?? undefined,
        displayName,
        avatarUrl: image_url,
        tier: "free",
        isCreator: clerkId === process.env.CREATOR_CLERK_ID,
        status: "offline",
      })
      .onConflictDoUpdate({
        target: users.clerkId,
        set: {
          displayName,
          avatarUrl: image_url,
          username: username ?? undefined,
        },
      });
  }

  if (eventType === "user.deleted") {
    const clerkId = event.data.id;
    if (clerkId) {
      // Soft delete — mark as banned so data is preserved
      await db
        .update(users)
        .set({ isBanned: true, banReason: "Account deleted via Clerk" })
        .where(eq(users.clerkId, clerkId));
    }
  }

  return new Response("OK", { status: 200 });
}
