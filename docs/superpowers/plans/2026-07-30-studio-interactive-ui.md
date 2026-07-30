# Studio Interactive UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make ThinkFlow Studio interactive — render Mermaid diagrams you can pan, zoom and click through; give Tasks a drag-and-drop board; replace link multi-selects with typeahead comboboxes; add a command palette.

**Architecture:** Four features on the existing shadcn/Radix stack. Mermaid is code-split behind a dynamic `import()` and guarded by a CI bundle budget. The drag decision is extracted into a pure `resolveDrop` module because jsdom has no layout and cannot test dnd-kit through the DOM. `LinkSelect` keeps its exact prop signature so its six call sites never change.

**Tech Stack:** React 18 · TypeScript 5.5 · Vite 5 · Vitest 2 + Testing Library · Tailwind v4 · Radix · mermaid 11 · dnd-kit 6 · cmdk 1 · react-zoom-pan-pinch 4

**Spec:** [`docs/superpowers/specs/2026-07-30-studio-interactive-ui-design.md`](../specs/2026-07-30-studio-interactive-ui-design.md)

## Global Constraints

- All commands run from `app/`. The repo root is not an npm project — **never** run `npm install` from the root; it creates a stray root `package.json` and breaks CI resolution.
- **The local toolchain is blocked by Trend Micro Application Control.** `npm test`, `npm run build` and `npm run dev` cannot run on this machine. Verification is by pushing the branch and reading GitHub Actions. Retrieve logs with `gh api repos/WaseemAbbaspk/ThinkFlow/actions/jobs/{job_id}/logs` — `gh run view --log` fails with EPERM.
- Install with `npm install --ignore-scripts <pkg>` so native postinstall steps do not trip Application Control. Commit `package.json` **and** `package-lock.json` together.
- **Never add a Claude Code attribution or co-author trailer to a git commit.**
- Exact dependency versions: `mermaid@11.16.0`, `react-zoom-pan-pinch@4.0.3`, `@dnd-kit/core@6.3.1`, `@dnd-kit/sortable@10.0.0`, `@dnd-kit/utilities@3.2.2`, `cmdk@1.1.1`, `@radix-ui/react-popover@1.1.23`, `@radix-ui/react-toggle-group@1.1.19`.
- `SelectField` stays a native `<select>`. `inputs.test.tsx:35` pins this and must not be modified.
- **Load-bearing accessible names** — existing tests match these exactly. Do not change them:

  | Name | Where | Matcher |
  |---|---|---|
  | `Remove` | `RepeatableList` remove button | `aria-label` |
  | `Export actions` | TopBar dropdown | `aria-label` |
  | `Open navigation` | MobileNav trigger | `aria-label` |
  | `Copy chain` | TraceabilityView | `aria-label` |
  | `Filter rows` | TraceabilityView filter | `<Label htmlFor>` |
  | stage labels | Sidebar | anchored regex, e.g. `/^Tasks/i` |

- **New accessible names introduced here**, to be kept stable once set: `Task view`, `Board`, `List`, `Status`, `View source`, `Zoom in`, `Zoom out`, `Reset view`, `Command palette`, `Keyboard shortcuts`.
- **`useTheme()` throws outside `ThemeProvider`** (`app/src/state/theme.tsx:60`). `DiagramView` calls it, so **any** test file rendering a component that transitively renders a diagram must wrap in `ThemeProvider`. Three existing files render with a bare `<ProjectProvider>` and will break the moment a diagram appears inside them: `TraceabilityView.test.tsx` (5 render calls), `ArchitectureForm.test.tsx`, `TasksForm.test.tsx`. Tasks 5, 6 and 13 rewire them. This is the same failure mode as the `useConfirm` provider-ordering bug from the previous round — check the provider before assuming a component is droppable anywhere.
- Combobox chips must use `aria-label="Remove <value>"`, **never** bare `Remove` — a bare `Remove` collides with `RepeatableList` and makes `getByLabelText('Remove')` ambiguous in every stage form.
- Icons and decorative content carry `aria-hidden="true"` so accessible names stay exactly their labels.
- Radius is always written explicitly as `rounded-[6px]` (or `rounded-[3px]` for badges). There is no `--radius` token.

## File Structure

**Phase A — PR A**

| File | Responsibility |
|---|---|
| `app/scripts/bundleSize.mjs` | Entry-chunk gzip measurement + budget assertion + CLI |
| `app/scripts/bundleSize.test.ts` | Tests for the budget assertion |
| `app/src/model/registry.ts` | `entityIndex` — entity id → owning view + label |
| `app/src/model/registry.test.ts` | Registry tests |
| `app/src/lib/mermaid.ts` | Memoised dynamic `import('mermaid')` + strict init |
| `app/src/components/DiagramView.tsx` | Render / empty / error states, pan-zoom, source toggle, node clicks |
| `app/src/components/DiagramView.test.tsx` | DiagramView tests (mermaid mocked) |
| `app/src/components/ui/popover.tsx` | Vendored Radix Popover |
| `app/src/components/ui/command.tsx` | Vendored cmdk |
| `app/src/components/Combobox.tsx` | Typeahead single/multi picker with chips |
| `app/src/components/Combobox.test.tsx` | Combobox tests |

**Phase B — PR B**

| File | Responsibility |
|---|---|
| `app/src/components/taskBoardDnd.ts` | Pure `resolveDrop` drop-decision logic |
| `app/src/components/taskBoardDnd.test.ts` | Exhaustive drop-shape tests |
| `app/src/components/ui/toggle-group.tsx` | Vendored Radix ToggleGroup |
| `app/src/components/ui/dialog.tsx` | Vendored centred Radix Dialog |
| `app/src/components/TaskBoard.tsx` | Columns, cards, dnd-kit wiring |
| `app/src/components/TaskBoard.test.tsx` | Board tests |
| `app/src/components/CommandPalette.tsx` | Palette + global shortcuts |
| `app/src/components/CommandPalette.test.tsx` | Palette tests |

Modified: `app/src/components/TraceabilityView.tsx`, `app/src/stages/ArchitectureForm.tsx`, `app/src/components/inputs.tsx`, `app/src/stages/TasksForm.tsx`, `app/src/state/projectStore.tsx`, `app/src/model/types.ts`, `app/src/components/AppShell.tsx`, `app/src/App.integration.test.tsx`, `app/src/components/inputs.test.tsx`, `.github/workflows/ci.yml`.

---

# Phase A — PR A: diagrams and comboboxes

## Task 1: Phase A dependencies and the bundle budget guard

**Files:**
- Create: `app/scripts/bundleSize.mjs`
- Create: `app/scripts/bundleSize.test.ts`
- Modify: `app/package.json`, `app/package-lock.json`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: nothing.
- Produces: `assertUnderBudget(name: string, sizeKb: number, limitKb: number): true` (throws `Error` when over) and `entryChunkGzipKb(assetsDir: string): Promise<{ name: string; kb: number }>` from `app/scripts/bundleSize.mjs`.

The budget is **200 kB gzipped** on the entry chunk. Today's is 159 kB. `tsc -b` only covers `src/`, so a test file under `scripts/` is run by Vitest but not type-checked by the build — that is intentional and fine.

- [ ] **Step 1: Install the Phase A dependencies**

```bash
cd app
npm install --ignore-scripts mermaid@11.16.0 react-zoom-pan-pinch@4.0.3 cmdk@1.1.1 @radix-ui/react-popover@1.1.23
```

- [ ] **Step 2: Write the failing test**

Create `app/scripts/bundleSize.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { assertUnderBudget } from './bundleSize.mjs';

describe('assertUnderBudget', () => {
  it('passes when the chunk is under the limit', () => {
    expect(assertUnderBudget('index-abc.js', 159, 200)).toBe(true);
  });

  it('passes exactly at the limit', () => {
    expect(assertUnderBudget('index-abc.js', 200, 200)).toBe(true);
  });

  it('throws when the chunk is over the limit, naming both numbers', () => {
    expect(() => assertUnderBudget('index-abc.js', 240.4, 200))
      .toThrow(/index-abc\.js is 240\.4 kB gzipped, over the 200 kB budget/);
  });
});
```

- [ ] **Step 3: Run it and confirm it fails**

Run: `npx vitest run scripts/bundleSize.test.ts`
Expected: FAIL — cannot resolve `./bundleSize.mjs`.

- [ ] **Step 4: Write the script**

Create `app/scripts/bundleSize.mjs`:

```js
import { readdir, readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export function assertUnderBudget(name, sizeKb, limitKb) {
  if (sizeKb > limitKb) {
    throw new Error(
      `${name} is ${sizeKb.toFixed(1)} kB gzipped, over the ${limitKb} kB budget`,
    );
  }
  return true;
}

/** The entry chunk only. Async chunks (mermaid) are deliberately not measured. */
export async function entryChunkGzipKb(assetsDir) {
  const files = await readdir(assetsDir);
  const entry = files.find(f => /^index-.*\.js$/.test(f));
  if (!entry) throw new Error(`no entry chunk matching index-*.js in ${assetsDir}`);
  const buf = await readFile(path.join(assetsDir, entry));
  return { name: entry, kb: gzipSync(buf).length / 1024 };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const limitKb = Number(process.argv[2] ?? 200);
  const { name, kb } = await entryChunkGzipKb('dist/assets');
  console.log(`entry chunk ${name}: ${kb.toFixed(1)} kB gzipped (budget ${limitKb} kB)`);
  assertUnderBudget(name, kb, limitKb);
}
```

- [ ] **Step 5: Run the test and confirm it passes**

Run: `npx vitest run scripts/bundleSize.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 6: Replace the CI bundle step with the budget check**

In `.github/workflows/ci.yml`, replace the `Bundle size` step with:

```yaml
      - name: Bundle budget
        run: |
          ls -la dist/assets/
          node scripts/bundleSize.mjs 200
```

- [ ] **Step 7: Commit**

```bash
git add app/package.json app/package-lock.json app/scripts .github/workflows/ci.yml
git commit -m "Add bundle budget guard and phase A dependencies"
```

---

## Task 2: Entity registry

**Files:**
- Create: `app/src/model/registry.ts`
- Create: `app/src/model/registry.test.ts`

**Interfaces:**
- Consumes: `Project` from `@/model/types`; `View` from `@/state/projectStore` (type-only import, so no runtime cycle).
- Produces: `EntityLocation { id: string; view: View; label: string }` and `entityIndex(project: Project): Map<string, EntityLocation>`. Used by Task 5 (click-to-jump) and Task 17 (palette).

- [ ] **Step 1: Write the failing test**

Create `app/src/model/registry.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { entityIndex } from './registry';
import { reducer, initialState } from '@/state/projectStore';

