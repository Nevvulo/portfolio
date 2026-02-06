import { and, eq, gte } from "drizzle-orm";
import { db } from "../index";
import { adminSettings, discordEvents, liveStats } from "../schema";

/** Get stream settings (singleton). */
export async function getStreamSettings() {
  const settings = await db.query.adminSettings.findFirst();
  return (settings?.stream as
    | {
        streamChance: number;
        streamChanceMessage?: string;
        lastUpdated: number;
        schedule?: Array<{
          day: string;
          startTime?: string;
          endTime?: string;
          likelihood: string;
        }>;
      }
    | undefined) ?? null;
}

/** Get admin settings (full singleton). */
export async function getAdminSettings() {
  return db.query.adminSettings.findFirst();
}

/** Get upcoming Discord events (scheduled, in the future). */
export async function getUpcomingEvents() {
  return db.query.discordEvents.findMany({
    where: and(
      eq(discordEvents.status, "scheduled"),
      gte(discordEvents.scheduledStartTime, new Date()),
    ),
    orderBy: [discordEvents.scheduledStartTime],
  });
}

/** Get a live stat by key. */
export async function getLiveStat(key: string) {
  const stat = await db.query.liveStats.findFirst({
    where: eq(liveStats.key, key),
  });
  return stat?.value ?? null;
}

/** Check if stream is live. */
export async function isStreamLive() {
  const status = await getLiveStat("stream_status");
  return status === true || status === "live";
}
