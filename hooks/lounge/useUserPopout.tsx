import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { Id } from "../../convex/_generated/dataModel";
import type { UserPopoutState, UserPopoutContextValue } from "../../types/user-popout";

// Initial state
const initialState: UserPopoutState = {
  isOpen: false,
  targetUserId: null,
  anchorEl: null,
};

// Create context
const UserPopoutContext = createContext<UserPopoutContextValue | null>(null);

/**
 * Provider component for user popout state
 */
export function UserPopoutProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UserPopoutState>(initialState);

  const open = useCallback((userId: Id<"users">, anchor: HTMLElement) => {
    setState({
      isOpen: true,
      targetUserId: userId,
      anchorEl: anchor,
    });
  }, []);

  const close = useCallback(() => {
    setState(initialState);
  }, []);

  return (
    <UserPopoutContext.Provider value={{ state, open, close }}>
      {children}
    </UserPopoutContext.Provider>
  );
}

/**
 * Hook to access and control the user popout
 */
export function useUserPopout() {
  const context = useContext(UserPopoutContext);

  if (!context) {
    throw new Error("useUserPopout must be used within a UserPopoutProvider");
  }

  return context;
}
