import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createSource, type Context } from "./lib/generated/hypertune";

// Routes that require authentication
const isProtectedRoute = createRouteMatcher([
  "/account(.*)",
  "/lounge(.*)", // nevulounge requires authentication
]);

// Auth routes should never be protected
const isAuthRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

// Blog routes that should redirect to /learn when flag is enabled
const isBlogRoute = createRouteMatcher(["/blog", "/blog/(.*)"]);

// Check if learn page feature flag is enabled
async function isLearnPageEnabled(userId?: string | null): Promise<boolean> {
  try {
    const context: Context = {
      environment: (process.env.NODE_ENV as Context["environment"]) || "development",
      user: {
        id: userId || "anonymous",
        name: "User",
        email: "",
      },
    };

    const hypertune = createSource({
      token: process.env.NEXT_PUBLIC_HYPERTUNE_TOKEN!,
    });

    // Wait for SDK to fetch latest flag values from Hypertune
    await hypertune.initIfNeeded();

    return hypertune.root({ args: { context } }).enableLearnPage({ fallback: false });
  } catch {
    return false;
  }
}

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // Handle blog -> learn redirect when feature flag is enabled
  if (isBlogRoute(req)) {
    const enableLearn = await isLearnPageEnabled(userId);
    if (enableLearn) {
      const url = req.nextUrl.clone();
      // Redirect /blog -> /learn, /blog/[slug] -> /learn/[slug]
      url.pathname = url.pathname.replace(/^\/blog/, "/learn");
      return NextResponse.redirect(url);
    }
  }

  if (isAuthRoute(req)) {
    return; // Don't protect auth routes
  }
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
