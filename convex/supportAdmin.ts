import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { requireCreator } from "./auth";

// ============================================
// SUPER LEGEND ADMIN QUERIES
// ============================================

/**
 * List all Super Legend subscribers with pagination and tier filter
 */
export const listSuperLegends = query({
  args: {
    tierFilter: v.optional(v.union(v.literal("tier1"), v.literal("tier2"), v.literal("all"))),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const limit = args.limit ?? 50;
    const offset = args.offset ?? 0;
    const tierFilter = args.tierFilter ?? "all";

    // Get all users with active clerk plans
    const allUsers = await ctx.db.query("users").collect();

    // Filter to active Super Legend subscribers
    const superLegends = allUsers.filter((user) => {
      if (user.clerkPlanStatus !== "active") return false;
      if (!user.clerkPlan) return false;

      if (tierFilter === "all") {
        return user.clerkPlan === "super_legend" || user.clerkPlan === "super_legend_2";
      } else if (tierFilter === "tier1") {
        return user.clerkPlan === "super_legend";
      } else if (tierFilter === "tier2") {
        return user.clerkPlan === "super_legend_2";
      }
      return false;
    });

    // Sort by subscription date (supporterSyncedAt)
    superLegends.sort((a, b) => (b.supporterSyncedAt ?? 0) - (a.supporterSyncedAt ?? 0));

    const totalCount = superLegends.length;
    const paginatedUsers = superLegends.slice(offset, offset + limit);
    const hasMore = offset + limit < totalCount;

    // Map to admin-friendly format
    const subscribers = paginatedUsers.map((user) => ({
      _id: user._id,
      clerkId: user.clerkId,
      displayName: user.displayName,
      username: user.username,
      avatarUrl: user.avatarUrl,
      tier: user.tier,
      clerkPlan: user.clerkPlan,
      clerkPlanStatus: user.clerkPlanStatus,
      discordId: user.discordId,
      discordUsername: user.discordUsername,
      founderNumber: user.founderNumber,
      showOnCredits: user.showOnCredits,
      supporterSyncedAt: user.supporterSyncedAt,
      createdAt: user.createdAt,
    }));

    return {
      subscribers,
      hasMore,
      totalCount,
      nextOffset: hasMore ? offset + limit : null,
    };
  },
});

/**
 * Get detailed verification status for a single subscriber
 */
export const getSubscriberVerification = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get vault download count for this user
    const downloads = await ctx.db
      .query("vaultDownloadLogs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Determine tier from clerkPlan
    const expectedTier =
      user.clerkPlan === "super_legend_2"
        ? "tier2"
        : user.clerkPlan === "super_legend"
          ? "tier1"
          : "free";

    return {
      user: {
        _id: user._id,
        displayName: user.displayName,
        username: user.username,
        avatarUrl: user.avatarUrl,
        clerkPlan: user.clerkPlan,
        clerkPlanStatus: user.clerkPlanStatus,
        tier: user.tier,
      },
      verification: {
        discordLinked: !!user.discordId,
        discordId: user.discordId,
        discordUsername: user.discordUsername,
        badgeVerified: user.tier === expectedTier,
        expectedTier,
        actualTier: user.tier,
        showOnCredits: user.showOnCredits ?? false,
        founderNumber: user.founderNumber,
      },
      analytics: {
        vaultDownloads: downloads.length,
      },
    };
  },
});

/**
 * Get content delivery stats for a given month
 * Tracks tier-locked blog posts published that month
 */
export const getContentDeliveryStats = query({
  args: {
    month: v.string(), // "2025-01" format
    tier: v.optional(v.union(v.literal("tier1"), v.literal("tier2"))),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    // Parse month to get start/end timestamps
    const [year, monthNum] = args.month.split("-").map(Number);
    const monthStart = new Date(year!, monthNum! - 1, 1).getTime();
    const monthEnd = new Date(year!, monthNum!, 0, 23, 59, 59, 999).getTime();

    // Get tier-locked blog posts published this month
    const blogPosts = await ctx.db.query("blogPosts").withIndex("by_status").collect();

    const tierLockedPosts = blogPosts.filter((post) => {
      if (post.status !== "published") return false;
      if (!post.publishedAt) return false;
      if (post.publishedAt < monthStart || post.publishedAt > monthEnd) return false;

      if (args.tier) {
        return post.visibility === args.tier;
      }
      return post.visibility === "tier1" || post.visibility === "tier2";
    });

    const specialAccessPosts = tierLockedPosts.map((post) => ({
      _id: post._id,
      title: post.title,
      slug: post.slug,
      visibility: post.visibility,
      publishedAt: post.publishedAt,
      contentType: post.contentType,
    }));

    const tier1SpecialAccess = tierLockedPosts.filter((p) => p.visibility === "tier1").length;
    const tier2SpecialAccess = tierLockedPosts.filter((p) => p.visibility === "tier2").length;

    return {
      month: args.month,
      specialAccess: {
        total: tierLockedPosts.length,
        tier1: tier1SpecialAccess,
        tier2: tier2SpecialAccess,
        posts: specialAccessPosts,
      },
      quotaProgress: {
        tier1: {
          specialAccess: tier1SpecialAccess,
          totalDelivered: tier1SpecialAccess,
          quota: 2,
        },
        tier2: {
          specialAccess: tier2SpecialAccess,
          totalDelivered: tier2SpecialAccess,
          quota: 3,
        },
      },
    };
  },
});

