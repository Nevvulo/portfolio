import type { ReactNode } from "react";
import styled from "styled-components";

interface VaultGridProps {
  children: ReactNode;
}

export function VaultGrid({ children }: VaultGridProps) {
  return <Grid>{children}</Grid>;
}

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  padding: 0 48px;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  box-sizing: border-box;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 14px;
    padding: 0 16px;
  }
`;
