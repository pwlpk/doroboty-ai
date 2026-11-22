# Enable PostHog surveys

## Intent

An NPS survey (Popover, Running) created in the PostHog project did not appear on the
hosted build because `posthog.init` set `disable_surveys: true`.

## Acceptance criteria

- `disable_surveys` is no longer set, so posthog-js loads surveys when analytics are on.
- Analytics remain off without `VITE_POSTHOG_KEY` (local, tests, participant forks).
- Session recording stays disabled.
- Privacy page and FEATURES.md SYS-12 state that a survey may be shown and its answers go to PostHog.
