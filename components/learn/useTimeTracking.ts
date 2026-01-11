import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { useCallback, useEffect, useRef } from "react";
import { api } from "../../convex/_generated/api";

// Heartbeat interval: 60 seconds
const HEARTBEAT_INTERVAL = 60000;

/**
 * Hook that tracks time spent on site and grants XP every 10 minutes.
 * Sends a heartbeat every minute while the user is active.
 *
 * FIX: Uses ref to store mutation to avoid re-running effect on every render.
 * useMutation returns a new function reference on each render, which would
 * cause the effect to re-run constantly if included in the dependency array.
 */
export function useTimeTracking() {
  const { isSignedIn } = useUser();
  const trackTimeHeartbeat = useMutation(api.experience.trackTimeHeartbeat);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isVisibleRef = useRef<boolean>(true);

  // Store mutation in ref so we can call it without it being a dependency
  const trackTimeHeartbeatRef = useRef(trackTimeHeartbeat);
  trackTimeHeartbeatRef.current = trackTimeHeartbeat;

  // Stable callback that uses the ref
  const sendHeartbeat = useCallback(() => {
    if (isVisibleRef.current) {
      trackTimeHeartbeatRef.current().catch(console.error);
    }
  }, []);

  useEffect(() => {
    if (!isSignedIn) return;

    // Track visibility to pause tracking when tab is hidden
    const handleVisibility = () => {
      isVisibleRef.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Send initial heartbeat
    sendHeartbeat();

    // Set up interval to send heartbeat every minute
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
