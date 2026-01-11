import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./auth";
import { Id } from "./_generated/dataModel";

// ============================================
// LEVELING FORMULA
// ============================================

/**
 * Calculate XP required for a given level
 * Formula: floor(10 * level^1.5)
 * Level 1: 10, Level 2: 28, Level 5: 112, Level 10: 316, Level 20: 894
 */
export function xpRequiredForLevel(level: number): number {
  return Math.floor(10 * Math.pow(level, 1.5));
}

/**
 * Calculate total XP needed to reach a level from level 1
 */
export function totalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += xpRequiredForLevel(i);
  }
  return total;
}

/**
 * Calculate level from total XP
 */
export function levelFromTotalXp(totalXp: number): { level: number; currentXp: number; xpForNextLevel: number } {
  let level = 1;
  let xpRemaining = totalXp;

  while (xpRemaining >= xpRequiredForLevel(level)) {
    xpRemaining -= xpRequiredForLevel(level);
    level++;
  }

  return {
    level,
    currentXp: xpRemaining,
    xpForNextLevel: xpRequiredForLevel(level),
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ============================================
// QUERIES
// ============================================

/**
 * Get current user's experience data
 */
export const getMyExperience = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const totalXp = user.totalExperience ?? 0;
    const levelData = levelFromTotalXp(totalXp);

    return {
      level: levelData.level,
      currentXp: levelData.currentXp,
      xpForNextLevel: levelData.xpForNextLevel,
      totalExperience: totalXp,
      progressPercent: Math.floor((levelData.currentXp / levelData.xpForNextLevel) * 100),
    };
  },
});

/**
 * Get experience data for any user
 */
export const getUserExperience = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const totalXp = user.totalExperience ?? 0;
    const levelData = levelFromTotalXp(totalXp);

    return {
      level: levelData.level,
      currentXp: levelData.currentXp,
      xpForNextLevel: levelData.xpForNextLevel,
      totalExperience: totalXp,
      progressPercent: Math.floor((levelData.currentXp / levelData.xpForNextLevel) * 100),
    };
  },
});

// ============================================
// INTERNAL XP GRANTING
// ============================================

async function grantXp(
  ctx: any,
  userId: Id<"users">,
  amount: number,
  type: "post_view" | "news_read" | "reaction" | "comment" | "time_on_site",
  referenceId?: string
) {
  const user = await ctx.db.get(userId);
  if (!user) return { success: false, reason: "User not found" };

  const today = getTodayString();

  // Record the XP event
  await ctx.db.insert("experienceEvents", {
    userId,
    type,
    referenceId,
    xpGranted: amount,
    date: today,
    createdAt: Date.now(),
  });

  // Update user's XP
  const newTotal = (user.totalExperience ?? 0) + amount;
  const levelData = levelFromTotalXp(newTotal);

  await ctx.db.patch(userId, {
    totalExperience: newTotal,
    level: levelData.level,
    experience: levelData.currentXp,
  });

  return { success: true, xpGranted: amount, newTotal, newLevel: levelData.level };
}

// ============================================
// XP GRANTING MUTATIONS
// ============================================

/**
 * Grant XP for viewing a post (1-3 XP, once per post per day)
 */
export const grantPostViewXp = mutation({
  args: { postId: v.id("blogPosts") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return { success: false, reason: "Not logged in" };

    const today = getTodayString();
    const refId = args.postId as string;

    // Check if already viewed this post today
    const existing = await ctx.db
      .query("experienceEvents")
      .withIndex("by_user_type_ref", (q) =>
        q.eq("userId", user._id).eq("type", "post_view").eq("referenceId", refId)
      )
      .filter((q) => q.eq(q.field("date"), today))
      .first();

    if (existing) {
      return { success: false, reason: "Already earned XP for this post today" };
    }

    // Get post to check if it's news
    const post = await ctx.db.get(args.postId);
    const xpAmount = post?.contentType === "news" ? 2 : randomInt(1, 3);

    return await grantXp(ctx, user._id, xpAmount, "post_view", refId);
  },
});

/**
 * Grant XP for first reaction on a post (1 XP, once per post ever)
 */
