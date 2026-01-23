"use client";

import { useUser } from "@clerk/nextjs";
import { useAction, useQuery } from "convex/react";
import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";

interface AuthenticatedUserContextType {
  isReady: boolean;
  convexUserId: string | null;
  error: Error | null;
}

const AuthenticatedUserContext = createContext<AuthenticatedUserContextType>({
  isReady: false,
  convexUserId: null,
  error: null,
});

export function useAuthenticatedUser() {
  return useContext(AuthenticatedUserContext);
}

interface AuthenticatedUserProviderProps {
  children: React.ReactNode;
}

export function AuthenticatedUserProvider({ children }: AuthenticatedUserProviderProps) {
  const { user, isSignedIn, isLoaded } = useUser();
  const [mounted, setMounted] = useState(false);
  const [userCreationAttempted, setUserCreationAttempted] = useState(false);
  const [userCreationError, setUserCreationError] = useState<Error | null>(null);

  const getOrCreateUser = useAction(api.users.getOrCreateUser);

  const convexUser = useQuery(api.users.getMe, isSignedIn && userCreationAttempted ? {} : "skip");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !isLoaded || !isSignedIn || !user || userCreationAttempted) return;

    const displayName = user.fullName || user.firstName || user.username || "User";
    const avatarUrl = user.imageUrl;

    getOrCreateUser({
      displayName,
      avatarUrl,
    })
      .then(() => {
        setUserCreationAttempted(true);
        setUserCreationError(null);
      })
      .catch((err) => {
        console.error("[AuthenticatedUserProvider] Failed to create user:", err);
        setUserCreationError(err instanceof Error ? err : new Error(String(err)));
        setUserCreationAttempted(true);
      });
  }, [mounted, isLoaded, isSignedIn, user, userCreationAttempted, getOrCreateUser]);

  const contextValue: AuthenticatedUserContextType = {
    isReady: !isSignedIn || (userCreationAttempted && convexUser !== undefined),
    convexUserId: convexUser?._id ?? null,
    error: userCreationError,
  };

  return (
    <AuthenticatedUserContext.Provider value={contextValue}>
      {children}
    </AuthenticatedUserContext.Provider>
  );
}
