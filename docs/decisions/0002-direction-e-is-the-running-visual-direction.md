# Direction E Is the Running Visual Direction

Date: 2026-11-21  
Status: Accepted (Paweł, decision card in the production-readiness thread).

## Context

Commits 173e450 → 314a24f (merged to main in PR #1, 18.11.2026) restyled the whole prototype in design direction E: light blue paper (`--e-paper: #f1f6fd`), flat grid cells without radii or shadows, Geist 500 / Inter / Space Mono and Build/Apply/Lead category colours, declared in `src/app/direction-e.css`. The browser checks still asserted Poster People values (warm paper background, rounded outlined home panels, card title sizes), so `./scripts/verify` failed although every functional journey passed.

## Decision

Direction E is the visual target of the running application. Browser assertions describe direction E. Poster People documentation and the immutable kit in `docs/design-system/agent-kit` remain the reference for component anatomy, states, responsive composition, keyboard behaviour and verification practice where direction E does not define its own values.

## Consequences

- New and changed screens use the tokens in `src/app/direction-e.css` and reuse existing `e-*` / `pp-*` owners.
- Accessibility still applies: muted text `--e-ink-3` was darkened from `#71717a` to `#5f5f68` so it reaches at least 4.5:1 on the cell background `#e3edfa` (5.34:1).
- Guidance in AGENTS.md, CLAUDE.md and GUI.md that names Poster People as the visual direction is read together with this record; this record wins on colours, type and surfaces.
