# Task 15 brief — Tasks stage form

Full task text from the plan (`docs/superpowers/plans/2026-07-27-thinkflow-studio.md`, "Task 15: Tasks form"):

**Files:**
- Create: `app/src/stages/TasksForm.tsx`
- Test: `app/src/stages/TasksForm.test.tsx`

**Interfaces — Fields per task** (each task added via `ADD_TASK`, mints `TASK-n`):
- `title` — TextField
- `tracesTo` — **multiple** LinkSelect of all US + AC ids (**the core traceability action**)
- `dependsOn` — **multiple** LinkSelect of the OTHER tasks' TASK ids (exclude the task itself)
- `goal`, `contextForAgent`, `outOfScope` — TextAreas
- `acceptance[]` — string list (RepeatableList of strings)
- `status` — SelectField (Todo / In progress / In review / Done)

**Step 1: Write the failing test** — use this EXACT test:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectProvider } from '../state/projectStore';
import { TasksForm } from './TasksForm';

it('adds a task', async () => {
  render(<ProjectProvider><TasksForm /></ProjectProvider>);
  await userEvent.click(screen.getByRole('button', { name: /add task/i }));
  expect(screen.getByText(/TASK-1/)).toBeInTheDocument();
});
```
(You may wrap in `describe('TasksForm', ...)`.)

**Step 2: Run, expect FAIL.**
**Step 3: Implement `TasksForm.tsx`** per the fields above. "Add task" dispatches `ADD_TASK`; the minted
`TASK-1` id must render as text so `getByText(/TASK-1/)` matches.
**Step 4: Run, expect PASS.**
**Step 5: Commit** — `git commit -m "Add Tasks stage form"`

## STORE actions for this stage (read `app/src/state/projectStore.tsx` to confirm shapes)

Dedicated actions EXIST for tasks — use them (do NOT edit the store):
- `{ type: 'ADD_TASK' }` → appends `{id:'TASK-n', title:'', tracesTo:[], dependsOn:[], goal:'', contextForAgent:'', acceptance:[], outOfScope:'', status:'Todo'}`
- `{ type: 'UPDATE_TASK'; id; patch }` — patch is `Partial<Task>`; use this for EVERY field edit (title, tracesTo, dependsOn, goal, contextForAgent, outOfScope, acceptance, status)
- `{ type: 'DELETE_TASK'; id }` — per-task Remove

Because `UPDATE_TASK` covers all fields, you do NOT need REPLACE_PROJECT here (tasks live at `state.project.tasks`).
Use `dispatch({ type: 'UPDATE_TASK', id, patch: { acceptance: nextArray } })` for the string-list edits too.
Do NOT edit the store; if you think it must change, STOP and report NEEDS_CONTEXT.

## LinkSelect option sources
- `tracesTo` options = union of US ids (`requirements.stories`) + AC ids (`requirements.criteria`), each `{ value: id, label: id }` (optionally add text to label). `multiple` → value `string[]`.
- `dependsOn` options = the OTHER tasks: `project.tasks.filter(t => t.id !== task.id).map(t => ({ value: t.id, label: t.title || t.id }))`. `multiple`.

Read `app/src/model/types.ts` for `Task`, `TaskStatus`; `app/src/components/inputs.tsx` for input props;
and `app/src/stages/RequirementsForm.tsx` for the stage-form style (per-item RepeatableList, id shown as text).
Match repo style (2-space indent, concise, strict TS).

## CRITICAL ENVIRONMENT — tests run in Docker ONLY

Windows IT policy blocks npm native binaries. `node_modules` already installed — do NOT run `npm install`.
Use the Bash tool:
```
MSYS_NO_PATHCONV=1 docker run --rm -v /c/Users/waseem.abbas/ThinkFlow/app:/app -w /app node:20-bookworm npx vitest run src/stages/TasksForm.test.tsx
```
Drop the trailing path for the full suite. ~30s per run. Focused test while iterating; FULL suite once
before committing. Baseline: 51 tests passing across 14 files — must stay green (your 1 new test → 52).
If the Docker daemon isn't running, report BLOCKED (don't start it yourself).

## Standing rules
- Work from `C:\Users\waseem.abbas\ThinkFlow`. Only touch the two Task 15 files.
- Commits must NOT add any Claude/Claude Code co-author or attribution trailer.
- Write your full report to `.superpowers/sdd/2026-07-27-thinkflow-studio/task-15-report.md`
  with TDD evidence (RED cmd+output, GREEN cmd+output), files changed, self-review, concerns.
