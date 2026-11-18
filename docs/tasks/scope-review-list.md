# Scope review list (I2 + I5) for recruiter test E4

## Intent

Give an employer persona (Karolina Wiśniewska, BrightLabs) one job with six applications and let her pick two people to invite, with:

- I2: the candidate's own sentences about their scope preserved in the assistant-edited answer, plus "Pokaż oryginał" (original answer before assistant edits and portfolio note).
- I5: a "Co kandydat zrobił sam / Zrobili inni / Czego nie wiadomo" summary in which every claim carries a verbatim quote that opens and highlights the original.

## Acceptance criteria

- Route `/#/app/kandydaci/oferta/:jobId`, employer role, only for the scenario job's company; other IDs show NotFound.
- Entry card on `/#/app/kandydaci` for the owning company.
- Three variants via `?wersja=`; moderator panel only with `?moderator=1`.
- Invitations limited to two; confirm enabled only at two; confirmation announced via a live region; action bar repeated after the list.
- Quotes validated as verbatim substrings by Zod at load and in unit tests.
- Poster People host recipes: one ink contour, r24/r18 surfaces, Geist Serif headings, pink primary action, existing Button/MatchScore/BackLink/PageTitle.
- No change to the persisted state schema, import/export or other flows.

## Data

`src/features/scope-review/scenario.json`: six application texts (assistant answer, I2 answer, original answer, portfolio note, Match Score, post-conversation decision) from the course export for publication pub-003697 (June 2026). Candidate names/headlines, the mapping to the BrightLabs job and all summaries are prepared for the scenario.

## Evidence (18.11.2026)

- format:check, lint, typecheck, unit tests (31 passed), design-system:check, verify:packet and build passed locally.
- Playwright e2e not run: no Playwright Chromium is provisioned on this machine.
- Manual walk-through in the desktop app's browser at 1280×900 and 375×812 (no horizontal scroll); keyboard focus moves to the original region after a quote click.
