import { useEffect } from "react";
import { useLocation } from "react-router";
import { trackPageview } from "./posthog";

/** Sends a page view for every hash-route change (path only, without search or section). */
export function AnalyticsPageviews() {
  const { pathname } = useLocation();
  useEffect(() => {
    trackPageview(pathname);
  }, [pathname]);
  return null;
}
