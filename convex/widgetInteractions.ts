import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./auth";

/**
 * Track a widget interaction (click within a widget area).
 * Upserts: increments interactionCount and updates lastInteractedAt.
 */
export const trackInteraction = mutation({
  args: { widgetId: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return;

    const existing = await ctx.db
      .query("widgetInteractions")
      .withIndex("by_user_widget", (q) =>
        q.eq("userId", user._id).eq("widgetId", args.widgetId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        interactionCount: existing.interactionCount + 1,
        lastInteractedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("widgetInteractions", {
        userId: user._id,
        widgetId: args.widgetId,
        interactionCount: 1,
        lastInteractedAt: Date.now(),
      });
    }
  },
});

/**
 * Get all widget interactions for the current user.
 * Returns [] if not authenticated.
 */
export const getMyInteractions = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    return await ctx.db
      .query("widgetInteractions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});
