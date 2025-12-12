import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser, requireChannelAccess } from "./auth";

const TYPING_TIMEOUT_MS = 5000; // 5 seconds

/**
 * Start typing indicator
 */
export const startTyping = mutation({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const { user } = await requireChannelAccess(ctx, args.channelId);

    const expiresAt = Date.now() + TYPING_TIMEOUT_MS;

    // Check if already typing
    const existing = await ctx.db
      .query("typingIndicators")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .unique();

    if (existing) {
      // Update expiration
      await ctx.db.patch(existing._id, { expiresAt });
    } else {
      // Create new typing indicator
      await ctx.db.insert("typingIndicators", {
        channelId: args.channelId,
        userId: user._id,
        expiresAt,
      });
    }
  },
});

/**
 * Stop typing indicator
 */
export const stopTyping = mutation({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const existing = await ctx.db
      .query("typingIndicators")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

/**
 * Get users currently typing in a channel
 */
export const getTyping = query({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const now = Date.now();

    // Get all typing indicators that haven't expired
    const typingIndicators = await ctx.db
      .query("typingIndicators")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .filter((q) => q.gt(q.field("expiresAt"), now))
      .collect();

    // Get user info for each typing indicator (excluding current user)
    const typingUsers = await Promise.all(
      typingIndicators
        .filter((t) => t.userId !== user._id)
        .map(async (indicator) => {
          const typingUser = await ctx.db.get(indicator.userId);
          if (!typingUser) return null;
          return {
            _id: typingUser._id,
            displayName: typingUser.displayName,
            avatarUrl: typingUser.avatarUrl,
          };
        })
    );

    return typingUsers.filter(Boolean);
  },
});

/**
 * Clean up expired typing indicators (run periodically via cron)
 */
export const cleanupExpired = mutation({
  handler: async (ctx) => {
    const now = Date.now();

    const expired = await ctx.db
      .query("typingIndicators")
      .withIndex("by_expires", (q) => q.lt("expiresAt", now))
      .collect();

    for (const indicator of expired) {
      await ctx.db.delete(indicator._id);
    }

    return expired.length;
  },
});
