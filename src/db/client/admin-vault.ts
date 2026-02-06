/**
 * Client-safe wrappers for admin vault actions.
 * Calls /api/admin/vault-actions — safe for Pages Router.
 */

async function rpc<T = any>(action: string, params?: Record<string, any>): Promise<T> {
  const res = await fetch("/api/admin/vault-actions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...params }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Vault action failed: ${action}`);
  }
  return res.json();
}

export function listVaultFiles(opts: { includeArchived: boolean }) {
  return rpc("listVaultFiles", opts);
}
export function getVaultFile(fileId: number) {
  return rpc("getVaultFile", { fileId });
}
export function createVaultFile(data: Record<string, any>) {
  return rpc("createVaultFile", data);
}
export function updateVaultFile(fileId: number, data: Record<string, any>) {
  return rpc("updateVaultFile", { fileId, ...data });
}
export function archiveVaultFile(fileId: number) {
  return rpc("archiveVaultFile", { fileId });
}
export function unarchiveVaultFile(fileId: number) {
  return rpc("unarchiveVaultFile", { fileId });
}
export function deleteVaultFile(fileId: number) {
  return rpc("deleteVaultFile", { fileId });
}
