/**
 * Client-safe wrappers for admin software actions.
 * Calls /api/admin/software-actions — safe for Pages Router.
 */

async function rpc<T = any>(action: string, params?: Record<string, any>): Promise<T> {
  const res = await fetch("/api/admin/software-actions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...params }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Software action failed: ${action}`);
  }
  return res.json();
}

export function listAllSoftware() { return rpc("listAllSoftware"); }
export function createSoftware(data: Record<string, any>) {
  return rpc("createSoftware", { data });
}
export function updateSoftware(id: number, data: Record<string, any>) {
  return rpc("updateSoftware", { id, data });
}
export function removeSoftware(id: number) { return rpc("removeSoftware", { id }); }
