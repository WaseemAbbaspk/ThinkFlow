# ThinkFlow Studio — Enterprise UI Design

**Date:** 2026-07-29
**Status:** Approved
**Supersedes:** the hand-written CSS layer described in `2026-07-27-thinkflow-studio-design.md`. The data model, export formats, and stage flow from that spec are unchanged.

## Problem

ThinkFlow Studio works, but it looks like a prototype. The styling is 523 lines of hand-written CSS. Interactions that a professional tool handles gracefully are handled crudely or not at all: deletes prompt through `window.confirm`, autosave gives no feedback until it fails, the traceability matrix is a bare `<table>` with no sorting or filtering, and dark mode follows the OS with no way to override it.

## Goal

Rebuild the presentation layer on shadcn/ui so the tool reads as enterprise software, and close the interaction gaps listed above. The information architecture stays as it is: five lifecycle stages, then traceability, then export.

## Non-Goals

- No change to the data model, storage format, or migration logic.
- No change to export output. The generated markdown, JSON, and zip must be byte-identical.
- No new IA surfaces: no dashboard, no command palette, no split-pane preview.
- No new stages or fields.

## Visual Identity

"Refined blueprint" — the existing engineering-ledger direction, executed properly rather than replaced. ThinkFlow is an instrument for tracing a spec from vision to tests, and the interface should read as precise rather than decorative.

**Palette** (light / dark):

| Token | Light | Dark | Use |
|---|---|---|---|
| canvas | `#F5F7F9` | `#0F1319` | app background |
| surface | `#FFFFFF` | `#171C24` | cards, inputs, panels |
| ink | `#1B2430` | `#E7ECF2` | primary text |
| muted | `#5B6672` | `#93A0AF` | labels, captions |
| hairline | `#E2E7EC` | `#262E3A` | borders, dividers |
| accent | `#2450C8` | `#6E93F0` | active nav, links, focus, primary buttons |
| warn | `#B25E00` | `#E0A356` | gap markers, save failure |
| ok | `#1F7A4D` | `#4FC28A` | traced-clean confirmation |

**Typography:** Inter for UI at a 14–15px base with tight tracking; JetBrains Mono for artifact IDs, table data, and the mermaid block. Both self-hosted through `@fontsource-variable` packages — no external CDN, because the site is served from GitHub Pages and must work offline.

**Form:** 6px radius, hairline borders, shadows used almost nowhere. Uppercase mono microlabels for subsection headings. Lifecycle rail numbered with `decimal-leading-zero`.

## Stack

| Package | Role |
|---|---|
| `tailwindcss` v4 + `@tailwindcss/vite` | CSS-first `@theme` tokens; no JS config file |
| `class-variance-authority`, `clsx`, `tailwind-merge` | shadcn variant system and the `cn()` helper |
| `@radix-ui/react-*` | dialog, alert-dialog, collapsible, tooltip, dropdown-menu, separator, label, scroll-area |
| `lucide-react` | icons |
| `@tanstack/react-table` | traceability matrix sorting and filtering |
| `sonner` | toast notifications |
| `@fontsource-variable/inter`, `@fontsource-variable/jetbrains-mono` | self-hosted fonts |

Build config gains an `@/` → `src/` path alias in three places: `tsconfig.json` (`paths`), `vite.config.ts` (`resolve.alias`), and `vitest.config.ts` (`resolve.alias`). All three are required; omitting the vitest one breaks the suite while leaving the build green.

## Architecture

### Token layer

`src/styles.css` is rewritten as a Tailwind v4 entry: `@import "tailwindcss"` plus an `@theme` block exposing the palette above under shadcn's semantic names (`--background`, `--foreground`, `--card`, `--card-foreground`, `--border`, `--input`, `--ring`, `--primary`, `--muted-foreground`, `--destructive`) plus two project-specific tokens, `--warn` and `--ok`, for gap markers.

Dark values are declared under a `.dark` class on `<html>` rather than inside `@media (prefers-color-scheme: dark)`, so an explicit toggle can drive them. The current media-query behavior is preserved as the `system` setting.

### Component layers

**`src/components/ui/*`** — shadcn primitives, vendored into the repo as owned source. Needed: `button`, `input`, `textarea`, `label`, `card`, `badge`, `separator`, `dialog`, `alert-dialog`, `collapsible`, `tooltip`, `dropdown-menu`, `table`, `scroll-area`, `sheet`, `sonner`.

**`src/components/inputs.tsx`** — keeps all five current exports with identical prop signatures: `TextField`, `TextArea`, `SelectField`, `LinkSelect`, `RepeatableList`. Only the rendering changes. Because the public API is stable, the five stage forms need no edits.

`SelectField` and `LinkSelect` must continue to render **native `<select>` elements**, styled with Tailwind rather than replaced by Radix Select. Two reasons, both hard constraints:

1. Radix Select has no multiple-selection mode, and `LinkSelect` requires one for `tracesTo`.
2. `App.integration.test.tsx` drives these through `userEvent.selectOptions(screen.getByLabelText(...))`, which depends on native select semantics.

Radix Select is used only for new dropdowns that have no such constraint.

