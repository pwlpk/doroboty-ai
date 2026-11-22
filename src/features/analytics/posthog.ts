/**
 * Optional PostHog product analytics for hosted test deployments.
 *
 * Analytics stay off unless VITE_POSTHOG_KEY is set at build time (for example in the
 * Vercel project). Local development, tests and participant forks therefore make no
 * external requests and never download the PostHog library.
 */
import type { PostHog } from "posthog-js";

export const DEFAULT_POSTHOG_HOST = "https://eu.i.posthog.com";

export interface AnalyticsConfig {
  key: string;
  host: string;
}

export function readAnalyticsConfig(env: Record<string, unknown>): AnalyticsConfig | null {
  const key = typeof env.VITE_POSTHOG_KEY === "string" ? env.VITE_POSTHOG_KEY.trim() : "";
  if (!key) return null;
  const host =
    typeof env.VITE_POSTHOG_HOST === "string" && env.VITE_POSTHOG_HOST.trim()
      ? env.VITE_POSTHOG_HOST.trim()
      : DEFAULT_POSTHOG_HOST;
  return { key, host };
}

const config = readAnalyticsConfig(import.meta.env);
export const analyticsEnabled = config !== null;

let client: Promise<PostHog | null> | null = null;

function loadClient(): Promise<PostHog | null> {
  if (!config) return Promise.resolve(null);
  client ??= import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(config.key, {
        api_host: config.host,
        // Hash routes are reported explicitly by trackPageview.
        capture_pageview: false,
        capture_pageleave: true,
        autocapture: true,
        // Never record sessions: forms contain free text typed by testers.
        disable_session_recording: true,
        // Surveys created in the PostHog project (e.g. NPS) may show as popovers.
        person_profiles: "identified_only",
        persistence: "localStorage",
      });
      return posthog;
    })
    .catch(() => null);
  return client;
}

/** Report one page view; a no-op when analytics are disabled. */
export function trackPageview(hashPath: string) {
  if (!config) return;
  void loadClient().then((posthog) =>
    posthog?.capture("$pageview", { $current_url: window.location.href, route: hashPath }),
  );
}
