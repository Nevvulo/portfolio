import { useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

// Heartbeat interval in milliseconds (30 seconds)
const HEARTBEAT_INTERVAL = 30000;

interface UseArticleWatchTimeOptions {
  postId?: number;
  enabled?: boolean;
}

/**
 * Track article watch time using API route (Drizzle → Postgres).
 * Sends heartbeats every 30 seconds while the user is reading.
 */
export function useArticleWatchTime({ postId, enabled = true }: UseArticleWatchTimeOptions) {
  const { isSignedIn } = useUser();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isVisibleRef = useRef<boolean>(true);

  useEffect(() => {
    if (!isSignedIn || !enabled || !postId) return;

    const handleVisibility = () => {
      isVisibleRef.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const trackWatchTime = async (secondsIncrement: number) => {
      try {
        await fetch("/api/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postId,
            secondsIncrement,
          }),
        });
      } catch (error) {
        console.debug("[watchTime] Heartbeat failed:", error);
      }
    };

    // Initial heartbeat (0 seconds to mark session start)
    trackWatchTime(0);

    // Regular heartbeats every 30 seconds
    intervalRef.current = setInterval(() => {
      if (isVisibleRef.current) {
        trackWatchTime(30);
      }
    }, HEARTBEAT_INTERVAL);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [postId, isSignedIn, enabled]);
}

export default useArticleWatchTime;
