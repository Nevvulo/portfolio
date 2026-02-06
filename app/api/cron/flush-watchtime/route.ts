/**
 * Cron: Flush buffered watch time from Redis → Postgres.
 * Schedule: Every 5 minutes via Vercel Cron.
 *
 * If Upstash Redis is configured, reads buffered watch time entries
 * and upserts them into the article_watch_time table.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  // TODO: Implement Redis flush once Upstash is wired up.
  // For now, watch time goes directly to Postgres via the heartbeat endpoint.

  return Response.json({ ok: true, message: "No buffered entries to flush" });
}
