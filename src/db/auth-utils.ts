/**
 * Check if a user's tier grants access to content with the given visibility.
 * Pure function — no server dependencies, safe for any context.
 */
export function canAccessTier(
  userTier: string | undefined | null,
  requiredVisibility: string,
): boolean {
  if (requiredVisibility === "public") return true;
  if (!userTier) return false;
  if (requiredVisibility === "members") return true;
  if (requiredVisibility === "tier1") return userTier === "tier1" || userTier === "tier2";
  if (requiredVisibility === "tier2") return userTier === "tier2";
  return false;
}
