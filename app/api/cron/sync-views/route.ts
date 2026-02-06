import { sql } from "drizzle-orm";
import { db } from "@/src/db";
import { blogPosts, blogViews } from "@/src/db/schema";

/**
 * Cron: Sync view counts from blog_views table → blog_posts.view_count.
 * Schedule: Hourly via Vercel Cron.
 */
export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Update view_count on blog_posts from the blog_views count
  await db.execute(sql`
    UPDATE blog_posts
    SET view_count = sub.cnt
    FROM (
      SELECT post_id, COUNT(*) as cnt
      FROM blog_views
      GROUP BY post_id
    ) sub
    WHERE blog_posts.id = sub.post_id
      AND blog_posts.view_count != sub.cnt
  `);

  return Response.json({ ok: true, synced: new Date().toISOString() });
}