/**
 * Get vault download analytics
 */
export const getVaultAnalytics = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const limit = args.limit ?? 50;

    // Get all download logs
    const logs = await ctx.db.query("vaultDownloadLogs").order("desc").take(500);

    // Group by user
    const byUser = new Map<
      string,
      { userId: Id<"users">; count: number; lastDownload: number; tier: string }
    >();

    for (const log of logs) {
      const existing = byUser.get(log.userId);
      if (existing) {
        existing.count++;
        if (log.downloadedAt > existing.lastDownload) {
          existing.lastDownload = log.downloadedAt;
        }
      } else {
        byUser.set(log.userId, {
          userId: log.userId,
          count: 1,
          lastDownload: log.downloadedAt,
          tier: log.userTier,
        });
      }
    }

    // Convert to array and sort by count
    const userStats = Array.from(byUser.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    // Get user details
    const usersWithDetails = await Promise.all(
      userStats.map(async (stat) => {
        const user = await ctx.db.get(stat.userId);
        return {
          ...stat,
          displayName: user?.displayName ?? "Unknown",
          username: user?.username,
          avatarUrl: user?.avatarUrl,
        };
      }),
    );

    // Group by file
    const byFile = new Map<string, { fileId: Id<"vaultFiles">; count: number }>();
    for (const log of logs) {
      const existing = byFile.get(log.fileId);
      if (existing) {
        existing.count++;
      } else {
        byFile.set(log.fileId, { fileId: log.fileId, count: 1 });
      }
    }

    const fileStats = Array.from(byFile.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    const filesWithDetails = await Promise.all(
      fileStats.map(async (stat) => {
        const file = await ctx.db.get(stat.fileId);
        return {
          ...stat,
          title: file?.title ?? "Unknown",
          slug: file?.slug,
        };
      }),
    );

    return {
      totalDownloads: logs.length,
      byUser: usersWithDetails,
      byFile: filesWithDetails,
    };
  },
});

/**
 * Get quick stats for the dashboard header
 */
export const getQuickStats = query({
  handler: async (ctx) => {
    await requireCreator(ctx);

    const allUsers = await ctx.db.query("users").collect();

    // Count active subscribers
    const activeSubscribers = allUsers.filter(
      (u) =>
        u.clerkPlanStatus === "active" &&
        (u.clerkPlan === "super_legend" || u.clerkPlan === "super_legend_2"),
    );

    const tier1Count = activeSubscribers.filter((u) => u.clerkPlan === "super_legend").length;
    const tier2Count = activeSubscribers.filter((u) => u.clerkPlan === "super_legend_2").length;

    // Count users with Discord linked
    const discordLinked = activeSubscribers.filter((u) => !!u.discordId).length;

    // Get this month's content delivery
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    return {
      totalSubscribers: activeSubscribers.length,
      tier1Count,
      tier2Count,
      discordLinkedCount: discordLinked,
      discordLinkedPercent:
        activeSubscribers.length > 0
          ? Math.round((discordLinked / activeSubscribers.length) * 100)
          : 0,
      currentMonth,
    };
  },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Send a notification to subscribers
 */
export const sendSubscriberNotification = mutation({
  args: {
    title: v.string(),
    message: v.string(),
    targetTier: v.union(v.literal("tier1"), v.literal("tier2"), v.literal("all")),
    sendToDiscord: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireCreator(ctx);

    // Get target subscribers
    const allUsers = await ctx.db.query("users").collect();
    const subscribers = allUsers.filter((u) => {
      if (u.clerkPlanStatus !== "active") return false;
      if (!u.clerkPlan) return false;

      if (args.targetTier === "all") {
        return u.clerkPlan === "super_legend" || u.clerkPlan === "super_legend_2";
      } else if (args.targetTier === "tier1") {
        return u.clerkPlan === "super_legend" || u.clerkPlan === "super_legend_2";
      } else if (args.targetTier === "tier2") {
        return u.clerkPlan === "super_legend_2";
      }
      return false;
    });

    // Create in-app notifications for each subscriber
    for (const subscriber of subscribers) {
      if (subscriber.notificationPreferences?.inAppNotifications) {
        await ctx.db.insert("notifications", {
          userId: subscriber._id,
          type: "new_content",
          title: args.title,
          body: args.message,
          isRead: false,
          createdAt: Date.now(),
        });
      }
    }

    // Record the notification
    const notificationId = await ctx.db.insert("supporterNotifications", {
      title: args.title,
      message: args.message,
      targetTier: args.targetTier,
      sentAt: Date.now(),
      sentBy: user._id,
      recipientCount: subscribers.length,
      discordWebhookSent: args.sendToDiscord ?? false,
    });

    return {
      notificationId,
      recipientCount: subscribers.length,
    };
  },
});

/**
 * List sent notifications
 */
export const listNotifications = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireCreator(ctx);

    const limit = args.limit ?? 20;

    const notifications = await ctx.db
      .query("supporterNotifications")
      .withIndex("by_sent")
      .order("desc")
      .take(limit);

    // Get sender info
    const withSenders = await Promise.all(
      notifications.map(async (n) => {
        const sender = await ctx.db.get(n.sentBy);
        return {
          ...n,
          senderName: sender?.displayName ?? "Unknown",
        };
      }),
    );

    return withSenders;
  },
});
