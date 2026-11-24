# Site assistant chat (public pages)

## Intent

Paweł (24.11.2026, project thread): "a możemy na stronie dodać czatbota, który będzie w stanie odpowiedzieć na proste pytania?" Visitors of the hosted prototype can ask short questions about how DoRoboty.ai works (candidates, employers, methodology, Build/Apply/Lead, current offers) and get an answer in Polish.

## Design

- Widget on public pages only (not in the signed-in workspace), bottom-right launcher, panel in direction E (paper/cell/line tokens, Space Mono labels, pink `--e-assist` for AI content, no radii or shadows beyond the existing grid lines).
- Answers come from Claude through a Vercel serverless function `api/chat.ts`. The API key (`ANTHROPIC_API_KEY`) lives only in the Vercel project environment, never in the browser bundle.
- The knowledge given to the model is built on the server from the same baseline fixtures and site copy the app renders (`src/features/prototype/data/marketplace.json`, `src/features/public/site-content.ts`). It does not see browser-local scenario changes.
- The system prompt limits the bot to the service, Polish answers, no invented facts (pricing, contacts, legal terms not in the knowledge), no hiring advice beyond the site, no personal data.
- Shared Zod schemas (`src/features/assistant/schema.ts`) validate the request in the widget and in the function.
- Limits: question ≤ 600 characters, ≤ 12 turns of history, answer `max_tokens` 1024, best-effort per-instance rate limit (20 requests / 10 minutes per IP). Questions are never logged.
- Without `ANTHROPIC_API_KEY` the function returns 503 and the widget shows a calm "asystent jest wyłączony" message. Local `npm run dev` / `preview` serve the same handler through a Vite middleware and read the key from `.env.local`.
- Model: `claude-opus-5-5` at low effort with server-side refusal fallback, overridable through `ANTHROPIC_MODEL`.

## Acceptance criteria

- Launcher visible on `/#/`, `/#/oferty`, `/#/metodologia`; not in `/#/app/*`.
- Keyboard: launcher reachable by Tab, panel opens with focus on the input, Escape closes and returns focus to the launcher, Enter sends.
- Loading, error (503/429/network) and empty states are visible and announced (`aria-live`).
- Panel fits 375 px wide without horizontal scroll; long answers scroll inside the panel.
- Unit tests cover schema limits, the handler (missing key, invalid body, rate limit, success with a fake client) and the knowledge prompt.
- Browser test mocks `/api/chat` and checks a full question → answer round trip.
- Privacy page mentions that assistant questions are sent to Anthropic.
- FEATURES.md gains an entry for the assistant.

## Evidence

See the PR description and the thread report.

### 24.11.2026, cloud container, Node 22.23.5

- `npm run format:check`, `lint`, `typecheck`, `test` (48/48, 12 new), `verify:packet`, `build`: passed.
- `npx playwright test`: 37/37 passed (3 new assistant journeys with a mocked `/api/chat`, existing no-external-request checks unchanged).
- `design-system:check` (part of `./scripts/verify`) requires Node 24 and did not run here; CI runs the full gate.
- `vite preview` middleware answered `POST /api/chat` with 503 and the "nie jest jeszcze włączony" message (no key in the container).
- Not verified: a live Claude answer (no API key available) and the function on Vercel before the preview deployment.
- Screenshots: project files `doroboty-ai/prototyp/2026-11-24-czatbot/` (1440 px and 375 px, mocked answer).
