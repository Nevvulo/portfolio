import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import styled, { keyframes } from "styled-components";

interface BentoWidgetGridProps {
  children: ReactNode;
  loading?: boolean;
}

const GAP = 16;

function getColCount() {
  if (typeof window === "undefined") return 3;
  if (window.innerWidth <= 768) return 1;
  if (window.innerWidth <= 1199) return 2;
  return 3;
}

export function BentoWidgetGrid({ children, loading }: BentoWidgetGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const rafRef = useRef<number>(0);

  const layout = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const cells = Array.from(container.children) as HTMLElement[];
    if (cells.length === 0) return;

    const colCount = getColCount();
    const containerWidth = container.clientWidth;
    const colWidth = (containerWidth - GAP * (colCount - 1)) / colCount;

    // Track the bottom-edge of each column
    const colHeights = new Array(colCount).fill(0);

    for (const cell of cells) {
      const span = Math.min(
        parseInt(cell.dataset.cols || "1", 10) || 1,
        colCount
      );

      // Find the best starting column: where the tallest spanned column is shortest
      let bestCol = 0;
      let bestMax = Infinity;
      for (let c = 0; c <= colCount - span; c++) {
        let maxH = 0;
        for (let s = 0; s < span; s++) {
          maxH = Math.max(maxH, colHeights[c + s]);
        }
        if (maxH < bestMax) {
          bestMax = maxH;
          bestCol = c;
        }
      }

      const x = bestCol * (colWidth + GAP);
      const y = bestMax;
      const w = colWidth * span + GAP * (span - 1);

      cell.style.position = "absolute";
      cell.style.left = `${x}px`;
      cell.style.top = `${y}px`;
      cell.style.width = `${w}px`;

      // Measure natural height after width is set
      const h = cell.scrollHeight;

      // Update column heights
      for (let s = 0; s < span; s++) {
        colHeights[bestCol + s] = y + h + GAP;
      }
    }

    const totalHeight = Math.max(...colHeights) - GAP;
    setContainerHeight(Math.max(totalHeight, 0));
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Layout after first paint
    rafRef.current = requestAnimationFrame(layout);

    // Re-layout on resize
    const resizeObs = new ResizeObserver(() => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(layout);
    });
    resizeObs.observe(container);

    // Re-layout when child content changes
    const mutObs = new MutationObserver(() => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(layout);
    });
    mutObs.observe(container, { childList: true, subtree: true, characterData: true });

    // Also observe each child for size changes (images loading, etc.)
    const childObs = new ResizeObserver(() => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(layout);
    });
    for (const child of Array.from(container.children)) {
      childObs.observe(child);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      resizeObs.disconnect();
      mutObs.disconnect();
      childObs.disconnect();
    };
  }, [children, layout]);

  if (loading) {
    return <BentoSkeleton />;
  }

  return (
    <Container ref={containerRef} style={{ height: containerHeight || "auto" }}>
      {children}
    </Container>
  );
}

interface BentoCellProps {
  $cols: number;
  children: ReactNode;
}

export function BentoCell({ $cols, children }: BentoCellProps) {
  return <CellDiv data-cols={$cols}>{children}</CellDiv>;
}

/** Skeleton loader shown while interaction data loads */
function BentoSkeleton() {
  return (
    <SkeletonContainer>
      <SkeletonCard $width="66%" $height="220px" />
      <SkeletonCard $width="32%" $height="100px" />
      <SkeletonCard $width="32%" $height="180px" />
      <SkeletonCard $width="32%" $height="160px" />
      <SkeletonCard $width="32%" $height="200px" />
      <SkeletonCard $width="100%" $height="140px" />
    </SkeletonContainer>
  );
}

const shimmer = keyframes`
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
`;

const SkeletonContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${GAP}px;
  padding: 0 48px;
  max-width: 1200px;
  margin: 0 auto 24px;

  @media (max-width: 768px) {
    padding: 0 16px;
    margin-bottom: 16px;
  }
`;

const SkeletonCard = styled.div<{ $width: string; $height: string }>`
  width: calc(${(p) => p.$width} - 8px);
  height: ${(p) => p.$height};
  border-radius: 16px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.04) 25%,
    rgba(255, 255, 255, 0.08) 50%,
    rgba(255, 255, 255, 0.04) 75%
  );
  background-size: 800px 100%;
  animation: ${shimmer} 1.5s infinite linear;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const CellDiv = styled.div`
  /* positioned absolutely by JS */
`;

const Container = styled.div`
  position: relative;
  padding: 0 48px;
  max-width: 1200px;
  margin: 0 auto 24px;

  @media (max-width: 768px) {
    padding: 0 16px;
    margin-bottom: 16px;
  }
`;
