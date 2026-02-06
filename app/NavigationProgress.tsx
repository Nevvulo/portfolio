"use client";

import { useEffect, useRef } from "react";
import NProgress from "nprogress";
import { usePathname, useSearchParams } from "next/navigation";

NProgress.configure({ showSpinner: false });

/**
 * App Router NProgress integration.
 * - Starts the bar on internal link clicks (same-origin, different path).
 * - Finishes the bar when pathname/searchParams change (navigation complete).
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prevPath = useRef(pathname);

  // Finish progress bar when navigation completes
  useEffect(() => {
    NProgress.done();
    prevPath.current = pathname;
  }, [pathname, searchParams]);

  // Start progress bar on internal link clicks
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest("a");
      if (
        !anchor ||
        !anchor.href ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      try {
        const url = new URL(anchor.href);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === prevPath.current && url.search === window.location.search) return;
        NProgress.start();
      } catch {
        // ignore malformed URLs
      }
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
