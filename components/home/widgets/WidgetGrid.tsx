import type { ReactNode } from "react";
import styled from "styled-components";

interface WidgetGridProps {
  children: ReactNode;
  className?: string;
}

export function WidgetGrid({ children, className }: WidgetGridProps) {
  return <Grid className={className}>{children}</Grid>;
}

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 0 48px;

  @media (max-width: 1199px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 0 16px;
    gap: 12px;
  }
`;

// Row variants for specific layouts
export const WidgetRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 16px;
  padding: 0 48px;

  @media (max-width: 1199px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 0 16px;
    gap: 12px;
  }
`;

export const WidgetFullWidth = styled.div`
  padding: 0 48px;

  @media (max-width: 768px) {
    padding: 0 16px;
  }
`;
