/**
 * Client-safe wrapper for getMe().
 * Calls the existing /api/me endpoint — safe to import from Pages Router components.
 */
export async function getMe() {
  const res = await fetch("/api/me");
  if (!res.ok) return null;
  return res.json();
}
