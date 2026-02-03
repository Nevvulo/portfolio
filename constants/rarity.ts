// Rarity system constants - shared across all inventory components
// Ported from nevulounge src/constants/lounge.ts

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export interface RarityConfig {
  color: string;
  gradient: string;
  glow: string;
  glowIntense: string;
  label: string;
  animationIntensity: number;
  particleCount: number;
}

export const RARITY_ORDER: Record<Rarity, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 4,
  legendary: 5,
} as const;

export const RARITY_COLORS: Record<Rarity, RarityConfig> = {
  common: {
    color: "#9CA3AF",
    gradient: "linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)",
    glow: "0 0 12px rgba(156, 163, 175, 0.3)",
    glowIntense: "0 0 24px rgba(156, 163, 175, 0.5)",
    label: "Common",
    animationIntensity: 1,
    particleCount: 8,
  },
  uncommon: {
    color: "#22C55E",
    gradient: "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",
    glow: "0 0 12px rgba(34, 197, 94, 0.3)",
    glowIntense: "0 0 24px rgba(34, 197, 94, 0.5)",
    label: "Uncommon",
    animationIntensity: 1.2,
    particleCount: 12,
  },
  rare: {
    color: "#3B82F6",
    gradient: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
    glow: "0 0 12px rgba(59, 130, 246, 0.3)",
    glowIntense: "0 0 24px rgba(59, 130, 246, 0.5)",
    label: "Rare",
    animationIntensity: 1.5,
    particleCount: 20,
  },
  epic: {
    color: "#A855F7",
    gradient: "linear-gradient(135deg, #A855F7 0%, #9333EA 100%)",
    glow: "0 0 12px rgba(168, 85, 247, 0.3)",
    glowIntense: "0 0 24px rgba(168, 85, 247, 0.5)",
    label: "Epic",
    animationIntensity: 1.8,
    particleCount: 30,
  },
  legendary: {
    color: "#F97316",
    gradient: "linear-gradient(135deg, #F97316 0%, #EA580C 50%, #FBBF24 100%)",
    glow: "0 0 16px rgba(249, 115, 22, 0.4), 0 0 8px rgba(251, 191, 36, 0.2)",
    glowIntense: "0 0 32px rgba(249, 115, 22, 0.6), 0 0 16px rgba(251, 191, 36, 0.3)",
    label: "Legendary",
    animationIntensity: 2.5,
    particleCount: 50,
  },
} as const;

export const ITEM_TYPES = {
  cosmetic: { label: "Cosmetic", icon: "sparkles" },
  wallpaper: { label: "Wallpaper", icon: "image" },
  consumable: { label: "Consumable", icon: "flask" },
  download: { label: "Download", icon: "download" },
  code: { label: "Code", icon: "key" },
  role: { label: "Role", icon: "shield" },
  collectible: { label: "Collectible", icon: "gem" },
} as const;

export type ItemType = keyof typeof ITEM_TYPES;
