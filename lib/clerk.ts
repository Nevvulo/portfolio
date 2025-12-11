// Clerk configuration for OAuth providers and billing
// Discord and Google OAuth - configured in Clerk Dashboard
// Billing/Subscriptions - managed via Clerk Billing

export const clerkConfig = {
  // OAuth provider scopes (configured in Clerk Dashboard)
  socialProviders: {
    discord: {
      // Default scopes: identify, email
      scopes: ["identify", "email"],
    },
    google: {
      // Default scopes: openid, email, profile
      scopes: ["openid", "email", "profile"],
    },
  },
};

// Subscription plan identifiers (match your Clerk Dashboard plans)
export const PLANS = {
  SUPER_LEGEND: "super_legend",
  SUPER_LEGEND_2: "super_legend_2", // TODO: update when created
} as const;

// Feature identifiers (set these to match your Clerk Dashboard features)
export const FEATURES = {
  EARLY_ACCESS: "early_access",
  DISCORD_ROLE: "discord_role",
  PRIORITY_SUPPORT: "priority_support",
  PRIVATE_REPOS: "private_repos",
} as const;

export type PlanId = (typeof PLANS)[keyof typeof PLANS];
export type FeatureId = (typeof FEATURES)[keyof typeof FEATURES];
