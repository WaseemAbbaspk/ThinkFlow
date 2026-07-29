# Task 13 brief — Requirements stage form

Full task text from the plan (`docs/superpowers/plans/2026-07-27-thinkflow-studio.md`, "Task 13: Requirements form"):

**Files:**
- Create: `app/src/stages/RequirementsForm.tsx`
- Test: `app/src/stages/RequirementsForm.test.tsx`

**Interfaces:**
- Consumes: `useProject()` (store — `app/src/state/projectStore.tsx`), inputs (`app/src/components/inputs.tsx`).
- Sections + exact fields:
  - **Goals** — RepeatableList → `ADD_GOAL`; each editable `text`, `metric`. (Goals live at `state.project.goals`; update a goal via... see design note below.)
  - **Stories** — `ADD_STORY`; each editable `role`, `want`, `benefit`, `priority` (SelectField: Must/Should/Could), `servesGoalId` (LinkSelect of goals, single). Per-story Remove → `DELETE_STORY`.
    - Nested **Criteria** — RepeatableList → `ADD_CRITERION`(storyId); each `text`; per-criterion Remove → `DELETE_CRITERION`. Show only criteria whose `storyId` matches the story.
  - **NFRs** — `ADD_NFR`; each `name`, `target`. Remove.
  - **assumptions / constraints / nonGoals** — string lists (`state.project.requirements.{assumptions,constraints,nonGoals}`).
  - **signoff** — `by`, `date` (`state.project.requirements.signoff` is `{by,date}|null`).

**Step 1: Write the failing test** — use this EXACT test:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectProvider } from '../state/projectStore';
import { RequirementsForm } from './RequirementsForm';

describe('RequirementsForm', () => {
  it('adds a story with an auto id shown', async () => {
    render(<ProjectProvider><RequirementsForm /></ProjectProvider>);
    await userEvent.click(screen.getByRole('button', { name: /add story/i }));
    expect(screen.getByText(/US-1/)).toBeInTheDocument();
  });
  it('adds a criterion under a story', async () => {
    render(<ProjectProvider><RequirementsForm /></ProjectProvider>);
    await userEvent.click(screen.getByRole('button', { name: /add story/i }));
    await userEvent.click(screen.getByRole('button', { name: /add criterion/i }));
    expect(screen.getByText(/AC-1\.1/)).toBeInTheDocument();
  });
});
```

**Step 2: Run, expect FAIL.**
**Step 3: Implement `RequirementsForm.tsx`** per the field list above.
**Step 4: Run, expect PASS.**
**Step 5: Commit** — `git commit -m "Add Requirements stage form"`

## STORE ACTIONS AVAILABLE (read `app/src/state/projectStore.tsx` to confirm exact shapes)

These are the actions the store's reducer handles — USE THESE, do not invent new ones and do NOT edit the store:
- `{ type: 'ADD_GOAL' }` → appends `{id:'GOAL-n', text:'', metric:''}`
- `{ type: 'ADD_STORY' }` → appends `{id:'US-n', role,want,benefit, priority:'Must', servesGoalId:null}`
- `{ type: 'UPDATE_STORY'; id; patch }` — patch is `Partial<UserStory>`
- `{ type: 'DELETE_STORY'; id }` — cascade-removes its criteria and strips task links
- `{ type: 'ADD_CRITERION'; storyId }` → appends `{id:'AC-<storyNo>.<m>', storyId, text:''}`
- `{ type: 'UPDATE_CRITERION'; id; patch }`
- `{ type: 'DELETE_CRITERION'; id }`
- `{ type: 'ADD_NFR' }` → `{id:'NFR-n', name:'', target:''}`

There is NO `UPDATE_GOAL`, NO `UPDATE_NFR`, and NO action for the requirements string-lists/signoff.

## IMPORTANT design note — updating goals, nfrs, string lists, signoff (no dedicated actions exist)

The store (Task 10) is already reviewed/committed — **do NOT edit `projectStore.tsx`**. There is no
`UPDATE_GOAL`/`UPDATE_NFR`/etc. To edit goals, nfrs, requirements.assumptions/constraints/nonGoals, and
signoff, use the generic **`REPLACE_PROJECT`** action, which the reducer supports:
`dispatch({ type: 'REPLACE_PROJECT', project: nextProject })` where you build `nextProject` immutably
from `state.project` with the one changed field. Example for editing a goal's text:
```ts
dispatch({ type: 'REPLACE_PROJECT', project: {
  ...state.project,
  goals: state.project.goals.map(g => g.id === id ? { ...g, text: v } : g),
}});
```
Use the same pattern for nfr name/target, the three requirements string-lists, and signoff. For adding
goals/stories/nfrs/criteria use the dedicated ADD_* actions (they mint ids). For removing a goal/nfr/string
(no DELETE_GOAL/DELETE_NFR exists) use REPLACE_PROJECT with a filtered array. For stories/criteria use the
dedicated DELETE_STORY/DELETE_CRITERION (they cascade). If you become convinced the store MUST gain new
actions, STOP and report NEEDS_CONTEXT rather than editing it.

Read `app/src/model/types.ts` for `UserStory`, `Criterion`, `Goal`, `Nfr`, `Priority` shapes, and
`app/src/components/inputs.tsx` for `TextField`/`TextArea`/`SelectField`/`LinkSelect`/`RepeatableList` props,
and `app/src/stages/VisionForm.tsx` (Task 12, just committed) as a style reference for form structure.

## CRITICAL ENVIRONMENT — tests run in Docker ONLY

Windows IT policy blocks npm native binaries. `node_modules` already installed — do NOT run `npm install`.
Use the Bash tool:
```
MSYS_NO_PATHCONV=1 docker run --rm -v /c/Users/waseem.abbas/ThinkFlow/app:/app -w /app node:20-bookworm npx vitest run src/stages/RequirementsForm.test.tsx
```
Drop the trailing path for the full suite. ~30s per run. Focused test while iterating; FULL suite once
before committing. Baseline: 48 tests passing across 12 files — must stay green (your 2 new tests → 50).
If the Docker daemon isn't running, report BLOCKED (don't start it yourself).

## Standing rules
- Work from `C:\Users\waseem.abbas\ThinkFlow`. Only touch the two Task 13 files.
- Commits must NOT add any Claude/Claude Code co-author or attribution trailer.
- Write your full report to `.superpowers/sdd/2026-07-27-thinkflow-studio/task-13-report.md`
  with TDD evidence (RED cmd+output, GREEN cmd+output), files changed, self-review, concerns.
