# ThinkFlow Studio — Interactive UI

**Date:** 2026-07-30
**Status:** Approved
**Builds on:** [2026-07-29-studio-ui-enterprise-design.md](2026-07-29-studio-ui-enterprise-design.md)

## Problem

The enterprise reskin landed a coherent visual language, but the app is still a
static form. Every stage is a stack of always-open section cards holding flat
text inputs. Three specific frictions:

1. Mermaid diagrams are emitted as source text in a `<pre>`. The traceability
   chain — the artifact that justifies the whole five-stage flow — is something
   you have to copy into another tool to look at.
2. Entity links (`tracesTo`, `dependsOn`, `relatesTo`, `adrIds`, `verifies`,
   `servesGoalId`) go through native multi-selects. Picking four of twenty
   ctrl-clickable options is the worst input in the app.
3. Tasks are a vertical form. Status is a dropdown on each card, so seeing what
   is in flight means reading every task.

## Goals

- Render diagrams for real, and make the traceability graph a navigation surface.
- Give the Tasks stage a board view with drag-to-change-status.
- Replace link multi-selects with typeahead comboboxes.
- Add a command palette and keyboard shortcuts.

## Non-goals

- No change to the data model beyond task ordering (see B3).
- No change to the five-stage IA, the sidebar, or the export formats.
- No server, no collaboration, no persistence changes. Still a static site on
  GitHub Pages with `localStorage`.
- `SelectField` (Priority / TaskStatus / TestLevel / TestStatus / AdrStatus) stays
  a native `<select>`. These are short fixed enums where the native control is
  better on mobile and already well covered by tests.

## Dependencies added

| Package | Version | Used by |
|---|---|---|
| `mermaid` | 11.16.0 | A |
| `react-zoom-pan-pinch` | 4.0.3 | A |
| `@dnd-kit/core` | 6.3.1 | B |
| `@dnd-kit/sortable` | 10.0.0 | B |
| `@dnd-kit/utilities` | 3.2.2 | B |
| `cmdk` | 1.1.1 | C, D |
| `@radix-ui/react-popover` | 1.1.23 | C |
| `@radix-ui/react-toggle-group` | 1.1.19 | B |

---

## A. Live diagrams

### A1. `DiagramView` component

`app/src/components/DiagramView.tsx`

```tsx
interface DiagramViewProps {
  source: string;
  /** Called with an entity id when a node is clicked. Omit to disable navigation. */
  onNodeClick?: (entityId: string) => void;
  /** Accessible label for the diagram region. */
  label: string;
}
```

Renders `source` to SVG and shows it inside a pan/zoom viewport. Three states:

- **empty** — `source` has no edges: a muted placeholder, no mermaid load.
- **error** — mermaid threw. Half-written mermaid is the normal state while
  typing, so the last successfully rendered SVG stays on screen at 50% opacity
  with an error banner above it carrying the parse message. Only when nothing has
  ever rendered does the error replace the viewport entirely. A render failure
  never propagates out of the component.
- **rendered** — the SVG, plus zoom in / zoom out / reset controls and a
  **View source** toggle that reveals the original `<pre>`.

### A2. Loading mermaid

mermaid is ~800 kB raw. The initial chunk is 519 kB raw / 159 kB gzipped today,
so a static import would roughly double what every visitor downloads for a
feature many sessions never open. It is loaded with a dynamic `import()` behind a
module-level memoised promise, so it becomes its own async chunk fetched the
first time any diagram renders:

```ts
let mermaidPromise: Promise<typeof import('mermaid')> | null = null;

export function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then(m => {
      m.default.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        htmlLabels: false,
        theme: 'base',
      });
      return m;
    });
  }
  return mermaidPromise;
}
```

`securityLevel: 'strict'` and `htmlLabels: false` matter: the diagram source is
user-typed and, via project import, can come from a file the user did not write.
Strict mode sanitises the generated SVG and blocks `click` directives that would
otherwise let a crafted project file run script or open URLs.

Renders are debounced 300 ms against the source, since it changes on every
keystroke in the architecture textareas.

Theme: mermaid is re-initialised and the diagram re-rendered when the resolved
theme changes, so diagrams are legible in dark mode.

### A3. Click-to-jump

`buildMermaidChain` already emits nodes as `US_1["US-1"]` — the label is exactly
the entity ID. After render, a single delegated click listener on the SVG walks
up from the event target to the nearest `.node` element and reads its text
content. If that text matches an ID in the project's entity registry, the
handler fires.

Matching on **label text**, not on mermaid's internal DOM ids (`flowchart-US_1-0`),
which are an undocumented implementation detail that changes between versions.

A new `app/src/model/registry.ts` maps an entity ID to the view that owns it:

```ts
export type EntityLocation = { id: string; view: View; label: string };
export function entityIndex(project: Project): Map<string, EntityLocation>;
```

`GOAL-*`, `US-*`, `AC-*`, `NFR-*` → `requirements`; `ADR-*` → `architecture`;
`TASK-*` → `tasks`; `TEST-*` → `testing`. This module is also what powers the
command palette's **Jump to entity** group (D2), so it is written once and used
twice.

