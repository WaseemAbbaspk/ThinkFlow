# ThinkFlow Studio — Master-Detail Stage Layout

**Date:** 2026-07-31
**Status:** Approved
**Builds on:** [2026-07-30-studio-interactive-ui-design.md](2026-07-30-studio-interactive-ui-design.md)
**Supersedes:** Phase B of the interactive-UI plan (tasks B-T11 … B-T19)

## Problem

Every stage is one long scrolling column of always-open `SectionCard`s, each
holding a `RepeatableList` of fully-expanded forms. A project with twelve
stories renders twelve complete story forms stacked vertically, each with its
own nested criteria list. Three consequences:

1. **No overview.** You cannot see what stories exist without scrolling past
   every field of every story. There is no way to scan.
2. **No way to find anything.** No search, no filter, no sort. Locating `US-7`
   means scrolling until you see it.
3. **Editing is a scroll-position problem.** Comparing two stories, or editing
   one while reading another, is impossible in a single column.

A reference mockup supplied by the user shows the intended shape: a three-pane
layout with a stage tab strip, a scannable card list in the centre, and a
detail inspector on the right.

## Goals

- Replace the scrolling form with **list + inspector** on the three stages that
  are genuinely collections of records: Requirements, Tasks, Testing.
- Make records **findable**: per-collection search, filter and sort.
- Add the **Ctrl-K command palette** for stage and entity navigation.
- Keep every record **live-editable with autosave**, exactly as today.

## Non-goals

- **No schema change.** `SCHEMA_VERSION` stays `1`. No migration.
- **No new persisted fields.** Specifically: no tags, no per-story status, no
  per-entity author or timestamps, no attachments. See "Rejected from the
  mockup" below.
- **No kanban board and no drag-and-drop.** Phase B's board is dropped rather
  than deferred-in-place; `dnd-kit` is not installed. See "Relationship to
  Phase B".
- Vision and Architecture keep their current scrolling forms.
- No pagination.

## Rejected from the mockup

The mockup is a visual reference, not a data specification. Roughly a third of
what it shows has no backing in `model/types.ts`. Everything in this table is
**deliberately not built**:

| Mockup element | Why not |
| --- | --- |
| Tags (`Authentication`, `Security`, …) | New persisted field; would need schema v2 |
| Per-story status (`Draft` / `In Progress` / `Review`) | `UserStory` has no status; only `Task` does |
| `Created by` / `Created on` / per-entity `Updated` | Timestamps exist once, on `project.meta` |
| Attachments (`login-flow.png`, 245 KB) | `persistence.ts` writes the whole project to **one** localStorage key against a ~5 MB quota. One 245 kB PNG is ~327 kB base64-encoded; a handful of attachments makes `saveProject` fail silently |
| Notifications bell with badge `3` | Nothing in a local-first app generates events |
| `WASEEM` avatar / account | No auth layer; the app is local-first |
| `Projects /` breadcrumb root | There is exactly one project |
| `REV-01` | No revision concept |
| Pagination (`Showing 1 to 10 of 12`) | A design-doc tool holds tens of records, not thousands. A scrolling list with a count footer is less code and less state |

What **is** kept from the mockup maps onto real fields: ID badges (`entity.id`),
priority chips (`priority`, i.e. `Must`/`Should`/`Could`), acceptance criteria
(`criteria` filtered by `storyId`), linked goal (`servesGoalId`), linked tasks
(`task.tracesTo` plus `task.status`), the tab strip (the existing
`SectionCard`s), and `Search anything… Ctrl K` (the command palette).

## Relationship to Phase B

Phase A shipped as PR #12. Phase B (tasks B-T11 … B-T19) was never started.
This spec replaces it:

- **B-T16, B-T17, B-T18 (command palette, palette groups, shortcuts)** — carried
  forward into this spec, because the palette appears in the mockup.
- **B-T11 … B-T15 (`REORDER_TASKS`, `resolveDrop`, ToggleGroup, `TaskBoard`,
  dnd-kit wiring)** — dropped. The Tasks stage now gets list + inspector, and
  shipping a kanban board alongside it would mean two competing Tasks UIs. It
  also frees the ~15 kB gzipped that `dnd-kit` would have cost. A board can
  return later as a third view if it proves wanted.

## The index-addressing defect

**This is the highest-risk item in the spec and the reason several store
changes are mandatory rather than optional.**

Goals, NFRs, assumptions, constraints and non-goals are updated and deleted by
**array index** today:

```tsx
onRemove={i => dispatch({ type: 'DELETE_GOAL', id: project.goals[i].id })}
```

