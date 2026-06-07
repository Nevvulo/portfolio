// TEMPORARY no-op stub for `@clerk/nextjs`.
//
// Clerk is disabled for now (the hosted instance was removed). The real package
// stays installed so TypeScript types still resolve; this module is swapped in
// at bundle time via `turbopack.resolveAlias` (and the webpack fallback) in
// next.config.mjs. To re-enable Clerk, delete those alias entries.
//
// Behaviour: the app acts as a permanently signed-out site. No clerk-js is ever
// loaded, so there are no network calls and no "Failed to load Clerk" timeouts.
// Sign-in / sign-up entry points render nothing (hidden but code preserved).

import type React from "react";

type Props = { children?: React.ReactNode };

const Passthrough = ({ children }: Props) => <>{children ?? null}</>;
const RenderNothing = (_props: Props) => null;

// Provider — renders children, never bootstraps clerk-js.
export const ClerkProvider = ({ children }: Props) => <>{children ?? null}</>;
export const ClerkLoaded = Passthrough;
export const ClerkLoading = RenderNothing;

// Visibility gates — behave as a signed-out app.
export const SignedIn = RenderNothing;
export const SignedOut = Passthrough;
export const Protect = RenderNothing;

// Auth entry points — hidden while disabled.
export const SignInButton = RenderNothing;
export const SignUpButton = RenderNothing;
export const SignOutButton = RenderNothing;
export const UserButton = RenderNothing;
export const RedirectToSignIn = RenderNothing;
export const RedirectToSignUp = RenderNothing;

// Full-page sign-in / sign-up widgets — show a notice instead of the form.
const DisabledNotice = ({ label }: { label: string }) => (
  <div
    style={{
      maxWidth: 420,
      margin: "0 auto",
      padding: "2rem",
      textAlign: "center",
      color: "#fff",
      border: "1px solid rgba(79, 77, 193, 0.3)",
      borderRadius: 8,
      background: "rgba(30, 30, 40, 0.9)",
    }}
  >
    <h2 style={{ margin: "0 0 0.5rem" }}>{label} is temporarily unavailable</h2>
    <p style={{ margin: 0, color: "#bdbdbd" }}>
      Accounts are disabled right now — please check back later.
    </p>
  </div>
);

export const SignIn = () => <DisabledNotice label="Sign in" />;
export const SignUp = () => <DisabledNotice label="Sign up" />;

// Hooks — report a stable, signed-out state.
export const useUser = () => ({ isLoaded: true, isSignedIn: false, user: null });
export const useAuth = () => ({
  isLoaded: true,
  isSignedIn: false,
  userId: null,
  sessionId: null,
  orgId: null,
  getToken: async () => null,
  signOut: async () => {},
});
export const useClerk = () => ({
  loaded: true,
  signOut: async () => {},
  openSignIn: () => {},
  openSignUp: () => {},
  openUserProfile: () => {},
  redirectToSignIn: () => {},
  redirectToSignUp: () => {},
});
export const useSession = () => ({ isLoaded: true, isSignedIn: false, session: null });
export const useSessionList = () => ({
  isLoaded: true,
  sessions: [],
  setActive: async () => {},
});

// useReverification wraps an action and returns an enhanced version; with
// reverification disabled we just hand the original action back untouched.
export const useReverification = <T,>(fetcher: T): T => fetcher;
