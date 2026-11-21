# Prototype data boundary

This static frontend has no trusted server or real authentication. Role-specific UI and local transition checks organize the scenario; anyone using the browser can inspect all stored data. Use synthetic data only.

No API keys, credentials, real CVs or private material belong in frontend source, JSON, localStorage or exports. Exports include private-in-the-UI source/recruiter notes.

Render imported text through React text nodes, validate imports with shared Zod schemas, reject unsupported versions, duplicate IDs, broken references and oversized files. Never overwrite an unreadable save automatically.

Optional PostHog analytics (FEATURES SYS-12) run only on builds with `VITE_POSTHOG_KEY`. The `phc_` project key is a public ingestion key, not a secret, but it is still kept in hosting environment settings rather than source. Analytics send page paths, page leave and autocaptured clicks (element text can include fictional names); session recording and surveys are disabled and form values are not captured. Never enable session replay or identify testers by real personal data without a separate decision.
