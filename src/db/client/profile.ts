/**
 * Client-safe wrappers for profile operations.
 * Calls /api/profile-actions via fetch().
 */

async function rpc<T = any>(action: string, params?: Record<string, any>): Promise<T> {
  const res = await fetch("/api/profile-actions", {
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

export function getUserByUsername(username: string) {
  return rpc("getUserByUsername", { username });
}

export function getMeForProfile() {
  return rpc("getMeForProfile");
}

export function getUserContributions(userId: number) {
  return rpc("getUserContributions", { userId });
}

export function updateProfileLinks(
  links: Array<{ type: string; serviceKey?: string; url: string; title?: string }>,
) {
  return rpc("updateProfileLinks", { links });
}

export function updateShowOnCredits(showOnCredits: boolean) {
  return rpc("updateShowOnCredits", { showOnCredits });
}
