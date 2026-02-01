import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

// Internal mutation to receive Netvulo webhook events
export const handleWebhook = internalMutation({
  args: {
    eventType: v.string(),
    eventId: v.string(),
    source: v.string(),
    data: v.any(),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Log the event for debugging/history
    await ctx.db.insert("netvuloEvents", {
      eventType: args.eventType,
      eventId: args.eventId,
      source: args.source,
      data: args.data,
      receivedAt: now,
    });

    // Handle specific event types
    switch (args.eventType) {
      case "PLAYER_COUNT_UPDATE":
      case "Custom(PLAYER_COUNT_UPDATE)":
      case 'Custom("PLAYER_COUNT_UPDATE")': {
        // Update live stats for player count
        const key = `${args.source}_players`;
        const existing = await ctx.db
          .query("liveStats")
          .withIndex("by_key", (q) => q.eq("key", key))
          .first();

        if (existing) {
          await ctx.db.patch(existing._id, {
            value: args.data,
            source: args.source,
            updatedAt: now,
          });
        } else {
          await ctx.db.insert("liveStats", {
            key,
            value: args.data,
            source: args.source,
            updatedAt: now,
          });
        }
        break;
      }

      case "STREAM_STATUS":
      case "Custom(STREAM_STATUS)":
      case 'Custom("STREAM_STATUS")': {
        // Update stream live status
        const existing = await ctx.db
          .query("liveStats")
          .withIndex("by_key", (q) => q.eq("key", "stream_status"))
          .first();

        if (existing) {
          await ctx.db.patch(existing._id, {
            value: args.data,
            source: args.source,
            updatedAt: now,
          });
        } else {
          await ctx.db.insert("liveStats", {
            key: "stream_status",
            value: args.data,
            source: args.source,
            updatedAt: now,
          });
        }
        break;
      }

      case "BADGE_EARNED":
      case "Custom(BADGE_EARNED)":
      case 'Custom("BADGE_EARNED")': {
        // Could trigger a notification or update user profile
        // For now just log it
        break;
      }

      default: {
        // Generic stat update - use event type as key
        // Clean up event type: Custom("PLAYER_COUNT_UPDATE") -> player_count_update
        const key = args.eventType
          .replace(/^Custom\("?/, "")
          .replace(/"?\)$/, "")
          .replace(/"/g, "")
          .toLowerCase();
        const existing = await ctx.db
          .query("liveStats")
          .withIndex("by_key", (q) => q.eq("key", key))
          .first();

        if (existing) {
          await ctx.db.patch(existing._id, {
            value: args.data,
            source: args.source,
            updatedAt: now,
          });
        } else {
          await ctx.db.insert("liveStats", {
            key,
            value: args.data,
            source: args.source,
            updatedAt: now,
          });
        }
      }
    }
  },
});

// Query to get a specific live stat
export const getLiveStat = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("liveStats")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
  },
});

// Query to get all live stats
export const getAllLiveStats = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("liveStats").collect();
  },
});

// Query to get recent Netvulo events (for debugging)
export const getRecentEvents = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("netvuloEvents")
      .order("desc")
      .take(limit);
  },
});
