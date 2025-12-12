import type { Id } from "../convex/_generated/dataModel";
import type { Tier, PresenceStatus } from "./lounge";
import type { DiscordRole } from "./supporter";

/**
 * User profile data for the popout
 */
export interface UserProfile {
  _id: Id<"users">;
  clerkId: string;
  displayName: string;
  avatarUrl?: string;
  bannerUrl?: string;
  bannerFocalY: number; // 0-100, default 50
  bio?: string;
  tier: Tier;
  status: PresenceStatus;
  lastSeenAt: number;
  isCreator: boolean;
  createdAt: number;

  // Privacy-respecting fields (may be hidden)
  discordId?: string;
  showConnections: boolean;

  // Supporter status fields (from Convex)
  discordHighestRole?: DiscordRole | null;
  twitchSubTier?: 1 | 2 | 3 | null;
  discordBooster?: boolean | null;
  clerkPlan?: string | null;
  clerkPlanStatus?: string | null;

  // Connected account usernames (from Clerk)
  discordUsername?: string;
  twitchUsername?: string;
}

/**
 * Popout state
 */
export interface UserPopoutState {
  isOpen: boolean;
  targetUserId: Id<"users"> | null;
  anchorEl: HTMLElement | null;
}

/**
 * Popout context value
 */
export interface UserPopoutContextValue {
  state: UserPopoutState;
  open: (userId: Id<"users">, anchor: HTMLElement) => void;
  close: () => void;
}

/**
 * Banner upload result
 */
export interface BannerUploadResult {
  url: string;
  focalY: number;
}

/**
 * Bio filter result
 */
export interface BioFilterResult {
  isValid: boolean;
  reason?: string;
  filtered?: string;
}

/**
 * Connected account for display
 */
export interface ConnectedAccount {
  provider: "discord" | "twitch";
  username: string;
  profileUrl: string;
}