export const grantReactionXp = mutation({
  args: { postId: v.id("blogPosts") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return { success: false, reason: "Not logged in" };

    const refId = args.postId as string;

    // Check if already reacted to this post (ever)
    const existing = await ctx.db
      .query("experienceEvents")
      .withIndex("by_user_type_ref", (q) =>
        q.eq("userId", user._id).eq("type", "reaction").eq("referenceId", refId)
      )
      .first();

    if (existing) {
      return { success: false, reason: "Already earned XP for reacting to this post" };
    }

    return await grantXp(ctx, user._id, 1, "reaction", refId);
  },
});

/**
 * Grant XP for commenting (2-3 XP, max 5 per day)
 */
export const grantCommentXp = mutation({
  args: { postId: v.id("blogPosts") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return { success: false, reason: "Not logged in" };

    const today = getTodayString();

    // Count comments today
    const todayComments = await ctx.db
      .query("experienceEvents")
      .withIndex("by_user_type_date", (q) =>
        q.eq("userId", user._id).eq("type", "comment").eq("date", today)
      )
      .collect();

    if (todayComments.length >= 5) {
      return { success: false, reason: "Max 5 comment XP per day" };
    }

    const xpAmount = randomInt(2, 3);
    return await grantXp(ctx, user._id, xpAmount, "comment", args.postId as string);
  },
});

/**
 * Heartbeat for time tracking (call every minute)
 * Grants 3-10 XP per 10 minutes
 */
export const trackTimeHeartbeat = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return { success: false };

    const now = Date.now();
    const today = getTodayString();

    // Find or create session
    let session = await ctx.db
      .query("timeTrackingSessions")
      .withIndex("by_user_date", (q) => q.eq("userId", user._id).eq("date", today))
      .first();

    if (!session) {
      // Create new session
      await ctx.db.insert("timeTrackingSessions", {
        userId: user._id,
        sessionStart: now,
        lastHeartbeat: now,
        totalMinutes: 0,
        xpGrantedThisSession: 0,
        date: today,
      });
      return { success: true, minutesTracked: 0, xpGranted: 0 };
    }

    // Calculate minutes since last heartbeat
    const minutesSinceLast = Math.floor((now - session.lastHeartbeat) / 60000);

    // If more than 5 minutes, assume they were away - only count 1 minute
    const minutesToAdd = minutesSinceLast > 5 ? 1 : minutesSinceLast;
    const newTotalMinutes = session.totalMinutes + minutesToAdd;

    // Calculate XP to grant (every 10 minutes = 3-10 XP)
    const tenMinuteBlocks = Math.floor(newTotalMinutes / 10);
    const previousBlocks = Math.floor(session.totalMinutes / 10);
    const newBlocks = tenMinuteBlocks - previousBlocks;

    let xpGranted = 0;
    if (newBlocks > 0) {
      // Grant XP for each new 10-minute block
      for (let i = 0; i < newBlocks; i++) {
        const xpAmount = randomInt(3, 10);
        await grantXp(ctx, user._id, xpAmount, "time_on_site");
        xpGranted += xpAmount;
      }
    }

    // Update session
    await ctx.db.patch(session._id, {
      lastHeartbeat: now,
      totalMinutes: newTotalMinutes,
      xpGrantedThisSession: session.xpGrantedThisSession + xpGranted,
    });

    return {
      success: true,
      minutesTracked: newTotalMinutes,
      xpGranted,
      totalSessionXp: session.xpGrantedThisSession + xpGranted,
    };
  },
});

/**
 * Get today's XP breakdown
 */
export const getTodayXpBreakdown = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const today = getTodayString();

    const events = await ctx.db
      .query("experienceEvents")
      .withIndex("by_user_date", (q) => q.eq("userId", user._id).eq("date", today))
      .collect();

    const breakdown = {
      post_view: 0,
      news_read: 0,
      reaction: 0,
      comment: 0,
      time_on_site: 0,
      total: 0,
    };

    for (const event of events) {
      breakdown[event.type] += event.xpGranted;
      breakdown.total += event.xpGranted;
    }

    return breakdown;
  },
});
