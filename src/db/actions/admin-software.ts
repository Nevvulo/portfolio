"use server";

import { desc, eq } from "drizzle-orm";
import { requireCreator } from "../auth";
import { db } from "../index";
import { software } from "../schema";

export async function listAllSoftware() {
  await requireCreator();
  return db.query.software.findMany({
    orderBy: [software.displayOrder],
  });
}

export async function createSoftware(data: {
  slug: string;
  name: string;
  shortDescription: string;
  type: string;
  category: string;
  status?: string;
  logoUrl?: string;
  bannerUrl?: string;
  background?: string;
  links?: Record<string, string>;
  technologies?: string[];
  platforms?: string[];
  stats?: Record<string, any>;
  robloxUniverseId?: string;
  displayOrder?: number;
  isFeatured?: boolean;
  accentColor?: string;
  displaySize?: string;
  openExternally?: boolean;
  longDescription?: string;
}) {
  await requireCreator();
  const [created] = await db.insert(software).values(data).returning();
  return created;
}

export async function updateSoftware(
  id: number,
  data: Partial<{
    slug: string;
    name: string;
    shortDescription: string;
    longDescription: string;
    type: string;
    category: string;
    status: string;
    logoUrl: string | null;
    bannerUrl: string | null;
    background: string | null;
    links: Record<string, string> | null;
    technologies: string[];
    platforms: string[];
    stats: Record<string, any> | null;
    robloxUniverseId: string | null;
    displayOrder: number;
    isFeatured: boolean;
    accentColor: string | null;
    displaySize: string | null;
    openExternally: boolean;
  }>,
) {
  await requireCreator();
  await db
    .update(software)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(software.id, id));
}

export async function removeSoftware(id: number) {
  await requireCreator();
  await db.delete(software).where(eq(software.id, id));
}
