/**
 * Pages Router API route for admin project management.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { eq } from "drizzle-orm";
import { requireCreatorApi } from "@/src/db/api-auth";
import { db } from "@/src/db";
import { projects, roles, technologies } from "@/src/db/schema";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { action, ...params } = req.body;

    switch (action) {
      case "listProjects": {
        return res.json(await db.query.projects.findMany({ orderBy: [projects.displayOrder] }));
      }

      case "listTechnologies": {
        return res.json(await db.query.technologies.findMany({ orderBy: [technologies.key] }));
      }

      case "listRoles": {
        return res.json(await db.query.roles.findMany({ orderBy: [roles.key] }));
      }

      case "updateProject": {
        await requireCreatorApi(req);
        await db
          .update(projects)
          .set({ ...params.data, updatedAt: new Date() })
          .where(eq(projects.id, params.id));
        return res.json({ ok: true });
      }

      case "deleteProject": {
        await requireCreatorApi(req);
        await db.delete(projects).where(eq(projects.id, params.id));
        return res.json({ ok: true });
      }

      case "toggleProjectStatus": {
        await requireCreatorApi(req);
        const project = await db.query.projects.findFirst({ where: eq(projects.id, params.id) });
        if (!project) return res.status(404).json({ error: "Project not found" });
        const newStatus = project.status === "active" ? "inactive" : "active";
        await db.update(projects).set({ status: newStatus, updatedAt: new Date() }).where(eq(projects.id, params.id));
        return res.json({ ok: true });
      }

      case "seedTechnologies": {
        await requireCreatorApi(req);
        for (const item of params.items) {
          await db
            .insert(technologies)
            .values(item)
            .onConflictDoUpdate({ target: technologies.key, set: { label: item.label, color: item.color } });
        }
        return res.json({ ok: true });
      }

      case "seedRoles": {
        await requireCreatorApi(req);
        for (const item of params.items) {
          await db
            .insert(roles)
            .values(item)
            .onConflictDoUpdate({
              target: roles.key,
              set: { label: item.label, description: item.description, color: item.color },
            });
        }
        return res.json({ ok: true });
      }

      case "seedProjects": {
        await requireCreatorApi(req);
        for (const item of params.items) {
          await db
            .insert(projects)
            .values(item as any)
            .onConflictDoUpdate({ target: projects.slug, set: { ...item, updatedAt: new Date() } as any });
        }
        return res.json({ ok: true });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err: any) {
    if (err.message?.includes("required")) return res.status(401).json({ error: err.message });
    console.error("[/api/admin/projects-actions] Error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
