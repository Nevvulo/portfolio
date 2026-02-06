/**
 * Client-safe wrappers for admin inventory actions.
 * Calls /api/admin/inventory-actions — safe for Pages Router.
 */

async function rpc<T = any>(action: string, params?: Record<string, any>): Promise<T> {
  const res = await fetch("/api/admin/inventory-actions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...params }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Inventory action failed: ${action}`);
  }
  return res.json();
}

// Item catalog
export function getItemCatalog(opts: { includeArchived: boolean }) {
  return rpc("getItemCatalog", opts);
}
export function createItem(data: Record<string, any>) {
  return rpc("createItem", { data });
}
export function updateItem(id: number, data: Record<string, any>) {
  return rpc("updateItem", { id, data });
}
export function archiveItem(id: number) {
  return rpc("archiveItem", { id });
}
export function unarchiveItem(id: number) {
  return rpc("unarchiveItem", { id });
}

// Lootbox templates
export function getLootboxTemplates() {
  return rpc("getLootboxTemplates");
}
export function createLootboxTemplate(data: Record<string, any>) {
  return rpc("createLootboxTemplate", { data });
}
export function updateLootboxTemplate(id: number, data: Record<string, any>) {
  return rpc("updateLootboxTemplate", { id, data });
}

// Ship / send
export function shipLootbox(data: Record<string, any>) {
  return rpc("shipLootbox", data);
}
export function sendDirectItem(data: { userId: number; itemId: number; quantity?: number }) {
  return rpc("sendDirectItem", data);
}

// Tier claimables
export function getTierClaimables() {
  return rpc("getTierClaimables");
}
export function createTierClaimable(data: Record<string, any>) {
  return rpc("createTierClaimable", { data });
}
export function deactivateTierClaimable(id: number) {
  return rpc("deactivateTierClaimable", { id });
}

// Analytics
export function getInventoryAnalytics() {
  return rpc("getInventoryAnalytics");
}
