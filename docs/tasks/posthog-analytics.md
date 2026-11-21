# Optional PostHog analytics on the hosted test deployment

## Intent

Observe real use of the Vercel deployment (production-readiness observation stage) with PostHog, at the owner's request (21.11.2026, EU region), without changing local, test or participant behaviour.

## Acceptance criteria

- No key → no PostHog code downloaded and no external request (existing Playwright external-request checks keep passing).
- Key set via `VITE_POSTHOG_KEY` (optional `VITE_POSTHOG_HOST`, default `https://eu.i.posthog.com`) → one `$pageview` per hash-route path change, page leave and autocapture.
- Session recording and surveys disabled; form values not captured; person profiles only for identified users (none are identified).
- Privacy page mentions analytics only when enabled.
- FEATURES.md (SYS-12), SECURITY.md and architecture.md describe the behaviour.

## Vercel setup (owner)

1. Vercel → project doroboty-ai → Settings → Environment Variables.
2. Add `VITE_POSTHOG_KEY` = the project's `phc_…` key for Production (and Preview if wanted).
3. Redeploy (Deployments → latest → Redeploy) because Vite reads the variable at build time.
4. Open the site, click around, then check PostHog → Activity for `$pageview` events.

## Evidence

See the thread report and PR description for the checks that actually ran.
