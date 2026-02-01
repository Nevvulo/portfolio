import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, requireUser } from "./auth";

/**
 * Get notifications for current user
 */
export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const limit = args.limit ?? 50;

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);

    return notifications;
  },
});

/**
 * Get unread notification count
 * Returns 0 if not authenticated (graceful degradation)
 */
export const getUnreadCount = query({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return 0;

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) => q.eq("userId", user._id).eq("isRead", false))
      .collect();

    return unreadNotifications.length;
  },
});

/**
 * Mark a notification as read
 */
export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const notification = await ctx.db.get(args.notificationId);

    if (!notification) throw new Error("Notification not found");
    if (notification.userId !== user._id) throw new Error("Not your notification");

    await ctx.db.patch(args.notificationId, { isRead: true });
  },
});

/**
 * Mark all notifications as read
 */
export const markAllAsRead = mutation({
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) => q.eq("userId", user._id).eq("isRead", false))
      .collect();

    for (const notification of unreadNotifications) {
      await ctx.db.patch(notification._id, { isRead: true });
    }

    return { count: unreadNotifications.length };
  },
});

/**
 * Delete a notification
 */
export const remove = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const notification = await ctx.db.get(args.notificationId);

    if (!notification) throw new Error("Notification not found");
    if (notification.userId !== user._id) throw new Error("Not your notification");

    await ctx.db.delete(args.notificationId);
  },
});

/**
 * Clear all notifications
 */
export const clearAll = mutation({
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
    }

    return { count: notifications.length };
  },
});

/**
 * Create a notification (internal helper)
 */
export const create = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("mention"),
      v.literal("reply"),
      v.literal("new_content"),
      v.literal("comment_reply"),
      v.literal("collaborator_added"),
      v.literal("comment_reaction"),
      v.literal("feed_reply"),
      v.literal("feed_reaction"),
    ),
    title: v.string(),
    body: v.string(),
    referenceType: v.optional(
      v.union(v.literal("blogComment"), v.literal("blogPost"), v.literal("feedPost")),
    ),
    referenceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user has notifications enabled
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    if (!user.notificationPreferences?.inAppNotifications) return null;

    const notificationId = await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      body: args.body,
      referenceType: args.referenceType,
      referenceId: args.referenceId,
      isRead: false,
      createdAt: Date.now(),
    });

    return notificationId;
  },
});
