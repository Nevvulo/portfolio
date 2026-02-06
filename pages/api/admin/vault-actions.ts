/**
 * Pages Router API route for admin vault file management.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { desc, eq } from "drizzle-orm";
import { requireCreatorApi } from "@/src/db/api-auth";
import { db } from "@/src/db";
import { vaultFiles } from "@/src/db/schema";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { action, ...params } = req.body;

    switch (action) {
      case "listVaultFiles": {
        await requireCreatorApi(req);
        const conditions = params.includeArchived ? undefined : eq(vaultFiles.isArchived, false);
        const files = await db.query.vaultFiles.findMany({
          where: conditions,
          orderBy: [desc(vaultFiles.createdAt)],
        });
        return res.json(files);
      }

      case "getVaultFile": {
        await requireCreatorApi(req);
        const file = await db.query.vaultFiles.findFirst({
          where: eq(vaultFiles.id, params.fileId),
        });
        return res.json(file ?? null);
      }

      case "createVaultFile": {
        const user = await requireCreatorApi(req);
        const [created] = await db
          .insert(vaultFiles)
          .values({
            title: params.title,
            description: params.description ?? null,
            slug: params.slug,
            fileType: params.fileType,
            fileUrl: params.fileUrl,
            thumbnailUrl: params.thumbnailUrl ?? null,
            filename: params.filename,
            mimeType: params.mimeType,
            fileSize: params.fileSize,
            visibility: params.visibility,
            authorId: user.id,
            downloadCount: 0,
            isArchived: false,
          })
          .returning();
        return res.json(created);
      }

      case "updateVaultFile": {
        await requireCreatorApi(req);
        const { fileId, ...data } = params;
        await db.update(vaultFiles).set(data).where(eq(vaultFiles.id, fileId));
        return res.json({ ok: true });
      }

      case "archiveVaultFile": {
        await requireCreatorApi(req);
        await db.update(vaultFiles).set({ isArchived: true }).where(eq(vaultFiles.id, params.fileId));
        return res.json({ ok: true });
      }

      case "unarchiveVaultFile": {
        await requireCreatorApi(req);
        await db.update(vaultFiles).set({ isArchived: false }).where(eq(vaultFiles.id, params.fileId));
        return res.json({ ok: true });
      }

      case "deleteVaultFile": {
        await requireCreatorApi(req);
        await db.delete(vaultFiles).where(eq(vaultFiles.id, params.fileId));
        return res.json({ ok: true });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err: any) {
    if (err.message?.includes("required")) return res.status(401).json({ error: err.message });
    console.error("[/api/admin/vault-actions] Error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
