import { auth } from "@clerk/nextjs/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/src/db";
import { articleWatchTime, users } from "@/src/db/schema";

/**
 * Watch time heartbeat endpoint.
 * Called every ~30s by useArticleWatchTime while reading an article.
 * Increments article_watch_time.total_seconds for the user + post.
 */
export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { postId, secondsIncrement } = body as {
    postId: number;
    secondsIncrement: number;
  };

  if (!postId || typeof secondsIncrement !== "number") {
    return new Response("Bad request", { status: 400 });
  }

  // Look up user
  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
    columns: { id: true },
  });
  if (!user) {
    return new Response("User not found", { status: 404 });
  }

  const now = new Date();

  // Upsert: increment total_seconds by the heartbeat amount
  await db
    .insert(articleWatchTime)
    .values({
      postId,
      userId: user.id,
      totalSeconds: secondsIncrement,
      lastHeartbeat: now,
      sessionId: `${user.id}-${postId}`,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [articleWatchTime.userId, articleWatchTime.postId],
      set: {
        totalSeconds: sql`${articleWatchTime.totalSeconds} + ${secondsIncrement}`,
        lastHeartbeat: now,
        updatedAt: now,
      },
    });

  return Response.json({ ok: true });
}
