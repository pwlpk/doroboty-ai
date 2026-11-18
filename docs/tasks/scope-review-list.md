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
- Visual direction E (grid), at Paweł's request on 18.11.2026, scoped to `.scope-page`: warm paper sheet with thin beige cell lines, no shadows, 6px control radius, Geist 500 / Inter / Space Mono stacks, category bar colours (Build orange, Apply blue, Lead green), pink for AI content, black/grey buttons. Source: the direction-E page `strona-e/template.html` from the project library; the `doroboty-grid-ui` skill itself was not available in this session. The surrounding app shell keeps Poster People. Fonts: local Geist 500, Inter 400/500 and Space Mono 400 woff2 files (SIL OFL, Fontsource 5.3.0) in `src/app/fonts/`, declared in `direction-e.css`; no npm dependency and no remote request.
- No change to the persisted state schema, import/export or other flows.

## Data

`src/features/scope-review/scenario.json`: six application texts (assistant answer, I2 answer, original answer, portfolio note, Match Score, post-conversation decision) from the course export for publication pub-003697 (June 2026). Candidate names/headlines, the mapping to the BrightLabs job and all summaries are prepared for the scenario.

## Evidence (18.11.2026)

- format:check, lint, typecheck, unit tests (31 passed), design-system:check, verify:packet and build passed locally.
- Playwright e2e not run: no Playwright Chromium is provisioned on this machine.
- Manual walk-through in the desktop app's browser at 1280×900 and 375×812 (no horizontal scroll); keyboard focus moves to the original region after a quote click.

- 18.11.2026 restyle to direction E: same checks passed again; manual walk-through repeated at 1280×900 and 375×812. Quote click now waits two frames before focusing and scrolling to the original.

## Workspace shell in direction E (18.11.2026)

At Paweł's request the signed-in workspace shell (sidebar, top bar, mobile header and menu) uses direction E via `.shell-e` in `src/app/direction-e.css`, which also holds the shared `--e-*` tokens. The robot BrandMark is replaced in the shell by the direction-E 2x2 category mark; the public header/footer and page content outside `.scope-page` keep Poster People. Checked manually: employer and candidate shells at 1280×900, mobile menu at 375×812 (no horizontal scroll); format, lint, types, 31 unit tests, design-system check, packet check and build pass. E2E not run (no Playwright Chromium).

## Local fonts (18.11.2026)

Added at Paweł's request. Verified in the desktop app's browser: all seven faces report `loaded`; Polish letters (ą ć ę ł ń ó ś ź ż and capitals) render from Geist, not a fallback; no horizontal scroll at 375 px. Format, lint, types, 31 unit tests, design-system check, packet check and build pass.

## Whole app in direction E (18.11.2026)

Paweł reported that the running app did not match his `doroboty-grid-ui` skill. The skill (proposed in the moodboard thread, not saved in this session) says direction E is for the new website only; Paweł now asks for the prototype app to follow it, which overrides that scope and the repo's Poster People requirement for this branch. The reference kit in docs/design-system stays unchanged.

Changes: host tokens (`tokens.css`) and marketplace `--pp-*` tokens switched to E (paper, cell, beige 1px lines, no card radii, 6px controls, Geist 500 / Inter / Space Mono, neutral grey in place of pink); ink contours replaced by beige lines and surface radii set to 0 across host CSS; Button variants: primary black with a decorative `›`, secondary/outline grey, padding 8×12; BrandMark is the 2x2 category mark; home rebuilt as a grid sheet (hero text cell + illustration cell, coloured Build/Apply/Lead blocks, latest jobs); JobCard rebuilt per skill (mosaic, category chip, full title, meta, footer cells salary | mode | arrow, "Pensja do ustalenia" when missing); listing category tabs become chips with category stripes; Match Score and stage labels are neutral Space Mono chips; pink only on AI content (I5 summary); invite selection uses ink, not pink.

Not yet matching the skill: offer page keeps top section tabs instead of the three-column side nav; no dark "Dla firm" section or pricing page exists in the app; company profile has no side nav. E2E browser tests were not run (no Playwright Chromium) and several assert Poster People CSS values (font sizes of `.pp-job-title`, `.pp-salary-tag`), so they need updating when a browser is available.

Checked: format, lint, types, 31 unit tests, design-system check, packet check, build; desktop 1280 and phone 375 views of home, listing, offer, company, recruiting detail, job editor and the scope list, no horizontal scroll.

## Blue paper variant (18.11.2026)

At Paweł's request the beige neutrals were replaced by light blue: paper #f1f6fd, cell #e3edfa, grid line #c8d9ef, cell hover #d8e6f8. Ink, buttons, category and AI colours are unchanged. This deviates from the skill's measured beige values by Paweł's decision.

## Motion (18.11.2026)

At Paweł's request, in `direction-e.css`: staggered transform-only entrance for hero cells, category blocks, job cards, scope cards and summary columns (420ms); job-card hover drifts the mosaic and nudges the arrow; category blocks brighten; primary chevron nudges; the I2 original slides in and the quoted sentence flashes pink then settles. Everything sits under `prefers-reduced-motion: no-preference`, with an explicit reduce override. Transform-only keyframes keep content visible if the timeline is paused. Verified computed animation names/delays and visible opacity; the motion itself was not watched because the desktop app's browser pane was hidden (paused timeline).
