# Prepare the prototype for publication on Vercel

## Intent

Publish the static prototype on Vercel for project test users working only with fictional data, after the production-readiness audit (`docs/production-readiness.html`, preparation stage) found a failing quality gate and missing release documentation.

## Acceptance criteria

- `./scripts/verify` gate passes: 34/34 browser checks, including axe colour contrast, with assertions describing direction E (decision 0002).
- Muted direction-E text meets WCAG AA contrast on cell and paper backgrounds.
- `vercel.json` pins install/build/output and sends basic security headers; no runtime behaviour changes.
- A release plan below covers the post-publication smoke test, rollback, recovery and where errors are found.
- FEATURES.md reviewed: no behaviour was added, changed or removed (token colour, test assertions, hosting config and docs only), so it was not updated.

## Release plan (Vercel)

### Setup (once, by the project owner)

1. vercel.com → Add New → Project → import `pwlpk/doroboty-ai` from GitHub.
2. Framework preset Vite is read from `vercel.json`; leave build and output settings unchanged. Add no environment variables (the app needs none).
3. Node.js version: `package.json` engines `>=24 <27` overrides the project setting, so Vercel will most likely build on the newest allowed major (26.x). CI verifies Node 24. If the build log shows a problem, change engines to `24.x` in a separate commit.
4. Production branch: `main`. Every pull request gets its own preview URL.

### Smoke test after each production deployment (about 5 minutes)

On the production URL, desktop and a phone (or 375 px window):

1. Home page loads with fonts and illustration; the browser console has no errors.
2. `#/oferty` lists offers; search and one filter work; open `#/oferty/ai-product-manager` directly in a new tab.
3. Choose Anna Kowalska, save an offer, write and submit an application.
4. Switch to Karolina Wiśniewska, open the application and record a decision; reload and confirm it persisted.
5. Open the I2+I5 candidate list (`#/app/kandydaci`, BrightLabs entry card) and invite two people.
6. Response headers include `X-Content-Type-Options: nosniff` and `X-Robots-Tag: noindex, nofollow`.

### Rollback

- Vercel dashboard → project → Deployments → previous production deployment → Instant Rollback. On Hobby only the immediately previous deployment is available.
- A rollback stops automatic promotion of new `main` deployments until "Undo Rollback" (or `vercel promote`) is used.
- Durable fix: `git revert` the faulty commit on `main`, let Vercel build it, then undo the rollback.
- No server data exists, so rollback never needs a data migration. Testers can reset their own scenario in Ustawienia.

### Where errors are found

- Failed builds: Vercel deployment build log; Vercel e-mails the account owner on failed production builds by default (confirm after the first deployment).
- Runtime errors: the tester's browser console only. No error-reporting service is added because the prototype deliberately makes no external requests. Testers report problems to the project owner directly.

## Evidence (21.11.2026, cloud copy of commit 314a24f plus this change, Node 22.23.5)

- `npm run format:check`, `lint`, `typecheck`, `test` (31/31), `verify:packet`, `build`: see final report in the thread.
- `npx playwright test`: 34 passed after the contrast and assertion changes (before: 29 passed, 5 failed).
- `design-system:check` requires Node 24 and was not run in this environment.

## CI note

GitHub Actions had never run in this repository (no workflow runs, including PR #1). The owner enabled Actions on 2026-11-21 so the Node 24 gate (`./scripts/verify`) runs on this PR.