```tsx
onChange={v => replace({
  goals: project.goals.map((g, idx) => idx === i ? { ...g, text: v } : g),
})}
```

This is currently safe only because rendered order *is* model order. Adding
search, filter or sort breaks that invariant, and every edit and delete then
silently targets the wrong record. There is no `UPDATE_GOAL` and no
`UPDATE_NFR` action at all — `RequirementsForm` reaches around the reducer with
`REPLACE_PROJECT` plus an index map.

**Required fix:** add `UPDATE_GOAL` and `UPDATE_NFR` (id-keyed, matching the
existing `UPDATE_STORY` / `UPDATE_TASK` shape), and address every sortable row
by `id`. No `ListDetail` row may be addressed by index.

`assumptions`, `constraints` and `nonGoals` are bare `string[]` with no ids.
Inventing ids for them is a schema change, which is out of scope. Those three
tabs therefore render as **plain inline-editable lists — no search, no sort, no
inspector**, and keep their existing index-addressed updates. They hold
one-line strings; an inspector for them would be empty ceremony. This is a
deliberate asymmetry, not an oversight.

## Architecture

One generic `ListDetail` driven by render props, matching the idiom already in
the codebase (`RepeatableList` takes `renderItem`).

Two alternatives were considered and rejected. **Bespoke components per stage**
would duplicate selection, toolbar and empty-state wiring three times and drift.
**A data-driven entity registry** (one config object per type, one renderer)
would be DRYer, but the three stages differ enough — Requirements has seven
tabs, Tasks has one, Testing has one plus a prose card — that the config would
immediately sprout escape hatches, trading readable JSX for config archaeology.

### New files

| File | Purpose |
| --- | --- |
| `components/ui/tabs.tsx` | Vendored Radix Tabs wrapper, shadcn style |
| `components/ListDetail.tsx` | Toolbar + row list + inspector rail; render-prop based |
| `components/Inspector.tsx` | Right-rail chrome: id badge, title, Duplicate, Delete, close |
| `components/StageTabs.tsx` | Tab strip with per-collection counts |
| `components/CommandPalette.tsx` | Ctrl-K / Cmd-K palette over cmdk + Dialog |
| `lib/listView.ts` | **Pure** search / filter / sort. No DOM, no React |

### Changed files

| File | Change |
| --- | --- |
| `state/projectStore.tsx` | `selectedId` in `State`; `SELECT_ENTITY`; `UPDATE_GOAL`; `UPDATE_NFR`; `DUPLICATE_STORY`; `DUPLICATE_TASK`; `DUPLICATE_TEST`; `SET_VIEW` clears selection |
| `components/AppShell.tsx` | `<main>` becomes a flex row so a stage can render an inspector rail |
| `components/TopBar.tsx` | Breadcrumb + palette trigger; bell and avatar not added |
| `stages/RequirementsForm.tsx` | Rebuilt on `StageTabs` + `ListDetail` |
| `stages/TasksForm.tsx` | Rebuilt on `ListDetail` |
| `stages/TestingForm.tsx` | Rebuilt on `ListDetail`, plus a prose card for entry/exit criteria |
| `components/DiagramView.tsx` call sites | Node click now selects the entity as well as switching stage |

### `lib/listView.ts` interface

Pure, DOM-free, and the whole of the search/filter/sort logic:

```ts
export interface SortOption<T> {
  id: string;                       // stable key for the sort dropdown
  label: string;                    // e.g. "ID", "Title A–Z", "Priority"
  compare: (a: T, b: T) => number;
}

export interface FilterGroup<T> {
  id: string;                       // e.g. "priority", "status"
  label: string;
  options: { value: string; label: string }[];
  /** True when `item` belongs to `value`. */
  matches: (item: T, value: string) => boolean;
}

export interface ListViewState {
  query: string;
  /** Group id -> selected values. Empty or absent means "all". */
  active: Record<string, string[]>;
  sortId: string;
}

export function applyListView<T>(
  items: T[],
  state: ListViewState,
  config: {
    getSearchText: (item: T) => string;
    sorts: SortOption<T>[];
    filters: FilterGroup<T>[];
  },
): T[];
```

Search is case-insensitive substring matching over `getSearchText(item)`.
Filters within one group are OR-ed; separate groups are AND-ed. Sorting is
applied last and is stable.

### `ListDetail` interface

