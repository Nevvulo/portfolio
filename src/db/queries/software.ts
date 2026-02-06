import { and, eq } from "drizzle-orm";
import { db } from "../index";
import { software } from "../schema";

/** All active software sorted by display order. */
export async function getActiveSoftware() {
  return db.query.software.findMany({
    where: eq(software.status, "active"),
    orderBy: [software.displayOrder],
  });
}

/** All public software (all statuses) sorted by display order. */
export async function getAllPublicSoftware() {
  return db.query.software.findMany({
    orderBy: [software.displayOrder],
  });
}

/** Featured software (excluding games). */
export async function getFeaturedSoftware() {
  const featured = await db.query.software.findMany({
    where: and(eq(software.isFeatured, true), eq(software.status, "active")),
    orderBy: [software.displayOrder],
  });
  return featured.filter((s) => s.type !== "game");
}

/** Featured games only. */
export async function getFeaturedGames() {
  const featured = await db.query.software.findMany({
    where: and(eq(software.isFeatured, true), eq(software.status, "active")),
    orderBy: [software.displayOrder],
  });
  return featured.filter((s) => s.type === "game");
}

/** Single software by slug. */
export async function getSoftwareBySlug(slug: string) {
  return db.query.software.findFirst({
    where: eq(software.slug, slug),
  });
}

/** All active software slugs (for generateStaticParams). */
export async function getSoftwareSlugs() {
  const result = await db.query.software.findMany({
    where: eq(software.status, "active"),
    columns: { slug: true },
  });
  return result.map((s) => s.slug);
}

/** Software filtered by category. */
export async function getSoftwareByCategory(
  category: "open-source" | "commercial" | "personal" | "game",
) {
  return db.query.software.findMany({
    where: and(eq(software.category, category), eq(software.status, "active")),
    orderBy: [software.displayOrder],
  });
}

/** Software filtered by type. */
export async function getSoftwareByType(
  type: "app" | "tool" | "library" | "game" | "website" | "bot",
) {
  return db.query.software.findMany({
    where: and(eq(software.type, type), eq(software.status, "active")),
    orderBy: [software.displayOrder],
  });
}
