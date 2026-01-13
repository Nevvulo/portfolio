"use client";

import { useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import type { ReactNode } from "react";

// Initialize the Convex client
// The URL comes from environment variable set during `npx convex dev` or deploy
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

// Skip Convex in headless/test environments (e.g., Lighthouse) to prevent WebSocket errors
const isHeadless =
  typeof navigator !== "undefined" &&
  (navigator.webdriver === true || /HeadlessChrome/.test(navigator.userAgent));

// Create the Convex client (only if URL exists and not in headless mode)
export const convex = convexUrl && !isHeadless ? new ConvexReactClient(convexUrl) : null;

/**
 * Convex Provider with Clerk authentication
 * Wraps children with Convex context that uses Clerk for auth
 */
export function ConvexClientProvider({ children }: { children: ReactNode }) {
  // If Convex isn't configured, just render children without the provider
  if (!convex) {
    return <>{children}</>;
  }

  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
