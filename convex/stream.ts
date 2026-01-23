import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get stream settings (public - for homepage)
export const getStreamSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("adminSettings").first();
    return settings?.stream ?? null;
  },
});

// Update stream chance (admin only)
export const updateStreamChance = mutation({
  args: {
    streamChance: v.number(),
    streamChanceMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Check if user is creator
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user?.isCreator) throw new Error("Unauthorized - creator only");

    const settings = await ctx.db.query("adminSettings").first();

    if (settings) {
      await ctx.db.patch(settings._id, {
        stream: {
          ...settings.stream,
          streamChance: args.streamChance,
          streamChanceMessage: args.streamChanceMessage,
          lastUpdated: Date.now(),
          schedule: settings.stream?.schedule,
        },
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("adminSettings", {
        stream: {
          streamChance: args.streamChance,
          streamChanceMessage: args.streamChanceMessage,
          lastUpdated: Date.now(),
        },
        updatedAt: Date.now(),
      });
    }
  },
});

// Update stream schedule (admin only)
export const updateStreamSchedule = mutation({
  args: {
    schedule: v.array(
      v.object({
        day: v.union(
          v.literal("monday"),
          v.literal("tuesday"),
          v.literal("wednesday"),
          v.literal("thursday"),
          v.literal("friday"),
          v.literal("saturday"),
          v.literal("sunday"),
        ),
        startTime: v.optional(v.string()),
        endTime: v.optional(v.string()),
        likelihood: v.union(v.literal("likely"), v.literal("maybe"), v.literal("unlikely")),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user?.isCreator) throw new Error("Unauthorized - creator only");

    const settings = await ctx.db.query("adminSettings").first();

    if (settings) {
      await ctx.db.patch(settings._id, {
        stream: {
          ...settings.stream,
          streamChance: settings.stream?.streamChance ?? 0,
          lastUpdated: settings.stream?.lastUpdated ?? Date.now(),
          schedule: args.schedule,
        },
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("adminSettings", {
        stream: {
          streamChance: 0,
          lastUpdated: Date.now(),
          schedule: args.schedule,
        },
        updatedAt: Date.now(),
      });
    }
  },
});

// Get upcoming Discord events
export const getUpcomingEvents = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const events = await ctx.db
      .query("discordEvents")
      .withIndex("by_startTime")
      .filter((q) =>
        q.and(q.gte(q.field("scheduledStartTime"), now), q.eq(q.field("status"), "scheduled")),
      )
      .order("asc")
      .take(5);

    return events;
  },
});

// Sync Discord events (called from API route)
export const syncDiscordEvents = mutation({
  args: {
    events: v.array(
      v.object({
        eventId: v.string(),
        guildId: v.string(),
        name: v.string(),
        description: v.optional(v.string()),
        scheduledStartTime: v.number(),
        scheduledEndTime: v.optional(v.number()),
        entityType: v.union(v.literal("stage_instance"), v.literal("voice"), v.literal("external")),
        status: v.union(
          v.literal("scheduled"),
          v.literal("active"),
          v.literal("completed"),
          v.literal("canceled"),
        ),
        coverImageUrl: v.optional(v.string()),
        location: v.optional(v.string()),
        userCount: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    for (const event of args.events) {
      const existing = await ctx.db
        .query("discordEvents")
        .withIndex("by_eventId", (q) => q.eq("eventId", event.eventId))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          ...event,
          syncedAt: now,
        });
      } else {
        await ctx.db.insert("discordEvents", {
          ...event,
          syncedAt: now,
        });
      }
    }

    // Clean up old completed/canceled events (older than 7 days)
    const cutoff = now - 7 * 24 * 60 * 60 * 1000;
    const oldEvents = await ctx.db
      .query("discordEvents")
      .filter((q) =>
        q.and(
          q.or(q.eq(q.field("status"), "completed"), q.eq(q.field("status"), "canceled")),
          q.lt(q.field("scheduledStartTime"), cutoff),
        ),
      )
      .collect();

    for (const event of oldEvents) {
      await ctx.db.delete(event._id);
    }
  },
});