### A4. Call sites

- `TraceabilityView` — the **Traceability chain** section renders the graph with
  `onNodeClick` wired to `SET_VIEW`. The existing **Copy chain** button stays.
- `ArchitectureForm` — the context diagram and component diagram textareas each
  gain a live preview below them, with `onNodeClick` omitted (those are free-form
  diagrams whose node names are not entity IDs).

---

## B. Tasks board

### B1. View toggle

A Radix `ToggleGroup` (single, `type="single"`) at the top of the Tasks stage
with **Board** and **List**. The choice persists to `localStorage` under
`thinkflow.tasksView`. Default is **List**, so existing users see no change
until they opt in.

Accessible names: the toggle items are `Board` and `List`; the group is labelled
`Task view`.

### B2. Board

`app/src/components/TaskBoard.tsx`. Four columns, one per `TaskStatus`:
`Todo`, `In progress`, `In review`, `Done`. Each column header shows the status
and a count.

Card contents: ID badge, title (or a muted `Untitled` when blank), and counts of
traces and dependencies. Cards are `useSortable` items; columns are droppables.

- Dropping a card on a different column dispatches `UPDATE_TASK { status }`.
  If it lands on a specific card in that column, a `REORDER_TASKS` follows.
  If it lands on empty column space, only the status changes and array order is
  left alone.
- Dropping within a column dispatches `REORDER_TASKS` (B3).
- Clicking a card switches to List view and focuses that task's title input.

### B3. `REORDER_TASKS`

Task order is array order in `project.tasks`, so reordering needs a reducer
action:

```ts
| { type: 'REORDER_TASKS'; from: string; to: string }
```

Moves the task with id `from` to the array position of the task with id `to`,
shifting the rest. Ids rather than indices, because the board's per-column
indices are not array indices. A no-op when either id is missing, so a stale
drag cannot corrupt the list.

This does not touch ID assignment. `nextId` and the PR #9 reclamation logic are
unaffected — reordering never changes an id.

### B4. Accessibility and testing

dnd-kit's `KeyboardSensor` gives arrow-key dragging with no extra work; it is
enabled alongside `PointerSensor`. Each card additionally carries a plain status
`<select>` labelled `Status`, so changing status never requires a drag.

jsdom has no layout — every `getBoundingClientRect` is zeroes — and dnd-kit
resolves drops by measuring rects. So neither a mouse drag *nor* a keyboard drag
can be tested honestly through the DOM.

Instead the drop decision is extracted into a pure module,
`app/src/components/taskBoardDnd.ts`, and the dnd-kit wiring stays thin enough to
carry no logic worth testing:

```ts
export type BoardDrop =
  | { kind: 'status'; status: TaskStatus }
  | { kind: 'reorder'; from: string; to: string }
  | { kind: 'status+reorder'; status: TaskStatus; from: string; to: string };

/** `overId` is a task id, or a column id of the form `column:Todo`. */
export function resolveDrop(tasks: Task[], activeId: string, overId: string): BoardDrop | null;
```

Tests then cover:
- `resolveDrop` exhaustively — drop on empty column, on a card in another column,
  on a card in the same column, on itself, and with unknown ids,
- the status `<select>` fallback → asserts `UPDATE_TASK`,
- column membership and counts as a function of state,
- `REORDER_TASKS` in the reducer.

`KeyboardSensor` is still enabled for the real accessibility benefit, but its
drag path is verified manually in a browser, not asserted in jsdom. No test
pretends to drag.

---

## C. Link comboboxes

### C1. Vendored primitives

`app/src/components/ui/command.tsx` (cmdk) and
`app/src/components/ui/popover.tsx` (Radix Popover), in the same shadcn-vendoring
style as the existing `ui/*` files.

### C2. `Combobox`

`app/src/components/Combobox.tsx` — a popover holding a cmdk list with a search
input. Single and multiple modes. In multiple mode the trigger shows the selected
values as chips, each with a remove button.

### C3. `LinkSelect` swap

`LinkSelect` keeps its exact existing prop signature:

```ts
{ label: string; value: string | string[]; options: {value,label}[];
  multiple?: boolean; onChange: (v: string | string[]) => void }
```

Only its internals change, so **all six call sites across the stage forms need no
edits**. This is the point of keeping the signature — the churn stays in one file.

### C4. Test cost

**Four** `userEvent.selectOptions` assertions target link fields and must be
rewritten to click-based interaction:

| File | Line | Field |
|---|---|---|
| `App.integration.test.tsx` | 14 | Serves goal |
| `App.integration.test.tsx` | 18 | Traces to |
| `App.integration.test.tsx` | 21 | Verifies |
| `inputs.test.tsx` | 52 | Traces to (also asserts `toHaveAttribute('multiple')`) |

`inputs.test.tsx:35` targets `SelectField` and is deliberately **untouched** —
it is the test that pins the enum controls to native `<select>`.

---

## D. Command palette

### D1. Shell

