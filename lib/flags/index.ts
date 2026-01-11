import { type Identify, dedupe, flag } from "flags/next";
import { createHypertuneAdapter } from "@flags-sdk/hypertune";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  createSource,
  flagFallbacks,
  vercelFlagDefinitions as flagDefinitions,
  type Context,
  type FlagValues,
} from "../generated/hypertune";

// Identify function that integrates with Clerk
const identify: Identify<Context> = dedupe(async () => {
  // Get Clerk auth - this works in server components and API routes
  const { userId } = await auth();

  // Default context for anonymous users
  let context: Context = {
    environment: (process.env.NODE_ENV as Context["environment"]) || "development",
    user: {
      id: "anonymous",
      name: "Anonymous",
      email: "",
    },
  };

  // If user is logged in, get their details
  if (userId) {
    try {
      const user = await currentUser();
      if (user) {
        context = {
          ...context,
          user: {
            id: user.id,
            name: user.firstName
              ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
              : user.username || "User",
            email: user.emailAddresses[0]?.emailAddress || "",
          },
        };
      }
    } catch {
      // Fallback to anonymous if user fetch fails
    }
  }

  return context;
});

// Create Hypertune adapter with Clerk context
const hypertuneAdapter = createHypertuneAdapter<FlagValues, Context>({
  createSource: (context) =>
    createSource({
      token: process.env.NEXT_PUBLIC_HYPERTUNE_TOKEN!,
    }).root({
      args: { context },
    }),
  flagFallbacks,
  flagDefinitions,
  identify,
});

// Export flags
export const enableLearnPageFlag = flag(hypertuneAdapter.declarations.enableLearnPage);

// Learn title animation flag - defaults to false (off)
// Will use Hypertune once the flag is added there, otherwise falls back to false
export const learnTitleAnimationFlag = flag({
  key: "learnTitleAnimation",
  defaultValue: false,
  description: "Enable title/description scroll animation effect on learn pages",
  decide: async () => {
    // Check if the flag exists in Hypertune adapter
    if ("learnTitleAnimation" in hypertuneAdapter.declarations) {
      const declaration = hypertuneAdapter.declarations as Record<string, unknown>;
      const flagFn = declaration.learnTitleAnimation;
      if (typeof flagFn === "function") {
        return flagFn();
      }
    }
    // Default to false if flag doesn't exist in Hypertune yet
    return false;
  },
});

// Export all flag declarations for use elsewhere
export const flags = {
  enableLearnPage: enableLearnPageFlag,
  learnTitleAnimation: learnTitleAnimationFlag,
};

// Helper to check if learn page is enabled (for use in pages)
export async function isLearnPageEnabled(): Promise<boolean> {
  try {
    return await enableLearnPageFlag();
  } catch {
    return false; // Default to false if flag check fails
  }
}

// Helper to check if learn title animation is enabled
export async function isLearnTitleAnimationEnabled(): Promise<boolean> {
  try {
    return await learnTitleAnimationFlag();
  } catch {
    return false; // Default to false if flag check fails
  }
}
