export enum BadgeType {
  TWITCH_SUB_T1 = "TWITCH_SUB_T1",
  TWITCH_SUB_T2 = "TWITCH_SUB_T2",
  TWITCH_SUB_T3 = "TWITCH_SUB_T3",
  DISCORD_BOOSTER = "DISCORD_BOOSTER",
  DISCORD_ROLE = "DISCORD_ROLE",
  SUPER_LEGEND = "SUPER_LEGEND",
  SUPER_LEGEND_2 = "SUPER_LEGEND_2",
}

export const BadgeNames: Record<BadgeType, string> = {
  [BadgeType.TWITCH_SUB_T1]: "Twitch Sub",
  [BadgeType.TWITCH_SUB_T2]: "Twitch Sub T2",
  [BadgeType.TWITCH_SUB_T3]: "Twitch Sub T3",
  [BadgeType.DISCORD_BOOSTER]: "Server Booster",
  [BadgeType.DISCORD_ROLE]: "Discord Role",
  [BadgeType.SUPER_LEGEND]: "Super Legend I",
  [BadgeType.SUPER_LEGEND_2]: "Super Legend II",
};

export const BadgeColors: Record<BadgeType, string> = {
  [BadgeType.TWITCH_SUB_T1]: "#9147ff", // Twitch purple
  [BadgeType.TWITCH_SUB_T2]: "#772ce8", // Darker purple
  [BadgeType.TWITCH_SUB_T3]: "#5c16c5", // Even darker
  [BadgeType.DISCORD_BOOSTER]: "#f47fff", // Discord boost pink
  [BadgeType.DISCORD_ROLE]: "#5865F2", // Discord blurple (default, overridden by role color)
  [BadgeType.SUPER_LEGEND]: "#f7be5c", // Gold
  [BadgeType.SUPER_LEGEND_2]: "#e67e22", // Dark orange for tier 2
};

export const BadgeDescriptions: Record<BadgeType, string> = {
  [BadgeType.TWITCH_SUB_T1]: "Tier 1 Twitch Subscriber",
  [BadgeType.TWITCH_SUB_T2]: "Tier 2 Twitch Subscriber",
  [BadgeType.TWITCH_SUB_T3]: "Tier 3 Twitch Subscriber",
  [BadgeType.DISCORD_BOOSTER]: "Discord Server Booster",
  [BadgeType.DISCORD_ROLE]: "Discord Server Role",
  [BadgeType.SUPER_LEGEND]: "Super Legend Supporter",
  [BadgeType.SUPER_LEGEND_2]: "Super Legend 2 Supporter",
};
