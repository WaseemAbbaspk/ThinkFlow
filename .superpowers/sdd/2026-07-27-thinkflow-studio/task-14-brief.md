# Task 14 brief — Architecture stage form

Full task text from the plan (`docs/superpowers/plans/2026-07-27-thinkflow-studio.md`, "Task 14: Architecture form"):

**Files:**
- Create: `app/src/stages/ArchitectureForm.tsx`
- Test: `app/src/stages/ArchitectureForm.test.tsx`

**Interfaces — Sections + fields** (all under `state.project.architecture`):
- `overview` — TextArea
- `contextDiagram`, `componentDiagram` — TextAreas holding raw Mermaid text
- **components** — RepeatableList of `{ name, responsibility, adrIds }`; `name`,`responsibility` TextFields; `adrIds` via a **multiple** `LinkSelect` of the project's ADRs
- **keyFlows** — RepeatableList of `{ name, description }`
- **nfrConsiderations** — RepeatableList of `{ concern, approach }`
- **ADRs** — `ADD_ADR` (mints `ADR-n`); each ADR editable:
  - `title` (TextField), `status` (SelectField: Proposed/Accepted/Superseded/Deprecated), `date`, `deciders` (TextFields)
  - `relatesTo` — multiple `LinkSelect` of US + AC + NFR ids
  - `context`, `decision`, `rationale` (TextAreas)
  - `options[]` — RepeatableList of `{ name, pros, cons }`
  - `consequencesPositive`, `consequencesTradeoffs`, `followUps` (TextAreas)

**Step 1: Write the failing test** — use this EXACT test:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectProvider } from '../state/projectStore';
import { ArchitectureForm } from './ArchitectureForm';

it('adds an ADR', async () => {
  render(<ProjectProvider><ArchitectureForm /></ProjectProvider>);
  await userEvent.click(screen.getByRole('button', { name: /add adr/i }));
  expect(screen.getByText(/ADR-1/)).toBeInTheDocument();
});
```
(Wrap it in a `describe('ArchitectureForm', () => { ... })` if you prefer; the bare `it` above also runs.)

**Step 2: Run, expect FAIL.**
**Step 3: Implement `ArchitectureForm.tsx`** per the fields above. Clicking "Add ADR" dispatches `ADD_ADR`
and the new `ADR-1` id must render as text so the test's `getByText(/ADR-1/)` matches.
**Step 4: Run, expect PASS.**
**Step 5: Commit** — `git commit -m "Add Architecture stage form"`

## STORE — only ADD_ADR exists for this stage. Everything else = REPLACE_PROJECT.

The store (Task 10, `app/src/state/projectStore.tsx`) is already reviewed/committed — **do NOT edit it**.
For this stage the ONLY dedicated action is `{ type: 'ADD_ADR' }` (mints `ADR-n` with all fields blank/empty
arrays — read the reducer for the exact empty Adr shape). There is NO UPDATE_ADR, DELETE_ADR, or any action
for overview/diagrams/components/keyFlows/nfrConsiderations.

**So: use `REPLACE_PROJECT` for every edit and for every remove**, immutably rebuilding from
`state.project`, exactly like `app/src/stages/RequirementsForm.tsx` (Task 13, just committed — READ IT as your
primary style reference; it establishes the `replace()` helper pattern):
```ts
function replace(patch: Partial<typeof project>) {
  dispatch({ type: 'REPLACE_PROJECT', project: { ...project, ...patch } });
}
function replaceArch(patch: Partial<typeof project.architecture>) {
  replace({ architecture: { ...project.architecture, ...patch } });
}
```
Add an ADR via `ADD_ADR`; remove an ADR via `replaceArch({ adrs: adrs.filter(...) })`. Edit any ADR field
(including its nested `options[]` list) via `replaceArch({ adrs: adrs.map(a => a.id===id ? {...a, ...} : a) })`.
If you become convinced the store MUST gain actions, STOP and report NEEDS_CONTEXT rather than editing it.

## LinkSelect option sources
- component `adrIds` and each ADR is referenced by id — build ADR options from `project.architecture.adrs`
  as `{ value: adr.id, label: adr.title || adr.id }`.
- ADR `relatesTo` options = union of US ids (`requirements.stories`), AC ids (`requirements.criteria`),
  and NFR ids (`requirements.nfrs`), each `{ value: id, label: id }` (optionally include text in the label).
- `LinkSelect` with `multiple` takes `value: string[]` and calls `onChange(string[])`.

Read `app/src/model/types.ts` for `Adr`, `AdrOption`, `AdrStatus`, `Component`, `Flow`, `NfrConsideration`
shapes; `app/src/components/inputs.tsx` for input props; and `app/src/stages/RequirementsForm.tsx` for the
REPLACE_PROJECT form pattern. Match repo style (2-space indent, concise, strict TS).

## CRITICAL ENVIRONMENT — tests run in Docker ONLY

Windows IT policy blocks npm native binaries. `node_modules` already installed — do NOT run `npm install`.
Use the Bash tool:
```
MSYS_NO_PATHCONV=1 docker run --rm -v /c/Users/waseem.abbas/ThinkFlow/app:/app -w /app node:20-bookworm npx vitest run src/stages/ArchitectureForm.test.tsx
```
Drop the trailing path for the full suite. ~30s per run. Focused test while iterating; FULL suite once
before committing. Baseline: 50 tests passing across 13 files — must stay green (your 1 new test → 51).
If the Docker daemon isn't running, report BLOCKED (don't start it yourself).

## Standing rules
- Work from `C:\Users\waseem.abbas\ThinkFlow`. Only touch the two Task 14 files.
- Commits must NOT add any Claude/Claude Code co-author or attribution trailer.
- Write your full report to `.superpowers/sdd/2026-07-27-thinkflow-studio/task-14-report.md`
  with TDD evidence (RED cmd+output, GREEN cmd+output), files changed, self-review, concerns.
