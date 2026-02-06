/**
 * Client-safe wrappers for inventory, vault, and lootbox operations.
 * Calls /api/inventory-actions via fetch().
 */

async function rpc<T = any>(action: string, params?: Record<string, any>): Promise<T> {
  const res = await fetch("/api/inventory-actions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...params }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ===================== VAULT =====================

export function getVaultContent(limit: number, offset: number) {
  return rpc("getVaultContent", { limit, offset });
}

// ===================== INVENTORY =====================

export function getMyInventory() {
  return rpc("getMyInventory");
}

export function getMyLootboxes(opened: boolean) {
  return rpc("getMyLootboxes", { opened });
}

export function getAvailableClaimables() {
  return rpc("getAvailableClaimables");
}

export function claimTierItem(tierClaimableId: number) {
  return rpc("claimTierItem", { tierClaimableId });
}

export function useConsumableItem(inventoryEntryId: number) {
  return rpc("useConsumableItem", { inventoryEntryId });
}

export function openLootbox(lootboxId: number) {
  return rpc("openLootbox", { lootboxId });
}
