"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery as useRQ } from "@tanstack/react-query";
import { createContext, useContext } from "react";

interface MeResponse {
  id: number;
  displayName: string;
  avatarUrl: string | null;
  username: string;
  isCreator: boolean;
  role: number | null;
}

async function fetchMe(): Promise<MeResponse | null> {
  const res = await fetch("/api/me");
  if (!res.ok) return null;
  return res.json();
}

interface AuthenticatedUserContextType {
  isReady: boolean;
  userId: number | null;
  error: Error | null;
}

const AuthenticatedUserContext = createContext<AuthenticatedUserContextType>({
  isReady: false,
  userId: null,
  error: null,
});

export function useAuthenticatedUser() {
  return useContext(AuthenticatedUserContext);
}

interface AuthenticatedUserProviderProps {
  children: React.ReactNode;
}

export function AuthenticatedUserProvider({ children }: AuthenticatedUserProviderProps) {
  const { isSignedIn, isLoaded } = useUser();

  const { data: me, error, isLoading } = useRQ({
    queryKey: ["me"],
    queryFn: fetchMe,
    enabled: isLoaded && !!isSignedIn,
    staleTime: 60_000,
  });

  const contextValue: AuthenticatedUserContextType = {
    isReady: !isSignedIn || (!isLoading && me !== undefined),
    userId: me?.id ?? null,
    error: error instanceof Error ? error : null,
  };

  return (
    <AuthenticatedUserContext.Provider value={contextValue}>
      {children}
    </AuthenticatedUserContext.Provider>
  );
}