function seeded() {
  let s = reducer(initialState(), { type: 'ADD_GOAL' });
  s = reducer(s, { type: 'ADD_STORY' });
  s = reducer(s, { type: 'ADD_CRITERION', storyId: 'US-1' });
  s = reducer(s, { type: 'ADD_NFR' });
  s = reducer(s, { type: 'ADD_ADR' });
  s = reducer(s, { type: 'ADD_TASK' });
  s = reducer(s, { type: 'ADD_TEST' });
  return s.project;
}

describe('entityIndex', () => {
  it('maps every entity kind to its owning view', () => {
    const idx = entityIndex(seeded());
    expect(idx.get('GOAL-1')?.view).toBe('requirements');
    expect(idx.get('US-1')?.view).toBe('requirements');
    expect(idx.get('AC-1.1')?.view).toBe('requirements');
    expect(idx.get('NFR-1')?.view).toBe('requirements');
    expect(idx.get('ADR-1')?.view).toBe('architecture');
    expect(idx.get('TASK-1')?.view).toBe('tasks');
    expect(idx.get('TEST-1')?.view).toBe('testing');
  });

  it('falls back to the id when the entity has no text yet', () => {
    expect(entityIndex(seeded()).get('TASK-1')?.label).toBe('TASK-1');
  });

  it('prefers the entity text as the label', () => {
    let s = reducer(initialState(), { type: 'ADD_TASK' });
    s = reducer(s, { type: 'UPDATE_TASK', id: 'TASK-1', patch: { title: 'Wire up CI' } });
    expect(entityIndex(s.project).get('TASK-1')?.label).toBe('Wire up CI');
  });

  it('returns an empty index for an empty project', () => {
    expect(entityIndex(initialState().project).size).toBe(0);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run src/model/registry.test.ts`
Expected: FAIL — cannot resolve `./registry`.

- [ ] **Step 3: Write the implementation**

Create `app/src/model/registry.ts`:

```ts
import type { Project } from './types';
import type { View } from '@/state/projectStore';

export interface EntityLocation {
  id: string;
  view: View;
  label: string;
}

/**
 * Every addressable entity in the project, keyed by id.
 * Type-only import of `View` keeps this a leaf module at runtime.
 */
export function entityIndex(project: Project): Map<string, EntityLocation> {
  const index = new Map<string, EntityLocation>();
  const add = (id: string, view: View, text: string) => {
    if (id) index.set(id, { id, view, label: text.trim() || id });
  };

  for (const g of project.goals) add(g.id, 'requirements', g.text);
  for (const s of project.requirements.stories) add(s.id, 'requirements', s.want);
  for (const c of project.requirements.criteria) add(c.id, 'requirements', c.text);
  for (const n of project.requirements.nfrs) add(n.id, 'requirements', n.name);
  for (const a of project.architecture.adrs) add(a.id, 'architecture', a.title);
  for (const t of project.tasks) add(t.id, 'tasks', t.title);
  for (const t of project.testing.tests) add(t.id, 'testing', t.description);

  return index;
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npx vitest run src/model/registry.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add app/src/model/registry.ts app/src/model/registry.test.ts
git commit -m "Add entity registry mapping ids to their owning view"
```

---

## Task 3: Mermaid loader and DiagramView render states

**Files:**
- Create: `app/src/lib/mermaid.ts`
- Create: `app/src/components/DiagramView.tsx`
- Create: `app/src/components/DiagramView.test.tsx`

**Interfaces:**
- Consumes: `useTheme()` from `@/state/theme` returning `{ theme, setTheme, resolved }` where `resolved` is `'light' | 'dark'`.
- Produces: `loadMermaid(dark: boolean): Promise<Mermaid>` from `@/lib/mermaid`; `DiagramView` with props `{ source: string; label: string; onNodeClick?: (entityId: string) => void; debounceMs?: number }`.

`debounceMs` defaults to 300 and exists so tests can pass `0` — fake timers plus async rendering is a reliable source of flake.

Pan/zoom arrives in Task 4. This task builds empty / error / rendered and the source toggle.

- [ ] **Step 1: Write the failing test**

Create `app/src/components/DiagramView.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/state/theme';
import { DiagramView } from './DiagramView';

const renderMock = vi.fn();

vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: (...args: unknown[]) => renderMock(...args),
  },
}));

function renderDiagram(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

const SOURCE = 'flowchart LR\n  US_1["US-1"] --> TASK_1["TASK-1"]';

beforeEach(() => {
  renderMock.mockReset();
  renderMock.mockResolvedValue({
    svg: '<svg><g class="node"><text>US-1</text></g></svg>',
  });
});

describe('DiagramView', () => {
  it('shows a placeholder and never loads mermaid when there is nothing to draw', async () => {
    renderDiagram(<DiagramView source="flowchart LR" label="Chain" debounceMs={0} />);
    expect(screen.getByText(/nothing to diagram yet/i)).toBeInTheDocument();
    expect(renderMock).not.toHaveBeenCalled();
  });

  it('renders the mermaid svg', async () => {
    const { container } = renderDiagram(
      <DiagramView source={SOURCE} label="Chain" debounceMs={0} />,
    );
    await waitFor(() => expect(container.querySelector('svg')).toBeInTheDocument());
  });

  it('exposes the source behind a View source toggle', async () => {
    renderDiagram(<DiagramView source={SOURCE} label="Chain" debounceMs={0} />);
    expect(screen.queryByText(SOURCE)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /view source/i }));
    expect(screen.getByText(SOURCE)).toBeInTheDocument();
  });

  it('shows the parse error when nothing has ever rendered', async () => {
    renderMock.mockRejectedValue(new Error('Parse error on line 2'));
    renderDiagram(<DiagramView source={SOURCE} label="Chain" debounceMs={0} />);
    expect(await screen.findByText(/parse error on line 2/i)).toBeInTheDocument();
  });

  it('keeps the last good render on screen when a later edit fails to parse', async () => {
    const { container, rerender } = renderDiagram(
      <DiagramView source={SOURCE} label="Chain" debounceMs={0} />,
    );
    await waitFor(() => expect(container.querySelector('svg')).toBeInTheDocument());

    renderMock.mockRejectedValue(new Error('Parse error on line 3'));
    rerender(
      <ThemeProvider>
        <DiagramView source={`${SOURCE}\n  broken[[`} label="Chain" debounceMs={0} />
      </ThemeProvider>,
    );

    expect(await screen.findByText(/parse error on line 3/i)).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run src/components/DiagramView.test.tsx`
Expected: FAIL — cannot resolve `./DiagramView`.

- [ ] **Step 3: Write the mermaid loader**

Create `app/src/lib/mermaid.ts`:

```ts
type Mermaid = Awaited<typeof import('mermaid')>['default'];

let modulePromise: Promise<Mermaid> | null = null;

/**
 * Dynamic import so mermaid (~800 kB) becomes its own async chunk rather than
 * loading for every visitor. A static import here would fail the CI bundle budget.
 *
 * securityLevel 'strict' and htmlLabels false matter: diagram source is user-typed
 * and can arrive from an imported project file, so the generated SVG is sanitised
 * and mermaid `click` directives are refused.
 */
export async function loadMermaid(dark: boolean): Promise<Mermaid> {
  if (!modulePromise) modulePromise = import('mermaid').then(m => m.default);
  const mermaid = await modulePromise;
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    htmlLabels: false,
    theme: dark ? 'dark' : 'base',
  });
  return mermaid;
}
```

- [ ] **Step 4: Write DiagramView**

Create `app/src/components/DiagramView.tsx`:

```tsx
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/state/theme';
import { loadMermaid } from '@/lib/mermaid';
import { cn } from '@/lib/utils';

export interface DiagramViewProps {
  source: string;
  /** Accessible label for the diagram region. */
  label: string;
  /** Fires with a node's label text when clicked. Omit to disable navigation. */
  onNodeClick?: (entityId: string) => void;
  /** Tests pass 0. Production debounces because architecture sources change per keystroke. */
  debounceMs?: number;
}

/** A bare `flowchart LR` header with no edges is not worth loading mermaid for. */
function hasEdges(source: string): boolean {
  return source.trim().split('\n').filter(l => l.trim()).length > 1;
}

export function DiagramView({ source, label, onNodeClick, debounceMs = 300 }: DiagramViewProps) {
  const { resolved } = useTheme();
  const [svg, setSvg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showSource, setShowSource] = useState(false);
  const seqRef = useRef(0);

  const drawable = hasEdges(source);

  useEffect(() => {
    if (!drawable) {
      setSvg('');
      setError(null);
      return;
    }
    const seq = ++seqRef.current;
    const timer = setTimeout(async () => {
      try {
        const mermaid = await loadMermaid(resolved === 'dark');
        const { svg: out } = await mermaid.render(`thinkflow-diagram-${seq}`, source);
        if (seq !== seqRef.current) return; // a newer edit already won
        setSvg(out);
        setError(null);
      } catch (e) {
        if (seq !== seqRef.current) return;
        setError(e instanceof Error ? e.message : String(e));
      }
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [source, resolved, drawable, debounceMs]);

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!onNodeClick) return;
    const node = (e.target as Element).closest?.('.node');
    const text = node?.textContent?.trim();
    if (text) onNodeClick(text);
  }

  if (!drawable) {
    return (
      <p className="rounded-[6px] border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Nothing to diagram yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <p role="status" className="rounded-[6px] border border-warn bg-warn-soft px-3 py-2 font-mono text-[12.5px] text-warn">
          {error}
        </p>
      )}

      <div
        role="img"
        aria-label={label}
        onClick={handleClick}
        className={cn(
          'overflow-auto rounded-[6px] border border-border bg-card p-3',
          error && 'opacity-50',
        )}
        dangerouslySetInnerHTML={{ __html: svg }}
      />

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => setShowSource(s => !s)}>
          View source
        </Button>
      </div>

      {showSource && (
        <pre className="overflow-auto rounded-[6px] border border-border bg-muted p-3 font-mono text-[12.5px] leading-relaxed">
          {source}
        </pre>
      )}
    </div>
  );
}
```

`dangerouslySetInnerHTML` is safe here specifically because mermaid ran with `securityLevel: 'strict'`, which sanitises its own SVG output. Do not relax that setting.

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `npx vitest run src/components/DiagramView.test.tsx`
Expected: PASS, 5 tests.

- [ ] **Step 6: Commit**

```bash
git add app/src/lib/mermaid.ts app/src/components/DiagramView.tsx app/src/components/DiagramView.test.tsx
git commit -m "Add DiagramView with code-split mermaid rendering"
```

---

## Task 4: Pan, zoom and click-to-jump

**Files:**
- Modify: `app/src/components/DiagramView.tsx`
- Modify: `app/src/components/DiagramView.test.tsx`

**Interfaces:**
- Consumes: `DiagramViewProps` from Task 3, unchanged.
- Produces: buttons named `Zoom in`, `Zoom out`, `Reset view`; `onNodeClick` fires with the clicked node's label text.

`react-zoom-pan-pinch` measures elements, and jsdom reports every rect as zeroes, so the tests stub it with a passthrough. The stub keeps the tests about our logic rather than about the library's layout maths.

- [ ] **Step 1: Add the failing tests**

Add to the top of `app/src/components/DiagramView.test.tsx`, beside the existing `vi.mock('mermaid', ...)`:

```tsx
// jsdom has no layout, so the real TransformWrapper measures zeroes. Passthrough stub.
vi.mock('react-zoom-pan-pinch', () => ({
  TransformWrapper: ({ children }: { children: unknown }) =>
    typeof children === 'function'
      ? (children as (c: unknown) => React.ReactNode)({
          zoomIn: vi.fn(), zoomOut: vi.fn(), resetTransform: vi.fn(),
        })
      : (children as React.ReactNode),
  TransformComponent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
```

Then add these cases inside the `describe('DiagramView')` block:

```tsx
  it('offers zoom and reset controls', async () => {
    renderDiagram(<DiagramView source={SOURCE} label="Chain" debounceMs={0} />);
    await screen.findByRole('button', { name: /zoom in/i });
    expect(screen.getByRole('button', { name: /zoom out/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset view/i })).toBeInTheDocument();
  });

  it('reports the clicked node label', async () => {
    const onNodeClick = vi.fn();
    const { container } = renderDiagram(
      <DiagramView source={SOURCE} label="Chain" debounceMs={0} onNodeClick={onNodeClick} />,
    );
    await waitFor(() => expect(container.querySelector('.node')).toBeInTheDocument());
    await userEvent.click(container.querySelector('.node text')!);
    expect(onNodeClick).toHaveBeenCalledWith('US-1');
  });

  it('ignores clicks that miss a node', async () => {
    const onNodeClick = vi.fn();
    const { container } = renderDiagram(
      <DiagramView source={SOURCE} label="Chain" debounceMs={0} onNodeClick={onNodeClick} />,
    );
    await waitFor(() => expect(container.querySelector('svg')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('img', { name: 'Chain' }));
    expect(onNodeClick).not.toHaveBeenCalled();
  });
```

- [ ] **Step 2: Run and confirm the new cases fail**

Run: `npx vitest run src/components/DiagramView.test.tsx`
Expected: the three new cases FAIL — no zoom buttons; `onNodeClick` not called.

- [ ] **Step 3: Wrap the viewport in TransformWrapper**

In `app/src/components/DiagramView.tsx`, add to the imports:

```tsx
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
```

Replace the `<div role="img" ...>` element and the trailing controls row with:

```tsx
      <TransformWrapper doubleClick={{ disabled: true }}>
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <div className="flex justify-end gap-1">
              <Button variant="ghost" size="icon" aria-label="Zoom in" onClick={() => zoomIn()}>
                <ZoomIn aria-hidden="true" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Zoom out" onClick={() => zoomOut()}>
                <ZoomOut aria-hidden="true" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Reset view" onClick={() => resetTransform()}>
                <Maximize aria-hidden="true" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowSource(s => !s)}>
                View source
              </Button>
            </div>
            <TransformComponent>
              <div
                role="img"
                aria-label={label}
                onClick={handleClick}
                className={cn(
                  'overflow-auto rounded-[6px] border border-border bg-card p-3',
                  error && 'opacity-50',
                )}
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npx vitest run src/components/DiagramView.test.tsx`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add app/src/components/DiagramView.tsx app/src/components/DiagramView.test.tsx
git commit -m "Add pan, zoom and node click handling to DiagramView"
```

---

## Task 5: Render the traceability chain

**Files:**
- Modify: `app/src/components/TraceabilityView.tsx`
- Modify: `app/src/components/TraceabilityView.test.tsx`

**Interfaces:**
- Consumes: `DiagramView` (Task 4), `entityIndex` (Task 2).
- Produces: nothing new. `Copy chain` keeps its `aria-label`.

- [ ] **Step 1: Add ThemeProvider to every render in the file**

`TraceabilityView.test.tsx` currently has five bare `render(<ProjectProvider ...>)` calls. Once the view renders a diagram, `useTheme()` will throw in all of them. Add a local helper below the imports:

```tsx
import { ThemeProvider } from '@/state/theme';

function renderView(preload?: Project) {
  return render(
    <ThemeProvider>
      <ProjectProvider preload={preload}>
        <TraceabilityView />
      </ProjectProvider>
    </ThemeProvider>,
  );
}
```

Replace all five `render(<ProjectProvider ...><TraceabilityView /></ProjectProvider>)` calls with `renderView()` or `renderView(p)`. Keep the `const { container } = ` destructuring where it is used.

- [ ] **Step 2: Fix the mermaid-source test, which no longer has a bare `<pre>`**

The test at line 40, `sanitizes dotted AC ids in the Mermaid chain but keeps the original label`, reads `container.querySelector('pre')`. The source now sits behind the **View source** toggle. Rewrite it as:

```tsx
it('sanitizes dotted AC ids in the Mermaid chain but keeps the original label', async () => {
  const { container } = renderView(tracedProject());
  await userEvent.click(screen.getByRole('button', { name: /view source/i }));
  const chain = container.querySelector('pre')!.textContent ?? '';
  expect(chain).toContain('flowchart LR');
  expect(chain).toContain('AC_1_1["AC-1.1"]'); // dot & hyphen sanitized in node id, original id in label
  expect(chain).toContain('GOAL-1'); // goal -> story edge present
});
```

This test is load-bearing — it is the only coverage of the id-sanitisation rule. Do not delete it.

- [ ] **Step 3: Write the failing test for the diagram itself**

```tsx
it('renders the traceability chain as a diagram', async () => {
  renderView(tracedProject());
  expect(await screen.findByRole('img', { name: /traceability chain/i })).toBeInTheDocument();
});
```

Node-click navigation is already covered by Task 4's unit tests; do not re-test the click plumbing here.

- [ ] **Step 4: Run and confirm it fails**

Run: `npx vitest run src/components/TraceabilityView.test.tsx`
Expected: FAIL — no element with role `img` named `Traceability chain`.

- [ ] **Step 5: Wire DiagramView in**

In `app/src/components/TraceabilityView.tsx`, add imports:

```tsx
import { DiagramView } from '@/components/DiagramView';
import { entityIndex } from '@/model/registry';
```

The component already destructures `useProject()`. Ensure `dispatch` is in scope, then replace the `<pre>` inside the `Traceability chain` SectionCard with:

```tsx
        <DiagramView
          source={mermaid}
          label="Traceability chain"
          onNodeClick={id => {
            const target = entityIndex(project).get(id);
            if (target) dispatch({ type: 'SET_VIEW', view: target.view });
          }}
        />
```

Keep the `Copy chain` button exactly as it is.

- [ ] **Step 6: Run the full suite**

Run: `npm test`
Expected: PASS, including all five pre-existing TraceabilityView tests. The mermaid source builder itself is untouched.

- [ ] **Step 7: Commit**

```bash
git add app/src/components/TraceabilityView.tsx app/src/components/TraceabilityView.test.tsx
git commit -m "Render the traceability chain as a clickable diagram"
```

---

## Task 6: Architecture diagram previews

**Files:**
- Modify: `app/src/stages/ArchitectureForm.tsx`
- Modify: `app/src/stages/ArchitectureForm.test.tsx`

**Interfaces:**
- Consumes: `DiagramView` (Task 4).
- Produces: diagram regions labelled `Context diagram` and `Component diagram`.

`onNodeClick` is deliberately omitted — these are free-form diagrams whose node names are not entity ids.

- [ ] **Step 1: Add ThemeProvider to every render in the file**

`ArchitectureForm.test.tsx` renders with a bare `<ProjectProvider>`. Once the form contains a diagram, `useTheme()` throws in every test. Add below the imports:

```tsx
import { ThemeProvider } from '@/state/theme';

function renderForm() {
  return render(
    <ThemeProvider>
      <ProjectProvider><ArchitectureForm /></ProjectProvider>
    </ThemeProvider>,
  );
}
```

Replace every `render(<ProjectProvider><ArchitectureForm /></ProjectProvider>)` with `renderForm()`.

- [ ] **Step 2: Write the failing test**

```tsx
it('previews the context diagram as you type', async () => {
  renderForm();
  await userEvent.type(
    screen.getByLabelText(/Context diagram/i),
    'flowchart LR{enter}  A --> B',
  );
  expect(await screen.findByRole('img', { name: /context diagram/i })).toBeInTheDocument();
});
```

`userEvent.type` interprets `\n` as a literal newline only via `{enter}`, so the multi-line source must use `{enter}`. Without a second line `hasEdges` returns false and no diagram renders.

- [ ] **Step 3: Run it and confirm it fails**

Run: `npx vitest run src/stages/ArchitectureForm.test.tsx`
Expected: FAIL — no `img` named `Context diagram`.

- [ ] **Step 4: Add the previews**

In `app/src/stages/ArchitectureForm.tsx`, add:

```tsx
import { DiagramView } from '@/components/DiagramView';
```

In the `Diagrams` SectionCard, insert a `DiagramView` under each textarea:

```tsx
      <SectionCard title="Diagrams">
        <TextArea
          label="Context diagram (Mermaid)"
          value={architecture.contextDiagram}
          onChange={v => replaceArch({ contextDiagram: v })}
        />
        <DiagramView source={architecture.contextDiagram} label="Context diagram" />

        <TextArea
          label="Component diagram (Mermaid)"
          value={architecture.componentDiagram}
          onChange={v => replaceArch({ componentDiagram: v })}
        />
        <DiagramView source={architecture.componentDiagram} label="Component diagram" />
      </SectionCard>
```

- [ ] **Step 5: Run the tests**

Run: `npx vitest run src/stages/ArchitectureForm.test.tsx`
Expected: PASS, including every pre-existing test in the file.

- [ ] **Step 6: Commit**

```bash
git add app/src/stages/ArchitectureForm.tsx app/src/stages/ArchitectureForm.test.tsx
git commit -m "Preview architecture diagrams live beneath their sources"
```

---

## Task 7: Vendor Popover and Command primitives

**Files:**
- Create: `app/src/components/ui/popover.tsx`
- Create: `app/src/components/ui/command.tsx`

**Interfaces:**
- Produces: `Popover`, `PopoverTrigger`, `PopoverContent`; `Command`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`, `CommandSeparator`.

No tests of their own — these are thin vendored wrappers, exercised by Tasks 8 and 16.

- [ ] **Step 1: Create the Popover wrapper**

Create `app/src/components/ui/popover.tsx`:

```tsx
import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;

export const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = 'start', sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'z-50 w-[--radix-popover-trigger-width] min-w-56 rounded-[6px] border border-border',
        'bg-card p-1 text-foreground shadow-lg outline-none',
        className,
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = 'PopoverContent';
```

- [ ] **Step 2: Create the Command wrapper**

Create `app/src/components/ui/command.tsx`:

```tsx
import * as React from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn('flex w-full flex-col overflow-hidden rounded-[6px] bg-card text-foreground', className)}
    {...props}
  />
));
Command.displayName = 'Command';

export const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center gap-2 border-b border-border px-3">
    <Search aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        'h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground',
        className,
      )}
      {...props}
    />
  </div>
));
CommandInput.displayName = 'CommandInput';

