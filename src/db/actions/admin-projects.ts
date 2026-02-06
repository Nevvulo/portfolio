"use server";

import { eq } from "drizzle-orm";
import { requireCreator } from "../auth";
import { db } from "../index";
import { projects, roles, technologies } from "../schema";

export async function listProjects() {
  return db.query.projects.findMany({
    orderBy: [projects.displayOrder],
  });
}

export async function listTechnologies() {
  return db.query.technologies.findMany({
    orderBy: [technologies.key],
  });
}

export async function listRoles() {
  return db.query.roles.findMany({
    orderBy: [roles.key],
  });
}

export async function updateProject(
  id: number,
  data: Partial<{
    slug: string;
    name: string;
    shortDescription: string;
    background: string;
    logoUrl: string | null;
    logoDarkUrl: string | null;
    logoWidth: number | null;
    logoHeight: number | null;
    logoIncludesName: boolean;
    status: string;
    maintained: boolean;
    timeline: Record<string, any>;
    links: Record<string, string> | null;
    technologies: string[];
    roles: string[];
    contentSections: any[];
    displayOrder: number;
  }>,
) {
  await requireCreator();
  await db
    .update(projects)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(projects.id, id));
}

export async function deleteProject(id: number) {
  await requireCreator();
  await db.delete(projects).where(eq(projects.id, id));
}

export async function toggleProjectStatus(id: number) {
  await requireCreator();
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, id),
  });
  if (!project) throw new Error("Project not found");
  const newStatus = project.status === "active" ? "inactive" : "active";
  await db
    .update(projects)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(projects.id, id));
}

// Seed helpers
export async function seedTechnologies(
  items: Array<{ key: string; label: string; color: string }>,
) {
  await requireCreator();
  for (const item of items) {
    await db
      .insert(technologies)
      .values(item)
      .onConflictDoUpdate({
        target: technologies.key,
        set: { label: item.label, color: item.color },
      });
  }
}

export async function seedRoles(
  items: Array<{ key: string; label: string; description: string; color: string }>,
) {
  await requireCreator();
  for (const item of items) {
    await db
      .insert(roles)
      .values(item)
      .onConflictDoUpdate({
        target: roles.key,
        set: { label: item.label, description: item.description, color: item.color },
      });
  }
}

export async function seedProjects(
  items: Array<Record<string, any>>,
) {
  await requireCreator();
  for (const item of items) {
    await db
      .insert(projects)
      .values(item as any)
      .onConflictDoUpdate({
        target: projects.slug,
        set: { ...item, updatedAt: new Date() } as any,
      });
  }
}
