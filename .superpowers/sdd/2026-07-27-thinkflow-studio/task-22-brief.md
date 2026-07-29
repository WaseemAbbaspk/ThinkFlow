# Task 22 brief — Styling pass ("Engineering ledger / blueprint" direction)

**Files:**
- Modify: `app/src/styles.css` (the real work — currently near-empty)
- Modify (className props ONLY — no logic/behavior/handler changes): the stage forms, `Sidebar.tsx`,
  `TraceabilityView.tsx`, `App.tsx` — only to add class hooks where the CSS needs them (e.g. `id-tag` on the
  id-display `<div>`s). Do NOT change any dispatch, state, props typing, or JSX logic. Adding a wrapper `<div>`
  or `<aside>` purely for layout, and adding `className=`, is allowed; changing what renders is not.

Plain CSS only, dependency-light. No new packages, no web-font downloads (use system stacks). Keep all 63
tests green and the production build clean.

## Design concept (follow this exactly — it's a deliberate, non-generic direction)

**Concept:** ThinkFlow Studio is a precision instrument for tracing a spec from Vision to Tests. The UI should
feel like an *engineering ledger / blueprint*: quiet, exact, technical. The product's native vocabulary is its
**traceability IDs** (US-1, AC-1.1, ADR-2, TASK-7, TEST-12) — treat those identifiers as first-class citizens,
set in monospace like part numbers on a schematic. The lifecycle (Vision→Requirements→Architecture→Tasks→
Testing) is a real ordered sequence, so numbering it is meaningful (not decoration).

Deliberately AVOID the three generic AI looks: (1) cream + high-contrast serif + terracotta, (2) near-black +
acid-green accent, (3) hairline broadsheet columns. This is a cool, light, technical tool.

### Color tokens (define as CSS custom properties on `:root`, use them everywhere — no stray hex)
```
--paper:      #F5F7F9;  /* app canvas (cool paper) */
--surface:    #FFFFFF;  /* cards / inputs / panels */
--ink:        #1B2430;  /* primary text (cool near-black) */
--muted:      #5B6672;  /* secondary text, captions */
--line:       #E2E7EC;  /* hairline borders / dividers */
--accent:     #2450C8;  /* blueprint blue: active nav, links, focus, primary buttons */
--accent-soft:#E9EEFC;  /* active-nav background wash */
--warn:       #B25E00;  /* amber: ⚠ gap markers, storage warning */
--warn-soft:  #FBEFD9;
--ok:         #1F7A4D;  /* green: "No gaps" success text */
```
(Optional, nice-to-have: a `@media (prefers-color-scheme: dark)` block re-mapping these to a dark blueprint
palette. Only add it if you can do it cleanly and keep contrast AA; skip rather than ship a half-done dark mode.)

### Type
- UI/body: `font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;`
- **Mono (identifiers, data cells, `<pre>` previews/Mermaid, eyebrows):**
  `ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", monospace`
- Headings: system-ui, heavier weight (600–700), slightly tight letter-spacing (-0.01em). Set a clear scale
  (e.g. app title ~20px, `h3` stage heading ~17px, `h4` subsection ~13px uppercase muted eyebrow with letter-spacing).
- Base body ~14–15px, line-height ~1.5, color `--ink` on `--paper`.

### Layout
- `.app-shell { display: grid; grid-template-columns: 268px 1fr; min-height: 100vh; }`
- **Left column = sidebar**, full height, `position: sticky; top: 0; height: 100vh; overflow-y: auto;`
  background `--surface`, right border `--line`. It contains, top→bottom: the brand ("ThinkFlow Studio" — small
  wordmark, `--ink`, with a tiny mono tag like a version/looks-like-a-part-number is fine), the **Project name**
  field, then the `<nav class="sidebar">` stage list, then the storage-warning banner may sit here or atop main.
  To get the project-name field + brand into the sidebar column, wrap them with the `<nav>` in a single
  `<aside class="sidebar-col">` (layout wrapper — allowed). `<main>` is the right column and is the only
  horizontally-scrolling/vertically-scrolling content region; give its inner content a comfortable measure
  (`max-width: 72ch` or ~760px, generous padding ~32px).

### Signature element — the numbered lifecycle rail
The sidebar nav currently renders 7 flat `<li>` buttons: the first 5 are the lifecycle stages
(Vision/Requirements/Architecture/Tasks/Testing), the last 2 are utilities (Traceability/Export). Make the
sidebar read as a **numbered pipeline**:
- Use a **CSS counter** to number the first five items `01`–`05` (`counter-reset` on the `<ul>`,
  `counter-increment` per stage `<li>`, render the number via a `::before` with `content: counter(step, decimal-leading-zero)`
  in mono, `--muted`). Target the stage items with `.sidebar li:nth-child(-n+5)` and the utilities with
  `.sidebar li:nth-child(n+6)`.
