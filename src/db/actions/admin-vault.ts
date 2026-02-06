"use server";

import { desc, eq } from "drizzle-orm";
import { requireCreator } from "../auth";
import { db } from "../index";
import { vaultFiles } from "../schema";

// ============================================
// QUERIES
// ============================================

/** List all vault files (admin view, includes author info). */
export async function listVaultFiles(opts: { includeArchived: boolean }) {
  await requireCreator();
  const conditions = opts.includeArchived
    ? undefined
    : eq(vaultFiles.isArchived, false);
  return db.query.vaultFiles.findMany({
    where: conditions,
    orderBy: [desc(vaultFiles.createdAt)],
  });
}

/** Get a single vault file by ID (admin). */
export async function getVaultFile(fileId: number) {
  await requireCreator();
  return (
    db.query.vaultFiles.findFirst({
      where: eq(vaultFiles.id, fileId),
    }) ?? null
  );
}

// ============================================
// MUTATIONS
// ============================================

/** Create a new vault file entry. */
export async function createVaultFile(data: {
  title: string;
  description?: string;
  slug: string;
  fileType: string;
  fileUrl: string;
  thumbnailUrl?: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  visibility: string;
}) {
  const user = await requireCreator();

  const [created] = await db
    .insert(vaultFiles)
    .values({
      title: data.title,
      description: data.description ?? null,
      slug: data.slug,
      fileType: data.fileType,
      fileUrl: data.fileUrl,
      thumbnailUrl: data.thumbnailUrl ?? null,
      filename: data.filename,
      mimeType: data.mimeType,
      fileSize: data.fileSize,
      visibility: data.visibility,
      authorId: user.id,
      downloadCount: 0,
      isArchived: false,
    })
    .returning();

  return created;
}

/** Update a vault file's metadata. */
export async function updateVaultFile(
  fileId: number,
  data: Partial<{
    title: string;
    description: string | undefined;
    slug: string;
    visibility: string;
  }>,
) {
  await requireCreator();
  await db
    .update(vaultFiles)
    .set(data)
    .where(eq(vaultFiles.id, fileId));
}

/** Archive a vault file. */
export async function archiveVaultFile(fileId: number) {
  await requireCreator();
  await db
    .update(vaultFiles)
    .set({ isArchived: true })
    .where(eq(vaultFiles.id, fileId));
}

/** Unarchive a vault file. */
export async function unarchiveVaultFile(fileId: number) {
  await requireCreator();
  await db
    .update(vaultFiles)
    .set({ isArchived: false })
    .where(eq(vaultFiles.id, fileId));
}

/** Permanently delete a vault file. */
export async function deleteVaultFile(fileId: number) {
  await requireCreator();
  await db.delete(vaultFiles).where(eq(vaultFiles.id, fileId));
}
