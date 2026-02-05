import { internalMutation } from "./_generated/server";
import { levelFromTotalXp } from "./experience";

/**
 * Backfill userStats table from users table.
 * Creates a userStats doc for each user with totalExperience > 0.
 * Safe to run multiple times (skips users that already have a userStats doc).
 */
export const runBackfillUserStats = internalMutation({
  args: {},
  handler: async (ctx) => {

    const users = await ctx.db.query("users").collect();
    let created = 0;
    let skipped = 0;

    for (const user of users) {
      // Check if userStats already exists
      const existing = await ctx.db
        .query("userStats")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .unique();

      if (existing) {
        skipped++;
        continue;
      }

      const totalXp = user.totalExperience ?? 0;
      const levelData = levelFromTotalXp(totalXp);

      await ctx.db.insert("userStats", {
        userId: user._id,
        clerkId: user.clerkId,
        totalExperience: totalXp,
        level: levelData.level,
        experience: levelData.currentXp,
      });
      created++;
    }

    return { created, skipped, total: users.length };
  },
});

/**
 * Backfill clerkId on experienceEvents, timeTrackingSessions,
 * widgetInteractions, and articleWatchTime tables.
 * Builds a userId→clerkId map from users table, then patches all records missing clerkId.
 * Safe to run multiple times (skips records that already have clerkId).
 */
export const runBackfillClerkIds = internalMutation({
  args: {},
  handler: async (ctx) => {

    // Build userId→clerkId map
    const users = await ctx.db.query("users").collect();
    const clerkIdMap = new Map<string, string>();
    for (const user of users) {
      clerkIdMap.set(user._id.toString(), user.clerkId);
    }

    const results: Record<string, { patched: number; skipped: number }> = {};

    // Backfill experienceEvents
    const expEvents = await ctx.db.query("experienceEvents").collect();
    let patched = 0;
    let skipped = 0;
    for (const event of expEvents) {
      if (event.clerkId) {
        skipped++;
        continue;
      }
      const clerkId = clerkIdMap.get(event.userId.toString());
      if (clerkId) {
        await ctx.db.patch(event._id, { clerkId });
        patched++;
      }
    }
    results.experienceEvents = { patched, skipped };

    // Backfill timeTrackingSessions
    const sessions = await ctx.db.query("timeTrackingSessions").collect();
    patched = 0;
    skipped = 0;
    for (const session of sessions) {
      if (session.clerkId) {
        skipped++;
        continue;
      }
      const clerkId = clerkIdMap.get(session.userId.toString());
      if (clerkId) {
        await ctx.db.patch(session._id, { clerkId });
        patched++;
      }
    }
    results.timeTrackingSessions = { patched, skipped };

    // Backfill widgetInteractions
    const interactions = await ctx.db.query("widgetInteractions").collect();
    patched = 0;
    skipped = 0;
    for (const interaction of interactions) {
      if (interaction.clerkId) {
        skipped++;
        continue;
      }
      const clerkId = clerkIdMap.get(interaction.userId.toString());
      if (clerkId) {
        await ctx.db.patch(interaction._id, { clerkId });
        patched++;
      }
    }
    results.widgetInteractions = { patched, skipped };

    // Backfill articleWatchTime
    const watchTimes = await ctx.db.query("articleWatchTime").collect();
    patched = 0;
    skipped = 0;
    for (const record of watchTimes) {
      if (record.clerkId) {
        skipped++;
        continue;
      }
      const clerkId = clerkIdMap.get(record.userId.toString());
      if (clerkId) {
        await ctx.db.patch(record._id, { clerkId });
        patched++;
      }
    }
    results.articleWatchTime = { patched, skipped };

    return results;
  },
});
