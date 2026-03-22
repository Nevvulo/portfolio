import posthog from "posthog-js";

// Respect existing opt-out mechanisms
const isOptedOut =
  typeof window !== "undefined" &&
  (window.location.search.includes("notrack") ||
    localStorage.getItem("nevi_notrack") === "true");

if (
  typeof window !== "undefined" &&
  !isOptedOut &&
  process.env.NEXT_PUBLIC_POSTHOG_KEY
) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    defaults: "2026-01-30",
    capture_pageview: true,
    capture_pageleave: true,
  });
}

export default posthog;
