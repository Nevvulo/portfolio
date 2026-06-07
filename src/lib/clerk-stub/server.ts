// TEMPORARY no-op stub for `@clerk/nextjs/server`.
//
// Swapped in at bundle time via `turbopack.resolveAlias` (and the webpack
// fallback) in next.config.mjs, on BOTH server and client. Every auth lookup
// resolves to "no user", so all auth-gated API routes return their unauthorized
// path and middleware lets every request through. To re-enable Clerk, delete
// the alias entries in next.config.mjs.

// biome-ignore lint/suspicious/noExplicitAny: stub type for the disabled webhook route
export type WebhookEvent = any;

const authObject = {
  userId: null,
  sessionId: null,
  orgId: null,
  sessionClaims: null,
  getToken: async () => null,
  protect: () => {
    throw new Error("Authentication is disabled");
  },
};

// App Router: auth() is async and returns the auth object.
export async function auth() {
  return authObject;
}
auth.protect = () => {
  throw new Error("Authentication is disabled");
};

// Pages Router: getAuth(req) is synchronous.
export function getAuth(_req?: unknown) {
  return authObject;
}

export async function currentUser() {
  return null;
}

// No code path reaches this while userId is always null (callers 401 first),
// but throw loudly if something ever does.
export async function clerkClient(): Promise<never> {
  throw new Error("Clerk is disabled");
}

// Middleware: let every request pass through untouched.
export function clerkMiddleware(_handler?: unknown) {
  return () => undefined;
}

export function createRouteMatcher(_patterns?: unknown) {
  return () => false;
}
