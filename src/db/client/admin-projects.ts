/**
 * Client-safe wrappers for admin project actions.
 * Calls /api/admin/projects-actions — safe for Pages Router.
 */

async function rpc<T = any>(action: string, params?: Record<string, any>): Promise<T> {
  const res = await fetch("/api/admin/projects-actions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...params }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Projects action failed: ${action}`);
  }
  return res.json();
}

export function listProjects() { return rpc("listProjects"); }
export function listTechnologies() { return rpc("listTechnologies"); }
export function listRoles() { return rpc("listRoles"); }
export function updateProject(id: number, data: Record<string, any>) {
  return rpc("updateProject", { id, data });
}
export function deleteProject(id: number) { return rpc("deleteProject", { id }); }
export function toggleProjectStatus(id: number) { return rpc("toggleProjectStatus", { id }); }
export function seedTechnologies(items: Array<{ key: string; label: string; color: string }>) {
  return rpc("seedTechnologies", { items });
}
export function seedRoles(items: Array<{ key: string; label: string; description: string; color: string }>) {
  return rpc("seedRoles", { items });
}
export function seedProjects(items: Array<Record<string, any>>) {
  return rpc("seedProjects", { items });
}
