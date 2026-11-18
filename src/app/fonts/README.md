# Runtime typography

The application loads local Geist Serif Regular 400 from `docs/design-system/agent-kit/assets/fonts/GeistSerif-Regular.woff2` through Vite. Its SIL OFL license remains beside the font. All headings use this weight without synthetic bold. Body and controls use Arial/Helvetica/system sans; they make no remote font requests.

## Direction E fonts (workspace shell and scope review list)

`direction-e.css` loads these local files for the `.shell-e` workspace shell and `.scope-page`; no remote requests. All are SIL Open Font License 1.1, copied unchanged from the Fontsource 5.3.0 npm packages (`@fontsource/geist-sans`, `@fontsource/inter`, `@fontsource/space-mono`); licences sit beside them as `LICENSE-*.txt`. No npm dependency was added.

- Geist 500: `geist-sans-latin-500-normal.woff2` (headings). Fontsource ships a single Latin subset for Geist.
- Inter 400/500: `inter-latin-*-normal.woff2` and `inter-latin-ext-*-normal.woff2` (body; latin-ext covers Polish diacritics).
- Space Mono 400: `space-mono-latin-400-normal.woff2`, `space-mono-latin-ext-400-normal.woff2` (uppercase labels).

## Retained historical assets

# Timeless Sans Variable

`timeless-sans-variable.woff2` is the free Timeless Sans variable font served by the official
[Timeless Type](https://timeless.co/type) website. The vendor describes the Timeless family as
free for personal and commercial use.

The previous runtime used the Grotesk cut with `STYL` and `ital` pinned to `0`. These are existing implementation assets, not the target for new headings. Follow the accepted [design-system integration guide](../../../docs/design-system/README.md), which supplies local Geist Serif Regular and its license.

## Web-optimized Grotesk

`timeless-grotesk-web-variable.woff2` is generated from the original asset by
pinning `STYL=0` and `ital=0`, matching the existing global theme settings. It keeps
all 417 mapped Unicode characters, glyph coverage and the weight axis (300–800),
while discarding unused stylistic/italic interpolation. The original is retained.

Generate with FontTools `varLib.instancer` using those axis values and WOFF2 output;
preserve timestamps for repeatability. FontTools is asset tooling, not a runtime dependency.
These retained Timeless assets are no longer loaded by the application.
