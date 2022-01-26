import { useRouter } from "next/router";
import * as Fathom from "fathom-client";
import { useEffect } from "react";

const VALID_DOMAINS = ["nevulo.xyz", "www.nevulo.xyz"];

function onRouteChangeComplete() {
  Fathom.trackPageview();
}

export function useAnalytics(projectId: string) {
  const router = useRouter();

  // Fathom analytics
  useEffect(() => {
    Fathom.load(projectId, { includedDomains: VALID_DOMAINS });

    // Record a pageview when route changes
    router.events.on("routeChangeComplete", onRouteChangeComplete);

    // Unassign event listener
    return () => {
      router.events.off("routeChangeComplete", onRouteChangeComplete);
    };
  }, []);
}
