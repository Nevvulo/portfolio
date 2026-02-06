/**
 * Client-safe wrappers for admin blog operations.
 * Calls /api/admin/blog-actions via fetch() — safe to import from Pages Router components.
 */

async function rpc<T = any>(action: string, params?: Record<string, any>): Promise<T> {
  const res = await fetch("/api/admin/blog-actions", {
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

// ===================== POSTS =====================

export function listBlogPosts() {
  return rpc("listPosts");
}

export function getBlogPostContent(postId: number) {
  return rpc<string | null>("getPostContent", { postId });
}

export function createBlogPost(data: {
  slug: string;
  title: string;
  description: string;
  body?: string;
  contentType: string;
  coverImage?: string;
  coverAuthor?: string;
  coverAuthorUrl?: string;
  coverGradientIntensity?: number;
  youtubeId?: string;
  authorId: number;
  collaborators?: number[];
  labels?: string[];
  difficulty?: string;
  readTimeMins?: number;
  visibility?: string;
  bentoSize?: string;
  aiDisclosureStatus?: string;
}) {
  return rpc("createPost", { data });
}

export function updateBlogPost(
  id: number,
  data: Record<string, any>,
) {
  return rpc("updatePost", { id, data });
}

export function updateBentoLayout(
  updates: Array<{ id: number; bentoSize: string; bentoOrder: number }>,
) {
  return rpc("updateBentoLayout", { updates });
}

export function updateCollaborators(postId: number, collaboratorIds: number[]) {
  return rpc("updateCollaborators", { postId, collaboratorIds });
}

export function deleteBlogPost(id: number) {
  return rpc("deletePost", { id });
}

export function publishBlogPost(id: number) {
  return rpc("publishPost", { id });
}

export function unpublishBlogPost(id: number) {
  return rpc("unpublishPost", { id });
}

export function archiveBlogPost(id: number) {
  return rpc("archivePost", { id });
}

// ===================== USERS =====================

export function getUsersByIds(ids: number[]) {
  return rpc("getUsersByIds", { ids });
}

export function searchUsers(query: string) {
  return rpc("searchUsers", { query });
}

export function getCreatorId(): Promise<number> {
  return rpc("getCreatorId");
}

// ===================== ANALYTICS =====================

export function getDetailedAnalytics(days: number) {
  return rpc("getDetailedAnalytics", { days });
}

export function getViewsOverTime(days: number) {
  return rpc("getViewsOverTime", { days });
}

export function getReactionsOverTime(days: number) {
  return rpc("getReactionsOverTime", { days });
}

export function getCommentsOverTime(days: number) {
  return rpc("getCommentsOverTime", { days });
}

export function getAllPostsAnalytics(days: number) {
  return rpc("getAllPostsAnalytics", { days });
}

// ===================== MIGRATION =====================

export function getMigrationStatus() {
  return rpc("getMigrationStatus");
}
