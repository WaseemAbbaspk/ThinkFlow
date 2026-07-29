# Task 20 brief — App shell + persistence wiring + project name + integration test

Full task text from the plan (`docs/superpowers/plans/2026-07-27-thinkflow-studio.md`, "Task 20"):

**Files:**
- Modify: `app/src/App.tsx`, `app/src/main.tsx`, `app/src/state/projectStore.tsx` (add ONE new action — see below)
- Create: `app/src/App.integration.test.tsx`, `app/src/styles.css`

**What to build:**
- `App` renders `Sidebar` + the active view (switch on `state.view`), plus an editable **project-name** field
  that dispatches a new `PATCH_META` action.
- On load, decide preload vs recovery via `loadProject()`; a `useEffect` debounced-saves the project.

## STORE CHANGE — you MAY edit `projectStore.tsx`, but ONLY to add `PATCH_META`

This is the one task explicitly permitted to extend the store. Add exactly this action and nothing else:
- Union member: `| { type: 'PATCH_META'; patch: Partial<Project['meta']> }`
- Reducer case: `case 'PATCH_META': return { ...state, project: touch({ ...p, meta: { ...p.meta, ...action.patch } }) };`
  (`touch` already updates `updatedAt`; PATCH_META lets the name field be edited.)
Do NOT change any other existing action, type, or behavior. Keep the existing 18 actions intact.

## App architecture (the integration test renders `<App />` standalone — App must own the provider)

The test does NOT wrap App in `ProjectProvider`, and clears localStorage in `beforeEach`. So:
1. In `App`, read persisted state ONCE: `const [loaded] = useState(() => loadProject())`
   (`loadProject()` returns `{ok:true;project}` | `{ok:false;reason}` | `{ok:'empty'}`).
2. If `loaded.ok === false` → render a **recovery banner** (no provider needed): show the reason, an
   **"Export raw"** button (download the raw stored string via an anchor + `URL.createObjectURL`, read the raw
   string with `localStorage.getItem(STORAGE_KEY)` — import `STORAGE_KEY` from persistence), and a
   **"Start fresh"** button (`clearProject()` then reload state / set a state flag to render the fresh app).
3. Otherwise `preload = loaded.ok === true ? loaded.project : undefined` and render
   `<ProjectProvider preload={preload}><Shell /></ProjectProvider>`.
4. `Shell` (a component INSIDE the provider so it can call `useProject()`) renders:
   - the editable project-name field: `<TextField label="Project name" value={state.project.meta.name}
     onChange={v => dispatch({ type:'PATCH_META', patch:{ name:v } })} />` (or an inline labelled input),
   - `<Sidebar />`,
   - the active view via a switch on `state.view`:
     `vision`→`<VisionForm/>`, `requirements`→`<RequirementsForm/>`, `architecture`→`<ArchitectureForm/>`,
     `tasks`→`<TasksForm/>`, `testing`→`<TestingForm/>`, `traceability`→`<TraceabilityView/>`, `export`→`<ExportPanel/>`,
   - a **debounced save** `useEffect` keyed on `state.project`:
     ```ts
     useEffect(() => {
       const id = setTimeout(() => saveProject(state.project), 500);
       return () => clearTimeout(id);
     }, [state.project]);
     ```
     The `clearTimeout` cleanup is REQUIRED — it prevents a late timer firing after the test unmounts
     (which would cause act() warnings / non-pristine output).

`main.tsx`: keep it minimal — just render `<App />` inside `React.StrictMode` (App now owns loadProject and
the provider). Remove the old stub content.

## Wire the real components
Import and render `Sidebar`, `VisionForm`, `RequirementsForm`, `ArchitectureForm`, `TasksForm`, `TestingForm`,
`TraceabilityView`, `ExportPanel`, `TextField` — all already built. Import `styles.css` in `main.tsx` (create
a minimal `styles.css`; the full styling pass is Task 22 — just create the file, an empty or tiny file is fine).

