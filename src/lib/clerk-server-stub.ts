// Browser-only stub for @clerk/nextjs/server.
// Turbopack resolveAlias uses this for client bundles so that Pages Router
// pages don't pull in server-only Clerk modules. These functions are never
// called on the client — the "use server" action files handle the RPC boundary.

export function auth(): never {
  throw new Error("auth() is server-only");
}
export function getAuth(): never {
  throw new Error("getAuth() is server-only");
}
export function currentUser(): never {
  throw new Error("currentUser() is server-only");
}
export function clerkClient(): never {
  throw new Error("clerkClient() is server-only");
}
export function clerkMiddleware(): never {
  throw new Error("clerkMiddleware() is server-only");
}
export function createRouteMatcher(): never {
  throw new Error("createRouteMatcher() is server-only");
}
