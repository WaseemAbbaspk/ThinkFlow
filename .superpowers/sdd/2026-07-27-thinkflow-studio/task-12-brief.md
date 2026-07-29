# Task 12 brief — Vision stage form

Full task text from the plan (`docs/superpowers/plans/2026-07-27-thinkflow-studio.md`, "Task 12: Vision form"):

**Files:**
- Create: `app/src/stages/VisionForm.tsx`
- Test: `app/src/stages/VisionForm.test.tsx`

**Interfaces:**
- Consumes: `useProject()` (store, Task 10 — `app/src/state/projectStore.tsx`), inputs (Task 11 — `app/src/components/inputs.tsx`).
- Fields (bound to `state.project.vision` via the `PATCH_VISION` action, and problems as a repeatable list):
  - `statement`, `whyNow`, `successNarrative` — TextAreas
  - `problems[]` — RepeatableList of `{ id, text }`
  - `beneficiaries[]` — `{ audience, change }`
  - `nonGoals[]` — strings
  - `assumptions[]` / `risks[]` — `{ text, note }` (note = validation or mitigation)

**Step 1: Write the failing test** — use this EXACT test:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectProvider } from '../state/projectStore';
import { VisionForm } from './VisionForm';

describe('VisionForm', () => {
  it('edits the vision statement', async () => {
    render(<ProjectProvider><VisionForm /></ProjectProvider>);
    const field = screen.getByLabelText(/Vision statement/i);
    await userEvent.type(field, 'A trustworthy tool');
    expect((field as HTMLTextAreaElement).value).toBe('A trustworthy tool');
  });
});
```

**Step 2: Run, expect FAIL.**
**Step 3: Implement `VisionForm.tsx`** binding each field above. Dispatch `PATCH_VISION` with the updated
vision sub-object (e.g. `dispatch({ type: 'PATCH_VISION', patch: { statement: v } })`, and for lists
`patch: { problems: [...] }`). Wire the "Vision statement" TextArea label so `getByLabelText(/Vision statement/i)` resolves.
**Step 4: Run, expect PASS.**
**Step 5: Commit** — `git commit -m "Add Vision stage form"`

## IMPORTANT design note — read before coding

The plan text says problems "mint `PROB-` ids using `nextId` on add." But the store's `PATCH_VISION`
action ONLY merges the vision patch — it does NOT update `meta.counters`. So `nextId` (which returns a
new counters map) cannot persist its counter through `PATCH_VISION`; calling it repeatedly would keep
returning `PROB-1` and collide.

**Resolution (do this):** derive the next PROB id from the existing problems array — e.g.
`` `PROB-${(Math.max(0, ...problems.map(p => parseInt(p.id.split('-')[1], 10) || 0)) + 1)}` `` — so ids
stay unique across add/remove within a session without needing a persisted counter. PROB ids in this app
are display-only (nothing else in the data model traces to them), so this is sufficient and stable.

**Do NOT edit `app/src/state/projectStore.tsx`** (Task 10, already reviewed and committed) to add a
counter path. If you become convinced the store MUST change, STOP and report NEEDS_CONTEXT instead of
editing it — the controller will decide. Keep all your changes to the two Task 12 files.

## Other fields — presentational guidance
- Use `TextArea` for the three narrative fields; `RepeatableList` for problems/beneficiaries/nonGoals/assumptions/risks.
- Each list item edits its sub-fields via `TextField`/`TextArea` and dispatches a `PATCH_VISION` with the
  whole updated array. Add/Remove rebuild the array immutably.
- Keep it a single controlled form reading from `state.project.vision` and writing via `dispatch`.

## CRITICAL ENVIRONMENT — tests run in Docker ONLY

Windows IT policy blocks npm native binaries (vitest.exe → "Access denied"). `node_modules` is already
installed (Linux binaries) — do NOT run `npm install`. Use the Bash tool:
```
MSYS_NO_PATHCONV=1 docker run --rm -v /c/Users/waseem.abbas/ThinkFlow/app:/app -w /app node:20-bookworm npx vitest run src/stages/VisionForm.test.tsx
```
Drop the trailing path for the full suite. ~30s per run. Run the focused test while iterating; run the
FULL suite once before committing. Current baseline: 47 tests passing across 11 files — must stay green.
If Docker's daemon isn't running, report BLOCKED (don't start it yourself).

## Standing rules
- Work from `C:\Users\waseem.abbas\ThinkFlow`. Only touch the two Task 12 files.
- Commits must NOT add any Claude/Claude Code co-author or attribution trailer.
- Write your full report to `.superpowers/sdd/2026-07-27-thinkflow-studio/task-12-report.md`
  with TDD evidence (RED cmd+output, GREEN cmd+output), files changed, self-review, concerns.
