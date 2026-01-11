import { useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import type { Id } from "../../convex/_generated/dataModel";

// Heartbeat interval in milliseconds (30 seconds)
// Reduced from 5s to save function calls - uses Redis buffering
const HEARTBEAT_INTERVAL = 30000;

interface UseArticleWatchTimeOptions {
  postId?: Id<"blogPosts">;
  enabled?: boolean;
}

/**
 * Track article watch time using Redis-backed API route
 * This is much cheaper than direct Convex mutations:
 * - Buffers heartbeats in Redis
 * - 30-second interval instead of 5-second
 * - Flushes to Convex periodically via cron
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

    // Track watch time via API route (Redis-backed)
    const trackWatchTime = async (secondsIncrement: number) => {
      try {
        await fetch("/api/presence/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "watchTime",
            postId: postId.toString(),
            secondsIncrement,
          }),
        });
      } catch (error) {
        // Silently fail - watch time is non-critical
        console.debug("[watchTime] Heartbeat failed:", error);
      }
    };

    // Initial heartbeat (0 seconds to mark session start)
    trackWatchTime(0);

    // Regular heartbeats every 30 seconds
    intervalRef.current = setInterval(() => {
      if (isVisibleRef.current) {
        trackWatchTime(30); // 30 seconds since last heartbeat
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
