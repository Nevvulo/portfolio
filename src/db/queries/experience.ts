import { and, eq, sql } from "drizzle-orm";
import { db } from "../index";
import { experienceEvents, users } from "../schema";

/** XP formula: XP required to reach next level from current level. */
export function xpRequiredForLevel(level: number): number {
  return Math.floor(10 * Math.pow(level, 1.5));
}

/** Total XP needed to reach a given level from scratch. */
export function totalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += xpRequiredForLevel(i);
  }
  return total;
}

/** Compute level info from total XP. */
export function levelFromTotalXp(totalXp: number): {
  level: number;
  currentXp: number;
  xpForNextLevel: number;
} {
  let level = 1;
  let remaining = totalXp;
  while (remaining >= xpRequiredForLevel(level)) {
    remaining -= xpRequiredForLevel(level);
    level++;
  }
  return {
    level,
    currentXp: remaining,
    xpForNextLevel: xpRequiredForLevel(level),
  };
}

/** Get user's XP/level info. */
export async function getUserExperience(userId: number) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { totalExperience: true, level: true, experience: true },
  });
  if (!user) return null;

  const totalXp = user.totalExperience ?? 0;
  const info = levelFromTotalXp(totalXp);
  return {
    level: info.level,
    currentXp: info.currentXp,
    xpForNextLevel: info.xpForNextLevel,
    totalExperience: totalXp,
    progressPercent: info.xpForNextLevel > 0 ? (info.currentXp / info.xpForNextLevel) * 100 : 0,
  };
}

/** Today's XP breakdown by type. */
export async function getTodayXpBreakdown(userId: number) {
  const today = new Date().toISOString().split("T")[0]!;
  const rows = await db
    .select({
      type: experienceEvents.type,
      total: sql<number>`sum(${experienceEvents.xpGranted})`,
    })
    .from(experienceEvents)
    .where(and(eq(experienceEvents.userId, userId), eq(experienceEvents.date, today)))
    .groupBy(experienceEvents.type);

  const breakdown: Record<string, number> = {
    post_view: 0,
    news_read: 0,
    reaction: 0,
    comment: 0,
    time_on_site: 0,
    total: 0,
  };
  for (const row of rows) {
    breakdown[row.type] = Number(row.total);
    breakdown["total"] = (breakdown["total"] ?? 0) + Number(row.total);
  }
  return breakdown;
}
