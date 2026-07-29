# Task 16 brief — Testing stage form

Full task text from the plan (`docs/superpowers/plans/2026-07-27-thinkflow-studio.md`, "Task 16: Testing form"):

**Files:**
- Create: `app/src/stages/TestingForm.tsx`
- Test: `app/src/stages/TestingForm.test.tsx`

**Interfaces — Fields** (under `state.project.testing`):
- `entryCriteria`, `exitCriteria` — TextAreas
- **tests** — added via `ADD_TEST` (mints `TEST-n`); each test editable:
  - `description` — TextField (or TextArea)
  - `verifies` — **single** LinkSelect of AC ids (**the core link**)
  - `level` — SelectField: Unit / Integration / E2E / Non-functional
  - `status` — SelectField: Pass / Fail / Not run

**Step 1: Write the failing test** — use this EXACT test:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectProvider } from '../state/projectStore';
import { TestingForm } from './TestingForm';

it('adds a test', async () => {
  render(<ProjectProvider><TestingForm /></ProjectProvider>);
  await userEvent.click(screen.getByRole('button', { name: /add test/i }));
  expect(screen.getByText(/TEST-1/)).toBeInTheDocument();
});
```
(You may wrap in `describe('TestingForm', ...)`.)

**Step 2: Run, expect FAIL.**
**Step 3: Implement `TestingForm.tsx`** per the fields above. "Add test" dispatches `ADD_TEST`; the minted
`TEST-1` id must render as text so `getByText(/TEST-1/)` matches.
**Step 4: Run, expect PASS.**
**Step 5: Commit** — `git commit -m "Add Testing stage form"`

## STORE actions (read `app/src/state/projectStore.tsx` to confirm shapes)

- Tests HAVE dedicated actions — use them:
  - `{ type: 'ADD_TEST' }` → appends `{id:'TEST-n', verifies:'', description:'', level:'Unit', status:'Not run'}`
  - `{ type: 'UPDATE_TEST'; id; patch }` — use for description/verifies/level/status
  - `{ type: 'DELETE_TEST'; id }` — per-test Remove
- `entryCriteria` / `exitCriteria` have NO dedicated action → edit via `REPLACE_PROJECT` (immutably rebuilt),
  same helper pattern as `app/src/stages/RequirementsForm.tsx`:
  ```ts
  function replaceTesting(patch: Partial<typeof project.testing>) {
    dispatch({ type: 'REPLACE_PROJECT', project: { ...project, testing: { ...project.testing, ...patch } } });
  }
  ```
Do NOT edit the store (Task 10, already reviewed); if you think it must change, STOP and report NEEDS_CONTEXT.

## Option sources / enum values
- `verifies` options = AC ids only: `requirements.criteria.map(c => ({ value: c.id, label: c.id }))`. SINGLE
  select (no `multiple`) → value is a `string`. Consider prepending a blank `{ value: '', label: '—' }` so a
  test can be unlinked.
- `level` options: Unit, Integration, E2E, Non-functional (type `TestLevel`).
- `status` options: Pass, Fail, Not run (type `TestStatus`).

Read `app/src/model/types.ts` for `Test`, `TestLevel`, `TestStatus`; `app/src/components/inputs.tsx` for
input props; and `app/src/stages/TasksForm.tsx` (Task 15, just committed) for the current stage-form style.
Match repo style (2-space indent, concise, strict TS).

## CRITICAL ENVIRONMENT — tests run in Docker ONLY

Windows IT policy blocks npm native binaries. `node_modules` already installed — do NOT run `npm install`.
Use the Bash tool:
```
MSYS_NO_PATHCONV=1 docker run --rm -v /c/Users/waseem.abbas/ThinkFlow/app:/app -w /app node:20-bookworm npx vitest run src/stages/TestingForm.test.tsx
```
Drop the trailing path for the full suite. ~30s per run. Focused test while iterating; FULL suite once
before committing. Baseline: 52 tests passing across 15 files — must stay green (your 1 new test → 53).
If the Docker daemon isn't running, report BLOCKED (don't start it yourself).

## Standing rules
- Work from `C:\Users\waseem.abbas\ThinkFlow`. Only touch the two Task 16 files.
- Commits must NOT add any Claude/Claude Code co-author or attribution trailer.
- Write your full report to `.superpowers/sdd/2026-07-27-thinkflow-studio/task-16-report.md`
  with TDD evidence (RED cmd+output, GREEN cmd+output), files changed, self-review, concerns.
