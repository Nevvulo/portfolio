import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  typescript: true,
});

// Stripe Price IDs — set in .env.local
export const STRIPE_PRICES = {
  super_legend_monthly: process.env.STRIPE_PRICE_SL1_MONTHLY!,
  super_legend_annual: process.env.STRIPE_PRICE_SL1_ANNUAL!,
  super_legend_lifetime: process.env.STRIPE_PRICE_SL1_LIFETIME!,
  super_legend_2_monthly: process.env.STRIPE_PRICE_SL2_MONTHLY!,
  super_legend_2_annual: process.env.STRIPE_PRICE_SL2_ANNUAL!,
  super_legend_2_lifetime: process.env.STRIPE_PRICE_SL2_LIFETIME!,
} as const;
