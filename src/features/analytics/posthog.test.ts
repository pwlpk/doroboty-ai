import { describe, expect, it } from "vitest";
import { analyticsEnabled, DEFAULT_POSTHOG_HOST, readAnalyticsConfig } from "./posthog";

describe("analytics configuration", () => {
  it("stays disabled without a project key", () => {
    expect(readAnalyticsConfig({})).toBeNull();
    expect(readAnalyticsConfig({ VITE_POSTHOG_KEY: "   " })).toBeNull();
    expect(analyticsEnabled).toBe(false);
  });

  it("uses the EU host unless another host is configured", () => {
    expect(readAnalyticsConfig({ VITE_POSTHOG_KEY: "phc_test" })).toEqual({
      key: "phc_test",
      host: DEFAULT_POSTHOG_HOST,
    });
    expect(
      readAnalyticsConfig({
        VITE_POSTHOG_KEY: " phc_test ",
        VITE_POSTHOG_HOST: "https://us.i.posthog.com",
      }),
    ).toEqual({ key: "phc_test", host: "https://us.i.posthog.com" });
  });
});
