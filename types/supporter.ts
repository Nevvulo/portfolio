export interface DiscordRole {
  id: string;
  name: string;
  color: number;
  position: number;
}

export interface SupporterStatus {
  // External platform badges
  twitchSubTier: 1 | 2 | 3 | null;
  discordBooster: boolean;
  discordHighestRole: DiscordRole | null;
  twitchUserId?: string;
  discordUserId?: string;

  // Clerk subscription (cached)
  clerkPlan: "super_legend" | "super_legend_2" | null;
  clerkPlanStatus: "active" | "past_due" | "canceled" | null;

  // Founder status (first 10 subscribers, permanent badge)
  // 1-10 = founder number, null = not a founder
  founderNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | null;

  lastSyncedAt: string;
}

export interface SupporterStatusResponse {
  status: SupporterStatus | null;
  needsSync: boolean;
}
