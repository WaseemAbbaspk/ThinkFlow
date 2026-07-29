# Task 21 brief — Delete-with-unlink confirmation + storage-warning banner

Full task text from the plan (`docs/superpowers/plans/2026-07-27-thinkflow-studio.md`, "Task 21"):

**Files:**
- Modify: `app/src/stages/RequirementsForm.tsx` (the delete guards live here) and `app/src/App.tsx` (storage banner)
- Modify: `app/src/state/persistence.ts` (minimal — make `saveProject` report success; see below)
- Test: extend `app/src/stages/RequirementsForm.test.tsx` (confirm-guard test) — NOTE the reducer cascade
  test the plan's Step 1 asks for is ALREADY DONE (commit ddca290 added the `DELETE_CRITERION` → `verifies:''`
  test to `projectStore.test.tsx`); do NOT duplicate it.

**Two features to build:**

### 1. Delete-with-unlink confirmation (in `RequirementsForm.tsx`)
Before dispatching a delete for an entity that OTHER entities reference, show a `window.confirm` naming the
dependents; only dispatch on confirm. Two cases:
- **DELETE_STORY** (a story's Remove): dependents = its criteria (`requirements.criteria.filter(c => c.storyId === story.id)`)
  PLUS any tasks tracing to the story (`tasks.filter(t => t.tracesTo.includes(story.id))`). If there are any
  dependents, `window.confirm(\`Delete ${story.id}? This also removes N criteria and unlinks M tasks.\`)` (word
  it clearly, naming counts/ids); dispatch `DELETE_STORY` only if confirmed. If no dependents, dispatch directly
  (no confirm).
- **DELETE_CRITERION** (a criterion's Remove): dependents = tasks tracing to it
  (`tasks.filter(t => t.tracesTo.includes(criterion.id))`) PLUS tests verifying it
  (`testing.tests.filter(t => t.verifies === criterion.id)`). If any, confirm naming them; dispatch only if
  confirmed. If none, dispatch directly.

Extract a tiny helper like `confirmDelete(message: string): boolean { return window.confirm(message); }` or
inline `window.confirm(...)`. Keep the existing add/update behavior unchanged. Do NOT add confirm guards to
goals/nfrs/tasks/tests deletes — only story and criterion (the entities others reference).

### 2. Storage-failure banner (in `App.tsx` + minimal `persistence.ts` change)
- `persistence.ts`: change `saveProject` to RETURN a boolean — `true` on success, `false` in the `catch`.
  Signature: `export function saveProject(p: Project): boolean`. Return `true` after `setItem`, `false` in catch.
  This is the ONLY change to persistence.ts; keep `loadProject`/`clearProject`/`STORAGE_KEY` untouched. Existing
  Task 9 tests call `saveProject(p)` and ignore the return, so they still pass.
- `App.tsx` `Shell`: track a `saveHealthy` state (default `true`). In the debounced-save effect, set it from the
  `saveProject` return:
  ```ts
  const [saveHealthy, setSaveHealthy] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setSaveHealthy(saveProject(state.project)), 500);
    return () => clearTimeout(id);
  }, [state.project]);
  ```
  When `!saveHealthy`, render a **non-blocking** banner (e.g. `<div className="storage-warning" role="status">
  Your work could not be saved to this browser. Export your project to avoid losing it.</div>`) above the main
  content. It must NOT block interaction (no modal). Keep the `clearTimeout` cleanup.

**Step 1 (reducer cascade test):** ALREADY SATISFIED by ddca290 — skip; do not duplicate.

**Step 2–4: Add a confirm-guard test** to `RequirementsForm.test.tsx`. Mock `window.confirm` with vitest so
no real dialog is invoked and jsdom prints no "Not implemented" noise. Example shape:
```tsx
import { vi } from 'vitest';
// ... in a test:
const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
// add a story, add a criterion under it, click the story's Remove
// assert confirm was called AND the story is still present (because confirm returned false → no delete)
confirmSpy.mockRestore();
```
Add a second case with `mockReturnValue(true)` asserting the story IS removed when confirmed. Keep assertions
resilient (query by the id text). Run these focused, then the full suite.

**Step 5: Commit** — `git commit -m "Add delete-with-unlink confirmation and storage warning"`

## Read before coding
- `app/src/stages/RequirementsForm.tsx` — current delete handlers (`onRemove` for stories/criteria) you'll guard.
- `app/src/App.tsx` — the `Shell` component's debounced-save effect you'll extend + where to put the banner.
- `app/src/state/persistence.ts` — `saveProject` you'll make return boolean.
- `app/src/stages/RequirementsForm.test.tsx` — existing tests you'll extend.
Match repo style (2-space indent, concise, strict TS). Do NOT touch other stage forms, the store, or traceability.

## CRITICAL ENVIRONMENT — tests AND build run in Docker ONLY

Windows IT policy blocks npm native binaries. `node_modules` already installed — do NOT run `npm install`.
Full suite: `MSYS_NO_PATHCONV=1 docker run --rm -v /c/Users/waseem.abbas/ThinkFlow/app:/app -w /app node:20-bookworm npx vitest run`
Focused: append ` src/stages/RequirementsForm.test.tsx`
Build (run once before committing — must stay clean, no TS errors):
`MSYS_NO_PATHCONV=1 docker run --rm -v /c/Users/waseem.abbas/ThinkFlow/app:/app -w /app node:20-bookworm npm run build`
Baseline: 60 tests passing across 20 files — must stay green (your new confirm tests → 62). ~30-60s per run.
If the Docker daemon isn't running, report BLOCKED (don't start it yourself). Do not commit app/dist (gitignored).

## Standing rules
- Work from `C:\Users\waseem.abbas\ThinkFlow`. Touch only the Task 21 files listed above.
- Commits must NOT add any Claude/Claude Code co-author or attribution trailer.
- Write your full report to `.superpowers/sdd/2026-07-27-thinkflow-studio/task-21-report.md`
  with TDD evidence (RED cmd+output, GREEN cmd+output), the build result, files changed, self-review, concerns.