`RepeatableList` renders each item as a Card with the artifact's mono ID badge in its header and a ghost icon Remove button. The button's accessible name stays exactly `Remove`, because `RequirementsForm.test.tsx` locates it with `getAllByRole('button', { name: /remove/i })`.

**`src/components/SectionCard.tsx`** — new. Replaces the bare `<section>` wrapper used throughout the stage forms. Renders a title, an item count, and a Collapsible body.

### Shell

`App.tsx` splits into three components:

- **`AppShell`** — grid layout, provider composition, view routing.
- **`TopBar`** — project-name field, save status, theme toggle, export dropdown menu.
- **`Sidebar`** — rewritten. Keeps the numbered lifecycle rail, gains Lucide icons and a per-stage state indicator: a check when the stage is complete, a warn dot when `detectGaps` reports a gap touching it. The existing `GAP_KIND_TO_VIEWS` mapping supplies the gap-to-stage relation and does not change.

On viewports below the current 720px breakpoint the rail collapses into a Radix Sheet opened from the top bar.

### Save status

Today `Shell` debounces `saveProject` by 500ms and renders a `.storage-warning` div only on failure. This becomes a three-state `SaveStatus` component in the top bar: `Saving…` while the debounce is pending, `Saved` on success, and a persistent `Not saved` warn state on failure that keeps the existing "export your project to avoid losing it" guidance. Failure also raises a `sonner` toast.

### Confirm dialogs

`ConfirmProvider` and a `useConfirm()` hook replace `window.confirm`. The hook returns a promise resolving to a boolean, backed by a Radix AlertDialog so the destructive-action copy currently passed to `window.confirm` renders as real UI.

There are exactly two call sites, both in `RequirementsForm` — delete story and delete criterion — routed through its local `confirmDelete` helper. No other stage form guards deletes today. `confirmDelete` is replaced by the hook; the surrounding dependency-counting logic that builds the message is unchanged.

Because the hook is promise-based, the affected `RepeatableList.onRemove` callbacks become `async`. That is assignable to the existing `(index: number) => void` prop type, so `RepeatableList`'s signature does not change.

**This breaks three tests** in `RequirementsForm.test.tsx` that spy on `window.confirm`. They will be rewritten to assert against the dialog: that it appears with the expected message, that cancelling preserves the entity, and that confirming deletes it. This is the only test rewrite in scope.

### Traceability

The matrix moves to TanStack Table with sortable column headers and a filter input. Rows whose story or criterion appears in `detectGaps` get a warn-tinted left edge.

Gaps render as alert cards grouped by `Gap['kind']` rather than a flat `<ul>`. The "No gaps — every artifact is traced" state keeps its `ok`-colored treatment.

The mermaid chain stays inside a `<pre>` element, inside a Card, with a copy-to-clipboard button. The `<pre>` is required: `TraceabilityView.test.tsx` reads it via `container.querySelector('pre')`.

### Export

Each action becomes a card with an icon and a description of what the file contains. A DropdownMenu in the top bar offers the same actions without navigating to the panel. Success and failure both raise `sonner` toasts. Import gets a styled drop target; its `role="alert"` error output is unchanged.

## Error Handling

- **Save failure** — persistent warn state in the top bar plus a toast. Never silently swallowed.
- **Import failure** — the existing `parse` result carries a reason; it renders in the import card with `role="alert"` as it does today.
- **Recovery page** — the corrupt-storage path (`loadProject` returning `ok: false`) keeps its Export-raw / Start-fresh choice, restyled as a centered Card. Its behavior is unchanged because it is the last line of defense against data loss.
- **Confirm dialog** — dismissal by Escape or overlay click resolves `false`, matching `window.confirm`'s cancel semantics.

## Testing

The suite is 63 tests. All must pass.

- **Unchanged and must stay green:** every test under `src/model`, `src/export`, `src/state`, plus the stage-form tests, `inputs.test.tsx`, `Sidebar.test.tsx`, `TraceabilityView.test.tsx`, `ExportPanel.test.tsx`, and `App.integration.test.tsx`. These are the regression net for the reskin — if the `inputs.tsx` API and accessible names hold, they pass without edits.
- **Rewritten:** the three `window.confirm` spy tests in `RequirementsForm.test.tsx`.
- **New:** theme toggle switches and persists the mode; `SaveStatus` renders each of its three states; `useConfirm` resolves true on confirm and false on both cancel and dismiss.

Verification before the work is called done: `npm test` green, `tsc -b` clean, `npm run build` clean, and the app driven in a browser to confirm both themes render and the responsive breakpoint behaves.

## Risks

- **Tailwind v4 with Vitest.** Tailwind is build-time only and jsdom never evaluates the stylesheet, so tests are insensitive to it. The real risk is the `@/` alias missing from `vitest.config.ts`, which fails the suite while the build stays green. Add all three aliases in the same change.
- **shadcn CLI assumptions.** The CLI expects a particular project shape. If `init` fights the existing layout, vendor the component source manually — the components are small and the point is owning the source anyway.
- **Bundle size.** The site is static on GitHub Pages. Radix and TanStack are tree-shakeable; the two variable fonts are the largest addition. Acceptable, but worth checking the built output.
