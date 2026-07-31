# Master-Detail Stage Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the scrolling stage forms on Requirements, Tasks and Testing with a searchable list + live-editing inspector, and add a Ctrl-K command palette.

**Architecture:** One generic `ListDetail<T>` component driven by render props (matching the existing `RepeatableList` idiom), fed by a pure `lib/listView.ts` module that does all search/filter/sort with no DOM involvement. Selection lives on the store as `selectedId` so the command palette and diagram node clicks can select an entity, not merely switch stage. Vision and Architecture keep their current forms.

**Tech Stack:** React 18, TypeScript 5.5 (`strict`, `noUnusedLocals`, `noUnusedParameters`), Vite 5, Tailwind CSS v4, Radix primitives, cmdk, Vitest 2 + Testing Library + jsdom.

**Spec:** [`docs/superpowers/specs/2026-07-31-studio-master-detail-design.md`](../specs/2026-07-31-studio-master-detail-design.md)

## Global Constraints

- **Never run `npm install` from the repo root.** All npm work happens in `app/`.
- Install new dependencies with `--ignore-scripts`.
- **Never add a Claude Code attribution or co-author trailer to a git commit.**
- Exact dependency version to add: `@radix-ui/react-tabs@1.1.14`. It is the **only** new dependency in this plan.
- **`npm test` and `npm run build` cannot run locally** — Trend Micro Application Control blocks `@rollup/rollup-win32-x64-msvc` with `ERR_DLOPEN_FAILED: Access is denied`. Run the command anyway as each task instructs; when it fails with that specific error, that is the known block — record it, commit, and rely on the batched CI verification in Task 17. Any *other* failure is a real failure.
- **Bundle budget is 200 kB gzipped** for the entry chunk, enforced by `app/scripts/bundleSize.mjs` in CI. Phase A landed at 174.2 kB. **If the build comes in over 200 kB, report the number and stop — do not edit the budget.**
- **No schema change.** `SCHEMA_VERSION` stays `1`. No new fields on any `Project` type. `selectedId` goes on `State`, never on `Project`.
- Tailwind v4 dropped v3's implicit `w-[--foo]` → `var()` conversion. Always write `w-[var(--foo)]`.
- **Load-bearing accessible names** — these are asserted by existing tests and must not change:
  | Name | Asserted by |
  | --- | --- |
  | Sidebar stage buttons, anchored `/^Tasks/i` | `App.integration.test.tsx` |
  | `Export actions` (TopBar trigger) | must stay distinct from the sidebar's `Export` |
  | `/^delete$/i` resolving **only** the confirm dialog's button | `RequirementsForm.test.tsx` |
- **New accessible names introduced here, and why they are shaped this way:**
  | Name | Reason |
  | --- | --- |
  | `Delete <id>` / `Duplicate <id>` (inspector) | A bare `Delete` would collide with the confirm dialog's `/^delete$/i` |
  | `Close details` | Distinct from `RepeatableList`'s `Remove` |
  | `Search tasks` / `Search stories` / … | Each `ListDetail` search box needs a unique label |
  | `Details` (the `<aside>`) | Lets tests assert the rail's presence/absence |
- **A row is a single `<button>`.** Never nest a checkbox, kebab menu, or any other interactive element inside `renderRow` — a button inside a button is invalid HTML and breaks Testing Library role queries. This is the same trap that forced `Combobox` chips outside their trigger.
- **Never address a `ListDetail` row by array index.** Anything rendered through `ListDetail` is sortable and filterable, so a visible index no longer matches the model index — every add, update and delete for those rows goes through an id-keyed action. Removing that class of bug is why this plan exists.
  - **Carve-out:** `RepeatableList` stays index-based. It is used for nested, unsorted collections (a story's criteria, a task's acceptance lines) and for the three bare `string[]` fields (assumptions, constraints, non-goals) that have no ids at all. Where an index *is* used, resolve it to an id immediately and dispatch the id-keyed action — never pass the index into the reducer.
- **Accessible-name collision to design around.** A `ListDetail` row button's name is its whole text content (e.g. `US-1 Log in Must 0 criteria`), and the open inspector adds `Delete US-1` and `Duplicate US-1`. So `getByRole('button', { name: /US-1/ })` is **ambiguous whenever that row is selected**. Match the row with a leading anchor — `/^US-1/` — or query it before selecting. Likewise `getByText(/US-1/)` matches the row badge *and* the inspector's badge *and* its heading once selected; use `getAllByText` or an anchored role query.
- `useTheme()` throws outside `ThemeProvider` and `useConfirm()` throws outside `ConfirmProvider`. Any test rendering a component that reaches either must use `renderWithProviders` from `@/test/renderWithProviders`, not a bare `<ProjectProvider>`.

---

### Task 1: Pure list-view module

**Files:**
- Create: `app/src/lib/listView.ts`
- Test: `app/src/lib/listView.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `SortOption<T>`, `FilterGroup<T>`, `ListViewState`, `ListViewConfig<T>`, `applyListView<T>(items, state, config): T[]`.

- [ ] **Step 1: Write the failing test**

Create `app/src/lib/listView.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { applyListView, type FilterGroup, type ListViewConfig, type SortOption } from './listView';

interface Row { id: string; name: string; status: string; }

const rows: Row[] = [
  { id: 'A-2', name: 'banana', status: 'open' },
  { id: 'A-1', name: 'apple', status: 'done' },
  { id: 'A-3', name: 'cherry', status: 'open' },
];

const sorts: SortOption<Row>[] = [
  { id: 'id', label: 'ID', compare: (a, b) => a.id.localeCompare(b.id) },
  { id: 'name', label: 'Name', compare: (a, b) => a.name.localeCompare(b.name) },
];

const filters: FilterGroup<Row>[] = [
  {
    id: 'status', label: 'Status',
    options: [{ value: 'open', label: 'Open' }, { value: 'done', label: 'Done' }],
    matches: (r, v) => r.status === v,
  },
];

const config: ListViewConfig<Row> = {
  getSearchText: r => `${r.id} ${r.name}`,
  sorts,
  filters,
};

const base = { query: '', active: {}, sortId: '' };

