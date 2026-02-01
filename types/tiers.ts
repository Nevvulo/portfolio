/**
 * Shared tier types used across the site.
 */

/**
 * User tier levels
 * - free: Free users with limited access
 * - tier1: Super Legend (paid tier 1)
 * - tier2: Super Legend II (paid tier 2)
 */
export type Tier = "free" | "tier1" | "tier2";

/**
 * User presence status
 */
export type PresenceStatus = "online" | "offline" | "away";

/**
 * Notification types
 */
export type NotificationType =
  | "mention"
  | "reply"
  | "new_content"
  | "comment_reply"
  | "collaborator_added"
  | "comment_reaction"
  | "feed_reply"
  | "feed_reaction";
