import { useMutation } from "convex/react";
import { useCallback, useRef } from "react";
import { api } from "../convex/_generated/api";

const DEBOUNCE_MS = 3000;

/**
 * Returns a debounced callback that tracks widget interactions.
 * Fires at most once every 3 seconds per widget.
 */
export function useWidgetTracker(widgetId: string) {
  const track = useMutation(api.widgetInteractions.trackInteraction);
  const lastFiredRef = useRef(0);

  const trackInteraction = useCallback(() => {
    const now = Date.now();
    if (now - lastFiredRef.current < DEBOUNCE_MS) return;
    lastFiredRef.current = now;
    track({ widgetId });
  }, [track, widgetId]);

  return trackInteraction;
}
