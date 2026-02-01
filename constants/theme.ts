/**
 * Shared theme constants — brand colors, tier info, rarity system.
 * Extracted from the former nevulounge constants for site-wide use.
 */

// Styled-components global themes
export const DarkTheme = {
  background: "#100d1b",
  backgroundSecondary: "rgba(17, 17, 17, 0.8)",
  foreground: "#fff",
  contrast: "#fff",
  pure: "#fff",
  textColor: "#bdbdbd",
  textMuted: "rgba(255, 255, 255, 0.5)",
  border: "rgba(255, 255, 255, 0.1)",
  postBackground: "rgba(38, 32, 58, 0.7)",
  postImageLoadingBackground: "#1c1730",
  postImageLoadingBackgroundShimmerRgb: "42, 35, 66",
  postDescriptionText: "rgb(174 174 174)",
  linkColor: "#9074f2",
  postImageBoxShadow: "rgba(0, 0, 0, 0.5)",
  subscriptionBackground: "rgba(247, 190, 92, 0.2)",
  subscriptionText: "#f7be5c",
  difficultyBeginnerBackground: "#2d6b4f",
  difficultyIntermediateBackground: "#3d5a80",
  difficultyAdvancedBackground: "#7b3b5c",
  menuBackground: "rgba(17, 17, 17, 0.98)",
  menuBorder: "rgba(79, 77, 193, 0.2)",
  menuShadow: "rgba(0, 0, 0, 0.3)",
  navbarBackground: "rgba(17, 17, 17, 0.8)",
  navbarBorder: "rgba(79, 77, 193, 0.1)",
};

export const LightTheme = {
  background: "#fff",
  backgroundSecondary: "rgba(255, 255, 255, 0.95)",
  foreground: "#212121",
  contrast: "#000",
  pure: "#fff",
  textColor: "#212121",
  textMuted: "rgba(0, 0, 0, 0.5)",
  border: "rgba(0, 0, 0, 0.1)",
  linkColor: "#9074f2",
  postBackground: "rgb(218 211 245 / 17%)",
  postImageLoadingBackground: "#e2e1e8",
  postImageLoadingBackgroundShimmerRgb: "182, 180, 194",
  postDescriptionText: "rgb(76 76 76)",
  postImageBoxShadow: "rgba(210, 210, 210, 0.5)",
  subscriptionBackground: "rgba(247, 190, 92, 0.4)",
  subscriptionText: "#916a0f",
  difficultyBeginnerBackground: "rgb(0 128 11 / 68%)",
  difficultyIntermediateBackground: "rgb(0 29 178 / 52%)",
  difficultyAdvancedBackground: "rgb(204 52 34 / 71%)",
  menuBackground: "rgba(255, 255, 255, 0.98)",
  menuBorder: "rgba(79, 77, 193, 0.25)",
  menuShadow: "rgba(0, 0, 0, 0.15)",
  navbarBackground: "rgba(255, 255, 255, 0.9)",
  navbarBorder: "rgba(79, 77, 193, 0.15)",
};

// Creator Discord ID for admin checks
export const CREATOR_DISCORD_ID = "246574843460321291";

// Brand color system — site-wide accents
export const BRAND_COLORS = {
  // VIP Gold accents
  goldPrimary: "#f7be5c",
  goldSecondary: "#e6a84a",
  goldGlow: "rgba(247, 190, 92, 0.3)",

  // Tier indicators
  tier1: "#9074f2", // Purple (existing link color)
  tier2: "#f7be5c", // Gold

  // Tier backgrounds
  tier1Background: "rgba(144, 116, 242, 0.1)",
  tier2Background: "rgba(247, 190, 92, 0.1)",
  tier2Glow: "rgba(247, 190, 92, 0.2)",

  // Status indicators
  online: "#22c55e",
  away: "#eab308",
  offline: "#6b7280",
  dnd: "#ef4444",

  // Glassmorphic (dark theme defaults - use BRAND_THEME for theme-aware)
  glassBackground: "rgba(16, 13, 27, 0.85)",
  glassBorder: "rgba(144, 116, 242, 0.2)",
  glassHighlight: "rgba(255, 255, 255, 0.05)",
  glassShadow: "0 4px 30px rgba(0, 0, 0, 0.3)",

  // Message colors
  messageBackground: "rgba(255, 255, 255, 0.02)",
  messageHover: "rgba(255, 255, 255, 0.04)",
  messageMention: "rgba(247, 190, 92, 0.1)",

  // Channel colors
  channelActive: "rgba(144, 116, 242, 0.15)",
  channelHover: "rgba(255, 255, 255, 0.05)",
  channelLocked: "rgba(107, 114, 128, 0.3)",
} as const;

