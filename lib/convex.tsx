"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";
import type { ReactNode } from "react";

// Initialize the Convex client
// The URL comes from environment variable set during `npx convex dev` or deploy
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

// Create the Convex client (only if URL exists)
export const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

/**
 * Convex Provider with Clerk authentication
 * Wraps children with Convex context that uses Clerk for auth
 */
export function ConvexClientProvider({ children }: { children: ReactNode }) {
  // If Convex isn't configured, just render children without the provider
  if (!convex) {
    return <>{children}</>;
  }

  // Use the provider - reference it here to avoid unused import warning
  const Provider = ConvexProviderWithClerk;

  return (
    <Provider client={convex} useAuth={useAuth}>
      {children}
    </Provider>
  );
}