`app/src/components/CommandPalette.tsx` — cmdk inside a Radix Dialog, mounted in
`AppShell`. Opens on Ctrl+K / Cmd+K, closes on Escape.

Modifier-based shortcuts (Ctrl+K, Ctrl+1..5) fire everywhere, including inside
text fields — that is the convention and they cannot collide with typing. The
unmodified `?` shortcut is the only one that needs a guard, and it is ignored
whenever focus is in an input, textarea, select, or contenteditable.

### D2. Groups

| Group | Items |
|---|---|
| Go to | Vision, Requirements, Architecture, Tasks, Testing, Traceability, Export |
| Create | Goal, Story, NFR, ADR, Task, Test |
| Jump to entity | every entity from `entityIndex` (A3), searchable by id and title |
| Actions | Go to export, Toggle theme |

**Create** dispatches the matching `ADD_*` action and navigates to that stage.
**Jump to entity** navigates to the owning view.

The Actions group routes to the Export stage rather than invoking Markdown /
JSON / ZIP directly. Those handlers are currently local to `ExportPanel` and are
not callable from outside it; lifting them out is a refactor this work does not
need, and one extra keystroke is a fair price for not disturbing a tested
component.

### D3. Shortcuts

- `Ctrl/Cmd+K` — palette
- `Ctrl/Cmd+1..5` — the five stages
- `?` — a shortcuts sheet (Radix Dialog), only when focus is not in a field

---

## Global constraints

Accessible names that existing tests match on. A rewrite must preserve these:

| Name | Where | Matcher |
|---|---|---|
| `Remove` | `RepeatableList` remove button | `aria-label` |
| `Export actions` | TopBar dropdown | `aria-label` |
| `Open navigation` | MobileNav trigger | `aria-label` |
| `Copy chain` | TraceabilityView | `aria-label` |
| `Filter rows` | TraceabilityView filter | `<Label htmlFor>` |
| stage labels | Sidebar | anchored regex, e.g. `/^Tasks/i` |

The sidebar's step numbers and all icons stay `aria-hidden`, so a stage's
accessible name remains exactly its label.

New names introduced here, to be kept stable:

`Task view`, `Board`, `List`, `Status`, `View source`, `Zoom in`, `Zoom out`,
`Reset view`, `Command palette`, `Keyboard shortcuts`.

## Bundle budget

A CI step fails the build if the **initial** JS chunk exceeds **200 kB gzipped**.

Measured on gzip, because that is what visitors actually download and what Vite
already prints. Today's initial chunk is 159 kB gzipped. dnd-kit, cmdk, Popover
and react-zoom-pan-pinch together are expected to add roughly 35 kB gzipped,
landing near 195 kB — so the budget is tight enough to catch a regression and
loose enough to pass. If the real figure comes in over budget, that is a genuine
signal to discuss, not a number to quietly raise.

mermaid's async chunk is exempt; it is not on the critical path. The check reads
the size of the entry chunk only, so a static `import 'mermaid'` — the specific
mistake worth guarding against — fails the build immediately.

## Testing

Roughly 30 new tests, taking the suite from 100 to ~130:

- `registry.test.ts` — id → view mapping for all seven kinds.
- `DiagramView.test.tsx` — empty / error / rendered states, source toggle,
  node-click dispatch. mermaid is mocked; the real library is not exercised in
  jsdom, which cannot lay out SVG.
- `taskBoardDnd.test.ts` — `resolveDrop` across all five drop shapes.
- `TaskBoard.test.tsx` — column membership, counts, status fallback,
  click-to-edit.
- `projectStore.test.tsx` — `REORDER_TASKS` including both no-op cases.
- `Combobox.test.tsx` — filtering, single and multiple select, chip removal.
- `CommandPalette.test.tsx` — open/close, each group, the input-focus guard.
- Rewrites of the six link-field `selectOptions` assertions.

Verification runs on GitHub Actions; the local toolchain is blocked by Trend
Micro Application Control (see task #14).

## Sequencing

Two PRs, because four features in one CI cycle is hard to review and harder to
bisect.

- **PR A** — A (diagrams) + C (comboboxes). Improves surfaces that already exist.
  Establishes the bundle budget, so the mermaid chunking is proven before more
  weight arrives.
- **PR B** — B (task board) + D (command palette). New surfaces. Depends on
  `entityIndex` from A3 and on `ui/command.tsx` from C1.

## Risks

| Risk | Mitigation |
|---|---|
| mermaid inflates first paint | Dynamic import + CI bundle budget |
| Crafted project file injects script via diagram source | `securityLevel: 'strict'`, `htmlLabels: false` |
| mermaid render errors crash the stage | Error state renders inline; render wrapped in try/catch |
| Combobox rewrite silently breaks link editing | `LinkSelect` signature frozen; four assertions rewritten deliberately, not deleted |
| Drag-only status change excludes keyboard users | `KeyboardSensor` + a status `<select>` on every card |
| Drag logic untestable in jsdom | Decision extracted to pure `resolveDrop`; dnd-kit wiring kept logic-free |
| Palette shortcut hijacks typing | Handler ignores events originating in form fields |