// Backwards-compatible alias
export const LOUNGE_COLORS = BRAND_COLORS;

// Theme-aware colors
export const BRAND_THEME = {
  dark: {
    background: "#100d1b",
    backgroundSecondary: "rgba(16, 13, 27, 0.95)",
    text: "#fff",
    textSecondary: "rgba(255, 255, 255, 0.7)",
    textMuted: "rgba(255, 255, 255, 0.5)",
    border: "rgba(255, 255, 255, 0.08)",
    borderAccent: "rgba(144, 116, 242, 0.2)",
    cardBackground: "rgba(255, 255, 255, 0.03)",
    cardHover: "rgba(255, 255, 255, 0.05)",
    inputBackground: "rgba(0, 0, 0, 0.3)",
  },
  light: {
    background: "#f8f7fc",
    backgroundSecondary: "#ffffff",
    text: "#1a1625",
    textSecondary: "rgba(26, 22, 37, 0.75)",
    textMuted: "rgba(26, 22, 37, 0.5)",
    border: "rgba(0, 0, 0, 0.08)",
    borderAccent: "rgba(144, 116, 242, 0.25)",
    cardBackground: "rgba(144, 116, 242, 0.04)",
    cardHover: "rgba(144, 116, 242, 0.08)",
    inputBackground: "rgba(0, 0, 0, 0.04)",
  },
} as const;

// Backwards-compatible alias
export const LOUNGE_THEME = BRAND_THEME;

// Rarity system colors and effects (Fortnite/Rocket League inspired)
export const RARITY_COLORS = {
  common: {
    color: "#9CA3AF",
    gradient: "linear-gradient(135deg, #9CA3AF, #6B7280)",
    glow: "rgba(156, 163, 175, 0.3)",
    glowIntense: "rgba(156, 163, 175, 0.5)",
    label: "Common",
    animationIntensity: 1,
    particleCount: 8,
  },
  uncommon: {
    color: "#22C55E",
    gradient: "linear-gradient(135deg, #22C55E, #16A34A)",
    glow: "rgba(34, 197, 94, 0.4)",
    glowIntense: "rgba(34, 197, 94, 0.6)",
    label: "Uncommon",
    animationIntensity: 1.2,
    particleCount: 12,
  },
  rare: {
    color: "#3B82F6",
    gradient: "linear-gradient(135deg, #3B82F6, #2563EB)",
    glow: "rgba(59, 130, 246, 0.5)",
    glowIntense: "rgba(59, 130, 246, 0.7)",
    label: "Rare",
    animationIntensity: 1.5,
    particleCount: 20,
  },
  epic: {
    color: "#A855F7",
    gradient: "linear-gradient(135deg, #A855F7, #9333EA)",
    glow: "rgba(168, 85, 247, 0.6)",
    glowIntense: "rgba(168, 85, 247, 0.8)",
    label: "Epic",
    animationIntensity: 1.8,
    particleCount: 30,
  },
  legendary: {
    color: "#F97316",
    gradient: "linear-gradient(135deg, #F97316, #EA580C, #FBBF24)",
    glow: "rgba(249, 115, 22, 0.7)",
    glowIntense: "rgba(249, 115, 22, 0.9)",
    secondaryGlow: "rgba(251, 191, 36, 0.5)",
    label: "Legendary",
    animationIntensity: 2.5,
    particleCount: 50,
  },
} as const;

// Rarity order for sorting (highest to lowest)
export const RARITY_ORDER: Record<string, number> = {
  legendary: 5,
  epic: 4,
  rare: 3,
  uncommon: 2,
  common: 1,
};

// Tier display info
export const TIER_INFO = {
  free: {
    name: "Member",
    shortName: "Member",
    color: "#9CA3AF", // Grey
    badge: null,
  },
  tier1: {
    name: "Super Legend",
    shortName: "Legend",
    color: BRAND_COLORS.tier1,
    badge: "star",
  },
  tier2: {
    name: "Super Legend II",
    shortName: "Legend II",
    color: BRAND_COLORS.tier2,
    badge: "crown",
  },
} as const;