```ts
export interface ListDetailProps<T> {
  items: T[];
  getId: (item: T) => string;
  /** Fields concatenated for the search box to match against. */
  getSearchText: (item: T) => string;
  sorts: SortOption<T>[];
  filters?: FilterGroup<T>[];
  renderRow: (item: T) => React.ReactNode;
  renderInspector: (item: T) => React.ReactNode;
  onAdd: () => void;
  onDelete: (id: string) => void | Promise<void>;
  onDuplicate?: (id: string) => void;
  addLabel: string;        // e.g. "New story"
  searchLabel: string;     // e.g. "Search stories"
  emptyMessage: string;
}
```

### Per-stage configuration

| Stage / tab | Row shows | Sorts | Filters |
| --- | --- | --- | --- |
| Requirements ▸ Goals | `id`, `text`, `metric` | ID, Text A–Z | — |
| Requirements ▸ Stories | `id`, `want`, priority chip, linked-goal chip, criteria count | ID, Want A–Z, Priority | Priority (`Must`/`Should`/`Could`), Has goal / no goal |
| Requirements ▸ Non-functional | `id`, `name`, `target` | ID, Name A–Z | — |
| Requirements ▸ Assumptions / Constraints / Non-goals | inline text input per row — **no toolbar, no inspector** | — | — |
| Requirements ▸ Signoff | not a list; a single small card with the two `signoff` fields | — | — |
| Tasks | `id`, `title`, status chip, `tracesTo` chips | ID, Title A–Z, Status | Status (`Todo`/`In progress`/`In review`/`Done`), Traced / untraced |
| Testing ▸ tests | `id`, `description`, level chip, status chip | ID, Description A–Z, Status | Level, Status |

Requirements therefore has **seven** tabs: Goals, Stories, Non-functional,
Assumptions, Constraints, Non-goals, Signoff. The last four are not
`ListDetail` instances — the first three of those are plain inline lists and
Signoff is a two-field card. The mockup's tab strip shows six; Signoff is the
seventh and appears in the mockup only as a stray panel heading.

### Duplicate

`Duplicate` needs reducer support — copying an entity is not expressible
through the existing `ADD_*` actions, which return no id to the caller. Three
new actions, each allocating a fresh id through `nextId` exactly as the
matching `ADD_*` does:

- `DUPLICATE_TASK` / `DUPLICATE_TEST` — shallow copy of every field except
  `id`; arrays copied, not shared.
- `DUPLICATE_STORY` — copies the story, **and** deep-copies its criteria with
  freshly allocated `AC-<n>.<m>` ids under the new story number. Copying a
  story without its criteria would silently drop data the user can see in the
  inspector.

Goals, NFRs and the three string lists get no Duplicate button — there is
nothing there worth copying that re-typing does not cover.

### Data flow

- **Selection lives in the store.** It has to: the command palette and
  `DiagramView` node clicks both need to select an entity, not merely switch
  stage. `SELECT_ENTITY` carries `{ view, id }` and sets both. `selectedId`
  lives on `State`, not on `Project`, so it is **not persisted** — `persistence.ts`
  serialises `Project` alone. Reloading the app opens with nothing selected.
- **Search, filter and sort are local `useState` inside `ListDetail`.** They are
  transient view state, not worth persisting or lifting.
- **Editing is unchanged.** Inspector fields are real inputs that dispatch
  `UPDATE_*` on every keystroke. Autosave and `SaveStatus` behave exactly as
  today. There is no draft state, no Save button, no dirty tracking, and
  therefore no way to lose work by forgetting to save. The mockup's `Edit`
  button is not built; `Duplicate` and `Delete` are.

### Layout

`AppShell`'s `<main>` becomes a flex row. The inspector is a sibling rail
rendered *by the stage*, not by the shell — so it sits below the full-width top
bar, matching the mockup, while selection state stays owned by the store and
the rail stays absent on stages that do not use it.

The sidebar is unchanged: `Sidebar.tsx` already renders numbered stages `01`–`05`,
a divider, then Traceability and Export, which is exactly what the mockup shows.

**Responsive.** The rail appears at the `lg` breakpoint, not `md`. At `md`
(768 px) the 256 px sidebar leaves ~512 px to split between list and rail, which
is too narrow for both. Below `lg`, selecting a record makes the inspector
**replace** the list full-width with a back button, rather than opening as an
overlay — pure CSS visibility, no second Sheet, no focus trap to manage. The
sidebar remains a Sheet via the existing `MobileNav`.

