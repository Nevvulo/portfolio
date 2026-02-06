import { useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useRef } from "react";
import { trackTimeHeartbeat } from "@/src/db/actions/experience";

// Heartbeat interval: 180 seconds (3 minutes)
// XP logic handles gaps, so less frequent heartbeats are fine
const HEARTBEAT_INTERVAL = 180000;

/**
 * Hook that tracks time spent on site and grants XP every 10 minutes.
 * Sends a heartbeat every 3 minutes while the user is active.
 * Uses Server Action (Drizzle → Postgres) instead of Convex mutation.
 */
export function useTimeTracking() {
  const { isSignedIn } = useUser();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isVisibleRef = useRef<boolean>(true);

  const sendHeartbeat = useCallback(() => {
    if (isVisibleRef.current) {
      trackTimeHeartbeat().catch(console.error);
    }
  }, []);

  useEffect(() => {
    if (!isSignedIn) return;

    const handleVisibility = () => {
      isVisibleRef.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Send initial heartbeat
    sendHeartbeat();

    // Set up interval
    intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isSignedIn, sendHeartbeat]);
}

export default useTimeTracking;
