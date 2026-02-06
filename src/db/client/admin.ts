/**
 * Client-safe wrappers for general admin actions.
 * Calls /api/admin/actions — safe for Pages Router.
 */

async function rpc<T = any>(action: string, params?: Record<string, any>): Promise<T> {
  const res = await fetch("/api/admin/actions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...params }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Admin action failed: ${action}`);
  }
  return res.json();
}

// Staff management
export function getStaffMembers() { return rpc("getStaffMembers"); }
export function searchUsers(query: string) { return rpc("searchUsers", { query }); }
export function addStaff(userId: number, role: number) { return rpc("addStaff", { userId, role }); }
export function removeStaff(userId: number) { return rpc("removeStaff", { userId }); }

// Stream settings
export function getStreamSettings() { return rpc("getStreamSettings"); }
export function updateStreamChance(data: { streamChance: number; streamChanceMessage?: string }) {
  return rpc("updateStreamChance", data);
}
export function getUpcomingEvents() { return rpc("getUpcomingEvents"); }

// YouTube settings
export function getYouTubeSettings() { return rpc("getYouTubeSettings"); }
export function updateYouTubeSettings(data: Record<string, any>) {
  return rpc("updateYouTubeSettings", { data });
}

// Discord settings
export function getDiscordSettings() { return rpc("getDiscordSettings"); }
export function updateDiscordSettings(data: Record<string, any>) {
  return rpc("updateDiscordSettings", { data });
}

// Moderation
export function getCommentReports() { return rpc("getCommentReports"); }
export function resolveCommentReport(reportId: number, status: string, deleteComment: boolean) {
  return rpc("resolveCommentReport", { reportId, status, deleteComment });
}
export function getContentReports() { return rpc("getContentReports"); }
export function resolveContentReport(reportId: number, status: string) {
  return rpc("resolveContentReport", { reportId, status });
}
