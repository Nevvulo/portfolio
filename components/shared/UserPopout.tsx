import type React from "react";
import styled from "styled-components";

/**
 * Simplified UserPopout components — the full popout system moved to lounge.nev.so.
 * These are lightweight stubs that preserve the same API surface.
 */

// Provider is a no-op passthrough
export function UserPopoutProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// Popout component is a no-op (nothing renders)
export function UserPopout() {
  return null;
}

// Trigger wraps children in a styled span
export const UserPopoutTrigger = styled.span<{ userId?: any }>`
  cursor: pointer;
  display: inline-flex;
  align-items: center;
`;
