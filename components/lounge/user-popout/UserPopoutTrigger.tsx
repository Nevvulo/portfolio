import { ReactNode, useCallback } from "react";
import styled from "styled-components";
import type { Id } from "../../../convex/_generated/dataModel";
import { useUserPopout } from "../../../hooks/lounge/useUserPopout";

interface UserPopoutTriggerProps {
  userId: Id<"users">;
  children: ReactNode;
  className?: string;
}

/**
 * Wrapper component that triggers the user popout when clicked
 */
export function UserPopoutTrigger({
  userId,
  children,
  className,
}: UserPopoutTriggerProps) {
  const { open } = useUserPopout();

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      open(userId, e.currentTarget);
    },
    [userId, open]
  );

  return (
    <TriggerButton onClick={handleClick} className={className}>
      {children}
    </TriggerButton>
  );
}

const TriggerButton = styled.button`
  display: inline-flex;
  align-items: center;
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  color: inherit;
  font: inherit;
  text-align: inherit;

  &:hover {
    text-decoration: underline;
  }
`;

export default UserPopoutTrigger;