**Row anatomy.** A row is a single `<button>` wrapping `renderRow(item)`. The
mockup's per-row checkbox and kebab menu are **not** built: interactive elements
nested inside a button are invalid HTML (the same trap that forced `Combobox`
chips outside their trigger), bulk selection is not specified anywhere, and the
kebab would only duplicate the Duplicate/Delete actions that already live in the
inspector. One button per row also gets keyboard access and `aria-current` for
free.

## Error handling

- Quota failure on save is already handled — `saveProject` returns `false` and
  `SaveStatus` surfaces it. Unchanged.
- Deleting a story or criterion keeps its existing `useConfirm` dependency
  warning ("this also removes N criteria and unlinks N tasks").
- **New case:** when the selected entity is deleted, selection clears and the
  inspector rail closes. Selection must never point at a missing id.
- **New case:** when a search or filter excludes the selected entity, the
  inspector stays open. Filtering the list is not deselection.

## Testing

- `lib/listView.ts` — pure unit tests: search matching, each sort order, filter
  predicates, and the empty-result case.
- `ListDetail` — behavioural: select a row opens the inspector; close button
  closes it; New adds and selects the new record; search narrows the list;
  deleting the selected record clears selection.
- `CommandPalette` — Ctrl-K opens, typing filters, Enter navigates to the
  entity's stage and selects it.
- `projectStore` — `UPDATE_GOAL` and `UPDATE_NFR` patch by id; `SET_VIEW`
  clears `selectedId`; `DUPLICATE_STORY` allocates a new `US` id and clones the
  source story's criteria under fresh `AC` ids without touching the original;
  `DUPLICATE_TASK` and `DUPLICATE_TEST` copy arrays rather than sharing them.
- **Rewrites required** (the flows genuinely change shape):
  `App.integration.test.tsx`, `RequirementsForm.test.tsx`,
  `TasksForm.test.tsx`, `TestingForm.test.tsx`.
- **Untouched:** `VisionForm.test.tsx`, `ArchitectureForm.test.tsx`, and every
  model, export and state test.

### Accessible names that must survive

The integration test resolves the sidebar's Tasks button with an anchored
`/^Tasks/i`, and the TopBar export trigger is named `Export actions`
specifically so it does not collide. Both constraints still hold. Row
checkboxes and the inspector close button need distinct accessible names —
`Select <id>` and `Close details` — so they do not collide with the existing
`Remove` buttons.

## Bundle budget

The budget stays **200 kB gzipped** for the entry chunk, enforced by
`scripts/bundleSize.mjs` in CI. Phase A landed at **174.2 kB**, leaving
**25.8 kB** of headroom.

The only new dependency is `@radix-ui/react-tabs` (~4 kB gzipped). `cmdk`,
`@radix-ui/react-dialog` and `@radix-ui/react-popover` are already installed and
already counted in the 174.2. Dropping the kanban board avoids `dnd-kit`
entirely.

**If the build comes in over 200 kB, report the number and stop — do not edit
the budget.**

## Risks

| Risk | Mitigation |
| --- | --- |
| Index-addressed updates corrupt data under sort | Mandatory `UPDATE_GOAL` / `UPDATE_NFR`; all rows keyed by `id`. Covered by store tests |
| Four test files need rewriting; regressions hide in the churn | Rewrite them one stage at a time, keeping each stage's existing assertions where the flow still supports them |
| `ListDetail` grows into a god component | Inspector chrome and the pure list logic are separate modules from the start; `ListDetail` only wires them |
| Local toolchain cannot run `npm test` (Trend Micro) | Verify via GitHub Actions, batched — the established loop |
| Three-pane layout on a narrow viewport | Below `lg` the inspector replaces the list full-width with a back button; no overlay, no focus trap |
| `Delete` in the inspector collides with `Delete` in the confirm dialog | Inspector buttons are labelled `Delete <id>` / `Duplicate <id>`, so `RequirementsForm.test.tsx`'s `/^delete$/i` still resolves the dialog uniquely |

## Sequencing

1. `lib/listView.ts` + tests (pure, no UI dependency).
2. Store: `selectedId`, `SELECT_ENTITY`, `UPDATE_GOAL`, `UPDATE_NFR`, the three
   `DUPLICATE_*` actions + tests.
3. Vendor `tabs.tsx`; add `@radix-ui/react-tabs`.
4. `Inspector.tsx`, then `ListDetail.tsx` + tests.
5. `AppShell` flex row; `TopBar` breadcrumb and palette trigger.
6. Rebuild Requirements (largest, seven tabs), then Tasks, then Testing.
7. `CommandPalette.tsx` + tests; wire Ctrl-K.
8. Rewrite the four affected test files; verify in CI; open PR.