**Step 1: Write the failing integration test (`App.integration.test.tsx`)** — use this EXACT test:

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('core traceability flow', () => {
  beforeEach(() => localStorage.clear());
  it('story -> criterion -> task -> test clears the untested-criterion gap', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: /Requirements/i }));
    await userEvent.click(screen.getByRole('button', { name: /add story/i }));
    await userEvent.click(screen.getByRole('button', { name: /add criterion/i }));
    await userEvent.click(screen.getByRole('button', { name: /^Tasks/i }));
    await userEvent.click(screen.getByRole('button', { name: /add task/i }));
    await userEvent.selectOptions(screen.getByLabelText(/Traces to/i), 'US-1');
    await userEvent.click(screen.getByRole('button', { name: /Testing/i }));
    await userEvent.click(screen.getByRole('button', { name: /add test/i }));
    await userEvent.selectOptions(screen.getByLabelText(/Verifies/i), 'AC-1.1');
    await userEvent.click(screen.getByRole('button', { name: /Traceability/i }));
    expect(screen.getByText(/No gaps/i)).toBeInTheDocument();
  });
});
```

Notes to make this test pass:
- Sidebar nav buttons must have clean accessible names ("Requirements", "Tasks", "Testing", "Traceability")
  — already true (⚠ is aria-hidden). The `/^Tasks/i` anchor avoids matching "Add task".
- When `state.view === 'requirements'`, `RequirementsForm` renders "Add story" / "Add criterion".
- The task's "Traces to" LinkSelect options include `US-1` (value) once a story exists; test's `selectOptions`
  picks it by value. The test's "Verifies" select includes `AC-1.1`.
- After linking task→US-1 and test→AC-1.1, `detectGaps` returns `[]` and TraceabilityView shows "No gaps".

**Step 2: Run, expect FAIL.**
**Step 3: Implement** App.tsx, main.tsx, add PATCH_META to the reducer, create styles.css.
**Step 4: Run the FULL suite in Docker, expect PASS** (baseline 59 + 1 new integration test = 60; and the
existing projectStore tests must still pass with PATCH_META added).
**Step 5: Verify the production build in Docker** (see command below) — must succeed (tsc + vite build).
**Step 6: Commit** — `git commit -m "Wire app shell, persistence, and core flow integration test"`

## Read before coding
- `app/src/state/projectStore.tsx` — provider/preload, actions, `touch`, `View`.
- `app/src/state/persistence.ts` — `loadProject`, `saveProject`, `clearProject`, `STORAGE_KEY`.
- `app/src/components/Sidebar.tsx`, `app/src/components/inputs.tsx`, and the 5 stage forms + TraceabilityView + ExportPanel.
Match repo style (2-space indent, concise, strict TS).

## CRITICAL ENVIRONMENT — tests AND build run in Docker ONLY

Windows IT policy blocks npm native binaries. `node_modules` already installed — do NOT run `npm install`.
Full suite:
```
MSYS_NO_PATHCONV=1 docker run --rm -v /c/Users/waseem.abbas/ThinkFlow/app:/app -w /app node:20-bookworm npx vitest run
```
Focused: append ` src/App.integration.test.tsx`. Production build verification:
```
MSYS_NO_PATHCONV=1 docker run --rm -v /c/Users/waseem.abbas/ThinkFlow/app:/app -w /app node:20-bookworm npm run build
```
~30-60s per run. Run focused while iterating; run the FULL suite AND the build once before committing.
If the Docker daemon isn't running, report BLOCKED (don't start it yourself). Note: the build writes `app/dist`
which is gitignored — do not commit it.

## Standing rules
- Work from `C:\Users\waseem.abbas\ThinkFlow`. Touch only the Task 20 files listed (App.tsx, main.tsx,
  projectStore.tsx [PATCH_META only], App.integration.test.tsx, styles.css).
- Commits must NOT add any Claude/Claude Code co-author or attribution trailer.
- If the integration test reveals a real defect in an already-built component, STOP and report it as
  DONE_WITH_CONCERNS or NEEDS_CONTEXT rather than editing that component — the controller decides.
- Write your full report to `.superpowers/sdd/2026-07-27-thinkflow-studio/task-20-report.md`
  with TDD evidence (RED cmd+output, GREEN cmd+output), the build output, files changed, self-review, concerns.
