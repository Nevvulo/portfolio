import styled from "styled-components";
import { Skeleton } from "../generics/skeleton";
import { BentoCard, type BentoCardProps } from "./BentoCard";

interface BentoGridProps {
  posts: BentoCardProps[];
  compact?: boolean;
}

export function BentoGrid({ posts, compact }: BentoGridProps) {
  if (posts.length === 0) {
    return (
      <EmptyState>
        <EmptyTitle>No posts yet</EmptyTitle>
        <EmptyDescription>Check back soon for new content!</EmptyDescription>
      </EmptyState>
    );
  }

  if (compact) {
    return (
      <CompactGridContainer>
        {posts.map((post) => (
          <BentoCard key={post._id} {...post} />
        ))}
      </CompactGridContainer>
    );
  }

  return (
    <GridContainer>
      {posts.map((post) => (
        <BentoCard key={post._id} {...post} />
      ))}
    </GridContainer>
  );
}

// COMPACT GRID for news - smaller rows, simpler layout, right-aligned
const CompactGridContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
  padding: 0 24px;
  max-width: 1400px;
  margin: 0 auto;

  @media (max-width: 900px) {
    gap: 8px;
    padding: 0 16px;
  }
`;

// TRUE BENTO GRID - 5 columns for proper bento layout
const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-auto-rows: 200px;
  grid-auto-flow: dense;
  gap: 16px;
  padding: 0 24px;
  max-width: 1400px;
  margin: 0 auto;

  /* Ensure grid items stretch to fill their cells */
  & > * {
    min-height: 100%;
    height: 100%;
  }

  @media (max-width: 1200px) {
    grid-template-columns: repeat(4, 1fr);
    grid-auto-rows: 180px;
  }

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: 180px;
    gap: 14px;
    padding: 0 16px;
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    grid-auto-rows: auto;
    gap: 16px;
    padding: 0 16px;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
`;

const EmptyTitle = styled.h2`
  margin: 0 0 8px;
  font-size: 24px;
  color: ${(props) => props.theme.contrast};
  font-family: var(--font-sans);
`;

const EmptyDescription = styled.p`
  margin: 0;
  font-size: 16px;
  color: ${(props) => props.theme.textColor};
  font-family: var(--font-sans);
`;

// ========== SKELETON LOADING ==========
const SkeletonBentoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-auto-rows: 200px;
  grid-auto-flow: dense;
  gap: 16px;
  padding: 0 24px;
  max-width: 1400px;
  margin: 0 auto;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(4, 1fr);
    grid-auto-rows: 180px;
  }

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: 180px;
    gap: 14px;
    padding: 0 16px;
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    grid-auto-rows: auto;
    gap: 16px;
  }
`;

const SkeletonBentoCard = styled(Skeleton)<{ $cols: number; $rows: number }>`
  border-radius: 16px;
  grid-column: span ${(p) => p.$cols};
  grid-row: span ${(p) => p.$rows};

  @media (max-width: 900px) {
    grid-column: span ${(p) => Math.min(p.$cols, 2)};
  }

  @media (max-width: 600px) {
    grid-column: span 1 !important;
    grid-row: span 1 !important;
    min-height: 200px;
  }
`;

export function BentoGridSkeleton() {
  return (
    <SkeletonBentoGrid>
      <SkeletonBentoCard $cols={3} $rows={2} />
      <SkeletonBentoCard $cols={2} $rows={2} />
      <SkeletonBentoCard $cols={2} $rows={1} />
      <SkeletonBentoCard $cols={2} $rows={1} />
      <SkeletonBentoCard $cols={1} $rows={1} />
    </SkeletonBentoGrid>
  );
}

export default BentoGrid;