export const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn('max-h-72 overflow-y-auto overflow-x-hidden p-1', className)}
    {...props}
  />
));
CommandList.displayName = 'CommandList';

export const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty ref={ref} className="py-6 text-center text-sm text-muted-foreground" {...props} />
));
CommandEmpty.displayName = 'CommandEmpty';

export const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      'overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5',
      '[&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold',
      '[&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide',
      '[&_[cmdk-group-heading]]:text-muted-foreground',
      className,
    )}
    {...props}
  />
));
CommandGroup.displayName = 'CommandGroup';

export const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center gap-2 rounded-[6px] px-2 py-1.5 text-sm outline-none',
      'data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground',
      className,
    )}
    {...props}
  />
));
CommandItem.displayName = 'CommandItem';

export const CommandSeparator = CommandPrimitive.Separator;
```

- [ ] **Step 3: Run the suite to confirm nothing regressed**

Run: `npm test`
Expected: PASS — nothing imports these yet.

- [ ] **Step 4: Commit**

```bash
git add app/src/components/ui/popover.tsx app/src/components/ui/command.tsx
git commit -m "Vendor Popover and Command primitives"
```

---

## Task 8: Combobox

**Files:**
- Create: `app/src/components/Combobox.tsx`
- Create: `app/src/components/Combobox.test.tsx`

**Interfaces:**
- Consumes: `Popover`/`PopoverTrigger`/`PopoverContent`, `Command`/`CommandInput`/`CommandList`/`CommandEmpty`/`CommandItem` (Task 7).
- Produces: `Combobox` with props `{ label: string; value: string | string[]; options: { value: string; label: string }[]; multiple?: boolean; onChange: (v: string | string[]) => void }` — deliberately identical in shape to `LinkSelectProps` so Task 9 is a one-line swap.

Chips render **outside** the trigger button: a remove button nested inside a button is invalid HTML and breaks click handling. Chip labels are `Remove <value>`, never bare `Remove`.

- [ ] **Step 1: Write the failing test**

Create `app/src/components/Combobox.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Combobox } from './Combobox';

