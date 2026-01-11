import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";

export function useNavigationType() {
  const [isPopState, setIsPopState] = useState(false);
  const router = useRouter();
  const isPopStateRef = useRef(false);

  useEffect(() => {
    // Track if navigation is from browser back/forward
    const handlePopState = () => {
      isPopStateRef.current = true;
      setIsPopState(true);
    };

    // Listen for browser back/forward events BEFORE route change
    window.addEventListener("popstate", handlePopState);

    // Reset flag after route change completes
    const handleRouteChangeComplete = () => {
      // Small delay to ensure animation decision is made first
      setTimeout(() => {
        isPopStateRef.current = false;
        setIsPopState(false);
      }, 50);
    };

    // Normal navigation (link clicks)
    const handleRouteChangeStart = (_url: string) => {
      // If popstate wasn't triggered, this is a normal navigation
      if (!isPopStateRef.current) {
        setIsPopState(false);
      }
    };

    router.events.on("routeChangeStart", handleRouteChangeStart);
    router.events.on("routeChangeComplete", handleRouteChangeComplete);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      router.events.off("routeChangeStart", handleRouteChangeStart);
      router.events.off("routeChangeComplete", handleRouteChangeComplete);
    };
  }, [router.events]);

  return isPopState;
}
