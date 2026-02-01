import { useEffect, useRef, useState } from "react";
import {
  BENTO_SIZES,
  WIDGET_DEFINITIONS,
  downsizeWidget,
  type BentoWidgetSize,
  type WidgetDefinition,
} from "../components/home/widgets/bento-config";

export interface BentoWidget {
  id: string;
  effectiveSize: BentoWidgetSize;
  interactionCount: number;
}

interface InteractionRecord {
  widgetId: string;
  interactionCount: number;
}

const COLS = 3;

/**
 * Simulate row packing and downsize widgets that would create
 * consecutive full-width rows or leave large gaps.
 */
function packWidgets(widgets: BentoWidget[]): BentoWidget[] {
  const result = [...widgets];
  const defMap = new Map(WIDGET_DEFINITIONS.map((d) => [d.id, d]));

  // Simulate placing widgets into a 3-col row system
  let colsUsed = 0;

  for (let i = 0; i < result.length; i++) {
    const w = result[i]!;
    const def = defMap.get(w.id);
    let cols = BENTO_SIZES[w.effectiveSize].cols;

    // If this widget won't fit in the remaining cols of the current row
    if (colsUsed + cols > COLS) {
      const remaining = COLS - colsUsed;

      if (remaining > 0 && cols > remaining) {
        // Try to downsize to fit the remaining space
        let newSize = w.effectiveSize;
        while (BENTO_SIZES[newSize].cols > remaining) {
          const smaller = downsizeWidget(newSize);
          if (smaller === newSize) break; // can't go smaller
          if (def && sizeOrder(smaller) < sizeOrder(def.minSize)) break;
          newSize = smaller;
        }

        if (BENTO_SIZES[newSize].cols <= remaining) {
          result[i] = { ...w, effectiveSize: newSize };
          cols = BENTO_SIZES[newSize].cols;
        } else {
          // Can't fit — start a new row
          colsUsed = 0;
        }
      } else {
        // Start a new row
        colsUsed = 0;
      }
    }

    // Check if placing a multi-col widget would leave the rest of the row
    // impossible to fill (look ahead to see if enough small items exist)
    if (cols >= 2 && colsUsed === 0) {
      const remaining = COLS - cols;
      if (remaining > 0) {
        // Count how many upcoming 1-col widgets could fill the gap
        let available1Col = 0;
        for (let j = i + 1; j < result.length && available1Col < remaining; j++) {
          if (BENTO_SIZES[result[j]!.effectiveSize].cols <= 1) {
            available1Col++;
          }
        }
        if (available1Col < remaining) {
          // Not enough small widgets to fill beside this one — downsize
          let newSize = result[i]!.effectiveSize;
          while (BENTO_SIZES[newSize].cols > 1) {
            const smaller = downsizeWidget(newSize);
            if (smaller === newSize) break;
            if (def && sizeOrder(smaller) < sizeOrder(def.minSize)) break;
            newSize = smaller;
          }
          result[i] = { ...result[i]!, effectiveSize: newSize };
          cols = BENTO_SIZES[newSize].cols;
        }
      }
    }

    colsUsed += cols;
    if (colsUsed >= COLS) colsUsed = 0;
  }

  return result;
}

function sizeOrder(s: BentoWidgetSize): number {
  const order: Record<BentoWidgetSize, number> = { small: 0, medium: 1, large: 2, wide: 3 };
  return order[s];
}

/**
 * Returns sorted widgets with effective sizes based on interaction data.
 * Snapshots interaction data on first load — ignores live Convex updates
 * so the layout doesn't shift while the user is on the page.
 */
export function useBentoLayout(
  interactions: InteractionRecord[] | undefined
): BentoWidget[] {
  const snapshotRef = useRef<InteractionRecord[] | null>(null);
  const [snapshot, setSnapshot] = useState<InteractionRecord[] | null>(null);

  // Capture the first non-undefined result and freeze it
  useEffect(() => {
    if (interactions && snapshotRef.current === null) {
      snapshotRef.current = interactions;
      setSnapshot(interactions);
    }
  }, [interactions]);

  const frozen = snapshot ?? [];

  const counts = new Map<string, number>();
  for (const w of frozen) {
    counts.set(w.widgetId, w.interactionCount);
  }

  const widgets: BentoWidget[] = WIDGET_DEFINITIONS.map((def: WidgetDefinition) => {
    const count = counts.get(def.id) ?? 0;
    const promoted =
      def.promotedSize &&
      def.promotionThreshold != null &&
      count >= def.promotionThreshold;
    return {
      id: def.id,
      effectiveSize: promoted ? def.promotedSize! : def.defaultSize,
      interactionCount: count,
    };
  });

  // Sort by interaction count desc, preserve original order for ties
  const originalIndex = new Map(WIDGET_DEFINITIONS.map((d, i) => [d.id, i]));
  widgets.sort((a, b) => {
    const diff = b.interactionCount - a.interactionCount;
    if (diff !== 0) return diff;
    return (originalIndex.get(a.id) ?? 0) - (originalIndex.get(b.id) ?? 0);
  });

  // Smart row packing — downsize widgets to prevent gaps
  return packWidgets(widgets);
}
