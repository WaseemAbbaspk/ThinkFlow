# Task 22 report — Styling pass ("Engineering ledger / blueprint")

## Summary

Wrote the full "engineering ledger / blueprint" stylesheet to `app/src/styles.css` per the task-22 brief, and
made className-only (plus two pure-layout wrapper elements) additions to the components the CSS needed to hook
into. No dispatch/state/props/handler/logic changes anywhere.

## `app/src/styles.css`

Rewrote from the near-empty placeholder to the full design system:

- `:root` custom properties for the exact color tokens from the brief (`--paper`, `--surface`, `--ink`,
  `--muted`, `--line`, `--accent`, `--accent-soft`, `--warn`, `--warn-soft`, `--ok`), plus `--font-ui` /
  `--font-mono` stacks (system-ui stack / ui-monospace stack, no web fonts).
- A `@media (prefers-color-scheme: dark)` block re-mapping all tokens to a dark blueprint palette (kept AA
  contrast in mind; every downstream rule uses the custom properties, so dark mode is "free").
- `.app-shell` two-column grid (`268px 1fr`); `.sidebar-col` sticky full-height left column (brand + project
  name field + nav); `main` as the scrolling right column with `max-width: 72ch` measure and 32px padding.
- Signature numbered lifecycle rail: `counter-reset`/`counter-increment` on `.sidebar ul` / `li:nth-child(-n+5)`,
  a `::before` numbered node (`decimal-leading-zero`, mono, `--muted`) on each stage button, and a timeline-style
  vertical rail via `::after` (full-height per item, trimmed to a half-line on the first/last node so it reads
  as one continuous line through the 5 stages). Utilities (items 6–7) get a `border-top` divider on
  `:nth-child(6)` and are excluded from the rail/numbering via `:nth-child(n+6)`.
- `.sidebar button.active` / `[aria-current="page"]`: `--accent-soft` bg, `--accent` text, `box-shadow: inset 3px
  0 0 var(--accent)` left indicator, filled accent number node. Hover: `--paper` wash. New `.gappy` modifier
  (see Sidebar.tsx change below) tints the number node amber for stages that own traceability gaps, per spec.
- `.id-tag`: inline-block mono chip (`--surface` bg, `1px solid --line`, 3px radius, `--muted` text, `1px 6px`
  padding, 12px, `.02em` tracking) — the ID-chip signature applied to every id-display div (see per-file list
  below).
- `.field` / inputs/select/textarea: label styling, full-width surface inputs with hairline borders, 6px radius,
  `:focus-visible` → accent border + soft accent ring (never `outline: none` without replacement).
- `section` spacing (28px), `h3` with bottom hairline, `h4` as small uppercase mono eyebrow in `--muted`.
- `.repeatable-list-item` card treatment; its Remove button styled quiet/muted with `--warn` hover; the "Add …"
  button styled as an accent-tinted primary action.
- `table`/`th`/`td` for the traceability matrix: full width, collapsed borders, mono uppercase `th`, mono `td`
  (all id-bearing cells), row hover tint using `--paper`.
- `pre` (Mermaid/preview): mono, `--paper` bg, hairline border, 6px radius, 12.5px/1.5.
- `.storage-warning`, `.recovery-banner`/`.recovery-page`: amber/warn treatment and centered empty-page layout
  respectively.
- `select[multiple]` gets a sensible `min-height`.
- Quality floor: `@media (max-width: 720px)` collapses the grid to one column (sidebar becomes a static block
  above main); global `:focus-visible` ring; `@media (prefers-reduced-motion: reduce)` disables all transitions;
  only subtle ~120ms color transitions were added anywhere (nav hover/active, buttons, id-tag hover).

## Component className/structure changes (no logic touched)

