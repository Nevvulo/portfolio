import { useCallback, useRef } from "react";
import { trackWidgetInteraction } from "@/src/db/actions/widgets";

const DEBOUNCE_MS = 3000;

/**
 * Returns a debounced callback that tracks widget interactions.
 * Fires at most once every 3 seconds per widget.
 * Uses Server Action (Drizzle → Postgres) instead of Convex mutation.
 */
export function useWidgetTracker(widgetId: string) {
  const lastFiredRef = useRef(0);

  const trackInteraction = useCallback(() => {
    const now = Date.now();
    if (now - lastFiredRef.current < DEBOUNCE_MS) return;
    lastFiredRef.current = now;
    trackWidgetInteraction(widgetId).catch(console.error);
  }, [widgetId]);

  return trackInteraction;
}