describe('applyListView', () => {
  it('returns everything when nothing is set', () => {
    expect(applyListView(rows, base, config)).toHaveLength(3);
  });

  it('matches the search query case-insensitively', () => {
    const out = applyListView(rows, { ...base, query: 'BAN' }, config);
    expect(out.map(r => r.id)).toEqual(['A-2']);
  });

  it('searches across every field getSearchText returns', () => {
    const out = applyListView(rows, { ...base, query: 'a-3' }, config);
    expect(out.map(r => r.id)).toEqual(['A-3']);
  });

  it('ORs values within one filter group', () => {
    const out = applyListView(rows, { ...base, active: { status: ['open', 'done'] } }, config);
    expect(out).toHaveLength(3);
  });

  it('treats an empty value list as no filter', () => {
    const out = applyListView(rows, { ...base, active: { status: [] } }, config);
    expect(out).toHaveLength(3);
  });

  it('ANDs the query with a filter group', () => {
    const out = applyListView(rows, { query: 'a', active: { status: ['open'] }, sortId: '' }, config);
    expect(out.map(r => r.id)).toEqual(['A-2', 'A-3']);
  });

  it('applies the named sort', () => {
    const out = applyListView(rows, { ...base, sortId: 'name' }, config);
    expect(out.map(r => r.name)).toEqual(['apple', 'banana', 'cherry']);
  });

  it('leaves order untouched when sortId matches nothing', () => {
    const out = applyListView(rows, { ...base, sortId: 'nope' }, config);
    expect(out.map(r => r.id)).toEqual(['A-2', 'A-1', 'A-3']);
  });

  it('does not mutate the input array', () => {
    const input = [...rows];
    applyListView(input, { ...base, sortId: 'name' }, config);
    expect(input.map(r => r.id)).toEqual(['A-2', 'A-1', 'A-3']);
  });

  it('returns an empty array when nothing matches', () => {
    expect(applyListView(rows, { ...base, query: 'zzz' }, config)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && npm test -- listView`
Expected: FAIL — `Failed to resolve import "./listView"`.

- [ ] **Step 3: Write the implementation**

Create `app/src/lib/listView.ts`:

```ts
export interface SortOption<T> {
  /** Stable key stored in ListViewState.sortId. */
  id: string;
  label: string;
  compare: (a: T, b: T) => number;
}

export interface FilterGroup<T> {
  id: string;
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

export interface ListViewConfig<T> {
  getSearchText: (item: T) => string;
  sorts: SortOption<T>[];
  filters: FilterGroup<T>[];
}

/**
 * Search, then filter, then sort. Values inside one filter group are OR-ed;
 * separate groups are AND-ed. Never mutates `items`.
 */
export function applyListView<T>(
  items: T[],
  state: ListViewState,
  config: ListViewConfig<T>,
): T[] {
  let out = items;

  const query = state.query.trim().toLowerCase();
  if (query) {
    out = out.filter(item => config.getSearchText(item).toLowerCase().includes(query));
  }

  for (const group of config.filters) {
    const values = state.active[group.id];
    if (!values || values.length === 0) continue;
    out = out.filter(item => values.some(v => group.matches(item, v)));
  }

  const sort = config.sorts.find(s => s.id === state.sortId);
  if (sort) out = [...out].sort(sort.compare);

  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app && npm test -- listView`
Expected: PASS, 10 tests.

- [ ] **Step 5: Commit**

```bash
git add app/src/lib/listView.ts app/src/lib/listView.test.ts
git commit -m "Add pure list search, filter and sort module"
```

---

### Task 2: Selection state on the store

**Files:**
- Modify: `app/src/state/projectStore.tsx`
- Test: `app/src/state/projectStore.test.tsx`

**Interfaces:**
- Consumes: `entityIndex(project)` from `app/src/model/registry.ts`, which returns `Map<string, { id: string; view: View; label: string }>`.
- Produces: `State.selectedId: string | null`; action `{ type: 'SELECT_ENTITY'; view: View; id: string | null }`.

**Context:** every existing test in `projectStore.test.tsx` builds state via `initialState()`, so adding a field to `State` breaks none of them.

`registry.ts` imports `View` from `projectStore` with `import type`, which is erased at compile time — importing `entityIndex` back into `projectStore` therefore creates **no runtime cycle**.

- [ ] **Step 1: Write the failing test**

Append to the top-level `describe` in `app/src/state/projectStore.test.tsx`:

```ts
  it('starts with nothing selected', () => {
    expect(initialState().selectedId).toBeNull();
  });

  it('SELECT_ENTITY sets both the view and the id', () => {
    const s = reducer(initialState(), { type: 'SELECT_ENTITY', view: 'tasks', id: 'TASK-1' });
    expect(s.view).toBe('tasks');
    expect(s.selectedId).toBe('TASK-1');
  });

  it('SET_VIEW clears the selection', () => {
    let s = reducer(initialState(), { type: 'SELECT_ENTITY', view: 'tasks', id: 'TASK-1' });
    s = reducer(s, { type: 'SET_VIEW', view: 'testing' });
    expect(s.selectedId).toBeNull();
  });

  it('clears the selection when the selected entity is deleted', () => {
    let s = reducer(initialState(), { type: 'ADD_TASK' });
    s = reducer(s, { type: 'SELECT_ENTITY', view: 'tasks', id: 'TASK-1' });
    s = reducer(s, { type: 'DELETE_TASK', id: 'TASK-1' });
    expect(s.selectedId).toBeNull();
  });

  it('keeps the selection when a different entity is deleted', () => {
    let s = reducer(initialState(), { type: 'ADD_TASK' });
    s = reducer(s, { type: 'ADD_TASK' });
    s = reducer(s, { type: 'SELECT_ENTITY', view: 'tasks', id: 'TASK-1' });
    s = reducer(s, { type: 'DELETE_TASK', id: 'TASK-2' });
    expect(s.selectedId).toBe('TASK-1');
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && npm test -- projectStore`
Expected: FAIL — `selectedId` does not exist on type `State`.

- [ ] **Step 3: Write the implementation**

In `app/src/state/projectStore.tsx`:

Add the import:

```ts
import { entityIndex } from '../model/registry';
```

Replace the `State` interface and `initialState`:

```ts
export interface State { project: Project; view: View; selectedId: string | null; }
export const initialState = (): State => ({
  project: emptyProject('Untitled Project'), view: 'vision', selectedId: null,
});
```

Add to the `Action` union:

```ts
  | { type: 'SELECT_ENTITY'; view: View; id: string | null }
```

Rename the existing exported `reducer` function to `baseReducer` (change only the
declaration line — leave the whole body alone):

```ts
function baseReducer(state: State, action: Action): State {
```

Change its `SET_VIEW` case to clear the selection:

```ts
    case 'SET_VIEW': return { ...state, view: action.view, selectedId: null };
```

Add a `SELECT_ENTITY` case next to it:

```ts
    case 'SELECT_ENTITY': return { ...state, view: action.view, selectedId: action.id };
```

Then add the new exported wrapper immediately after `baseReducer` closes:

```ts
/**
 * Selection must never point at an entity that no longer exists — deleting the
 * selected record has to close the inspector rather than leave it rendering a
 * stale row. Checking after the fact means every DELETE_* case gets this for
 * free instead of each one remembering to clear.
 */
export function reducer(state: State, action: Action): State {
  const next = baseReducer(state, action);
  if (next.selectedId !== null && !entityIndex(next.project).has(next.selectedId)) {
    return { ...next, selectedId: null };
  }
  return next;
}
```

Finally, update `ProjectProvider`'s initializer so a preloaded project also starts unselected:

```ts
  const [state, dispatch] = useReducer<React.Reducer<State, Action>, undefined>(reducer, undefined, () =>
    preload ? { project: preload, view: 'vision', selectedId: null } : initialState());
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app && npm test -- projectStore`
Expected: PASS — the 5 new tests plus every pre-existing one.

- [ ] **Step 5: Commit**

```bash
git add app/src/state/projectStore.tsx app/src/state/projectStore.test.tsx
git commit -m "Track selected entity on the store"
```

---

### Task 3: Id-keyed goal and NFR updates

**Files:**
- Modify: `app/src/state/projectStore.tsx`
- Test: `app/src/state/projectStore.test.tsx`

**Interfaces:**
- Produces: `{ type: 'UPDATE_GOAL'; id: string; patch: Partial<Goal> }`, `{ type: 'UPDATE_NFR'; id: string; patch: Partial<Nfr> }`.

**Why:** `RequirementsForm` currently edits goals and NFRs by array index through
`REPLACE_PROJECT`. Once the list can be sorted, the visible index stops matching
the model index and every edit hits the wrong record. These actions are what make
sorting safe.

- [ ] **Step 1: Write the failing test**

Append to `app/src/state/projectStore.test.tsx`:

```ts
  it('UPDATE_GOAL patches by id, not position', () => {
    let s = reducer(initialState(), { type: 'ADD_GOAL' });
    s = reducer(s, { type: 'ADD_GOAL' });
    s = reducer(s, { type: 'UPDATE_GOAL', id: 'GOAL-2', patch: { text: 'second' } });
    expect(s.project.goals.find(g => g.id === 'GOAL-2')?.text).toBe('second');
    expect(s.project.goals.find(g => g.id === 'GOAL-1')?.text).toBe('');
  });

  it('UPDATE_NFR patches by id, not position', () => {
    let s = reducer(initialState(), { type: 'ADD_NFR' });
    s = reducer(s, { type: 'ADD_NFR' });
    s = reducer(s, { type: 'UPDATE_NFR', id: 'NFR-2', patch: { name: 'latency' } });
    expect(s.project.requirements.nfrs.find(n => n.id === 'NFR-2')?.name).toBe('latency');
    expect(s.project.requirements.nfrs.find(n => n.id === 'NFR-1')?.name).toBe('');
  });

  it('UPDATE_GOAL on a missing id changes nothing', () => {
    const s0 = reducer(initialState(), { type: 'ADD_GOAL' });
    const s1 = reducer(s0, { type: 'UPDATE_GOAL', id: 'GOAL-9', patch: { text: 'x' } });
    expect(s1.project.goals).toEqual(s0.project.goals);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && npm test -- projectStore`
Expected: FAIL — `UPDATE_GOAL` is not assignable to the `Action` union.

- [ ] **Step 3: Write the implementation**

Add to the `Action` union in `app/src/state/projectStore.tsx`:

```ts
  | { type: 'UPDATE_GOAL'; id: string; patch: Partial<Goal> }
  | { type: 'UPDATE_NFR'; id: string; patch: Partial<Nfr> }
```

Add these cases to `baseReducer`, beside `ADD_GOAL` and `ADD_NFR`:

```ts
    case 'UPDATE_GOAL':
      return { ...state, project: touch({ ...p,
        goals: p.goals.map(g => g.id === action.id ? { ...g, ...action.patch } : g) }) };

    case 'UPDATE_NFR':
      return { ...state, project: touch({ ...p, requirements: { ...p.requirements,
        nfrs: p.requirements.nfrs.map(n => n.id === action.id ? { ...n, ...action.patch } : n) } }) };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app && npm test -- projectStore`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/src/state/projectStore.tsx app/src/state/projectStore.test.tsx
git commit -m "Add id-keyed UPDATE_GOAL and UPDATE_NFR actions"
```

---

### Task 4: Duplicate actions

**Files:**
- Modify: `app/src/state/projectStore.tsx`
- Test: `app/src/state/projectStore.test.tsx`

**Interfaces:**
- Consumes: `nextId(counters, kind, ctx?)` from `app/src/model/ids.ts`, returning `{ id, counters }`. For `'AC'` it **requires** `ctx.storyNumber` and throws without it.
- Produces: `DUPLICATE_STORY`, `DUPLICATE_TASK`, `DUPLICATE_TEST`, each `{ type; id: string }`.

**Why a reducer action rather than reusing `ADD_*`:** `ADD_*` allocates the id
internally and returns nothing to the caller, so a component cannot add a record
and then patch it with the source's fields.

- [ ] **Step 1: Write the failing test**

Append to `app/src/state/projectStore.test.tsx`:

```ts
  it('DUPLICATE_TASK copies fields under a fresh id', () => {
    let s = reducer(initialState(), { type: 'ADD_TASK' });
    s = reducer(s, { type: 'UPDATE_TASK', id: 'TASK-1', patch: { title: 'build it', acceptance: ['a'] } });
    s = reducer(s, { type: 'DUPLICATE_TASK', id: 'TASK-1' });
    expect(s.project.tasks).toHaveLength(2);
    const copy = s.project.tasks[1];
    expect(copy.id).toBe('TASK-2');
    expect(copy.title).toBe('build it');
    expect(copy.acceptance).toEqual(['a']);
    expect(copy.acceptance).not.toBe(s.project.tasks[0].acceptance);
  });

  it('DUPLICATE_TEST copies fields under a fresh id', () => {
    let s = reducer(initialState(), { type: 'ADD_TEST' });
    s = reducer(s, { type: 'UPDATE_TEST', id: 'TEST-1', patch: { description: 'checks login' } });
    s = reducer(s, { type: 'DUPLICATE_TEST', id: 'TEST-1' });
    expect(s.project.testing.tests.map(t => t.id)).toEqual(['TEST-1', 'TEST-2']);
    expect(s.project.testing.tests[1].description).toBe('checks login');
  });

  it('DUPLICATE_STORY clones the story and its criteria under new ids', () => {
    let s = reducer(initialState(), { type: 'ADD_STORY' });
    s = reducer(s, { type: 'UPDATE_STORY', id: 'US-1', patch: { want: 'log in' } });
    s = reducer(s, { type: 'ADD_CRITERION', storyId: 'US-1' });
    s = reducer(s, { type: 'UPDATE_CRITERION', id: 'AC-1.1', patch: { text: 'password works' } });
    s = reducer(s, { type: 'DUPLICATE_STORY', id: 'US-1' });

    expect(s.project.requirements.stories.map(x => x.id)).toEqual(['US-1', 'US-2']);
    expect(s.project.requirements.stories[1].want).toBe('log in');

    const copied = s.project.requirements.criteria.filter(c => c.storyId === 'US-2');
    expect(copied.map(c => c.id)).toEqual(['AC-2.1']);
    expect(copied[0].text).toBe('password works');

    // the original is untouched
    expect(s.project.requirements.criteria.filter(c => c.storyId === 'US-1')).toHaveLength(1);
  });

  it('DUPLICATE_STORY on a missing id changes nothing', () => {
    const s0 = reducer(initialState(), { type: 'ADD_STORY' });
    const s1 = reducer(s0, { type: 'DUPLICATE_STORY', id: 'US-9' });
    expect(s1).toBe(s0);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && npm test -- projectStore`
Expected: FAIL — `DUPLICATE_TASK` is not assignable to the `Action` union.

- [ ] **Step 3: Write the implementation**

Add to the `Action` union in `app/src/state/projectStore.tsx`:

```ts
  | { type: 'DUPLICATE_STORY'; id: string }
  | { type: 'DUPLICATE_TASK'; id: string }
  | { type: 'DUPLICATE_TEST'; id: string }
```

Add these cases to `baseReducer`:

```ts
    case 'DUPLICATE_STORY': {
      const src = p.requirements.stories.find(s => s.id === action.id);
      if (!src) return state;
      const { id, counters } = nextId(p.meta.counters, 'US');
      const story: UserStory = { ...src, id };
      /* Criteria come along. A story's criteria are visible in its inspector, so
         duplicating without them would look like silent data loss. Each copy gets
         a fresh AC id numbered under the NEW story. */
      let running = counters;
      const copies: Criterion[] = [];
      for (const c of p.requirements.criteria.filter(c => c.storyId === action.id)) {
        const allocated = nextId(running, 'AC', { storyNumber: storyNumber(id) });
        running = allocated.counters;
        copies.push({ ...c, id: allocated.id, storyId: id });
      }
      return { ...state, project: touch({ ...p, meta: { ...p.meta, counters: running },
        requirements: { ...p.requirements,
          stories: [...p.requirements.stories, story],
          criteria: [...p.requirements.criteria, ...copies] } }) };
    }

    case 'DUPLICATE_TASK': {
      const src = p.tasks.find(t => t.id === action.id);
      if (!src) return state;
      const { id, counters } = nextId(p.meta.counters, 'TASK');
      const task: Task = {
        ...src, id,
        tracesTo: [...src.tracesTo],
        dependsOn: [...src.dependsOn],
        acceptance: [...src.acceptance],
      };
      return { ...state, project: touch({ ...p, meta: { ...p.meta, counters },
        tasks: [...p.tasks, task] }) };
    }

    case 'DUPLICATE_TEST': {
      const src = p.testing.tests.find(t => t.id === action.id);
      if (!src) return state;
      const { id, counters } = nextId(p.meta.counters, 'TEST');
      return { ...state, project: touch({ ...p, meta: { ...p.meta, counters },
        testing: { ...p.testing, tests: [...p.testing.tests, { ...src, id }] } }) };
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app && npm test -- projectStore`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/src/state/projectStore.tsx app/src/state/projectStore.test.tsx
git commit -m "Add duplicate actions for stories, tasks and tests"
```

---

### Task 5: Vendor Tabs and a checkable dropdown item

**Files:**
- Create: `app/src/components/ui/tabs.tsx`
- Modify: `app/src/components/ui/dropdown-menu.tsx`, `app/package.json`

**Interfaces:**
- Produces: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`; `DropdownMenuCheckboxItem`.

- [ ] **Step 1: Install the dependency**

```bash
cd app && npm install --ignore-scripts --save-exact @radix-ui/react-tabs@1.1.14
```

Confirm `package.json` now lists `"@radix-ui/react-tabs": "1.1.14"`. `@radix-ui/react-dropdown-menu` is already a dependency — the checkbox item needs no install.

- [ ] **Step 2: Create the Tabs wrapper**

Create `app/src/components/ui/tabs.tsx`:

```tsx
import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn('flex flex-wrap items-center gap-1 border-b border-border', className)}
    {...props}
  />
));
TabsList.displayName = 'TabsList';

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center gap-1.5 border-b-2 border-transparent px-3 py-2 text-sm',
      'text-muted-foreground transition-colors hover:text-foreground',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
      'data-[state=active]:border-primary data-[state=active]:font-semibold data-[state=active]:text-foreground',
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = 'TabsTrigger';

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn('flex min-h-0 flex-1 flex-col pt-4 outline-none', className)}
    {...props}
  />
));
TabsContent.displayName = 'TabsContent';
```

- [ ] **Step 3: Add the checkable dropdown item**

In `app/src/components/ui/dropdown-menu.tsx`, add `Check` to the `lucide-react`
import (create the import if the file has none), then append:

```tsx
export const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center gap-2 rounded-[6px] py-1.5 pl-8 pr-2',
      'text-sm outline-none focus:bg-accent focus:text-accent-foreground',
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex size-4 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check aria-hidden="true" className="size-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem';
```

- [ ] **Step 4: Verify it compiles**

Run: `cd app && npx tsc -b --noEmit`
Expected: no errors. (`tsc` is not blocked by Trend Micro — only the rollup native binary is, so this check does run locally.)

- [ ] **Step 5: Commit**

```bash
git add app/package.json app/package-lock.json app/src/components/ui/tabs.tsx app/src/components/ui/dropdown-menu.tsx
git commit -m "Vendor Radix Tabs and a checkable dropdown item"
```

---

### Task 6: Inspector chrome

**Files:**
- Create: `app/src/components/Inspector.tsx`
- Test: `app/src/components/Inspector.test.tsx`

**Interfaces:**
- Produces: `Inspector({ id, title, onClose, onDelete, onDuplicate?, children })`.

**Critical:** the delete and duplicate buttons are labelled `Delete <id>` and
`Duplicate <id>`. A bare `Delete` would make `RequirementsForm.test.tsx`'s
`getByRole('button', { name: /^delete$/i })` ambiguous once a confirm dialog is
also on screen.

- [ ] **Step 1: Write the failing test**

Create `app/src/components/Inspector.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Inspector } from './Inspector';

describe('Inspector', () => {
  it('shows the id and title and renders children', () => {
    render(
      <Inspector id="US-1" title="User login" onClose={() => {}} onDelete={() => {}}>
        <p>body content</p>
      </Inspector>,
    );
    expect(screen.getByText('US-1')).toBeInTheDocument();
    expect(screen.getByText('User login')).toBeInTheDocument();
    expect(screen.getByText('body content')).toBeInTheDocument();
  });

  it('falls back to the id when the title is empty', () => {
    render(<Inspector id="US-1" title="" onClose={() => {}} onDelete={() => {}}><p>x</p></Inspector>);
    expect(screen.getByRole('heading', { name: 'US-1' })).toBeInTheDocument();
  });

  it('calls onClose from the close button', async () => {
    const onClose = vi.fn();
    render(<Inspector id="US-1" title="t" onClose={onClose} onDelete={() => {}}><p>x</p></Inspector>);
    await userEvent.click(screen.getByRole('button', { name: 'Close details' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('scopes the delete button name to the id so it cannot collide with a confirm dialog', async () => {
    const onDelete = vi.fn();
    render(<Inspector id="US-1" title="t" onClose={() => {}} onDelete={onDelete}><p>x</p></Inspector>);
    expect(screen.queryByRole('button', { name: /^delete$/i })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Delete US-1' }));
    expect(onDelete).toHaveBeenCalled();
  });

  it('omits the duplicate button when no handler is given', () => {
    render(<Inspector id="US-1" title="t" onClose={() => {}} onDelete={() => {}}><p>x</p></Inspector>);
    expect(screen.queryByRole('button', { name: /duplicate/i })).not.toBeInTheDocument();
  });

  it('calls onDuplicate when a handler is given', async () => {
    const onDuplicate = vi.fn();
    render(
      <Inspector id="US-1" title="t" onClose={() => {}} onDelete={() => {}} onDuplicate={onDuplicate}>
        <p>x</p>
      </Inspector>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Duplicate US-1' }));
    expect(onDuplicate).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && npm test -- Inspector`
Expected: FAIL — `Failed to resolve import "./Inspector"`.

- [ ] **Step 3: Write the implementation**

Create `app/src/components/Inspector.tsx`:

```tsx
import React from 'react';
import { Copy, Trash2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface InspectorProps {
  id: string;
  title: string;
  onClose: () => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  children: React.ReactNode;
}

export function Inspector({ id, title, onClose, onDelete, onDuplicate, children }: InspectorProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-[8px] border border-border bg-card">
      <div className="flex items-start gap-2 border-b border-border p-4">
        <div className="min-w-0 flex-1">
          <Badge className="mb-2">{id}</Badge>
          <h2 className="truncate text-base font-semibold">{title || id}</h2>
        </div>
        <Button variant="ghost" size="icon" aria-label="Close details" onClick={onClose}>
          <X aria-hidden="true" />
        </Button>
      </div>

      {/* Names are scoped to the id on purpose: a bare "Delete" would collide with
          the confirm dialog's own Delete button, which tests match as /^delete$/i. */}
      <div className="flex items-center gap-1 border-b border-border px-3 py-2">
        {onDuplicate && (
          <Button variant="ghost" size="sm" aria-label={`Duplicate ${id}`} onClick={onDuplicate}>
            <Copy aria-hidden="true" />
            <span aria-hidden="true">Duplicate</span>
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          aria-label={`Delete ${id}`}
          className="text-muted-foreground hover:text-warn"
          onClick={onDelete}
        >
          <Trash2 aria-hidden="true" />
          <span aria-hidden="true">Delete</span>
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app && npm test -- Inspector`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add app/src/components/Inspector.tsx app/src/components/Inspector.test.tsx
git commit -m "Add Inspector panel chrome"
```

---

### Task 7: ListDetail

**Files:**
- Create: `app/src/components/ListDetail.tsx`
- Test: `app/src/components/ListDetail.test.tsx`

**Interfaces:**
- Consumes: `applyListView`, `SortOption`, `FilterGroup`, `ListViewState` (Task 1); `Inspector` (Task 6); `DropdownMenuCheckboxItem` (Task 5).
- Produces: `ListDetail<T>(props: ListDetailProps<T>)`.

**Design note:** selection is **controlled** via `selectedId` / `onSelect` props
rather than read from the store. That keeps `ListDetail` testable with no
providers at all, and lets each stage decide which `view` to pass to
`SELECT_ENTITY`.

- [ ] **Step 1: Write the failing test**

Create `app/src/components/ListDetail.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListDetail } from './ListDetail';
import type { FilterGroup, SortOption } from '@/lib/listView';

interface Row { id: string; name: string; flag: boolean; }

const rows: Row[] = [
  { id: 'R-1', name: 'alpha', flag: true },
  { id: 'R-2', name: 'beta', flag: false },
];

const sorts: SortOption<Row>[] = [
  { id: 'id', label: 'ID', compare: (a, b) => a.id.localeCompare(b.id) },
  { id: 'name', label: 'Name', compare: (a, b) => a.name.localeCompare(b.name) },
];

const filters: FilterGroup<Row>[] = [
  {
    id: 'flag', label: 'Flag',
    options: [{ value: 'on', label: 'On' }],
    matches: (r, v) => (v === 'on' ? r.flag : true),
  },
];

function setup(overrides: Partial<React.ComponentProps<typeof ListDetail<Row>>> = {}) {
  const props = {
    items: rows,
    getId: (r: Row) => r.id,
    getTitle: (r: Row) => r.name,
    getSearchText: (r: Row) => `${r.id} ${r.name}`,
    sorts,
    filters,
    selectedId: null as string | null,
    onSelect: vi.fn(),
    onAdd: vi.fn(),
    onDelete: vi.fn(),
    addLabel: 'Add row',
    searchLabel: 'Search rows',
    emptyMessage: 'Nothing here.',
    renderRow: (r: Row) => <span>{r.id} {r.name}</span>,
    renderInspector: (r: Row) => <p>inspecting {r.name}</p>,
    ...overrides,
  };
  render(<ListDetail<Row> {...props} />);
  return props;
}

describe('ListDetail', () => {
  it('renders a row per item and a count', () => {
    setup();
    expect(screen.getByText(/R-1 alpha/)).toBeInTheDocument();
    expect(screen.getByText(/R-2 beta/)).toBeInTheDocument();
    expect(screen.getByText(/Showing 2 of 2/)).toBeInTheDocument();
  });

  it('narrows the list as you search', async () => {
    setup();
    await userEvent.type(screen.getByLabelText('Search rows'), 'beta');
    expect(screen.queryByText(/R-1 alpha/)).not.toBeInTheDocument();
    expect(screen.getByText(/R-2 beta/)).toBeInTheDocument();
    expect(screen.getByText(/Showing 1 of 2/)).toBeInTheDocument();
  });

  it('shows the empty message when nothing matches', async () => {
    setup();
    await userEvent.type(screen.getByLabelText('Search rows'), 'zzz');
    expect(screen.getByText('Nothing here.')).toBeInTheDocument();
  });

  it('reports the clicked row id', async () => {
    const props = setup();
    await userEvent.click(screen.getByRole('button', { name: /R-1 alpha/ }));
    expect(props.onSelect).toHaveBeenCalledWith('R-1');
  });

  it('hides the inspector until something is selected', () => {
    setup();
    expect(screen.queryByRole('complementary', { name: 'Details' })).not.toBeInTheDocument();
  });

  it('renders the inspector for the selected item', () => {
    setup({ selectedId: 'R-2' });
    expect(screen.getByRole('complementary', { name: 'Details' })).toBeInTheDocument();
    expect(screen.getByText('inspecting beta')).toBeInTheDocument();
  });

  it('deselects from the inspector close button', async () => {
    const props = setup({ selectedId: 'R-2' });
    await userEvent.click(screen.getByRole('button', { name: 'Close details' }));
    expect(props.onSelect).toHaveBeenCalledWith(null);
  });

  it('passes the selected id to onDelete', async () => {
    const props = setup({ selectedId: 'R-2' });
    await userEvent.click(screen.getByRole('button', { name: 'Delete R-2' }));
    expect(props.onDelete).toHaveBeenCalledWith('R-2');
  });

  it('renders no inspector when the selected id is absent from items', () => {
    setup({ selectedId: 'R-9' });
    expect(screen.queryByRole('complementary', { name: 'Details' })).not.toBeInTheDocument();
  });

  it('keeps the inspector open when a search excludes the selected row', async () => {
    setup({ selectedId: 'R-1' });
    await userEvent.type(screen.getByLabelText('Search rows'), 'beta');
    // R-1 is filtered out of the list but stays selected — filtering is not deselection.
    expect(screen.queryByText(/R-1 alpha/)).not.toBeInTheDocument();
    expect(screen.getByText('inspecting alpha')).toBeInTheDocument();
  });

  it('calls onAdd from the add button', async () => {
    const props = setup();
    await userEvent.click(screen.getByRole('button', { name: /Add row/ }));
    expect(props.onAdd).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && npm test -- ListDetail`
Expected: FAIL — `Failed to resolve import "./ListDetail"`.

- [ ] **Step 3: Write the implementation**

Create `app/src/components/ListDetail.tsx`:

```tsx
import React, { useState } from 'react';
import { ArrowLeft, ArrowUpDown, ListFilter, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Inspector } from '@/components/Inspector';
import { applyListView, type FilterGroup, type ListViewState, type SortOption } from '@/lib/listView';
import { cn } from '@/lib/utils';

export interface ListDetailProps<T> {
  items: T[];
  getId: (item: T) => string;
  getTitle: (item: T) => string;
  /** Everything the search box should match against, concatenated. */
  getSearchText: (item: T) => string;
  sorts: SortOption<T>[];
  filters?: FilterGroup<T>[];
  renderRow: (item: T) => React.ReactNode;
  renderInspector: (item: T) => React.ReactNode;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAdd: () => void;
  onDelete: (id: string) => void | Promise<void>;
  onDuplicate?: (id: string) => void;
  addLabel: string;
  searchLabel: string;
  emptyMessage: string;
}

export function ListDetail<T>({
  items, getId, getTitle, getSearchText, sorts, filters = [],
  renderRow, renderInspector, selectedId, onSelect,
  onAdd, onDelete, onDuplicate, addLabel, searchLabel, emptyMessage,
}: ListDetailProps<T>) {
  const [view, setView] = useState<ListViewState>({
    query: '', active: {}, sortId: sorts[0]?.id ?? '',
  });

  /* Not memoised on purpose. These lists hold tens of records, and the config
     object is rebuilt each render anyway, so a useMemo here would recompute
     every time while adding a stale-dependency footgun. */
  const visible = applyListView(items, view, { getSearchText, sorts, filters });
  const selected = items.find(item => getId(item) === selectedId) ?? null;
  const activeSort = sorts.find(s => s.id === view.sortId);

  function toggleFilter(groupId: string, value: string) {
    setView(v => {
      const current = v.active[groupId] ?? [];
      return {
        ...v,
        active: {
          ...v.active,
          [groupId]: current.includes(value)
            ? current.filter(x => x !== value)
            : [...current, value],
        },
      };
    });
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 gap-4">
      {/* Below lg the inspector replaces the list instead of sitting beside it. */}
      <div className={cn('flex min-w-0 flex-1 flex-col gap-3', selected && 'hidden lg:flex')}>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-48 flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              aria-label={searchLabel}
              placeholder={`${searchLabel}...`}
              className="h-9 pl-8"
              value={view.query}
              onChange={e => setView(v => ({ ...v, query: e.target.value }))}
            />
          </div>

          {filters.map(group => (
            <DropdownMenu key={group.id}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <ListFilter aria-hidden="true" />
                  {group.label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {group.options.map(o => (
                  <DropdownMenuCheckboxItem
                    key={o.value}
                    checked={(view.active[group.id] ?? []).includes(o.value)}
                    onCheckedChange={() => toggleFilter(group.id, o.value)}
                  >
                    {o.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ))}

          {sorts.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <ArrowUpDown aria-hidden="true" />
                  {activeSort?.label ?? 'Sort'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {sorts.map(s => (
                  <DropdownMenuItem key={s.id} onSelect={() => setView(v => ({ ...v, sortId: s.id }))}>
                    {s.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button size="sm" onClick={onAdd}>
            <Plus aria-hidden="true" />
            {addLabel}
          </Button>
        </div>

        {visible.length === 0 ? (
          <p className="rounded-[8px] border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {visible.map(item => {
              const id = getId(item);
              const active = id === selectedId;
              return (
                <li key={id}>
                  {/* One button per row. Never nest interactive elements in renderRow. */}
                  <button
                    type="button"
                    aria-current={active ? 'true' : undefined}
                    onClick={() => onSelect(id)}
                    className={cn(
                      'w-full rounded-[8px] border p-3 text-left transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                      active ? 'border-primary bg-accent' : 'border-border bg-card hover:bg-muted',
                    )}
                  >
                    {renderRow(item)}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <p className="text-xs text-muted-foreground">
          Showing {visible.length} of {items.length}
        </p>
      </div>

      {selected && (
        <aside aria-label="Details" className="flex min-w-0 flex-1 flex-col lg:max-w-96">
          <Button
            variant="ghost"
            size="sm"
            className="mb-2 self-start lg:hidden"
            onClick={() => onSelect(null)}
          >
            <ArrowLeft aria-hidden="true" />
            Back to list
          </Button>
          <Inspector
            id={getId(selected)}
            title={getTitle(selected)}
            onClose={() => onSelect(null)}
            onDelete={() => onDelete(getId(selected))}
            onDuplicate={onDuplicate ? () => onDuplicate(getId(selected)) : undefined}
          >
            {renderInspector(selected)}
          </Inspector>
        </aside>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app && npm test -- ListDetail`
Expected: PASS, 11 tests.

Note: jsdom loads no CSS, so the `hidden lg:flex` class on the list column does
not remove it from the DOM. Assertions about rows disappearing must be driven by
the filter actually excluding them, never by the responsive class.

- [ ] **Step 5: Commit**

```bash
git add app/src/components/ListDetail.tsx app/src/components/ListDetail.test.tsx
git commit -m "Add generic ListDetail component"
```

---

### Task 8: Widen the shell for list-detail stages

**Files:**
- Modify: `app/src/components/AppShell.tsx`

**Interfaces:**
- Consumes: `State.view`.
- Produces: nothing new; the three list-detail stages now render full-width.

**Why:** `<main>` currently wraps every stage in `mx-auto max-w-3xl`. A list plus
a 384 px inspector rail does not fit in 768 px.

- [ ] **Step 1: Make the change**

In `app/src/components/AppShell.tsx`, add the imports:

```tsx
import { cn } from '@/lib/utils';
import type { View } from '@/state/projectStore';
```

Add above the component:

```tsx
/* Stages built on ListDetail need the full width for their inspector rail;
   the prose-shaped stages stay in a comfortable reading column. */
const WIDE_VIEWS: View[] = ['requirements', 'tasks', 'testing'];
```

Replace the `<main>` block with:

```tsx
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto p-6">
          <div
            className={cn(
              'flex min-h-0 w-full flex-1 flex-col',
              !WIDE_VIEWS.includes(state.view) && 'mx-auto max-w-3xl',
            )}
          >
            {state.view === 'vision' && <VisionForm />}
            {state.view === 'requirements' && <RequirementsForm />}
            {state.view === 'architecture' && <ArchitectureForm />}
            {state.view === 'tasks' && <TasksForm />}
            {state.view === 'testing' && <TestingForm />}
            {state.view === 'traceability' && <TraceabilityView />}
            {state.view === 'export' && <ExportPanel />}
          </div>
        </main>
```

- [ ] **Step 2: Verify it compiles**

Run: `cd app && npx tsc -b --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/src/components/AppShell.tsx
git commit -m "Give list-detail stages the full content width"
```

---

### Task 9: Rebuild the Tasks stage

**Files:**
- Modify: `app/src/stages/TasksForm.tsx`
- Test: `app/src/stages/TasksForm.test.tsx`

**Interfaces:**
- Consumes: `ListDetail` (Task 7); `SELECT_ENTITY`, `DUPLICATE_TASK` (Tasks 2, 4).

Tasks is the proving ground for `ListDetail`: one flat collection, no tabs, no
delete-confirmation. Do it before Requirements.

- [ ] **Step 1: Write the failing test**

Replace `app/src/stages/TasksForm.test.tsx` entirely:

```tsx
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { TasksForm } from './TasksForm';

describe('TasksForm', () => {
  it('adds a task and lists it', async () => {
    renderWithProviders(<TasksForm />);
    await userEvent.click(screen.getByRole('button', { name: /add task/i }));
    expect(screen.getByText(/TASK-1/)).toBeInTheDocument();
  });

  it('opens the inspector when a task row is clicked', async () => {
    renderWithProviders(<TasksForm />);
    await userEvent.click(screen.getByRole('button', { name: /add task/i }));
    expect(screen.queryByRole('complementary', { name: 'Details' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /TASK-1/ }));
    expect(screen.getByRole('complementary', { name: 'Details' })).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
  });

  it('edits the title live from the inspector', async () => {
    renderWithProviders(<TasksForm />);
    await userEvent.click(screen.getByRole('button', { name: /add task/i }));
    await userEvent.click(screen.getByRole('button', { name: /TASK-1/ }));
    await userEvent.type(screen.getByLabelText('Title'), 'Ship it');
    expect(screen.getByLabelText('Title')).toHaveValue('Ship it');
  });

  it('duplicates a task from the inspector', async () => {
    renderWithProviders(<TasksForm />);
    await userEvent.click(screen.getByRole('button', { name: /add task/i }));
    await userEvent.click(screen.getByRole('button', { name: /TASK-1/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Duplicate TASK-1' }));
    expect(screen.getByText(/TASK-2/)).toBeInTheDocument();
  });

  it('closes the inspector when the selected task is deleted', async () => {
    renderWithProviders(<TasksForm />);
    await userEvent.click(screen.getByRole('button', { name: /add task/i }));
    await userEvent.click(screen.getByRole('button', { name: /TASK-1/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete TASK-1' }));
    expect(screen.queryByRole('complementary', { name: 'Details' })).not.toBeInTheDocument();
    expect(screen.queryByText(/TASK-1/)).not.toBeInTheDocument();
  });

  it('filters the list by search', async () => {
    renderWithProviders(<TasksForm />);
    await userEvent.click(screen.getByRole('button', { name: /add task/i }));
    await userEvent.click(screen.getByRole('button', { name: /add task/i }));
    await userEvent.type(screen.getByLabelText('Search tasks'), 'TASK-2');
    expect(screen.queryByText(/TASK-1/)).not.toBeInTheDocument();
    expect(screen.getByText(/TASK-2/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && npm test -- TasksForm`
Expected: FAIL — no `Details` complementary region; `Search tasks` not found.

- [ ] **Step 3: Write the implementation**

Replace `app/src/stages/TasksForm.tsx` entirely:

```tsx
import { useProject } from '../state/projectStore';
import { TextField, TextArea, SelectField, LinkSelect, RepeatableList } from '../components/inputs';
import { ListDetail } from '@/components/ListDetail';
import { Badge } from '@/components/ui/badge';
import { subheadingClass } from '@/components/typography';
import type { FilterGroup, SortOption } from '@/lib/listView';
import type { Task, TaskStatus } from '../model/types';

const STATUS_ORDER: TaskStatus[] = ['Todo', 'In progress', 'In review', 'Done'];
const STATUS_OPTIONS = STATUS_ORDER.map(s => ({ value: s, label: s }));

/* Module-level so the references stay stable across renders. */
const SORTS: SortOption<Task>[] = [
  { id: 'id', label: 'ID', compare: (a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }) },
  { id: 'title', label: 'Title A–Z', compare: (a, b) => a.title.localeCompare(b.title) },
  { id: 'status', label: 'Status', compare: (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) },
];

const FILTERS: FilterGroup<Task>[] = [
  {
    id: 'status', label: 'Status',
    options: STATUS_OPTIONS,
    matches: (t, v) => t.status === v,
  },
  {
    id: 'traced', label: 'Tracing',
    options: [{ value: 'traced', label: 'Traced' }, { value: 'untraced', label: 'Untraced' }],
    matches: (t, v) => (v === 'traced' ? t.tracesTo.length > 0 : t.tracesTo.length === 0),
  },
];

export function TasksForm() {
  const { state, dispatch } = useProject();
  const project = state.project;
  const { requirements, tasks } = project;

  const tracesToOptions = [
    ...requirements.stories.map(s => ({ value: s.id, label: s.id })),
    ...requirements.criteria.map(c => ({ value: c.id, label: c.id })),
  ];

  return (
    <ListDetail<Task>
      items={tasks}
      getId={t => t.id}
      getTitle={t => t.title}
      getSearchText={t => `${t.id} ${t.title} ${t.goal}`}
      sorts={SORTS}
      filters={FILTERS}
      selectedId={state.selectedId}
      onSelect={id => dispatch({ type: 'SELECT_ENTITY', view: 'tasks', id })}
      onAdd={() => dispatch({ type: 'ADD_TASK' })}
      onDelete={id => dispatch({ type: 'DELETE_TASK', id })}
      onDuplicate={id => dispatch({ type: 'DUPLICATE_TASK', id })}
      addLabel="Add task"
      searchLabel="Search tasks"
      emptyMessage="No tasks yet. Add one to get started."
      renderRow={task => (
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Badge>{task.id}</Badge>
            <span className="min-w-0 flex-1 truncate font-medium">{task.title || 'Untitled task'}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{task.status}</span>
          </div>
          {task.tracesTo.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tracesTo.map(ref => <Badge key={ref} variant="outline">{ref}</Badge>)}
            </div>
          )}
        </div>
      )}
      renderInspector={task => {
        const dependsOnOptions = tasks
          .filter(t => t.id !== task.id)
          .map(t => ({ value: t.id, label: t.title || t.id }));

        return (
          <div>
            <TextField
              label="Title"
              value={task.title}
              onChange={v => dispatch({ type: 'UPDATE_TASK', id: task.id, patch: { title: v } })}
            />
            <SelectField
              label="Status"
              value={task.status}
              options={STATUS_OPTIONS}
              onChange={v => dispatch({ type: 'UPDATE_TASK', id: task.id, patch: { status: v as TaskStatus } })}
            />
            <LinkSelect
              label="Traces to"
              value={task.tracesTo}
              options={tracesToOptions}
              multiple
              onChange={v => dispatch({ type: 'UPDATE_TASK', id: task.id, patch: { tracesTo: v as string[] } })}
            />
            <LinkSelect
              label="Depends on"
              value={task.dependsOn}
              options={dependsOnOptions}
              multiple
              onChange={v => dispatch({ type: 'UPDATE_TASK', id: task.id, patch: { dependsOn: v as string[] } })}
            />
            <TextArea
              label="Goal"
              value={task.goal}
              onChange={v => dispatch({ type: 'UPDATE_TASK', id: task.id, patch: { goal: v } })}
            />
            <TextArea
              label="Context for agent"
              value={task.contextForAgent}
              onChange={v => dispatch({ type: 'UPDATE_TASK', id: task.id, patch: { contextForAgent: v } })}
            />
            <TextArea
              label="Out of scope"
              value={task.outOfScope}
              onChange={v => dispatch({ type: 'UPDATE_TASK', id: task.id, patch: { outOfScope: v } })}
            />

            <h4 className={subheadingClass}>Acceptance</h4>
            <RepeatableList<string>
              items={task.acceptance}
              addLabel="Add acceptance"
              onAdd={() => dispatch({
                type: 'UPDATE_TASK', id: task.id, patch: { acceptance: [...task.acceptance, ''] },
              })}
              onRemove={i => dispatch({
                type: 'UPDATE_TASK', id: task.id,
                patch: { acceptance: task.acceptance.filter((_, idx) => idx !== i) },
              })}
              renderItem={(item, i) => (
                <TextField
                  label="Acceptance"
                  value={item}
                  onChange={v => dispatch({
                    type: 'UPDATE_TASK', id: task.id,
                    patch: { acceptance: task.acceptance.map((a, idx) => idx === i ? v : a) },
                  })}
                />
              )}
            />
          </div>
        );
      }}
    />
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app && npm test -- TasksForm`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add app/src/stages/TasksForm.tsx app/src/stages/TasksForm.test.tsx
git commit -m "Rebuild the Tasks stage on ListDetail"
```

---

### Task 10: Rebuild the Testing stage

**Files:**
- Modify: `app/src/stages/TestingForm.tsx`
- Test: `app/src/stages/TestingForm.test.tsx`

**Interfaces:**
- Consumes: `ListDetail` (Task 7); `DUPLICATE_TEST` (Task 4).

Testing keeps a small prose card for entry/exit criteria above the list.

- [ ] **Step 1: Write the failing test**

Replace `app/src/stages/TestingForm.test.tsx` entirely:

```tsx
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { TestingForm } from './TestingForm';

describe('TestingForm', () => {
  it('keeps the entry and exit criteria fields', () => {
    renderWithProviders(<TestingForm />);
    expect(screen.getByLabelText('Entry criteria')).toBeInTheDocument();
    expect(screen.getByLabelText('Exit criteria')).toBeInTheDocument();
  });

  it('adds a test and lists it', async () => {
    renderWithProviders(<TestingForm />);
    await userEvent.click(screen.getByRole('button', { name: /add test/i }));
    expect(screen.getByText(/TEST-1/)).toBeInTheDocument();
  });

  it('opens the inspector for a test row', async () => {
    renderWithProviders(<TestingForm />);
    await userEvent.click(screen.getByRole('button', { name: /add test/i }));
    await userEvent.click(screen.getByRole('button', { name: /TEST-1/ }));
    expect(screen.getByRole('complementary', { name: 'Details' })).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  it('duplicates a test from the inspector', async () => {
    renderWithProviders(<TestingForm />);
    await userEvent.click(screen.getByRole('button', { name: /add test/i }));
    await userEvent.click(screen.getByRole('button', { name: /TEST-1/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Duplicate TEST-1' }));
    expect(screen.getByText(/TEST-2/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && npm test -- TestingForm`
Expected: FAIL — no `Details` complementary region.

- [ ] **Step 3: Write the implementation**

Replace `app/src/stages/TestingForm.tsx` entirely:

```tsx
import { useProject } from '../state/projectStore';
import { TextField, TextArea, SelectField, LinkSelect } from '../components/inputs';
import { SectionCard } from '@/components/SectionCard';
import { ListDetail } from '@/components/ListDetail';
import { Badge } from '@/components/ui/badge';
import type { FilterGroup, SortOption } from '@/lib/listView';
import type { Test, TestLevel, TestStatus } from '../model/types';

const LEVELS: TestLevel[] = ['Unit', 'Integration', 'E2E', 'Non-functional'];
const STATUSES: TestStatus[] = ['Not run', 'Fail', 'Pass'];
const LEVEL_OPTIONS = LEVELS.map(l => ({ value: l, label: l }));
const STATUS_OPTIONS = STATUSES.map(s => ({ value: s, label: s }));

const SORTS: SortOption<Test>[] = [
  { id: 'id', label: 'ID', compare: (a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }) },
  { id: 'description', label: 'Description A–Z', compare: (a, b) => a.description.localeCompare(b.description) },
  { id: 'status', label: 'Status', compare: (a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) },
];

const FILTERS: FilterGroup<Test>[] = [
  { id: 'level', label: 'Level', options: LEVEL_OPTIONS, matches: (t, v) => t.level === v },
  { id: 'status', label: 'Status', options: STATUS_OPTIONS, matches: (t, v) => t.status === v },
];

export function TestingForm() {
  const { state, dispatch } = useProject();
  const project = state.project;
  const { requirements, testing } = project;

  function replaceTesting(patch: Partial<typeof project.testing>) {
    dispatch({ type: 'REPLACE_PROJECT', project: { ...project, testing: { ...project.testing, ...patch } } });
  }

  const verifiesOptions = [
    { value: '', label: '—' },
    ...requirements.criteria.map(c => ({ value: c.id, label: c.id })),
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <SectionCard title="Entry / exit criteria" defaultOpen={false}>
        <TextArea
          label="Entry criteria"
          value={testing.entryCriteria}
          onChange={v => replaceTesting({ entryCriteria: v })}
        />
        <TextArea
          label="Exit criteria"
          value={testing.exitCriteria}
          onChange={v => replaceTesting({ exitCriteria: v })}
        />
      </SectionCard>

      <ListDetail<Test>
        items={testing.tests}
        getId={t => t.id}
        getTitle={t => t.description}
        getSearchText={t => `${t.id} ${t.description} ${t.verifies}`}
        sorts={SORTS}
        filters={FILTERS}
        selectedId={state.selectedId}
        onSelect={id => dispatch({ type: 'SELECT_ENTITY', view: 'testing', id })}
        onAdd={() => dispatch({ type: 'ADD_TEST' })}
        onDelete={id => dispatch({ type: 'DELETE_TEST', id })}
        onDuplicate={id => dispatch({ type: 'DUPLICATE_TEST', id })}
        addLabel="Add test"
        searchLabel="Search tests"
        emptyMessage="No tests yet. Add one to get started."
        renderRow={test => (
          <div className="flex min-w-0 items-center gap-2">
            <Badge>{test.id}</Badge>
            <span className="min-w-0 flex-1 truncate">{test.description || 'Untitled test'}</span>
            {test.verifies && <Badge variant="outline">{test.verifies}</Badge>}
            <span className="shrink-0 text-xs text-muted-foreground">{test.level}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{test.status}</span>
          </div>
        )}
        renderInspector={test => (
          <div>
            <TextField
              label="Description"
              value={test.description}
              onChange={v => dispatch({ type: 'UPDATE_TEST', id: test.id, patch: { description: v } })}
            />
            <LinkSelect
              label="Verifies"
              value={test.verifies}
              options={verifiesOptions}
              onChange={v => dispatch({ type: 'UPDATE_TEST', id: test.id, patch: { verifies: v as string } })}
            />
            <SelectField
              label="Level"
              value={test.level}
              options={LEVEL_OPTIONS}
              onChange={v => dispatch({ type: 'UPDATE_TEST', id: test.id, patch: { level: v as TestLevel } })}
            />
            <SelectField
              label="Status"
              value={test.status}
              options={STATUS_OPTIONS}
              onChange={v => dispatch({ type: 'UPDATE_TEST', id: test.id, patch: { status: v as TestStatus } })}
            />
          </div>
        )}
      />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app && npm test -- TestingForm`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add app/src/stages/TestingForm.tsx app/src/stages/TestingForm.test.tsx
git commit -m "Rebuild the Testing stage on ListDetail"
```

---

### Task 11: StageTabs

**Files:**
- Create: `app/src/components/StageTabs.tsx`
- Test: `app/src/components/StageTabs.test.tsx`

**Interfaces:**
- Consumes: `Tabs`, `TabsList`, `TabsTrigger` (Task 5).
- Produces: `StageTabs({ tabs, value, onValueChange, children })` where
  `tabs: { value: string; label: string; count?: number }[]`.

**Note:** a trigger's accessible name becomes `"<label> <count>"` — e.g.
`"Stories 12"`. Tests must match with a leading anchor such as `/^Stories/`.

- [ ] **Step 1: Write the failing test**

Create `app/src/components/StageTabs.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StageTabs } from './StageTabs';

const tabs = [
  { value: 'goals', label: 'Goals', count: 3 },
  { value: 'stories', label: 'Stories', count: 12 },
];

describe('StageTabs', () => {
  it('renders a tab per entry with its count', () => {
    render(<StageTabs tabs={tabs} value="goals" onValueChange={() => {}}><p>body</p></StageTabs>);
    expect(screen.getByRole('tab', { name: /^Goals/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^Stories/ })).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('marks the active tab as selected', () => {
    render(<StageTabs tabs={tabs} value="stories" onValueChange={() => {}}><p>body</p></StageTabs>);
    expect(screen.getByRole('tab', { name: /^Stories/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('reports the chosen tab value', async () => {
    const onValueChange = vi.fn();
    render(<StageTabs tabs={tabs} value="goals" onValueChange={onValueChange}><p>body</p></StageTabs>);
    await userEvent.click(screen.getByRole('tab', { name: /^Stories/ }));
    expect(onValueChange).toHaveBeenCalledWith('stories');
  });

  it('renders its children', () => {
    render(<StageTabs tabs={tabs} value="goals" onValueChange={() => {}}><p>body</p></StageTabs>);
    expect(screen.getByText('body')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && npm test -- StageTabs`
Expected: FAIL — `Failed to resolve import "./StageTabs"`.

- [ ] **Step 3: Write the implementation**

Create `app/src/components/StageTabs.tsx`:

```tsx
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface StageTab { value: string; label: string; count?: number; }

export interface StageTabsProps {
  tabs: StageTab[];
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

export function StageTabs({ tabs, value, onValueChange, children }: StageTabsProps) {
  return (
    <Tabs value={value} onValueChange={onValueChange} className="flex min-h-0 flex-1 flex-col">
      <TabsList>
        {tabs.map(tab => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
            {tab.count !== undefined && (
              <span className="rounded-full bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                {tab.count}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app && npm test -- StageTabs`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add app/src/components/StageTabs.tsx app/src/components/StageTabs.test.tsx
git commit -m "Add StageTabs tab strip"
```

---

### Task 12: Rebuild the Requirements stage

**Files:**
- Modify: `app/src/stages/RequirementsForm.tsx`
- Test: `app/src/stages/RequirementsForm.test.tsx`

**Interfaces:**
- Consumes: `ListDetail` (7), `StageTabs` (11), `UPDATE_GOAL`/`UPDATE_NFR` (3), `DUPLICATE_STORY` (4).

Seven tabs. Goals, Stories and Non-functional are `ListDetail` instances.
Assumptions, Constraints and Non-goals are plain inline lists — they are bare
`string[]` with no ids, so they get no sort, no search and no inspector, and keep
their existing index-addressed updates. Signoff is a two-field card.

- [ ] **Step 1: Write the failing test**

Replace `app/src/stages/RequirementsForm.test.tsx` entirely:

```tsx
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { RequirementsForm } from './RequirementsForm';

async function openTab(name: RegExp) {
  await userEvent.click(screen.getByRole('tab', { name }));
}

describe('RequirementsForm', () => {
  it('opens on the Goals tab and adds a goal', async () => {
    renderWithProviders(<RequirementsForm />);
    await userEvent.click(screen.getByRole('button', { name: /add goal/i }));
    expect(screen.getByText(/GOAL-1/)).toBeInTheDocument();
  });

  it('edits a goal from its inspector', async () => {
    renderWithProviders(<RequirementsForm />);
    await userEvent.click(screen.getByRole('button', { name: /add goal/i }));
    await userEvent.click(screen.getByRole('button', { name: /GOAL-1/ }));
    await userEvent.type(screen.getByLabelText('Text'), 'Ship fast');
    expect(screen.getByLabelText('Text')).toHaveValue('Ship fast');
  });

  it('adds a story with an auto id shown', async () => {
    renderWithProviders(<RequirementsForm />);
    await openTab(/^Stories/);
    await userEvent.click(screen.getByRole('button', { name: /add story/i }));
    expect(screen.getByText(/US-1/)).toBeInTheDocument();
  });

  it('adds a criterion from inside the story inspector', async () => {
    renderWithProviders(<RequirementsForm />);
    await openTab(/^Stories/);
    await userEvent.click(screen.getByRole('button', { name: /add story/i }));
    await userEvent.click(screen.getByRole('button', { name: /US-1/ }));
    await userEvent.click(screen.getByRole('button', { name: /add criterion/i }));
    expect(screen.getByText(/AC-1\.1/)).toBeInTheDocument();
  });

  it('keeps the story when the delete dialog is cancelled', async () => {
    renderWithProviders(<RequirementsForm />);
    await openTab(/^Stories/);
    await userEvent.click(screen.getByRole('button', { name: /add story/i }));
    await userEvent.click(screen.getByRole('button', { name: /US-1/ }));
    await userEvent.click(screen.getByRole('button', { name: /add criterion/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete US-1' }));

    expect(await screen.findByText('Delete US-1?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

    // US-1 is still selected here, so its id appears on the row badge, the
    // inspector badge and the inspector heading. Anchor to the row button.
    expect(screen.getByRole('button', { name: /^US-1/ })).toBeInTheDocument();
  });

  it('removes the story when the delete dialog is confirmed', async () => {
    renderWithProviders(<RequirementsForm />);
    await openTab(/^Stories/);
    await userEvent.click(screen.getByRole('button', { name: /add story/i }));
    await userEvent.click(screen.getByRole('button', { name: /US-1/ }));
    await userEvent.click(screen.getByRole('button', { name: /add criterion/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete US-1' }));

    expect(await screen.findByText('Delete US-1?')).toBeInTheDocument();
    // The inspector's own button is "Delete US-1", so /^delete$/i is unambiguous here.
    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }));

    expect(screen.queryByText(/US-1/)).not.toBeInTheDocument();
  });

  it('deletes a story with no dependents without prompting', async () => {
    renderWithProviders(<RequirementsForm />);
    await openTab(/^Stories/);
    await userEvent.click(screen.getByRole('button', { name: /add story/i }));
    await userEvent.click(screen.getByRole('button', { name: /US-1/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete US-1' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.queryByText(/US-1/)).not.toBeInTheDocument();
  });

  it('duplicates a story together with its criteria', async () => {
    renderWithProviders(<RequirementsForm />);
    await openTab(/^Stories/);
    await userEvent.click(screen.getByRole('button', { name: /add story/i }));
    await userEvent.click(screen.getByRole('button', { name: /US-1/ }));
    await userEvent.click(screen.getByRole('button', { name: /add criterion/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Duplicate US-1' }));

    expect(screen.getByText(/US-2/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /US-2/ }));
    expect(screen.getByText(/AC-2\.1/)).toBeInTheDocument();
  });

  it('edits assumptions inline without an inspector', async () => {
    renderWithProviders(<RequirementsForm />);
    await openTab(/^Assumptions/);
    await userEvent.click(screen.getByRole('button', { name: /add assumption/i }));
    await userEvent.type(screen.getByLabelText('Assumption'), 'Users have email');
    expect(screen.getByLabelText('Assumption')).toHaveValue('Users have email');
    expect(screen.queryByRole('complementary', { name: 'Details' })).not.toBeInTheDocument();
  });

  it('keeps the signoff fields', async () => {
    renderWithProviders(<RequirementsForm />);
    await openTab(/^Signoff/);
    expect(screen.getByLabelText('Signed off by')).toBeInTheDocument();
    expect(screen.getByLabelText('Signoff date')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && npm test -- RequirementsForm`
Expected: FAIL — no `tab` roles exist.

- [ ] **Step 3: Write the implementation**

Replace `app/src/stages/RequirementsForm.tsx` entirely:

```tsx
import { useState } from 'react';
import { useProject } from '../state/projectStore';
import { useConfirm } from '@/state/confirm';
import { TextField, LinkSelect, RepeatableList, SelectField } from '../components/inputs';
import { ListDetail } from '@/components/ListDetail';
import { StageTabs } from '@/components/StageTabs';
import { TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { subheadingClass } from '@/components/typography';
import type { FilterGroup, SortOption } from '@/lib/listView';
import type { Goal, UserStory, Criterion, Nfr, Priority } from '../model/types';

const PRIORITY_ORDER: Priority[] = ['Must', 'Should', 'Could'];
const PRIORITY_OPTIONS = PRIORITY_ORDER.map(p => ({ value: p, label: p }));

const byId = <T extends { id: string }>(a: T, b: T) =>
  a.id.localeCompare(b.id, undefined, { numeric: true });

const GOAL_SORTS: SortOption<Goal>[] = [
  { id: 'id', label: 'ID', compare: byId },
  { id: 'text', label: 'Text A–Z', compare: (a, b) => a.text.localeCompare(b.text) },
];

const STORY_SORTS: SortOption<UserStory>[] = [
  { id: 'id', label: 'ID', compare: byId },
  { id: 'want', label: 'Want A–Z', compare: (a, b) => a.want.localeCompare(b.want) },
  { id: 'priority', label: 'Priority',
    compare: (a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority) },
];

const STORY_FILTERS: FilterGroup<UserStory>[] = [
  { id: 'priority', label: 'Priority', options: PRIORITY_OPTIONS, matches: (s, v) => s.priority === v },
  { id: 'goal', label: 'Goal',
    options: [{ value: 'linked', label: 'Has goal' }, { value: 'unlinked', label: 'No goal' }],
    matches: (s, v) => (v === 'linked' ? s.servesGoalId !== null : s.servesGoalId === null) },
];

const NFR_SORTS: SortOption<Nfr>[] = [
  { id: 'id', label: 'ID', compare: byId },
  { id: 'name', label: 'Name A–Z', compare: (a, b) => a.name.localeCompare(b.name) },
];

/** Assumptions, constraints and non-goals are bare string[] with no ids, so they
    get an inline list rather than a ListDetail — sorting them would break the
    index addressing they depend on. */
function StringList({ label, addLabel, items, onChange }: {
  label: string; addLabel: string; items: string[]; onChange: (next: string[]) => void;
}) {
  return (
    <RepeatableList<string>
      items={items}
      addLabel={addLabel}
      onAdd={() => onChange([...items, ''])}
      onRemove={i => onChange(items.filter((_, idx) => idx !== i))}
      renderItem={(item, i) => (
        <TextField
          label={label}
          value={item}
          onChange={v => onChange(items.map((x, idx) => (idx === i ? v : x)))}
        />
      )}
    />
  );
}

export function RequirementsForm() {
  const { state, dispatch } = useProject();
  const confirm = useConfirm();
  const project = state.project;
  const { requirements, tasks, testing } = project;
  const [tab, setTab] = useState('goals');

  function replaceRequirements(patch: Partial<typeof requirements>) {
    dispatch({ type: 'REPLACE_PROJECT', project: { ...project, requirements: { ...requirements, ...patch } } });
  }

  const goalOptions = project.goals.map(g => ({ value: g.id, label: g.text || g.id }));
  const select = (id: string | null) => dispatch({ type: 'SELECT_ENTITY', view: 'requirements', id });

  async function deleteStory(id: string) {
    const dependentCriteria = requirements.criteria.filter(c => c.storyId === id);
    const dependentTasks = tasks.filter(t => t.tracesTo.includes(id));
    if (dependentCriteria.length > 0 || dependentTasks.length > 0) {
      const ok = await confirm({
        title: `Delete ${id}?`,
        description: `This also removes ${dependentCriteria.length} criteria and unlinks ${dependentTasks.length} tasks.`,
        confirmLabel: 'Delete',
      });
      if (!ok) return;
    }
    dispatch({ type: 'DELETE_STORY', id });
  }

  async function deleteCriterion(id: string) {
    const dependentTasks = tasks.filter(t => t.tracesTo.includes(id));
    const dependentTests = testing.tests.filter(t => t.verifies === id);
    if (dependentTasks.length > 0 || dependentTests.length > 0) {
      const ok = await confirm({
        title: `Delete ${id}?`,
        description: `This unlinks ${dependentTasks.length} tasks and ${dependentTests.length} tests.`,
        confirmLabel: 'Delete',
      });
      if (!ok) return;
    }
    dispatch({ type: 'DELETE_CRITERION', id });
  }

  const tabs = [
    { value: 'goals', label: 'Goals', count: project.goals.length },
    { value: 'stories', label: 'Stories', count: requirements.stories.length },
    { value: 'nfrs', label: 'Non-functional', count: requirements.nfrs.length },
    { value: 'assumptions', label: 'Assumptions', count: requirements.assumptions.length },
    { value: 'constraints', label: 'Constraints', count: requirements.constraints.length },
    { value: 'nonGoals', label: 'Non-goals', count: requirements.nonGoals.length },
    { value: 'signoff', label: 'Signoff' },
  ];

  return (
    <StageTabs tabs={tabs} value={tab} onValueChange={setTab}>
      <TabsContent value="goals">
        <ListDetail<Goal>
          items={project.goals}
          getId={g => g.id}
          getTitle={g => g.text}
          getSearchText={g => `${g.id} ${g.text} ${g.metric}`}
          sorts={GOAL_SORTS}
          selectedId={state.selectedId}
          onSelect={select}
          onAdd={() => dispatch({ type: 'ADD_GOAL' })}
          onDelete={id => dispatch({ type: 'DELETE_GOAL', id })}
          addLabel="Add goal"
          searchLabel="Search goals"
          emptyMessage="No goals yet. Add one to get started."
          renderRow={goal => (
            <div className="flex min-w-0 items-center gap-2">
              <Badge>{goal.id}</Badge>
              <span className="min-w-0 flex-1 truncate">{goal.text || 'Untitled goal'}</span>
              {goal.metric && <span className="shrink-0 text-xs text-muted-foreground">{goal.metric}</span>}
            </div>
          )}
          renderInspector={goal => (
            <div>
              <TextField
                label="Text"
                value={goal.text}
                onChange={v => dispatch({ type: 'UPDATE_GOAL', id: goal.id, patch: { text: v } })}
              />
              <TextField
                label="Metric"
                value={goal.metric}
                onChange={v => dispatch({ type: 'UPDATE_GOAL', id: goal.id, patch: { metric: v } })}
              />
            </div>
          )}
        />
      </TabsContent>

      <TabsContent value="stories">
        <ListDetail<UserStory>
          items={requirements.stories}
          getId={s => s.id}
          getTitle={s => s.want}
          getSearchText={s => `${s.id} ${s.role} ${s.want} ${s.benefit}`}
          sorts={STORY_SORTS}
          filters={STORY_FILTERS}
          selectedId={state.selectedId}
          onSelect={select}
          onAdd={() => dispatch({ type: 'ADD_STORY' })}
          onDelete={deleteStory}
          onDuplicate={id => dispatch({ type: 'DUPLICATE_STORY', id })}
          addLabel="Add story"
          searchLabel="Search stories"
          emptyMessage="No stories yet. Add one to get started."
          renderRow={story => {
            const count = requirements.criteria.filter(c => c.storyId === story.id).length;
            return (
              <div className="flex min-w-0 flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <Badge>{story.id}</Badge>
                  <span className="min-w-0 flex-1 truncate font-medium">{story.want || 'Untitled story'}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{story.priority}</span>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {story.servesGoalId && <Badge variant="outline">{story.servesGoalId}</Badge>}
                  <span className="text-xs text-muted-foreground">{count} criteria</span>
                </div>
              </div>
            );
          }}
          renderInspector={story => (
            <div>
              <TextField
                label="Role"
                value={story.role}
                onChange={v => dispatch({ type: 'UPDATE_STORY', id: story.id, patch: { role: v } })}
              />
              <TextField
                label="Want"
                value={story.want}
                onChange={v => dispatch({ type: 'UPDATE_STORY', id: story.id, patch: { want: v } })}
              />
              <TextField
                label="Benefit"
                value={story.benefit}
                onChange={v => dispatch({ type: 'UPDATE_STORY', id: story.id, patch: { benefit: v } })}
              />
              <SelectField
                label="Priority"
                value={story.priority}
                options={PRIORITY_OPTIONS}
                onChange={v => dispatch({ type: 'UPDATE_STORY', id: story.id, patch: { priority: v as Priority } })}
              />
              <LinkSelect
                label="Serves goal"
                value={story.servesGoalId ?? ''}
                options={goalOptions}
                onChange={v => dispatch({
                  type: 'UPDATE_STORY', id: story.id, patch: { servesGoalId: (v as string) || null },
                })}
              />

              <h4 className={subheadingClass}>Criteria</h4>
              <RepeatableList<Criterion>
                items={requirements.criteria.filter(c => c.storyId === story.id)}
                addLabel="Add criterion"
                onAdd={() => dispatch({ type: 'ADD_CRITERION', storyId: story.id })}
                onRemove={i => {
                  const storyCriteria = requirements.criteria.filter(c => c.storyId === story.id);
                  void deleteCriterion(storyCriteria[i].id);
                }}
                renderItem={criterion => (
                  <div>
                    <Badge className="mb-2">{criterion.id}</Badge>
                    <TextField
                      label="Text"
                      value={criterion.text}
                      onChange={v => dispatch({ type: 'UPDATE_CRITERION', id: criterion.id, patch: { text: v } })}
                    />
                  </div>
                )}
              />
            </div>
          )}
        />
      </TabsContent>

      <TabsContent value="nfrs">
        <ListDetail<Nfr>
          items={requirements.nfrs}
          getId={n => n.id}
          getTitle={n => n.name}
          getSearchText={n => `${n.id} ${n.name} ${n.target}`}
          sorts={NFR_SORTS}
          selectedId={state.selectedId}
          onSelect={select}
          onAdd={() => dispatch({ type: 'ADD_NFR' })}
          onDelete={id => dispatch({ type: 'DELETE_NFR', id })}
          addLabel="Add NFR"
          searchLabel="Search NFRs"
          emptyMessage="No non-functional requirements yet."
          renderRow={nfr => (
            <div className="flex min-w-0 items-center gap-2">
              <Badge>{nfr.id}</Badge>
              <span className="min-w-0 flex-1 truncate">{nfr.name || 'Untitled NFR'}</span>
              {nfr.target && <span className="shrink-0 text-xs text-muted-foreground">{nfr.target}</span>}
            </div>
          )}
          renderInspector={nfr => (
            <div>
              <TextField
                label="Name"
                value={nfr.name}
                onChange={v => dispatch({ type: 'UPDATE_NFR', id: nfr.id, patch: { name: v } })}
              />
              <TextField
                label="Target"
                value={nfr.target}
                onChange={v => dispatch({ type: 'UPDATE_NFR', id: nfr.id, patch: { target: v } })}
              />
            </div>
          )}
        />
      </TabsContent>

      <TabsContent value="assumptions">
        <StringList
          label="Assumption"
          addLabel="Add assumption"
          items={requirements.assumptions}
          onChange={next => replaceRequirements({ assumptions: next })}
        />
      </TabsContent>

      <TabsContent value="constraints">
        <StringList
          label="Constraint"
          addLabel="Add constraint"
          items={requirements.constraints}
          onChange={next => replaceRequirements({ constraints: next })}
        />
      </TabsContent>

      <TabsContent value="nonGoals">
        <StringList
          label="Non-goal"
          addLabel="Add non-goal"
          items={requirements.nonGoals}
          onChange={next => replaceRequirements({ nonGoals: next })}
        />
      </TabsContent>

      <TabsContent value="signoff">
        <Card className="max-w-md p-4">
          <TextField
            label="Signed off by"
            value={requirements.signoff?.by ?? ''}
            onChange={v => replaceRequirements({ signoff: { by: v, date: requirements.signoff?.date ?? '' } })}
          />
          <TextField
            label="Signoff date"
            value={requirements.signoff?.date ?? ''}
            onChange={v => replaceRequirements({ signoff: { by: requirements.signoff?.by ?? '', date: v } })}
          />
        </Card>
      </TabsContent>
    </StageTabs>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app && npm test -- RequirementsForm`
Expected: PASS, 10 tests.

- [ ] **Step 5: Commit**

```bash
git add app/src/stages/RequirementsForm.tsx app/src/stages/RequirementsForm.test.tsx
git commit -m "Rebuild the Requirements stage on tabs and ListDetail"
```

---

### Task 13: TopBar breadcrumb and palette trigger

**Files:**
- Modify: `app/src/components/TopBar.tsx`
- Test: `app/src/components/TopBar.test.tsx` (create)

**Interfaces:**
- Produces: `TopBar` gains a required `onOpenPalette: () => void` prop.

**Constraint:** the export trigger keeps its `Export actions` name, so the
sidebar's `Export` stays unambiguous.

- [ ] **Step 1: Write the failing test**

Create `app/src/components/TopBar.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { TopBar } from './TopBar';

describe('TopBar', () => {
  it('shows the project name and the current stage as a breadcrumb', () => {
    renderWithProviders(<TopBar saveState="saved" onOpenPalette={() => {}} />);
    expect(screen.getByLabelText('Project name')).toHaveValue('Untitled Project');
    expect(screen.getByText('Vision')).toBeInTheDocument();
  });

  it('opens the palette from the search trigger', async () => {
    const onOpenPalette = vi.fn();
    renderWithProviders(<TopBar saveState="saved" onOpenPalette={onOpenPalette} />);
    await userEvent.click(screen.getByRole('button', { name: /search anything/i }));
    expect(onOpenPalette).toHaveBeenCalled();
  });

  it('keeps the export trigger named so it cannot collide with the sidebar', () => {
    renderWithProviders(<TopBar saveState="saved" onOpenPalette={() => {}} />);
    expect(screen.getByRole('button', { name: 'Export actions' })).toBeInTheDocument();
  });
});
```

(`SaveState` is `'saving' | 'saved' | 'error'` — `'saved'` is a valid literal.)

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && npm test -- TopBar`
Expected: FAIL — `onOpenPalette` is not a known prop.

- [ ] **Step 3: Write the implementation**

In `app/src/components/TopBar.tsx`, add to the imports:

```tsx
import { Search } from 'lucide-react';
import { useProject } from '@/state/projectStore';
import type { View } from '@/state/projectStore';
```

(`useProject` is already imported — do not duplicate it.)

Add above the component:

```tsx
const VIEW_LABELS: Record<View, string> = {
  vision: 'Vision', requirements: 'Requirements', architecture: 'Architecture',
  tasks: 'Tasks', testing: 'Testing', traceability: 'Traceability', export: 'Export',
};
```

Change the signature:

```tsx
export function TopBar({ saveState, onOpenPalette }: { saveState: SaveState; onOpenPalette: () => void }) {
```

Then, inside the `<header>`, immediately after the existing `<Input aria-label="Project name" … />`,
insert the breadcrumb separator and stage label:

```tsx
      <span aria-hidden="true" className="text-muted-foreground">/</span>
      <span className="shrink-0 text-sm font-medium">{VIEW_LABELS[state.view]}</span>
```

And replace the existing `<div className="flex-1" />` spacer with the palette trigger:

```tsx
      <div className="flex flex-1 justify-center px-4">
        <button
          type="button"
          onClick={onOpenPalette}
          className="flex w-full max-w-sm items-center gap-2 rounded-[6px] border border-input bg-muted px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent"
        >
          <Search aria-hidden="true" className="size-4 shrink-0" />
          <span className="flex-1 text-left">Search anything...</span>
          <kbd aria-hidden="true" className="rounded-[4px] border border-border px-1.5 font-mono text-[10px]">
            Ctrl K
          </kbd>
        </button>
      </div>
```

- [ ] **Step 4: Update the caller so the build still compiles**

In `app/src/components/AppShell.tsx`, pass a temporary no-op — Task 15 replaces it:

```tsx
        <TopBar saveState={saveState} onOpenPalette={() => {}} />
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd app && npm test -- TopBar`
Expected: PASS, 3 tests.

- [ ] **Step 6: Commit**

```bash
git add app/src/components/TopBar.tsx app/src/components/TopBar.test.tsx app/src/components/AppShell.tsx
git commit -m "Add breadcrumb and command palette trigger to the top bar"
```

---

### Task 14: Command palette

**Files:**
- Create: `app/src/components/CommandPalette.tsx`
- Test: `app/src/components/CommandPalette.test.tsx`

**Interfaces:**
- Consumes: `entityIndex(project)` → `Map<string, { id; view; label }>`; `useTheme()` → `{ theme, setTheme, resolved }`; `SELECT_ENTITY` (Task 2); vendored `Command*` primitives.
- Produces: `CommandPalette({ open, onOpenChange })`.

`useTheme()` has **no** toggle function — flip with
`setTheme(resolved === 'dark' ? 'light' : 'dark')`.

- [ ] **Step 1: Write the failing test**

Create `app/src/components/CommandPalette.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { CommandPalette } from './CommandPalette';

describe('CommandPalette', () => {
  it('renders nothing while closed', () => {
    renderWithProviders(<CommandPalette open={false} onOpenChange={() => {}} />);
    expect(screen.queryByPlaceholderText(/search anything/i)).not.toBeInTheDocument();
  });

  it('lists every stage when open', async () => {
    renderWithProviders(<CommandPalette open onOpenChange={() => {}} />);
    expect(await screen.findByPlaceholderText(/search anything/i)).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Requirements/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Traceability/ })).toBeInTheDocument();
  });

  it('narrows the options as you type', async () => {
    renderWithProviders(<CommandPalette open onOpenChange={() => {}} />);
    await userEvent.type(await screen.findByPlaceholderText(/search anything/i), 'trace');
    expect(screen.getByRole('option', { name: /Traceability/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /^Vision/ })).not.toBeInTheDocument();
  });

  it('closes after a command is chosen', async () => {
    const onOpenChange = vi.fn();
    renderWithProviders(<CommandPalette open onOpenChange={onOpenChange} />);
    await userEvent.click(await screen.findByRole('option', { name: /Requirements/ }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('offers a theme toggle', async () => {
    renderWithProviders(<CommandPalette open onOpenChange={() => {}} />);
    expect(await screen.findByRole('option', { name: /toggle theme/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && npm test -- CommandPalette`
Expected: FAIL — `Failed to resolve import "./CommandPalette"`.

- [ ] **Step 3: Write the implementation**

Create `app/src/components/CommandPalette.tsx`:

```tsx
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useProject, type View } from '@/state/projectStore';
import { useTheme } from '@/state/theme';
import { entityIndex } from '@/model/registry';
import {
  Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,
} from '@/components/ui/command';

const STAGES: { view: View; label: string }[] = [
  { view: 'vision', label: 'Vision' },
  { view: 'requirements', label: 'Requirements' },
  { view: 'architecture', label: 'Architecture' },
  { view: 'tasks', label: 'Tasks' },
  { view: 'testing', label: 'Testing' },
  { view: 'traceability', label: 'Traceability' },
  { view: 'export', label: 'Export' },
];

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const { state, dispatch } = useProject();
  const { resolved, setTheme } = useTheme();
  const entities = [...entityIndex(state.project).values()];

  function run(action: () => void) {
    action();
    onOpenChange(false);
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <DialogPrimitive.Content className="fixed left-1/2 top-24 z-50 w-[92vw] max-w-lg -translate-x-1/2 overflow-hidden rounded-[8px] border border-border bg-card shadow-lg">
          <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Search stages, entities and actions.
          </DialogPrimitive.Description>

          <Command>
            <CommandInput placeholder="Search anything..." />
            <CommandList>
              <CommandEmpty>No matches.</CommandEmpty>

              <CommandGroup heading="Go to stage">
                {STAGES.map(stage => (
                  <CommandItem
                    key={stage.view}
                    value={`stage ${stage.label}`}
                    onSelect={() => run(() => dispatch({ type: 'SET_VIEW', view: stage.view }))}
                  >
                    {stage.label}
                  </CommandItem>
                ))}
              </CommandGroup>

              {entities.length > 0 && (
                <CommandGroup heading="Jump to">
                  {entities.map(entity => (
                    <CommandItem
                      key={entity.id}
                      value={`${entity.id} ${entity.label}`}
                      onSelect={() => run(() =>
                        dispatch({ type: 'SELECT_ENTITY', view: entity.view, id: entity.id }))}
                    >
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">{entity.id}</span>
                      <span className="min-w-0 truncate">{entity.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              <CommandGroup heading="Actions">
                <CommandItem
                  value="toggle theme"
                  onSelect={() => run(() => setTheme(resolved === 'dark' ? 'light' : 'dark'))}
                >
                  Toggle theme
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app && npm test -- CommandPalette`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add app/src/components/CommandPalette.tsx app/src/components/CommandPalette.test.tsx
git commit -m "Add command palette"
```

---

### Task 15: Wire Ctrl-K

**Files:**
- Modify: `app/src/components/AppShell.tsx`
- Test: `app/src/components/AppShell.test.tsx` (create)

**Interfaces:**
- Consumes: `CommandPalette` (Task 14), `TopBar`'s `onOpenPalette` (Task 13).

- [ ] **Step 1: Write the failing test**

Create `app/src/components/AppShell.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { AppShell } from './AppShell';

/* Traceability renders a diagram; keep mermaid and its d3 dependencies out of jsdom. */
vi.mock('mermaid', () => ({
  default: { initialize: vi.fn(), render: vi.fn().mockResolvedValue({ svg: '<svg></svg>' }) },
}));
vi.mock('react-zoom-pan-pinch', () => ({
  TransformWrapper: ({ children }: { children: unknown }) =>
    typeof children === 'function'
      ? (children as (c: unknown) => React.ReactNode)({
          zoomIn: vi.fn(), zoomOut: vi.fn(), resetTransform: vi.fn(),
        })
      : (children as React.ReactNode),
  TransformComponent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('AppShell', () => {
  it('opens the palette on Ctrl+K', async () => {
    renderWithProviders(<AppShell />);
    expect(screen.queryByPlaceholderText(/search anything/i)).not.toBeInTheDocument();
    await userEvent.keyboard('{Control>}k{/Control}');
    expect(await screen.findByPlaceholderText(/search anything/i)).toBeInTheDocument();
  });

  it('opens the palette from the top bar trigger', async () => {
    renderWithProviders(<AppShell />);
    await userEvent.click(screen.getByRole('button', { name: /search anything/i }));
    expect(await screen.findByPlaceholderText(/search anything/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && npm test -- AppShell`
Expected: FAIL — Ctrl+K does nothing; no palette input appears.

- [ ] **Step 3: Write the implementation**

In `app/src/components/AppShell.tsx`, add:

```tsx
import { useEffect, useState } from 'react';
import { CommandPalette } from '@/components/CommandPalette';
```

Inside the component, above the `return`:

```tsx
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      /* Ctrl+K on Windows/Linux, Cmd+K on macOS. preventDefault stops the
         browser's own focus-address-bar binding. */
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(open => !open);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
```

Replace the temporary no-op from Task 13:

```tsx
        <TopBar saveState={saveState} onOpenPalette={() => setPaletteOpen(true)} />
```

And add the palette just before `<Toaster />`:

```tsx
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app && npm test -- AppShell`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add app/src/components/AppShell.tsx app/src/components/AppShell.test.tsx
git commit -m "Open the command palette with Ctrl+K"
```

---

### Task 16: Select on diagram click, and refresh the integration test

**Files:**
- Modify: `app/src/components/TraceabilityView.tsx`, `app/src/App.integration.test.tsx`

**Interfaces:**
- Consumes: `SELECT_ENTITY` (Task 2); `entityIndex` (already used here).

**Why:** `TraceabilityView` currently dispatches `SET_VIEW` on a node click, which
switches stage but leaves the reader hunting for the record. With `selectedId` in
place it can open the record directly.

- [ ] **Step 1: Write the failing test**

Replace `app/src/App.integration.test.tsx` entirely:

```tsx
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

/* This flow ends on the Traceability stage, which renders a diagram. Mock mermaid so the
   real library and its d3/cytoscape dependencies stay out of jsdom. */
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: '<svg></svg>' }),
  },
}));

vi.mock('react-zoom-pan-pinch', () => ({
  TransformWrapper: ({ children }: { children: unknown }) =>
    typeof children === 'function'
      ? (children as (c: unknown) => React.ReactNode)({
          zoomIn: vi.fn(), zoomOut: vi.fn(), resetTransform: vi.fn(),
        })
      : (children as React.ReactNode),
  TransformComponent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

/** Entity links are typeahead comboboxes: open the popover, then pick the option. */
async function pickLink(label: RegExp, option: string) {
  await userEvent.click(screen.getByLabelText(label));
  await userEvent.click(await screen.findByRole('option', { name: option }));
}

describe('core traceability flow', () => {
  beforeEach(() => localStorage.clear());

  it('goal -> story -> criterion -> task -> test yields a fully-traced, gap-free project', async () => {
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: /Requirements/i }));

    // a goal, and a story that serves it (so no goalless-story gap)
    await userEvent.click(screen.getByRole('button', { name: /add goal/i }));

    await userEvent.click(screen.getByRole('tab', { name: /^Stories/ }));
    await userEvent.click(screen.getByRole('button', { name: /add story/i }));
    await userEvent.click(screen.getByRole('button', { name: /US-1/ }));
    await pickLink(/Serves goal/i, 'GOAL-1');
    await userEvent.click(screen.getByRole('button', { name: /add criterion/i }));

    await userEvent.click(screen.getByRole('button', { name: /^Tasks/i }));
    await userEvent.click(screen.getByRole('button', { name: /add task/i }));
    await userEvent.click(screen.getByRole('button', { name: /TASK-1/ }));
    await pickLink(/Traces to/i, 'US-1');

    await userEvent.click(screen.getByRole('button', { name: /Testing/i }));
    await userEvent.click(screen.getByRole('button', { name: /add test/i }));
    await userEvent.click(screen.getByRole('button', { name: /TEST-1/ }));
    await pickLink(/Verifies/i, 'AC-1.1');

    await userEvent.click(screen.getByRole('button', { name: /Traceability/i }));
    expect(screen.getByText(/No gaps/i)).toBeInTheDocument();
  });

  it('finds an entity through the command palette', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: /^Tasks/i }));
    await userEvent.click(screen.getByRole('button', { name: /add task/i }));

    await userEvent.keyboard('{Control>}k{/Control}');
    await userEvent.type(await screen.findByPlaceholderText(/search anything/i), 'TASK-1');
    await userEvent.click(await screen.findByRole('option', { name: /TASK-1/ }));

    expect(screen.getByRole('complementary', { name: 'Details' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && npm test -- App.integration`
Expected: FAIL — no `tab` role for Stories; the palette test finds no `Details` region.

- [ ] **Step 3: Write the implementation**

In `app/src/components/TraceabilityView.tsx`, change the `DiagramView`'s
`onNodeClick` so it selects rather than only navigating:

```tsx
        onNodeClick={id => {
          const target = entityIndex(project).get(id);
          if (target) dispatch({ type: 'SELECT_ENTITY', view: target.view, id: target.id });
        }}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app && npm test -- App.integration`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add app/src/components/TraceabilityView.tsx app/src/App.integration.test.tsx
git commit -m "Select the entity when a diagram node is clicked"
```

---

### Task 17: Full verification and PR

**Files:** none modified unless a failure demands it.

- [ ] **Step 1: Run the whole suite**

Run: `cd app && npm test`
Expected: every test passes. If the Trend Micro `ERR_DLOPEN_FAILED` block hits, skip to Step 3.

- [ ] **Step 2: Check the bundle locally if possible**

```bash
cd app && npm run build && node scripts/bundleSize.mjs 200
```

Expected: entry chunk under 200 kB gzipped. Phase A baseline was 174.2 kB and the
only new dependency is `@radix-ui/react-tabs`. **If it is over 200, report the
number and stop — do not edit the budget.**

- [ ] **Step 3: Push and read the CI result**

```bash
git push -u origin feat/thinkflow-studio
gh run list --branch feat/thinkflow-studio --limit 1
```

Then wait for completion and fetch the log for any failing job:

```bash
gh api repos/WaseemAbbaspk/ThinkFlow/actions/jobs/<job_id>/logs
```

Use `gh api` rather than `gh run view --log`, which fails with EPERM in this
environment.

- [ ] **Step 4: Confirm the deliverables before claiming success**

Record the actual numbers, do not assume them:
- total test count and that all pass
- entry chunk size in kB gzipped, and the budget it was compared against

- [ ] **Step 5: Open the PR**

```bash
gh pr create --title "Master-detail stage layout and command palette" --body "$(cat <<'EOF'
Rebuilds Requirements, Tasks and Testing as a searchable list plus a live-editing
inspector, and adds a Ctrl-K command palette. Vision and Architecture keep their
existing forms.

## What changed
- `lib/listView.ts` — pure search/filter/sort, no DOM
- `ListDetail` + `Inspector` + `StageTabs` — the reusable shell
- `CommandPalette` — stage navigation, entity jump, theme toggle
- Store — `selectedId`, `SELECT_ENTITY`, `UPDATE_GOAL`, `UPDATE_NFR`, three `DUPLICATE_*` actions

## Review notes
- **The index-addressing fix is the load-bearing change.** Goals and NFRs were
  edited by array position through `REPLACE_PROJECT`. Sorting a list would have
  made every edit hit the wrong record, so both now have id-keyed actions.
- **Assumptions, constraints and non-goals are deliberately asymmetric** — plain
  inline lists with no search, sort or inspector. They are bare `string[]` with
  no ids; giving them a sortable list would reintroduce exactly the bug above.
- **Inspector buttons are named `Delete <id>` / `Duplicate <id>`** so they cannot
  collide with the confirm dialog's own `Delete`.
- **No schema change.** `SCHEMA_VERSION` stays 1. Tags, per-story status,
  attachments, notifications and the user avatar from the reference mockup were
  deliberately not built — see the spec's "Rejected from the mockup" table.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 6: Hand the browser checks to the user**

These cannot be verified in jsdom. Ask the user to confirm on the deployed site:

1. Requirements opens on Goals; all seven tabs render with counts.
2. Clicking a story row opens the inspector rail on the right.
3. Typing in the search box narrows the list; the count footer updates.
4. The Status filter and the Sort menu both change what is listed.
5. Editing a field in the inspector updates the row immediately and the save
   indicator settles on "Saved".
6. `Duplicate` on a story with criteria produces a copy whose criteria are
   renumbered under the new story id.
7. Deleting the selected record closes the rail.
8. Ctrl-K opens the palette; typing an id and pressing Enter jumps to and selects
   that record.
9. Clicking a node in the Traceability diagram opens that entity's stage with the
   record selected.
10. At a narrow window the inspector replaces the list and the "Back to list"
    button returns.