- **`app/src/App.tsx`**
  - Wrapped the brand + `TextField` (project name) + `<Sidebar />` in a new `<aside className="sidebar-col">`
    (pure layout wrapper, as explicitly permitted by the brief).
  - Added a static `<div className="brand"><span className="brand-name">ThinkFlow Studio</span><span
    className="brand-tag">REV-01</span></div>` — static text/markup only, no state, no logic, called for
    explicitly by the brief ("the brand — small wordmark ... with a tiny mono tag").
  - Moved the `.storage-warning` conditional block to render inside `<main>` (was a stray sibling of the grid's
    two columns before); the conditional logic (`{!saveHealthy && (...)}`) and its content/role are unchanged,
    only its position in the tree moved so the 2-column grid stays clean, per brief ("may sit here or atop
    main").
  - Wrapped the `loaded.ok === false` early-return `<RecoveryBanner />` in a new `<div className="recovery-page">`
    for centering, per brief ("center it on the empty page"). No change to `RecoveryBanner`'s own JSX/logic.
  - No dispatch/state/hook/prop changes.

- **`app/src/components/Sidebar.tsx`**
  - Extended the existing `className={active ? 'active' : undefined}` expression to also add `'gappy'` when the
    item's `hasGap` is true: `className={[active && 'active', hasGap && 'gappy'].filter(Boolean).join(' ') ||
    undefined}`. `hasGap` was already computed in the component (used for the `aria-hidden` warning glyph); this
    only exposes it as a class hook so CSS can tint the numbered node amber per the brief's requirement. No new
    state, no computation change, no accessible-name change. `<ul>`/`<li>` structure untouched (kept flat per
    brief's "Sidebar.tsx needs no structural change" — the numbering/rail is 100% CSS counters/`nth-child`).

- **`app/src/stages/RequirementsForm.tsx`**
  - Added `className="id-tag"` to the four bare id-display `<div>{...id}</div>` elements: goal id, story id,
    criterion id, NFR id. No other change.

- **`app/src/stages/ArchitectureForm.tsx`**
  - Added `className="id-tag"` to the ADR id-display `<div>{adr.id}</div>`. No other change.

- **`app/src/stages/TasksForm.tsx`**
  - Added `className="id-tag"` to the task id-display `<div>{task.id}</div>`. No other change.

- **`app/src/stages/TestingForm.tsx`**
  - Added `className="id-tag"` to the test id-display `<div>{test.id}</div>`. No other change.

- **`app/src/stages/VisionForm.tsx`**: no changes — it has no bare id-display divs (problem ids are only shown
  via the `TextField` label text).
- **`app/src/components/TraceabilityView.tsx`**: no changes — it has no id-display `<div>`s; the matrix cells
  are `<td>` elements, and the global `table td { font-family: var(--font-mono); }` rule covers "id-bearing
  cells in mono" without any JSX edit. The "No gaps" success message is targeted by `.traceability-view p`
  (the only `<p>` the component ever renders) for the `--ok` green treatment, again with no JSX change.
- **`app/src/components/inputs.tsx`**: no changes — `.field`, `.repeatable-list`, `.repeatable-list-item` class
  hooks already existed in the DOM; styled purely via CSS selectors already present.
- **`app/src/components/ExportPanel.tsx`**: no changes — styled via existing `.export-panel` class and generic
  `section`/`table`/`pre`/button selectors.

No file had any dispatch, state, hook, prop-typing, or conditional-rendering logic altered — verified by diff
review of every edited file after the pass.

## Build / test results

- **Build** (`docker run ... npm run build`): clean — `tsc -b && vite build` succeeded, no TS errors.
  ```
  ✓ 52 modules transformed.
  dist/assets/index-*.css   7.08 kB │ gzip: 2.05 kB
  dist/assets/index-*.js  275.38 kB │ gzip: 84.86 kB
  ✓ built in 2.27s
  ```
- **Full suite** (`docker run ... npx vitest run`): all green.
  ```
  Test Files  20 passed (20)
       Tests  63 passed (63)
  ```

## Deviations from the spec

- The brief allows the rail to be built "via a `::before` on the `<ul>` or a left-border trick." I implemented
  it as a `::after` timeline segment per `li` (full height, trimmed to a half-line at the first/last of the 5
  stage items) rather than a single pseudo-element on the `<ul>`, because item heights are intrinsic/variable
  and a single fixed-length line on the `<ul>` would either overshoot or require magic numbers. This is a purely
  presentational CSS choice within the spec's stated flexibility, not a deviation from the design intent
  (numbered nodes + connecting vertical rail, active/gap states, utilities excluded and divided).
  Left the traceability-gap amber tint to take specificity precedence over the active-blue tint when a stage is
  simultaneously active and gappy (higher-specificity `nth-child` selector naturally wins) — matches the letter
  of "when a stage item owns gaps, tint its number node amber" without needing extra `:not()` complexity.
- Everything else (color tokens, type stacks, layout grid, ID chip styling, component class inventory, quality
  floor: responsive collapse, focus-visible rings, reduced-motion) was implemented as specified.
