import type { ReactNode, MouseEvent } from "react";
import { useCallback } from "react";
import { useWidgetTracker } from "../../../hooks/useWidgetTracker";

interface WidgetTrackerProps {
  widgetId: string;
  children: ReactNode;
}

/**
 * Tracks meaningful interactions within a widget area.
 * Only fires on clicks that hit a link (<a>) or button (<button>),
 * preventing spam-clicks on empty space from inflating counts.
 */
export function WidgetTracker({ widgetId, children }: WidgetTrackerProps) {
  const trackInteraction = useWidgetTracker(widgetId);

  const handleClick = useCallback(
    (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const meaningful = target.closest("a, button");
      if (meaningful) {
        trackInteraction();
      }
    },
    [trackInteraction]
  );

  return (
    <div onClick={handleClick} style={{ height: "100%" }}>
      {children}
    </div>
  );
}
