import { eq } from "drizzle-orm";
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/src/db";
import { discordEvents } from "@/src/db/schema";

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID || "854861878498934784";

type EntityType = "stage_instance" | "voice" | "external";
type EventStatus = "scheduled" | "active" | "completed" | "canceled";

interface DiscordScheduledEvent {
  id: string;
  guild_id: string;
  name: string;
  description?: string;
  scheduled_start_time: string;
  scheduled_end_time?: string;
  entity_type: number; // 1 = STAGE_INSTANCE, 2 = VOICE, 3 = EXTERNAL
  status: number; // 1 = SCHEDULED, 2 = ACTIVE, 3 = COMPLETED, 4 = CANCELED
  image?: string;
  entity_metadata?: {
    location?: string;
  };
  user_count?: number;
}

function mapEntityType(type: number): EntityType {
  switch (type) {
    case 1:
      return "stage_instance";
    case 2:
      return "voice";
    case 3:
      return "external";
    default:
      return "external";
  }
}

function mapStatus(status: number): EventStatus {
  switch (status) {
    case 1:
      return "scheduled";
    case 2:
      return "active";
    case 3:
      return "completed";
    case 4:
      return "canceled";
    default:
      return "scheduled";
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET for fetching, POST for manual sync
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!DISCORD_BOT_TOKEN) {
    console.error("DISCORD_BOT_TOKEN not configured");
    return res.status(500).json({ error: "Discord not configured" });
  }

  try {
    // Fetch scheduled events from Discord
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/scheduled-events?with_user_count=true`,
      {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        },
      },
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Discord API error:", response.status, error);
      return res.status(response.status).json({ error: "Discord API error" });
    }

    const discordEventsData: DiscordScheduledEvent[] = await response.json();

    // Transform to our format and upsert into Postgres
    const events = discordEventsData.map((event) => ({
      eventId: event.id,
      guildId: event.guild_id,
      name: event.name,
      description: event.description || null,
      scheduledStartTime: new Date(event.scheduled_start_time),
      scheduledEndTime: event.scheduled_end_time
        ? new Date(event.scheduled_end_time)
        : null,
      entityType: mapEntityType(event.entity_type),
      status: mapStatus(event.status),
      coverImageUrl: event.image
        ? `https://cdn.discordapp.com/guild-events/${event.id}/${event.image}.png`
        : null,
      location: event.entity_metadata?.location || null,
      userCount: event.user_count || null,
      syncedAt: new Date(),
    }));

    // Upsert each event (insert or update on conflict)
    for (const event of events) {
      await db
        .insert(discordEvents)
        .values(event)
        .onConflictDoUpdate({
          target: discordEvents.eventId,
          set: {
            name: event.name,
            description: event.description,
            scheduledStartTime: event.scheduledStartTime,
            scheduledEndTime: event.scheduledEndTime,
            entityType: event.entityType,
            status: event.status,
            coverImageUrl: event.coverImageUrl,
            location: event.location,
            userCount: event.userCount,
            syncedAt: event.syncedAt,
          },
        });
    }

    return res.status(200).json({
      success: true,
      eventCount: events.length,
      events: events.map((e) => ({
        ...e,
        scheduledStartTime: e.scheduledStartTime.getTime(),
        scheduledEndTime: e.scheduledEndTime?.getTime(),
        syncedAt: e.syncedAt.getTime(),
      })),
    });
  } catch (error) {
    console.error("Error syncing Discord events:", error);
    return res.status(500).json({ error: "Failed to sync events" });
  }
}
