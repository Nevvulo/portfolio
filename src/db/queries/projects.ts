import { eq, inArray } from "drizzle-orm";
import { db } from "../index";
import { projects, technologies, roles } from "../schema";

/** All active projects sorted by display order. */
export async function getActiveProjects() {
  return db.query.projects.findMany({
    where: eq(projects.status, "active"),
    orderBy: [projects.displayOrder],
  });
}

/** Single project by slug. */
export async function getProjectBySlug(slug: string) {
  return db.query.projects.findFirst({
    where: eq(projects.slug, slug),
  });
}

/** All active project slugs (for generateStaticParams). */
export async function getProjectSlugs() {
  const result = await db.query.projects.findMany({
    where: eq(projects.status, "active"),
    columns: { slug: true },
  });
  return result.map((p) => p.slug);
}

/** Projects sorted by timeline (most recent first). */
export async function getProjectsByTimeline() {
  const active = await db.query.projects.findMany({
    where: eq(projects.status, "active"),
  });
  return active.sort((a, b) => {
    const aTimeline = a.timeline as { startYear: number; endYear?: number; endMonth?: number };
    const bTimeline = b.timeline as { startYear: number; endYear?: number; endMonth?: number };
    const aEnd = aTimeline.endYear ?? 9999;
    const bEnd = bTimeline.endYear ?? 9999;
    if (aEnd !== bEnd) return bEnd - aEnd;
    return (bTimeline.endMonth ?? 12) - (aTimeline.endMonth ?? 12);
  });
}

/** Unique sorted years from project timelines. */
export async function getTimelineYears() {
  const active = await db.query.projects.findMany({
    where: eq(projects.status, "active"),
    columns: { timeline: true },
  });
  const years = new Set<number>();
  for (const p of active) {
    const t = p.timeline as { startYear: number; endYear?: number };
    for (let y = t.startYear; y <= (t.endYear ?? new Date().getFullYear()); y++) {
      years.add(y);
    }
  }
  return Array.from(years).sort((a, b) => a - b);
}

/** Lookup technologies by their keys. */
export async function getTechnologiesByKeys(keys: string[]) {
  if (keys.length === 0) return [];
  return db.query.technologies.findMany({
    where: inArray(technologies.key, keys),
  });
}

/** Lookup roles by their keys. */
export async function getRolesByKeys(keys: string[]) {
  if (keys.length === 0) return [];
  return db.query.roles.findMany({
    where: inArray(roles.key, keys),
  });
}
