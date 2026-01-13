"use client";

import { useUser } from "@clerk/nextjs";
import { useAction, useQuery } from "convex/react";
import { useRouter } from "next/router";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import { UsernameSetup } from "../lounge/UsernameSetup";
import styled from "styled-components";

interface AuthenticatedUserContextType {
  isReady: boolean;
  hasUsername: boolean;
  convexUserId: string | null;
}

const AuthenticatedUserContext = createContext<AuthenticatedUserContextType>({
  isReady: false,
  hasUsername: false,
  convexUserId: null,
});

export function useAuthenticatedUser() {
  return useContext(AuthenticatedUserContext);
}

interface AuthenticatedUserProviderProps {
  children: React.ReactNode;
}

export function AuthenticatedUserProvider({ children }: AuthenticatedUserProviderProps) {
  const router = useRouter();
  const { user, isSignedIn, isLoaded } = useUser();
  const [mounted, setMounted] = useState(false);
  const [usernameSkippedForSession, setUsernameSkippedForSession] = useState(false);
  const [userCreationAttempted, setUserCreationAttempted] = useState(false);

  const getOrCreateUser = useAction(api.users.getOrCreateUser);

  const convexUser = useQuery(
    api.users.getMe,
    isSignedIn && userCreationAttempted ? {} : "skip"
  );

  const isOnAccountPage = router.pathname === "/account";

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset skip state when navigating away from /account
  useEffect(() => {
    if (!isOnAccountPage) {
      setUsernameSkippedForSession(false);
    }
  }, [isOnAccountPage]);

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
      })
      .catch((err) => {
        console.error("[AuthenticatedUserProvider] Failed to create user:", err);
        setUserCreationAttempted(true);
      });
  }, [mounted, isLoaded, isSignedIn, user, userCreationAttempted, getOrCreateUser]);

  // Only show username modal on /account page
  const needsUsernameSetup =
    isOnAccountPage &&
    isSignedIn &&
    convexUser &&
    !convexUser.username &&
    !usernameSkippedForSession;

  const handleUsernameComplete = useCallback(() => {
  }, []);

  const handleUsernameSkip = useCallback(() => {
    setUsernameSkippedForSession(true);
  }, []);

  const contextValue: AuthenticatedUserContextType = {
    isReady: !isSignedIn || (userCreationAttempted && convexUser !== undefined),
    hasUsername: !!convexUser?.username,
    convexUserId: convexUser?._id ?? null,
  };

  if (needsUsernameSetup) {
    return (
      <AuthenticatedUserContext.Provider value={contextValue}>
        {children}
        <UsernameModal>
          <UsernameSetup
            onComplete={handleUsernameComplete}
            onSkip={handleUsernameSkip}
          />
        </UsernameModal>
      </AuthenticatedUserContext.Provider>
    );
  }

  return (
    <AuthenticatedUserContext.Provider value={contextValue}>
      {children}
    </AuthenticatedUserContext.Provider>
  );
}

const UsernameModal = styled.div`
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
`;
