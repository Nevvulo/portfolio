/**
 * Pages Router API route for admin software management.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { eq } from "drizzle-orm";
import { requireCreatorApi } from "@/src/db/api-auth";
import { db } from "@/src/db";
import { software } from "@/src/db/schema";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { action, ...params } = req.body;

    switch (action) {
      case "listAllSoftware": {
        await requireCreatorApi(req);
        return res.json(await db.query.software.findMany({ orderBy: [software.displayOrder] }));
      }

      case "createSoftware": {
        await requireCreatorApi(req);
        const [created] = await db.insert(software).values(params.data).returning();
        return res.json(created);
      }

      case "updateSoftware": {
        await requireCreatorApi(req);
        await db
          .update(software)
          .set({ ...params.data, updatedAt: new Date() })
          .where(eq(software.id, params.id));
        return res.json({ ok: true });
      }

      case "removeSoftware": {
        await requireCreatorApi(req);
        await db.delete(software).where(eq(software.id, params.id));
        return res.json({ ok: true });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err: any) {
    if (err.message?.includes("required")) return res.status(401).json({ error: err.message });
    console.error("[/api/admin/software-actions] Error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
