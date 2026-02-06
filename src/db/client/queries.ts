/**
 * Client-safe wrappers for query operations.
 * Calls /api/queries — safe to import from Pages Router components.
 */

async function rpc<T = any>(action: string, params?: Record<string, any>): Promise<T> {
  const res = await fetch("/api/queries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...params }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Query failed: ${action}`);
  }
  return res.json();
}

/** Get all published bento posts. */
export function getPostsForBento() {
  return rpc("getPostsForBento");
}

/** Get credits page data (supporters grouped by tier). */
export function getCreditsPage() {
  return rpc("getCreditsPage");
}

/** Get posts published before LLM era. */
export function getPreLLMPosts(limit = 6) {
  return rpc("getPreLLMPosts", { limit });
}

/** Get all unique labels from published posts. */
export function getAllLabels(): Promise<string[]> {
  return rpc("getAllLabels");
}

/** Get watch history for the current user. */
export function getWatchHistory(): Promise<{ slug: string; totalSeconds: number }[]> {
  return rpc("getWatchHistory");
}

/** Get a post by slug (public). */
export function getPostBySlug(slug: string) {
  return rpc("getPostBySlug", { slug });
}

/** Get a post by slug for editing (includes permission check). */
export function getPostBySlugForEdit(slug: string) {
  return rpc("getPostBySlugForEdit", { slug });
}
