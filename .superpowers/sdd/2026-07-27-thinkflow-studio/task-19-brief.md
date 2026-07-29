# Task 19 brief — Sidebar navigation with gap markers

Full task text from the plan (`docs/superpowers/plans/2026-07-27-thinkflow-studio.md`, "Task 19"):

**Files:**
- Create: `app/src/components/Sidebar.tsx`
- Test: `app/src/components/Sidebar.test.tsx`

**Interfaces:**
- Consumes: `useProject()`, `detectGaps` (from `app/src/model/traceability.ts`).
- Renders nav buttons for the **7 views**, dispatches `SET_VIEW`, marks the current view active, and shows a
  **⚠ marker** next to a stage that owns open gaps.

**The 7 views** (from the store's `View` type — read `app/src/state/projectStore.tsx` to confirm):
`vision`, `requirements`, `architecture`, `tasks`, `testing`, `traceability`, `export`.
Button labels (must match the test regexes): **Vision, Requirements, Architecture, Tasks, Testing,
Traceability, Export**.

**Gap-kind → stage mapping for the ⚠ marker** (gap kinds come from `detectGaps`:
`untested-criterion | orphan-task | unrealized-story | goalless-story | dangling-link`):
- `untested-criterion`, `goalless-story`, `unrealized-story` → mark **requirements** and **testing**
- `orphan-task`, `dangling-link` → mark **tasks**

So: compute `const gaps = detectGaps(project)`; a stage shows ⚠ if any gap whose kind maps to it exists.
Implement this as a small lookup (e.g. a `Record<View, Gap['kind'][]>` or a helper `stageHasGap(view)`).

**SET_VIEW dispatch:** each nav button dispatches `{ type: 'SET_VIEW', view }`. Mark the button for
`state.view` as active (e.g. `className="active"` or `aria-current="page"`).

**Step 1: Write the failing test** — use this EXACT test:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectProvider } from '../state/projectStore';
import { Sidebar } from './Sidebar';

it('renders all stage nav items', () => {
  render(<ProjectProvider><Sidebar /></ProjectProvider>);
  ['Vision','Requirements','Architecture','Tasks','Testing','Traceability','Export']
    .forEach(label => expect(screen.getByRole('button', { name: new RegExp(label,'i') })).toBeInTheDocument());
});
```
NOTE: `getByRole('button', { name: /Tasks/i })` must resolve UNIQUELY. "Tasks" is a substring of nothing
else here, but be careful the ⚠ marker text doesn't create ambiguous accessible names. Keep each button's
accessible name centered on its label (put the ⚠ in a `<span aria-hidden="true">` or as a title, so the
accessible name stays e.g. "Tasks", not "Tasks ⚠"). This keeps the getByRole name-regex matching clean.

**Step 2: Run, expect FAIL.**
**Step 3: Implement `Sidebar.tsx`.**
**Step 4: Run, expect PASS.**
**Step 5: Commit** — `git commit -m "Add sidebar navigation with gap markers"`

## Read before coding
- `app/src/state/projectStore.tsx` — `useProject()`, the `View` union, `SET_VIEW` action, `state.view`.
- `app/src/model/traceability.ts` — `detectGaps(project): Gap[]`, `Gap['kind']`.
- `app/src/components/ExportPanel.tsx` / `TraceabilityView.tsx` — component style references.
Match repo style (2-space indent, concise, strict TS). Do NOT modify the store or traceability.ts.

## CRITICAL ENVIRONMENT — tests run in Docker ONLY

Windows IT policy blocks npm native binaries. `node_modules` already installed — do NOT run `npm install`.
Use the Bash tool:
```
MSYS_NO_PATHCONV=1 docker run --rm -v /c/Users/waseem.abbas/ThinkFlow/app:/app -w /app node:20-bookworm npx vitest run src/components/Sidebar.test.tsx
```
Drop the trailing path for the full suite. ~30-45s per run. Focused test while iterating; FULL suite once
before committing. Baseline: 58 tests passing across 18 files — must stay green (your new test → 59).
If the Docker daemon isn't running, report BLOCKED (don't start it yourself).

## Standing rules
- Work from `C:\Users\waseem.abbas\ThinkFlow`. Only touch the two Task 19 files.
- Commits must NOT add any Claude/Claude Code co-author or attribution trailer.
- Write your full report to `.superpowers/sdd/2026-07-27-thinkflow-studio/task-19-report.md`
  with TDD evidence (RED cmd+output, GREEN cmd+output), files changed, self-review, concerns.
