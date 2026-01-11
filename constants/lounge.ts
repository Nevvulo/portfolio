/**
 * nevulounge constants
 */

// Creator Discord ID for admin checks
export const CREATOR_DISCORD_ID = "246574843460321291";

// Layout dimensions
export const LOUNGE_LAYOUT = {
  sidebarWidth: "240px",
  sidebarWidthCollapsed: "64px",
  membersPanelWidth: "220px",
  headerHeight: "48px",
  messageMaxWidth: "800px",
  mobileBreakpoint: 768,
} as const;

// Color system for the lounge - theme agnostic accents
export const LOUNGE_COLORS = {
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

  // Glassmorphic (dark theme defaults - use LOUNGE_THEME for theme-aware)
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

// Theme-aware lounge colors
export const LOUNGE_THEME = {
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

// Default channels configuration
export const DEFAULT_CHANNELS = [
  {
    name: "lobby",
    slug: "lobby",
    type: "chat" as const,
    requiredTier: "free" as const,
    icon: "message-circle",
    description: "Open chat for everyone",
  },
  {
    name: "announcements",
    slug: "announcements",
    type: "announcements" as const,
    requiredTier: "free" as const,
    icon: "megaphone",
    description: "Important updates and news from Nevulo",
  },
  {
    name: "general",
    slug: "general",
    type: "chat" as const,
    requiredTier: "tier1" as const,
    icon: "message-circle",
    description: "General discussion for supporters",
  },
  {
    name: "content-drops",
    slug: "content-drops",
    type: "content" as const,
    requiredTier: "tier1" as const,
    icon: "sparkles",
    description: "Early access content and exclusive drops",
  },
  {
    name: "vip-lounge",
    slug: "vip-lounge",
    type: "chat" as const,
    requiredTier: "tier2" as const,
    icon: "crown",
    description: "Exclusive chat for Super Legend II members",
  },
  {
    name: "exclusive-content",
    slug: "exclusive-content",
    type: "content" as const,
    requiredTier: "tier2" as const,
    icon: "star",
    description: "Premium content only for tier 2 supporters",
  },
] as const;

// Content post types with metadata (FontAwesome icons and gradients)
export const CONTENT_TYPES = {
  music: {
    icon: "music", // fa-music
    faIcon: "faMusic",
    label: "Music / Audio",
    badgeLabel: "MUSIC",
    color: "#a855f7",
    colorSecondary: "#7c3aed",
    gradient: "linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(124, 58, 237, 0.04) 100%)",
    borderColor: "rgba(168, 85, 247, 0.25)",
    description: "Share music tracks, sound effects, or audio content",
  },
  video: {
    icon: "video", // fa-video
    faIcon: "faVideo",
    label: "Video",
    badgeLabel: "VIDEO",
    color: "#ef4444",
    colorSecondary: "#dc2626",
    gradient: "linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(220, 38, 38, 0.04) 100%)",
    borderColor: "rgba(239, 68, 68, 0.25)",
    description: "Share video content, trailers, or clips",
  },
  writing: {
    icon: "file-text", // fa-file-alt
    faIcon: "faFileAlt",
    label: "Writing / Blog",
    badgeLabel: "WRITING",
    color: "#3b82f6",
    colorSecondary: "#2563eb",
    gradient: "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(37, 99, 235, 0.04) 100%)",
    borderColor: "rgba(59, 130, 246, 0.25)",
    description: "Share blog drafts, stories, or written content",
  },
  game_build: {
    icon: "gamepad-2", // fa-gamepad
    faIcon: "faGamepad",
    label: "Game Build",
    badgeLabel: "GAME",
    color: "#22c55e",
    colorSecondary: "#16a34a",
    gradient: "linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(22, 163, 74, 0.04) 100%)",
    borderColor: "rgba(34, 197, 94, 0.25)",
    description: "Share game builds, demos, or playtest invites",
  },
  news: {
    icon: "newspaper", // fa-newspaper
    faIcon: "faNewspaper",
    label: "News / Announcement",
    badgeLabel: "NEWS",
    color: "#f59e0b",
    colorSecondary: "#d97706",
    gradient: "linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.04) 100%)",
    borderColor: "rgba(245, 158, 11, 0.25)",
    description: "Important news and updates",
  },
  tools: {
    icon: "wrench", // fa-wrench
    faIcon: "faWrench",
    label: "Tools / Resources",
    badgeLabel: "TOOLS",
    color: "#6366f1",
    colorSecondary: "#4f46e5",
    gradient: "linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(79, 70, 229, 0.04) 100%)",
    borderColor: "rgba(99, 102, 241, 0.25)",
    description: "Share useful tools, templates, or resources",
  },
  event: {
    icon: "calendar", // fa-calendar-alt
    faIcon: "faCalendarAlt",
    label: "Event",
    badgeLabel: "EVENT",
    color: "#ec4899",
    colorSecondary: "#db2777",
    gradient: "linear-gradient(135deg, rgba(236, 72, 153, 0.08) 0%, rgba(219, 39, 119, 0.04) 100%)",
    borderColor: "rgba(236, 72, 153, 0.25)",
    description: "Announce events, streams, or meetups",
  },
  advice: {
    icon: "lightbulb", // fa-lightbulb
    faIcon: "faLightbulb",
    label: "Advice / Tips",
    badgeLabel: "TIPS",
    color: "#14b8a6",
    colorSecondary: "#0d9488",
    gradient: "linear-gradient(135deg, rgba(20, 184, 166, 0.08) 0%, rgba(13, 148, 136, 0.04) 100%)",
    borderColor: "rgba(20, 184, 166, 0.25)",
    description: "Share quick tips, advice, or insights",
  },
  giveaway: {
    icon: "gift", // fa-gift
    faIcon: "faGift",
    label: "Giveaway",
    badgeLabel: "GIVEAWAY",
    color: "#f97316",
    colorSecondary: "#ea580c",
    gradient: "linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(234, 88, 12, 0.06) 100%)",
    borderColor: "rgba(249, 115, 22, 0.35)",
    description: "Host a giveaway for supporters",
  },
  poll: {
    icon: "bar-chart-2", // fa-poll
    faIcon: "faPoll",
    label: "Poll",
    badgeLabel: "POLL",
    color: "#8b5cf6",
    colorSecondary: "#7c3aed",
    gradient: "linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(124, 58, 237, 0.04) 100%)",
    borderColor: "rgba(139, 92, 246, 0.25)",
    description: "Create a poll to gather opinions",
  },
  emoji: {
    icon: "smile", // fa-smile
    faIcon: "faSmile",
    label: "Emoji Blast",
    badgeLabel: "EMOJI",
    color: "#fbbf24",
    colorSecondary: "#f59e0b",
    gradient: "linear-gradient(135deg, rgba(251, 191, 36, 0.12) 0%, rgba(245, 158, 11, 0.06) 100%)",
    borderColor: "rgba(251, 191, 36, 0.35)",
    description: "Send a fun emoji message to everyone",
  },
} as const;

// Reward types with default rarity hints
export const REWARD_TYPES = {
  emoji_pack: {
    icon: "smile-plus",
    label: "Emoji Pack",
    description: "Exclusive emoji pack for your Discord server",
    defaultRarity: "uncommon" as const,
  },
  wallpaper: {
    icon: "image",
    label: "Wallpaper",
    description: "High-resolution desktop or phone wallpaper",
    defaultRarity: "rare" as const,
  },
  discount_code: {
    icon: "ticket",
    label: "Discount Code",
    description: "Discount code for merch or services",
    defaultRarity: "epic" as const,
  },
  early_access: {
    icon: "clock",
    label: "Early Access",
    description: "Early access to upcoming content or features",
    defaultRarity: "legendary" as const,
  },
  shoutout: {
    icon: "megaphone",
    label: "Shoutout",
    description: "Personal shoutout on social media",
    defaultRarity: "legendary" as const,
  },
  custom: {
    icon: "sparkles",
    label: "Mystery Item",
    description: "A special surprise just for you",
    defaultRarity: "rare" as const,
  },
  music: {
    icon: "music",
    label: "Exclusive Track",
    description: "Exclusive music or audio content",
    defaultRarity: "epic" as const,
  },
  video: {
    icon: "video",
    label: "Exclusive Video",
    description: "Behind-the-scenes or exclusive video content",
    defaultRarity: "rare" as const,
  },
  game_key: {
    icon: "gamepad-2",
    label: "Game Key",
    description: "Game key or beta access code",
    defaultRarity: "legendary" as const,
  },
} as const;

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

// Channel icons mapping (Lucide icon names)
export const CHANNEL_ICONS: Record<string, string> = {
  megaphone: "Megaphone",
  "message-circle": "MessageCircle",
  sparkles: "Sparkles",
  crown: "Crown",
  star: "Star",
  hash: "Hash",
  "volume-2": "Volume2",
  book: "Book",
  code: "Code",
  "gamepad-2": "Gamepad2",
} as const;

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
    color: LOUNGE_COLORS.tier1,
    badge: "star",
  },
  tier2: {
    name: "Super Legend II",
    shortName: "Legend II",
    color: LOUNGE_COLORS.tier2,
    badge: "crown",
  },
} as const;