- Draw a thin **vertical rail** connecting the five numbered nodes (a `1px` `--line` line behind the numbers,
  e.g. via a `::before` on the `<ul>` or a left-border trick), so the stages visibly flow into one another —
  this expresses the lifecycle/traceability spine. The utilities (items 6–7) sit below a divider
  (`border-top: 1px solid --line` on `:nth-child(6)`) and are NOT on the numbered rail.
- **Active** item (`button[aria-current="page"]` / `.active`): `--accent-soft` background, `--accent` text, and
  a solid `--accent` left indicator bar / filled number node. Hover: subtle `--paper` wash.
- The ⚠ gap marker (already an `aria-hidden` span) must read in `--warn`; when a stage item owns gaps, tint its
  number node amber. Do NOT change the accessible names.

### ID chips (the identifier signature, applied consistently)
The forms/TraceabilityView render ids as bare `<div>{item.id}</div>` (and matrix cells show ids). Add
`className="id-tag"` to those id-display `<div>`s (className-only change) and style `.id-tag` as a small
inline-block mono chip: `--surface` bg, `1px solid --line`, subtle radius (3px), `--muted`→`--ink` text,
padding `1px 6px`, `font-size: 12px`, `letter-spacing: .02em`. In the traceability matrix, render id-bearing
cells in mono too. This makes US-1 / AC-1.1 / TASK-7 look like part numbers throughout.

### Component styles to cover (class inventory already in the DOM)
- `.field` (label block): label on its own line, `--muted`, 12–13px, `margin-bottom: 4px`; inputs/textarea/select
  full-width, `--surface` bg, `1px solid --line`, radius 6px, padding 8px 10px, `--ink` text; `:focus-visible`
  → `--accent` border + 2px `--accent-soft` ring (use `outline` or `box-shadow`), never remove focus outline.
- `section` blocks: spacing between them (`margin-bottom: 28px`), `h3` as the section title with a bottom
  hairline; `h4` as a small uppercase mono eyebrow in `--muted`.
- `.repeatable-list-item`: card — `--surface`, `1px solid --line`, radius 8px, padding 14px, `margin-bottom: 10px`;
  its "Remove" button styled as a quiet danger action (small, `--muted` text, hover `--warn`).
- Buttons: a primary style for "Add …" (accent-tinted or outline-accent), quiet style for Remove; nav buttons
  are full-width, borderless, left-aligned, inherit the rail styling. Give buttons `cursor: pointer` and focus-visible rings.
- `table` (traceability matrix): full width, `border-collapse: collapse`; `th` left-aligned, `--muted`, mono
  uppercase small; `td` `1px solid --line` hairlines, id cells mono; zebra or hover row tint using `--paper`.
- `pre` (preview / Mermaid): mono, `--paper` bg, `1px solid --line`, radius 6px, padding 12px, `overflow:auto`,
  `font-size: 12.5px`, line-height 1.5.
- `.storage-warning`: `--warn-soft` bg, `--warn` text, `1px solid` amber-ish border, radius 6px, padding 10px 14px.
- `.recovery-banner`: similar treatment; center it on the empty page with room to breathe.
- `select[multiple]` (LinkSelects): give a sensible min-height so multi-selects are usable.

### Quality floor (required)
- Responsive: below ~720px, collapse to a single column (sidebar becomes a top bar or static block above main;
  `grid-template-columns: 1fr`). Content stays usable on mobile.
- `:focus-visible` outlines visible on every interactive control (accent ring). Never `outline: none` without a
  replacement.
- `@media (prefers-reduced-motion: reduce)`: disable any transitions you add. Keep motion minimal anyway — at
  most subtle hover/active color transitions (~120ms). No decorative animation.

## Verify (Docker only — Windows blocks npm binaries; do NOT run npm install)
- Build MUST stay clean (this is the main gate since styling has no unit test):
  `MSYS_NO_PATHCONV=1 docker run --rm -v /c/Users/waseem.abbas/ThinkFlow/app:/app -w /app node:20-bookworm npm run build`
- Full suite MUST stay green (63 tests, 21 files — your className additions must not break any query):
  `MSYS_NO_PATHCONV=1 docker run --rm -v /c/Users/waseem.abbas/ThinkFlow/app:/app -w /app node:20-bookworm npx vitest run`
- The integration/component tests query by role/label/text, so wrapper divs and classNames are safe — but run
  them to confirm. If any test breaks, you changed structure/logic too much — pull back to className-only.
- If the Docker daemon isn't running, report BLOCKED (don't start it yourself).

## Commit
`git commit -m "Style ThinkFlow Studio layout"` (NO Claude co-author/attribution trailer — hard rule). Do not commit app/dist.

## Report
Write your full report to `.superpowers/sdd/2026-07-27-thinkflow-studio/task-22-report.md`: what you styled,
which files got className-only changes (list each and confirm no logic changed), the build result, the test
result, and any deviations from this design spec + why. Then reply with ONLY (under 15 lines):
- Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
- Commit created (short SHA + subject)
- One-line test summary + build result
- Concerns, if any
- The report file path
