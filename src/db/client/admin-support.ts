/**
 * Client-safe wrappers for admin support actions.
 * Calls /api/admin/support-actions — safe for Pages Router.
 */

async function rpc<T = any>(action: string, params?: Record<string, any>): Promise<T> {
  const res = await fetch("/api/admin/support-actions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...params }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Support action failed: ${action}`);
  }
  return res.json();
}

export function getQuickStats() { return rpc("getQuickStats"); }
export function listSuperLegends(tierFilter?: string) {
  return rpc("listSuperLegends", { tierFilter });
}
export function getSubscriberVerification(userId: number) {
  return rpc("getSubscriberVerification", { userId });
}
export function getContentDeliveryStats() { return rpc("getContentDeliveryStats"); }
export function listNotifications() { return rpc("listNotifications"); }
export function sendNotification(data: { title: string; message: string; targetTier: string }) {
  return rpc("sendNotification", data);
}
