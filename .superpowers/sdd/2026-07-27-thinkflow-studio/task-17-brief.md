# Task 17 brief — Traceability view (matrix + gap panel)

Full task text from the plan (`docs/superpowers/plans/2026-07-27-thinkflow-studio.md`, "Task 17"):

**Files:**
- Create: `app/src/components/TraceabilityView.tsx`
- Test: `app/src/components/TraceabilityView.test.tsx`

**Interfaces:**
- Consumes: `useProject()` (store), `buildMatrix`, `detectGaps` (from `app/src/model/traceability.ts`).
- Renders:
  1. A **table** from `buildMatrix(project)` with columns: **Story / Goal / Criterion / Tasks / Tests**.
     One `<tr>` per MatrixRow. Render `taskIds`/`testIds` arrays joined (e.g. comma-separated). Render
     `null` goalId/criterionId as an em-dash "—". Include a `<thead>` with the five column headers.
  2. A **`GapPanel`** listing `detectGaps(project)` messages (one per gap). When there are NO gaps, render
     exactly the text **"No gaps — every artifact is traced ✓"** (the test matches `/No gaps/i`).
  3. A **`<pre>`** containing a Mermaid chain string built from the project (see below).

**Exact shapes (from `app/src/model/traceability.ts` — already built, do NOT modify it):**
```ts
interface Gap { kind: 'untested-criterion'|'orphan-task'|'unrealized-story'|'goalless-story'|'dangling-link'; entityId: string; message: string; }
interface MatrixRow { storyId: string; goalId: string|null; criterionId: string|null; taskIds: string[]; testIds: string[]; }
detectGaps(project): Gap[]
buildMatrix(project): MatrixRow[]
```

**Step 1: Write the failing test** — use this EXACT test:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectProvider } from '../state/projectStore';
import { TraceabilityView } from './TraceabilityView';

it('shows the no-gaps message for an empty project', () => {
  render(<ProjectProvider><TraceabilityView /></ProjectProvider>);
  expect(screen.getByText(/No gaps/i)).toBeInTheDocument();
});
```
(An empty project has no stories/criteria/tasks/tests, so `detectGaps` returns `[]` → the no-gaps message shows.
You may add a second test rendering a project with a gap and asserting a gap message appears — optional but encouraged.)

**Step 2: Run, expect FAIL.**
**Step 3: Implement `TraceabilityView.tsx`.** Keep `GapPanel` as a small local component (or inline). Read
`project` from `useProject().state.project`. This view is READ-ONLY — it does not dispatch anything.
**Step 4: Run, expect PASS.**
**Step 5: Commit** — `git commit -m "Add traceability matrix and gap panel view"`

## Mermaid chain string
Build a simple textual Mermaid `graph`/`flowchart` string from the project that expresses the traceability
edges (Goal→Story→Criterion→Task/Test). A reasonable, self-consistent representation is fine — e.g. start
with `flowchart LR` and add one line per edge:
- `GOAL --> US` for each story with a `servesGoalId`
- `US --> AC` for each criterion (`criterion.storyId --> criterion.id`)
- `AC --> TASK` / `US --> TASK` for each task's `tracesTo` refs
- `AC --> TEST` for each test's `verifies`
Node ids in Mermaid can't contain a dot — AC ids look like `AC-1.1`. **Sanitize node ids** (e.g. replace
`.` with `_`) so the Mermaid parses; keep the original id as the node label, e.g. `AC-1_1["AC-1.1"]`.
Put the whole string inside a single `<pre>`. There is no strict format the test checks — just make it
coherent and parseable. Keep it a pure function of `project`.

## Read before coding
- `app/src/model/traceability.ts` — the two functions + types (shown above).
- `app/src/state/projectStore.tsx` — `useProject()` returns `{ state, dispatch }`; project at `state.project`.
- `app/src/stages/TasksForm.tsx` — repo component style reference.
Match repo style (2-space indent, concise, strict TS). Do NOT edit traceability.ts or the store.

## CRITICAL ENVIRONMENT — tests run in Docker ONLY

Windows IT policy blocks npm native binaries. `node_modules` already installed — do NOT run `npm install`.
Use the Bash tool:
```
MSYS_NO_PATHCONV=1 docker run --rm -v /c/Users/waseem.abbas/ThinkFlow/app:/app -w /app node:20-bookworm npx vitest run src/components/TraceabilityView.test.tsx
```
Drop the trailing path for the full suite. ~30s per run. Focused test while iterating; FULL suite once
before committing. Baseline: 53 tests passing across 16 files — must stay green (your new test(s) → 54+).
If the Docker daemon isn't running, report BLOCKED (don't start it yourself).

## Standing rules
- Work from `C:\Users\waseem.abbas\ThinkFlow`. Only touch the two Task 17 files.
- Commits must NOT add any Claude/Claude Code co-author or attribution trailer.
- Write your full report to `.superpowers/sdd/2026-07-27-thinkflow-studio/task-17-report.md`
  with TDD evidence (RED cmd+output, GREEN cmd+output), files changed, self-review, concerns.