const OPTIONS = [
  { value: 'US-1', label: 'US-1' },
  { value: 'US-2', label: 'US-2' },
  { value: 'AC-1.1', label: 'AC-1.1' },
];

describe('Combobox', () => {
  it('is reachable by its label', () => {
    render(<Combobox label="Traces to" value={[]} options={OPTIONS} multiple onChange={vi.fn()} />);
    expect(screen.getByLabelText('Traces to')).toBeInTheDocument();
  });

  it('selects a single value and closes', async () => {
    const onChange = vi.fn();
    render(<Combobox label="Serves goal" value="" options={OPTIONS} onChange={onChange} />);
    await userEvent.click(screen.getByLabelText('Serves goal'));
    await userEvent.click(await screen.findByRole('option', { name: 'US-2' }));
    expect(onChange).toHaveBeenCalledWith('US-2');
  });

  it('accumulates values in multiple mode', async () => {
    const onChange = vi.fn();
    render(<Combobox label="Traces to" value={['US-1']} options={OPTIONS} multiple onChange={onChange} />);
    await userEvent.click(screen.getByLabelText('Traces to'));
    await userEvent.click(await screen.findByRole('option', { name: 'AC-1.1' }));
    expect(onChange).toHaveBeenCalledWith(['US-1', 'AC-1.1']);
  });

  it('deselects an already-selected value in multiple mode', async () => {
    const onChange = vi.fn();
    render(<Combobox label="Traces to" value={['US-1', 'US-2']} options={OPTIONS} multiple onChange={onChange} />);
    await userEvent.click(screen.getByLabelText('Traces to'));
    await userEvent.click(await screen.findByRole('option', { name: 'US-1' }));
    expect(onChange).toHaveBeenCalledWith(['US-2']);
  });

  it('filters options by the typed query', async () => {
    render(<Combobox label="Traces to" value={[]} options={OPTIONS} multiple onChange={vi.fn()} />);
    await userEvent.click(screen.getByLabelText('Traces to'));
    await userEvent.type(screen.getByPlaceholderText(/search/i), 'AC');
    expect(await screen.findByRole('option', { name: 'AC-1.1' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'US-1' })).not.toBeInTheDocument();
  });

  it('removes a value from its chip, using a name that does not collide with RepeatableList', async () => {
    const onChange = vi.fn();
    render(<Combobox label="Traces to" value={['US-1', 'US-2']} options={OPTIONS} multiple onChange={onChange} />);
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Remove US-1' }));
    expect(onChange).toHaveBeenCalledWith(['US-2']);
  });

  it('shows an empty state when nothing matches', async () => {
    render(<Combobox label="Traces to" value={[]} options={OPTIONS} multiple onChange={vi.fn()} />);
    await userEvent.click(screen.getByLabelText('Traces to'));
    await userEvent.type(screen.getByPlaceholderText(/search/i), 'zzz');
    expect(await screen.findByText(/no matches/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run src/components/Combobox.test.tsx`
Expected: FAIL — cannot resolve `./Combobox`.

- [ ] **Step 3: Write the implementation**

Create `app/src/components/Combobox.tsx`:

```tsx
import React, { useId, useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';

export interface ComboboxOption { value: string; label: string; }

export interface ComboboxProps {
  label: string;
  value: string | string[];
  options: ComboboxOption[];
  multiple?: boolean;
  onChange: (value: string | string[]) => void;
}

export function Combobox({ label, value, options, multiple, onChange }: ComboboxProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const selected = multiple ? (value as string[]) : value ? [value as string] : [];

  function toggle(next: string) {
    if (!multiple) {
      onChange(next);
      setOpen(false);
      return;
    }
    onChange(selected.includes(next) ? selected.filter(v => v !== next) : [...selected, next]);
  }

  const triggerText = selected.length
    ? multiple ? `${selected.length} selected` : (options.find(o => o.value === selected[0])?.label ?? selected[0])
    : 'None';

  return (
    <div className="mb-3 flex flex-col gap-1">
      <Label htmlFor={id}>{label}</Label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'flex w-full items-center justify-between rounded-[6px] border border-input bg-card',
              'px-3 py-1.5 text-left text-sm text-foreground',
              'focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-accent',
              !selected.length && 'text-muted-foreground',
            )}
          >
            {triggerText}
            <ChevronsUpDown aria-hidden="true" className="size-4 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>

        <PopoverContent>
          <Command>
            <CommandInput placeholder={`Search ${label.toLowerCase()}...`} />
            <CommandList>
              <CommandEmpty>No matches.</CommandEmpty>
              {options.map(o => (
                <CommandItem key={o.value} value={o.label} onSelect={() => toggle(o.value)}>
                  <Check
                    aria-hidden="true"
                    className={cn('size-4', !selected.includes(o.value) && 'opacity-0')}
                  />
                  {o.label}
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Chips live outside the trigger: a button inside a button is invalid HTML. */}
      {multiple && selected.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {selected.map(v => (
            <Badge key={v} className="gap-1 pr-1">
              {v}
              <button
                type="button"
                aria-label={`Remove ${v}`}
                onClick={() => onChange(selected.filter(s => s !== v))}
                className="rounded-[3px] hover:text-warn"
              >
                <X aria-hidden="true" className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npx vitest run src/components/Combobox.test.tsx`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add app/src/components/Combobox.tsx app/src/components/Combobox.test.tsx
git commit -m "Add typeahead Combobox with removable chips"
```

---

## Task 9: Swap LinkSelect onto Combobox

**Files:**
- Modify: `app/src/components/inputs.tsx`
- Modify: `app/src/components/inputs.test.tsx:39-54`
- Modify: `app/src/App.integration.test.tsx:14,18,21`

**Interfaces:**
- Consumes: `Combobox` (Task 8).
- Produces: `LinkSelect` with its **existing** signature `{ label, value, options, onChange, multiple? }`. All six call sites across the stage forms are unchanged.

`SelectField` and its native `<select>` are untouched. `inputs.test.tsx:35` must still pass unmodified — it is the test that pins that decision.

- [ ] **Step 1: Rewrite the LinkSelect test**

In `app/src/components/inputs.test.tsx`, replace the whole `LinkSelect` test (the one asserting `toHaveAttribute('multiple')`) with:

```tsx
  it('LinkSelect is a combobox that reports an array in multiple mode', async () => {
    const onChange = vi.fn();
    render(
      <LinkSelect
        label="Traces to"
        value={[]}
        multiple
        options={[{ value: 'US-1', label: 'US-1' }, { value: 'US-2', label: 'US-2' }]}
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByLabelText('Traces to'));
    await userEvent.click(await screen.findByRole('option', { name: 'US-2' }));
    expect(onChange).toHaveBeenCalledWith(['US-2']);
  });
```

Leave the `SelectField` test above it exactly as it is.

- [ ] **Step 2: Run and confirm it fails**

Run: `npx vitest run src/components/inputs.test.tsx`
Expected: FAIL — the native select has no `option` role items until it is opened, and there is no combobox to click.

- [ ] **Step 3: Swap the implementation**

In `app/src/components/inputs.tsx`, add `import { Combobox } from '@/components/Combobox';` and replace the whole `LinkSelect` function body with:

```tsx
/* Entity links go through a typeahead Combobox. The signature is deliberately unchanged
   so the six call sites in the stage forms need no edits. SelectField below stays a
   native <select> — short fixed enums are better served by the platform control. */
export function LinkSelect({ label, value, options, onChange, multiple }: LinkSelectProps) {
  return (
    <Combobox label={label} value={value} options={options} multiple={multiple} onChange={onChange} />
  );
}
```

Remove the now-unused `min-h-24` branch if nothing else references it. Leave `selectClass` in place — `SelectField` still uses it.

- [ ] **Step 4: Run the inputs tests**

Run: `npx vitest run src/components/inputs.test.tsx`
Expected: PASS, including the untouched `SelectField` test.

- [ ] **Step 5: Update the integration test**

In `app/src/App.integration.test.tsx`, add this helper above the `describe`:

```tsx
async function pickLink(label: RegExp, option: string) {
  await userEvent.click(screen.getByLabelText(label));
  await userEvent.click(await screen.findByRole('option', { name: option }));
}
```

Then replace the three `selectOptions` lines:

```tsx
    await pickLink(/Serves goal/i, 'GOAL-1');
```
```tsx
    await pickLink(/Traces to/i, 'US-1');
```
```tsx
    await pickLink(/Verifies/i, 'AC-1.1');
```

The goal option's label is the goal text or its id; the goal is created blank, so `GOAL-1` is correct.

- [ ] **Step 6: Run the full suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add app/src/components/inputs.tsx app/src/components/inputs.test.tsx app/src/App.integration.test.tsx
git commit -m "Swap entity link pickers onto the typeahead Combobox"
```

---

## Task 10: Verify Phase A and open PR A

**Files:** none.

- [ ] **Step 1: Push the branch**

```bash
git push origin feat/thinkflow-studio
```

- [ ] **Step 2: Watch CI**

```bash
gh run list --workflow=ci.yml --limit 1 --json databaseId,status,conclusion
```

Poll until `status` is `completed`. On failure, fetch logs:

```bash
gh api repos/WaseemAbbaspk/ThinkFlow/actions/runs/<runId>/jobs --jq '.jobs[0].id'
gh api repos/WaseemAbbaspk/ThinkFlow/actions/jobs/<jobId>/logs
```

- [ ] **Step 3: Confirm the bundle budget held**

In the `Bundle budget` step output, read the `entry chunk index-*.js: NNN.N kB gzipped` line.

**If it is over 200 kB, stop and report the number.** Do not raise the budget to make the build pass — the spec is explicit that busting it is a conversation, not a number to edit. Check first that mermaid landed in its own chunk: `dist/assets/` should list a second large `.js` file alongside the entry chunk.

- [ ] **Step 4: Open PR A**

```bash
gh pr create --base main --head feat/thinkflow-studio \
  --title "Live diagrams and typeahead link pickers" \
  --body "$(cat <<'EOF'
Renders Mermaid for real and replaces the entity-link multi-selects.

- `DiagramView` renders the traceability chain and both architecture diagrams,
  with pan/zoom, a source toggle, and click-a-node-to-navigate on the chain.
- mermaid is code-split behind a dynamic import; a new CI step fails the build
  if the entry chunk exceeds 200 kB gzipped.
- `LinkSelect` now renders a cmdk typeahead with removable chips. Its prop
  signature is unchanged, so all six stage-form call sites are untouched.
- `SelectField` stays a native `<select>` for short enums.

Spec: `docs/superpowers/specs/2026-07-30-studio-interactive-ui-design.md`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 5: Report the CI result and the bundle number, then stop for review.**

---

# Phase B — PR B: task board and command palette

Start Phase B only after PR A is merged. Rebase first:

```bash
git checkout feat/thinkflow-studio
git fetch origin && git rebase origin/main
```

## Task 11: REORDER_TASKS

**Files:**
- Modify: `app/src/model/types.ts`
- Modify: `app/src/state/projectStore.tsx`
- Modify: `app/src/state/projectStore.test.tsx`

**Interfaces:**
- Produces: `TASK_STATUSES: readonly TaskStatus[]` from `@/model/types`; reducer action `{ type: 'REORDER_TASKS'; from: string; to: string }`.

Ids rather than indices, because a column's visible index is not an index into `project.tasks`.

- [ ] **Step 1: Write the failing test**

Add to `app/src/state/projectStore.test.tsx`:

```ts
describe('REORDER_TASKS', () => {
  function threeTasks() {
    let s = reducer(initialState(), { type: 'ADD_TASK' });
    s = reducer(s, { type: 'ADD_TASK' });
    s = reducer(s, { type: 'ADD_TASK' });
    return s;
  }

  it('moves a task to the position of another', () => {
    const s = reducer(threeTasks(), { type: 'REORDER_TASKS', from: 'TASK-1', to: 'TASK-3' });
    expect(s.project.tasks.map(t => t.id)).toEqual(['TASK-2', 'TASK-3', 'TASK-1']);
  });

  it('moves backwards too', () => {
    const s = reducer(threeTasks(), { type: 'REORDER_TASKS', from: 'TASK-3', to: 'TASK-1' });
    expect(s.project.tasks.map(t => t.id)).toEqual(['TASK-3', 'TASK-1', 'TASK-2']);
  });

  it('is a no-op when an id is unknown', () => {
    const before = threeTasks();
    const after = reducer(before, { type: 'REORDER_TASKS', from: 'TASK-1', to: 'TASK-9' });
    expect(after).toBe(before);
  });

  it('is a no-op when moving a task onto itself', () => {
    const before = threeTasks();
    const after = reducer(before, { type: 'REORDER_TASKS', from: 'TASK-2', to: 'TASK-2' });
    expect(after).toBe(before);
  });

  it('does not disturb id counters', () => {
    const s = reducer(threeTasks(), { type: 'REORDER_TASKS', from: 'TASK-1', to: 'TASK-3' });
    expect(s.project.meta.counters.TASK).toBe(3);
  });
});
```

- [ ] **Step 2: Run and confirm it fails**

Run: `npx vitest run src/state/projectStore.test.tsx`
Expected: FAIL — TypeScript rejects the unknown action type.

- [ ] **Step 3: Export the status list**

In `app/src/model/types.ts`, below the `TaskStatus` type:

```ts
export const TASK_STATUSES = ['Todo', 'In progress', 'In review', 'Done'] as const satisfies readonly TaskStatus[];
```

- [ ] **Step 4: Add the action**

In `app/src/state/projectStore.tsx`, extend the `Action` union:

```ts
  | { type: 'REORDER_TASKS'; from: string; to: string }
```

and add the case beside `DELETE_TASK`:

```ts
    case 'REORDER_TASKS': {
      const from = p.tasks.findIndex(t => t.id === action.from);
      const to = p.tasks.findIndex(t => t.id === action.to);
      if (from === -1 || to === -1 || from === to) return state;
      const tasks = [...p.tasks];
      const [moved] = tasks.splice(from, 1);
      tasks.splice(to, 0, moved);
      return { ...state, project: touch({ ...p, tasks }) };
    }
```

Reordering never changes an id, so `nextId` and the blank-entity reclamation logic are untouched.

- [ ] **Step 5: Run the tests**

Run: `npx vitest run src/state/projectStore.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/src/model/types.ts app/src/state/projectStore.tsx app/src/state/projectStore.test.tsx
git commit -m "Add REORDER_TASKS action for board drag ordering"
```

---

## Task 12: resolveDrop

**Files:**
- Create: `app/src/components/taskBoardDnd.ts`
- Create: `app/src/components/taskBoardDnd.test.ts`

**Interfaces:**
- Consumes: `Task`, `TaskStatus`, `TASK_STATUSES` from `@/model/types`.
- Produces: `COLUMN_PREFIX = 'column:'`, `BoardDrop`, `columnId(status)`, and `resolveDrop(tasks, activeId, overId): BoardDrop | null`.

This module exists because jsdom has no layout and dnd-kit resolves drops by measuring rects. Putting the decision in a pure function is the only way to test it honestly.

- [ ] **Step 1: Write the failing test**

Create `app/src/components/taskBoardDnd.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { resolveDrop, columnId } from './taskBoardDnd';
import type { Task } from '@/model/types';

function task(id: string, status: Task['status']): Task {
  return {
    id, title: '', tracesTo: [], dependsOn: [], goal: '', contextForAgent: '',
    acceptance: [], outOfScope: '', status,
  };
}

const TASKS: Task[] = [
  task('TASK-1', 'Todo'),
  task('TASK-2', 'Todo'),
  task('TASK-3', 'Done'),
];

describe('resolveDrop', () => {
  it('changes status when dropped on empty column space', () => {
    expect(resolveDrop(TASKS, 'TASK-1', columnId('In review')))
      .toEqual({ kind: 'status', status: 'In review' });
  });

  it('reorders when dropped on a card in the same column', () => {
    expect(resolveDrop(TASKS, 'TASK-1', 'TASK-2'))
      .toEqual({ kind: 'reorder', from: 'TASK-1', to: 'TASK-2' });
  });

  it('changes status and reorders when dropped on a card in another column', () => {
    expect(resolveDrop(TASKS, 'TASK-1', 'TASK-3'))
      .toEqual({ kind: 'status+reorder', status: 'Done', from: 'TASK-1', to: 'TASK-3' });
  });

  it('is null when dropped on its own column', () => {
    expect(resolveDrop(TASKS, 'TASK-1', columnId('Todo'))).toBeNull();
  });

  it('is null when dropped on itself', () => {
    expect(resolveDrop(TASKS, 'TASK-1', 'TASK-1')).toBeNull();
  });

  it('is null for an unknown active id', () => {
    expect(resolveDrop(TASKS, 'TASK-9', 'TASK-1')).toBeNull();
  });

  it('is null for an unknown over id', () => {
    expect(resolveDrop(TASKS, 'TASK-1', 'TASK-9')).toBeNull();
  });

  it('is null for a column id that is not a real status', () => {
    expect(resolveDrop(TASKS, 'TASK-1', 'column:Nonsense')).toBeNull();
  });
});
```

- [ ] **Step 2: Run and confirm it fails**

Run: `npx vitest run src/components/taskBoardDnd.test.ts`
Expected: FAIL — cannot resolve `./taskBoardDnd`.

- [ ] **Step 3: Write the implementation**

Create `app/src/components/taskBoardDnd.ts`:

```ts
import { TASK_STATUSES, type Task, type TaskStatus } from '@/model/types';

export const COLUMN_PREFIX = 'column:';

export function columnId(status: TaskStatus): string {
  return `${COLUMN_PREFIX}${status}`;
}

export type BoardDrop =
  | { kind: 'status'; status: TaskStatus }
  | { kind: 'reorder'; from: string; to: string }
  | { kind: 'status+reorder'; status: TaskStatus; from: string; to: string };

/**
 * Decide what a drop means. `overId` is either a task id or `column:<Status>`.
 * Returns null for anything that should be ignored, so a stale drag cannot
 * corrupt the list.
 */
export function resolveDrop(tasks: Task[], activeId: string, overId: string): BoardDrop | null {
  const active = tasks.find(t => t.id === activeId);
  if (!active) return null;

  if (overId.startsWith(COLUMN_PREFIX)) {
    const status = overId.slice(COLUMN_PREFIX.length) as TaskStatus;
    if (!TASK_STATUSES.includes(status)) return null;
    if (status === active.status) return null;
    return { kind: 'status', status };
  }

  const over = tasks.find(t => t.id === overId);
  if (!over || over.id === active.id) return null;

  if (over.status === active.status) {
    return { kind: 'reorder', from: activeId, to: overId };
  }
  return { kind: 'status+reorder', status: over.status, from: activeId, to: overId };
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/components/taskBoardDnd.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add app/src/components/taskBoardDnd.ts app/src/components/taskBoardDnd.test.ts
git commit -m "Add pure drop resolution for the task board"
```

---

## Task 13: ToggleGroup primitive and the Board/List switch

**Files:**
- Create: `app/src/components/ui/toggle-group.tsx`
- Modify: `app/src/stages/TasksForm.tsx`
- Modify: `app/src/stages/TasksForm.test.tsx`
- Modify: `app/package.json`, `app/package-lock.json`

**Interfaces:**
- Produces: `ToggleGroup`, `ToggleGroupItem`; `TASKS_VIEW_STORAGE_KEY = 'thinkflow.tasksView'`.

Default is `list`, so nothing changes for existing users until they opt in. The board itself lands in Task 14; this task wires the switch and renders a placeholder.

- [ ] **Step 1: Install the Phase B dependencies**

```bash
cd app
npm install --ignore-scripts @dnd-kit/core@6.3.1 @dnd-kit/sortable@10.0.0 @dnd-kit/utilities@3.2.2 @radix-ui/react-toggle-group@1.1.19
```

- [ ] **Step 2: Write the failing test**

Add to `app/src/stages/TasksForm.test.tsx`:

```tsx
  it('defaults to the list view and remembers a switch to board', async () => {
    localStorage.clear();
    const { unmount } = render(<ProjectProvider><TasksForm /></ProjectProvider>);
    expect(screen.getByRole('button', { name: /add task/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('radio', { name: 'Board' }));
    expect(screen.queryByRole('button', { name: /add task/i })).not.toBeInTheDocument();
    unmount();

    render(<ProjectProvider><TasksForm /></ProjectProvider>);
    expect(screen.queryByRole('button', { name: /add task/i })).not.toBeInTheDocument();
  });
```

Radix `ToggleGroup` items expose `role="radio"` in single mode.

`TasksForm.test.tsx` uses a bare `<ProjectProvider>`, matching the file's existing style. No `ThemeProvider` is needed here — neither `TasksForm` nor `TaskBoard` calls `useTheme()`. Keep it that way; do not add a diagram to this stage.

- [ ] **Step 3: Run and confirm it fails**

Run: `npx vitest run src/stages/TasksForm.test.tsx`
Expected: FAIL — no `radio` named `Board`.

- [ ] **Step 4: Vendor ToggleGroup**

Create `app/src/components/ui/toggle-group.tsx`:

```tsx
import * as React from 'react';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { cn } from '@/lib/utils';

export const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn('inline-flex items-center gap-1 rounded-[6px] border border-border bg-muted p-0.5', className)}
    {...props}
  />
));
ToggleGroup.displayName = 'ToggleGroup';

export const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>
>(({ className, ...props }, ref) => (
  <ToggleGroupPrimitive.Item
    ref={ref}
    className={cn(
      'inline-flex items-center gap-1.5 rounded-[5px] px-2.5 py-1 text-[13px] font-medium',
      'text-muted-foreground transition-colors hover:text-foreground',
      'data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-sm',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      className,
    )}
    {...props}
  />
));
ToggleGroupItem.displayName = 'ToggleGroupItem';
```

- [ ] **Step 5: Wire the switch into TasksForm**

In `app/src/stages/TasksForm.tsx`, add imports:

```tsx
import { useState } from 'react';
import { LayoutGrid, Rows3 } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
```

Add above the component:

```tsx
export const TASKS_VIEW_STORAGE_KEY = 'thinkflow.tasksView';
type TasksView = 'board' | 'list';

function readStoredView(): TasksView {
  try {
    return localStorage.getItem(TASKS_VIEW_STORAGE_KEY) === 'board' ? 'board' : 'list';
  } catch {
    return 'list'; // private mode / storage disabled
  }
}
```

Inside `TasksForm`, add state and persistence:

```tsx
  const [view, setView] = useState<TasksView>(readStoredView);

  function changeView(next: string) {
    if (next !== 'board' && next !== 'list') return; // Radix sends '' on deselect
    setView(next);
    try { localStorage.setItem(TASKS_VIEW_STORAGE_KEY, next); } catch { /* ignore */ }
  }
```

Wrap the return so the switch sits above the content:

```tsx
  return (
    <div className="tasks-form">
      <div className="mb-4 flex justify-end">
        <ToggleGroup type="single" value={view} onValueChange={changeView} aria-label="Task view">
          <ToggleGroupItem value="board" aria-label="Board">
            <LayoutGrid aria-hidden="true" className="size-4" />
            Board
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="List">
            <Rows3 aria-hidden="true" className="size-4" />
            List
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {view === 'board' ? (
        <p className="text-sm text-muted-foreground">Board coming in the next task.</p>
      ) : (
        <SectionCard title="Tasks" count={tasks.length}>
          {/* the existing RepeatableList block, unchanged */}
        </SectionCard>
      )}
    </div>
  );
```

The item text is `Board` / `List` and the `aria-label` matches, so the accessible name is unambiguous even with the icon present.

- [ ] **Step 6: Run the tests**

Run: `npx vitest run src/stages/TasksForm.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add app/package.json app/package-lock.json app/src/components/ui/toggle-group.tsx app/src/stages/TasksForm.tsx app/src/stages/TasksForm.test.tsx
git commit -m "Add Board/List switch to the Tasks stage"
```

---

## Task 14: TaskBoard columns, cards and status fallback

**Files:**
- Create: `app/src/components/TaskBoard.tsx`
- Create: `app/src/components/TaskBoard.test.tsx`
- Modify: `app/src/stages/TasksForm.tsx`

**Interfaces:**
- Consumes: `TASK_STATUSES` (Task 11), `columnId` (Task 12), `useProject`.
- Produces: `TaskBoard` with props `{ onOpenTask: (id: string) => void }`.

dnd-kit wiring arrives in Task 15. This task builds the static board plus the keyboard-accessible status fallback.

- [ ] **Step 1: Write the failing test**

Create `app/src/components/TaskBoard.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { TaskBoard } from './TaskBoard';

describe('TaskBoard', () => {
  it('shows every status column with a count', () => {
    renderWithProviders(<TaskBoard onOpenTask={vi.fn()} />);
    for (const s of ['Todo', 'In progress', 'In review', 'Done']) {
      expect(screen.getByRole('group', { name: new RegExp(`^${s}`, 'i') })).toBeInTheDocument();
    }
  });

  it('shows Untitled for a task with no title', async () => {
    renderWithProviders(<TaskBoard onOpenTask={vi.fn()} />);
    // no tasks yet, so add one through the empty-state button
    await userEvent.click(screen.getByRole('button', { name: /add task/i }));
    expect(screen.getByText('Untitled')).toBeInTheDocument();
  });

  it('moves a card between columns through the status fallback', async () => {
    renderWithProviders(<TaskBoard onOpenTask={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /add task/i }));

    const todo = screen.getByRole('group', { name: /^Todo/i });
    await userEvent.selectOptions(within(todo).getByLabelText('Status'), 'Done');

    const done = screen.getByRole('group', { name: /^Done/i });
    expect(within(done).getByText('TASK-1')).toBeInTheDocument();
    expect(within(screen.getByRole('group', { name: /^Todo/i })).queryByText('TASK-1')).not.toBeInTheDocument();
  });

  it('opens a task for editing when its card is clicked', async () => {
    const onOpenTask = vi.fn();
    renderWithProviders(<TaskBoard onOpenTask={onOpenTask} />);
    await userEvent.click(screen.getByRole('button', { name: /add task/i }));
    await userEvent.click(screen.getByRole('button', { name: /edit TASK-1/i }));
    expect(onOpenTask).toHaveBeenCalledWith('TASK-1');
  });
});
```

- [ ] **Step 2: Run and confirm it fails**

Run: `npx vitest run src/components/TaskBoard.test.tsx`
Expected: FAIL — cannot resolve `./TaskBoard`.

- [ ] **Step 3: Write the board**

Create `app/src/components/TaskBoard.tsx`:

```tsx
import { Plus } from 'lucide-react';
import { useProject } from '@/state/projectStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { TASK_STATUSES, type Task, type TaskStatus } from '@/model/types';
import { columnId } from '@/components/taskBoardDnd';
import { cn } from '@/lib/utils';

export interface TaskBoardProps {
  onOpenTask: (id: string) => void;
}

function TaskCard({ task, onOpenTask }: { task: Task; onOpenTask: (id: string) => void }) {
  const { dispatch } = useProject();
  const selectId = `status-${task.id}`;

  return (
    <Card className="flex flex-col gap-2 p-3">
      <div className="flex items-center justify-between gap-2">
        <Badge>{task.id}</Badge>
        <span className="font-mono text-[11px] text-muted-foreground">
          {task.tracesTo.length}t / {task.dependsOn.length}d
        </span>
      </div>

      <button
        type="button"
        aria-label={`Edit ${task.id}`}
        onClick={() => onOpenTask(task.id)}
        className="text-left text-sm hover:text-primary"
      >
        <span className={cn(!task.title && 'text-muted-foreground')}>
          {task.title || 'Untitled'}
        </span>
      </button>

      {/* Non-pointer fallback: status must never require a drag. */}
      <div className="flex items-center gap-2">
        <Label htmlFor={selectId} className="text-[11px] text-muted-foreground">Status</Label>
        <select
          id={selectId}
          value={task.status}
          onChange={e => dispatch({
            type: 'UPDATE_TASK', id: task.id, patch: { status: e.target.value as TaskStatus },
          })}
          className="flex-1 rounded-[6px] border border-input bg-card px-2 py-1 text-[12px] text-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-accent"
        >
          {TASK_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    </Card>
  );
}

export function TaskBoard({ onOpenTask }: TaskBoardProps) {
  const { state, dispatch } = useProject();
  const tasks = state.project.tasks;

  return (
    <div className="flex flex-col gap-3">
      <Button variant="secondary" size="sm" className="self-start" onClick={() => dispatch({ type: 'ADD_TASK' })}>
        <Plus aria-hidden="true" />
        Add task
      </Button>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {TASK_STATUSES.map(status => {
          const inColumn = tasks.filter(t => t.status === status);
          return (
            <section
              key={status}
              id={columnId(status)}
              role="group"
              aria-label={`${status} (${inColumn.length})`}
              className="flex min-h-32 flex-col gap-2 rounded-[6px] border border-border bg-muted/40 p-2"
            >
              <header className="flex items-center gap-2 px-1">
                <h3 className="text-[13px] font-semibold tracking-tight">{status}</h3>
                <Badge>{inColumn.length}</Badge>
              </header>
              {inColumn.map(task => (
                <TaskCard key={task.id} task={task} onOpenTask={onOpenTask} />
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Render it from TasksForm**

In `app/src/stages/TasksForm.tsx`, import `TaskBoard` and replace the placeholder paragraph:

```tsx
      {view === 'board' ? (
        <TaskBoard onOpenTask={() => changeView('list')} />
      ) : (
```

Focusing the specific task's title input comes in Task 15; switching to List is the useful half and ships now.

- [ ] **Step 5: Run the tests**

Run: `npx vitest run src/components/TaskBoard.test.tsx src/stages/TasksForm.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/src/components/TaskBoard.tsx app/src/components/TaskBoard.test.tsx app/src/stages/TasksForm.tsx
git commit -m "Add the task board with status columns and a keyboard fallback"
```

---

## Task 15: Wire dnd-kit onto the board

**Files:**
- Modify: `app/src/components/TaskBoard.tsx`
- Modify: `app/src/components/TaskBoard.test.tsx`

**Interfaces:**
- Consumes: `resolveDrop`, `columnId` (Task 12); `REORDER_TASKS` (Task 11).
- Produces: no new exports. The board dispatches on drop.

Keep this layer logic-free: `handleDragEnd` translates a `BoardDrop` into dispatches and nothing more. Everything decidable was already decided and tested in Task 12.

- [ ] **Step 1: Add the failing test**

Add to `app/src/components/TaskBoard.test.tsx`:

```tsx
  it('marks cards as draggable', async () => {
    renderWithProviders(<TaskBoard onOpenTask={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /add task/i }));
    expect(screen.getByRole('button', { name: /drag TASK-1/i })).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run and confirm it fails**

Run: `npx vitest run src/components/TaskBoard.test.tsx`
Expected: FAIL — no `Drag TASK-1` button.

- [ ] **Step 3: Add the dnd-kit wiring**

In `app/src/components/TaskBoard.tsx`, add imports:

```tsx
import { GripVertical } from 'lucide-react';
import {
  DndContext, KeyboardSensor, PointerSensor, closestCorners,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { resolveDrop } from '@/components/taskBoardDnd';
```

Make `TaskCard` sortable — add at the top of its body:

```tsx
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
```

and apply to the `Card`:

```tsx
    <Card
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('flex flex-col gap-2 p-3', isDragging && 'opacity-50')}
    >
```

Add a drag handle beside the id badge, so dragging never steals the card's click target:

```tsx
        <button
          type="button"
          aria-label={`Drag ${task.id}`}
          className="cursor-grab text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical aria-hidden="true" className="size-4" />
        </button>
```

Each column needs `useDroppable`, and a hook cannot be called inside the `TASK_STATUSES.map` callback. Extract the column into its own component:

```tsx
function BoardColumn({
  status, tasks, onOpenTask,
}: { status: TaskStatus; tasks: Task[]; onOpenTask: (id: string) => void }) {
  const { setNodeRef } = useDroppable({ id: columnId(status) });
  return (
    <section
      ref={setNodeRef}
      role="group"
      aria-label={`${status} (${tasks.length})`}
      className="flex min-h-32 flex-col gap-2 rounded-[6px] border border-border bg-muted/40 p-2"
    >
      <header className="flex items-center gap-2 px-1">
        <h3 className="text-[13px] font-semibold tracking-tight">{status}</h3>
        <Badge>{tasks.length}</Badge>
      </header>
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        {tasks.map(task => <TaskCard key={task.id} task={task} onOpenTask={onOpenTask} />)}
      </SortableContext>
    </section>
  );
}
```

Then in `TaskBoard`, wrap the grid and handle drops:

```tsx
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const overId = event.over?.id;
    if (!overId) return;
    const drop = resolveDrop(tasks, String(event.active.id), String(overId));
    if (!drop) return;

    if (drop.kind === 'status' || drop.kind === 'status+reorder') {
      dispatch({ type: 'UPDATE_TASK', id: String(event.active.id), patch: { status: drop.status } });
    }
    if (drop.kind === 'reorder' || drop.kind === 'status+reorder') {
      dispatch({ type: 'REORDER_TASKS', from: drop.from, to: drop.to });
    }
  }
```

```tsx
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {TASK_STATUSES.map(status => (
            <BoardColumn
              key={status}
              status={status}
              tasks={tasks.filter(t => t.status === status)}
              onOpenTask={onOpenTask}
            />
          ))}
        </div>
      </DndContext>
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/components/TaskBoard.test.tsx`
Expected: PASS, 5 tests.

If dnd-kit warns about missing `getBoundingClientRect`, that is jsdom having no layout and is expected — it must not fail the suite. If it does, add `aria-describedby={undefined}` to `DndContext`'s accessibility prop rather than silencing the warning globally.

- [ ] **Step 5: Commit**

```bash
git add app/src/components/TaskBoard.tsx app/src/components/TaskBoard.test.tsx
git commit -m "Wire dnd-kit drag and drop onto the task board"
```

---

## Task 16: Command palette shell

**Files:**
- Create: `app/src/components/ui/dialog.tsx`
- Create: `app/src/components/CommandPalette.tsx`
- Create: `app/src/components/CommandPalette.test.tsx`
- Modify: `app/src/components/AppShell.tsx`

**Interfaces:**
- Consumes: `Command*` (Task 7).
- Produces: `Dialog`, `DialogContent`, `DialogTitle`; `CommandPalette` (no props).

Groups arrive in Task 17. This task builds the shell, the Ctrl+K binding and the mount.

- [ ] **Step 1: Write the failing test**

Create `app/src/components/CommandPalette.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { CommandPalette } from './CommandPalette';

describe('CommandPalette', () => {
  it('is closed until Ctrl+K', async () => {
    renderWithProviders(<CommandPalette />);
    expect(screen.queryByRole('dialog', { name: /command palette/i })).not.toBeInTheDocument();
    await userEvent.keyboard('{Control>}k{/Control}');
    expect(await screen.findByRole('dialog', { name: /command palette/i })).toBeInTheDocument();
  });

  it('opens with Meta+K too', async () => {
    renderWithProviders(<CommandPalette />);
    await userEvent.keyboard('{Meta>}k{/Meta}');
    expect(await screen.findByRole('dialog', { name: /command palette/i })).toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    renderWithProviders(<CommandPalette />);
    await userEvent.keyboard('{Control>}k{/Control}');
    await screen.findByRole('dialog', { name: /command palette/i });
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: /command palette/i })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run and confirm it fails**

Run: `npx vitest run src/components/CommandPalette.test.tsx`
Expected: FAIL — cannot resolve `./CommandPalette`.

- [ ] **Step 3: Vendor a centred Dialog**

Create `app/src/components/ui/dialog.tsx`:

```tsx
import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-1/2 top-[15%] z-50 w-[92vw] max-w-lg -translate-x-1/2',
        'rounded-[6px] border border-border bg-card shadow-xl outline-none',
        className,
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = 'DialogContent';

export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;
```

- [ ] **Step 4: Write the palette shell**

Create `app/src/components/CommandPalette.tsx`:

```tsx
import { useEffect, useState } from 'react';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Command, CommandInput, CommandList, CommandEmpty } from '@/components/ui/command';

export function CommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Modifier-based, so it is safe to fire while the user is typing.
      if (e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setOpen(o => !o);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent aria-label="Command palette" aria-describedby={undefined} className="p-0">
        <VisuallyHidden.Root>
          <DialogTitle>Command palette</DialogTitle>
        </VisuallyHidden.Root>
        <Command>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No matches.</CommandEmpty>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
```

`@radix-ui/react-visually-hidden` is already present as a transitive dependency of the Radix packages in use. If the import fails to resolve, install it explicitly with `npm install --ignore-scripts @radix-ui/react-visually-hidden` rather than dropping the title — Radix Dialog requires an accessible title.

- [ ] **Step 5: Mount it**

In `app/src/components/AppShell.tsx`, import `CommandPalette` and render it beside `<Toaster />`:

```tsx
      <CommandPalette />
      <Toaster />
```

- [ ] **Step 6: Run the tests**

Run: `npx vitest run src/components/CommandPalette.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 7: Commit**

```bash
git add app/src/components/ui/dialog.tsx app/src/components/CommandPalette.tsx app/src/components/CommandPalette.test.tsx app/src/components/AppShell.tsx
git commit -m "Add the command palette shell on Ctrl+K"
```

---

## Task 17: Palette groups

**Files:**
- Modify: `app/src/components/CommandPalette.tsx`
- Modify: `app/src/components/CommandPalette.test.tsx`

**Interfaces:**
- Consumes: `entityIndex` (Task 2), `useProject`, `useTheme`.
- Produces: no new exports.

- [ ] **Step 1: Add the failing tests**

Add to `app/src/components/CommandPalette.test.tsx`:

```tsx
  it('navigates to a stage', async () => {
    renderWithProviders(<><CommandPalette /><ViewProbe /></>);
    await userEvent.keyboard('{Control>}k{/Control}');
    await userEvent.click(await screen.findByRole('option', { name: /architecture/i }));
    expect(screen.getByTestId('view')).toHaveTextContent('architecture');
  });

  it('creates an entity and lands on its stage', async () => {
    renderWithProviders(<><CommandPalette /><ViewProbe /></>);
    await userEvent.keyboard('{Control>}k{/Control}');
    await userEvent.click(await screen.findByRole('option', { name: /new task/i }));
    expect(screen.getByTestId('view')).toHaveTextContent('tasks');
    expect(screen.getByTestId('task-count')).toHaveTextContent('1');
  });

  it('jumps to an existing entity', async () => {
    renderWithProviders(<><CommandPalette /><ViewProbe /></>);
    await userEvent.keyboard('{Control>}k{/Control}');
    await userEvent.click(await screen.findByRole('option', { name: /new task/i }));

    await userEvent.keyboard('{Control>}k{/Control}');
    await userEvent.type(screen.getByPlaceholderText(/type a command/i), 'TASK-1');
    await userEvent.click(await screen.findByRole('option', { name: /TASK-1/ }));
    expect(screen.getByTestId('view')).toHaveTextContent('tasks');
  });
```

Add this probe above the `describe`:

```tsx
function ViewProbe() {
  const { state } = useProject();
  return (
    <>
      <span data-testid="view">{state.view}</span>
      <span data-testid="task-count">{state.project.tasks.length}</span>
    </>
  );
}
```

with `import { useProject } from '@/state/projectStore';`.

- [ ] **Step 2: Run and confirm they fail**

Run: `npx vitest run src/components/CommandPalette.test.tsx`
Expected: the three new cases FAIL — no options rendered.

- [ ] **Step 3: Add the groups**

Replace the `<CommandList>` contents in `app/src/components/CommandPalette.tsx`:

```tsx
          <CommandList>
            <CommandEmpty>No matches.</CommandEmpty>

            <CommandGroup heading="Go to">
              {VIEWS.map(({ view, label }) => (
                <CommandItem key={view} value={`go ${label}`} onSelect={() => run(() => dispatch({ type: 'SET_VIEW', view }))}>
                  {label}
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandGroup heading="Create">
              {CREATORS.map(({ label, action, view }) => (
                <CommandItem key={label} value={label} onSelect={() => run(() => {
                  dispatch(action);
                  dispatch({ type: 'SET_VIEW', view });
                })}>
                  {label}
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandGroup heading="Jump to entity">
              {[...entityIndex(state.project).values()].map(e => (
                <CommandItem
                  key={e.id}
                  value={`${e.id} ${e.label}`}
                  onSelect={() => run(() => dispatch({ type: 'SET_VIEW', view: e.view }))}
                >
                  <span className="font-mono text-[11px] text-muted-foreground">{e.id}</span>
                  {e.label !== e.id && <span className="truncate">{e.label}</span>}
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandGroup heading="Actions">
              <CommandItem value="toggle theme" onSelect={() => run(() => setTheme(resolved === 'dark' ? 'light' : 'dark'))}>
                Toggle theme
              </CommandItem>
              <CommandItem value="export" onSelect={() => run(() => dispatch({ type: 'SET_VIEW', view: 'export' }))}>
                Go to export
              </CommandItem>
            </CommandGroup>
          </CommandList>
```

Add above the component:

```tsx
const VIEWS: { view: View; label: string }[] = [
  { view: 'vision', label: 'Vision' },
  { view: 'requirements', label: 'Requirements' },
  { view: 'architecture', label: 'Architecture' },
  { view: 'tasks', label: 'Tasks' },
  { view: 'testing', label: 'Testing' },
  { view: 'traceability', label: 'Traceability' },
  { view: 'export', label: 'Export' },
];

const CREATORS: { label: string; action: Action; view: View }[] = [
  { label: 'New goal', action: { type: 'ADD_GOAL' }, view: 'requirements' },
  { label: 'New story', action: { type: 'ADD_STORY' }, view: 'requirements' },
  { label: 'New NFR', action: { type: 'ADD_NFR' }, view: 'requirements' },
  { label: 'New ADR', action: { type: 'ADD_ADR' }, view: 'architecture' },
  { label: 'New task', action: { type: 'ADD_TASK' }, view: 'tasks' },
  { label: 'New test', action: { type: 'ADD_TEST' }, view: 'testing' },
];
```

and inside the component:

```tsx
  const { state, dispatch } = useProject();
  const { setTheme, resolved } = useTheme();

  function run(fn: () => void) {
    fn();
    setOpen(false);
  }
```

with imports:

```tsx
import { useProject, type Action, type View } from '@/state/projectStore';
import { useTheme } from '@/state/theme';
import { entityIndex } from '@/model/registry';
import { CommandGroup, CommandItem } from '@/components/ui/command';
```

`Action` and `View` must be exported from `projectStore.tsx` — `View` already is; add `export` to the `Action` type if it is not already exported.

**Deliberately omitted:** direct Markdown/JSON/ZIP export commands. Those handlers live inside `ExportPanel` and are not currently callable from outside it. Extracting them is a refactor beyond this plan's scope, so the palette routes to the Export stage instead. Note this in the PR description.

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/components/CommandPalette.test.tsx`
Expected: PASS, 6 tests.

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/src/components/CommandPalette.tsx app/src/components/CommandPalette.test.tsx app/src/state/projectStore.tsx
git commit -m "Add navigation, creation and entity groups to the palette"
```

---

## Task 18: Stage shortcuts and the shortcuts sheet

**Files:**
- Modify: `app/src/components/CommandPalette.tsx`
- Modify: `app/src/components/CommandPalette.test.tsx`

**Interfaces:**
- Produces: a dialog named `Keyboard shortcuts`.

`Ctrl+1..5` fires anywhere. The bare `?` is guarded — it must never fire while the user is typing.

- [ ] **Step 1: Add the failing tests**

```tsx
  it('jumps to a stage with Ctrl+3', async () => {
    renderWithProviders(<><CommandPalette /><ViewProbe /></>);
    await userEvent.keyboard('{Control>}3{/Control}');
    expect(screen.getByTestId('view')).toHaveTextContent('architecture');
  });

  it('opens the shortcuts sheet with ?', async () => {
    renderWithProviders(<CommandPalette />);
    await userEvent.keyboard('?');
    expect(await screen.findByRole('dialog', { name: /keyboard shortcuts/i })).toBeInTheDocument();
  });

  it('does not open the shortcuts sheet while typing in a field', async () => {
    renderWithProviders(<><CommandPalette /><input aria-label="Some field" /></>);
    await userEvent.click(screen.getByLabelText('Some field'));
    await userEvent.keyboard('?');
    expect(screen.queryByRole('dialog', { name: /keyboard shortcuts/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Some field')).toHaveValue('?');
  });
```

- [ ] **Step 2: Run and confirm they fail**

Run: `npx vitest run src/components/CommandPalette.test.tsx`
Expected: the three new cases FAIL.

- [ ] **Step 3: Extend the key handler**

Add above the component:

```tsx
const STAGE_KEYS: View[] = ['vision', 'requirements', 'architecture', 'tasks', 'testing'];

const SHORTCUTS: { keys: string; description: string }[] = [
  { keys: 'Ctrl+K', description: 'Open the command palette' },
  { keys: 'Ctrl+1..5', description: 'Jump to a stage' },
  { keys: '?', description: 'Show this list' },
  { keys: 'Esc', description: 'Close a dialog' },
];

/** The bare `?` must not fire while the user is typing. Modified keys are safe. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT' ||
    target.isContentEditable
  );
}
```

Add `const [showShortcuts, setShowShortcuts] = useState(false);` and extend `onKeyDown`:

```tsx
      if (e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setOpen(o => !o);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && /^[1-5]$/.test(e.key)) {
        e.preventDefault();
        dispatch({ type: 'SET_VIEW', view: STAGE_KEYS[Number(e.key) - 1] });
        return;
      }

      if (e.key === '?' && !isTypingTarget(e.target)) {
        e.preventDefault();
        setShowShortcuts(true);
      }
```

Add `dispatch` to the effect's dependency array.

- [ ] **Step 4: Render the sheet**

Beside the palette `Dialog`, add:

```tsx
      <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
        <DialogContent aria-describedby={undefined} className="p-4">
          <DialogTitle className="mb-3 text-[15px] font-bold tracking-tight">
            Keyboard shortcuts
          </DialogTitle>
          <dl className="flex flex-col gap-2">
            {SHORTCUTS.map(s => (
              <div key={s.keys} className="flex items-center justify-between gap-4 text-sm">
                <dt className="text-muted-foreground">{s.description}</dt>
                <dd>
                  <kbd className="rounded-[3px] border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                    {s.keys}
                  </kbd>
                </dd>
              </div>
            ))}
          </dl>
        </DialogContent>
      </Dialog>
```

Wrap both dialogs in a fragment.

- [ ] **Step 5: Run the tests**

Run: `npx vitest run src/components/CommandPalette.test.tsx`
Expected: PASS, 9 tests.

- [ ] **Step 6: Commit**

```bash
git add app/src/components/CommandPalette.tsx app/src/components/CommandPalette.test.tsx
git commit -m "Add stage shortcuts and a keyboard shortcuts sheet"
```

---

## Task 19: Verify Phase B and open PR B

**Files:** none.

- [ ] **Step 1: Push and watch CI**

```bash
git push origin feat/thinkflow-studio
gh run list --workflow=ci.yml --limit 1 --json databaseId,status,conclusion
```

- [ ] **Step 2: Check the bundle budget again**

Read the `entry chunk` line. dnd-kit, cmdk and Popover all land in the entry chunk, so this is the run where the budget is most likely to bite. **If it is over 200 kB, report the number and stop** — do not edit the budget.

- [ ] **Step 3: Confirm the test count**

Expected: ~130 tests passing, up from 100.

- [ ] **Step 4: Open PR B**

```bash
gh pr create --base main --head feat/thinkflow-studio \
  --title "Task board and command palette" \
  --body "$(cat <<'EOF'
Adds the two new interactive surfaces.

- Tasks gains a Board/List switch. The board has one column per status,
  drag to change status or reorder, and a status `<select>` on every card so
  nothing requires a pointer.
- The drop decision lives in a pure `resolveDrop` module and is tested
  exhaustively; jsdom has no layout, so dnd-kit itself is not driven in tests
  and the drag path is verified in a browser.
- `REORDER_TASKS` moves tasks by id. It never touches id counters.
- Ctrl+K opens a command palette (go to / create / jump to entity / actions),
  Ctrl+1..5 jump between stages, `?` shows the shortcuts sheet.

Known gap: the palette routes to the Export stage rather than invoking the
Markdown/JSON/ZIP exports directly, because those handlers are currently private
to `ExportPanel`.

Spec: `docs/superpowers/specs/2026-07-30-studio-interactive-ui-design.md`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 5: Report the CI result, the bundle number and the test count.**

- [ ] **Step 6: Hand the browser checks to the user**

No browser tooling is reachable from this environment, so ask the user to confirm on the deployed site:

1. Traceability chain renders as a diagram; clicking a node navigates to its stage.
2. Pan, zoom and reset work; **View source** still shows the mermaid text.
3. Architecture context/component previews update as you type, and a half-typed diagram shows an error banner without blanking the last good render.
4. Link fields (Traces to, Depends on, Serves goal, Verifies, Relates to, ADRs) filter as you type; chips remove correctly.
5. Board/List toggle persists across a reload.
6. Dragging a card between columns changes its status; dragging within a column reorders.
7. Tabbing to a card's drag handle and using space + arrows moves it (the keyboard path is not covered by tests).
8. Ctrl+K, Ctrl+1..5 and `?` all work; `?` typed into a text field inserts a literal `?`.
9. Dark mode: diagrams re-render legibly after toggling the theme.
