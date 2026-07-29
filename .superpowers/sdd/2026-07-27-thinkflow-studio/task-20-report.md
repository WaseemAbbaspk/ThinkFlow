# Task 20 report — App shell + persistence wiring + project name + integration test

## Status: DONE_WITH_CONCERNS (not committed — see "Defect found" below)

## What was implemented

- `app/src/state/projectStore.tsx` — added exactly the permitted `PATCH_META` action:
  - Union member: `| { type: 'PATCH_META'; patch: Partial<Project['meta']> }`
  - Reducer case: `case 'PATCH_META': return { ...state, project: touch({ ...p, meta: { ...p.meta, ...action.patch } }) };`
  - No other action/type/behavior touched. All 18 pre-existing actions intact (now 19 total).
- `app/src/App.tsx` — full rewrite:
  - `App`: reads persisted state once via `useState(() => loadProject())`. If `loaded.ok === false` and the
    user hasn't chosen "Start fresh" yet, renders `RecoveryBanner` (no provider) showing the reason, an
    "Export raw" button (reads the raw string via `localStorage.getItem(STORAGE_KEY)`, downloads it as a
    blob via `URL.createObjectURL` + anchor), and a "Start fresh" button (`clearProject()` then sets a
    `fresh` state flag). Otherwise computes `preload` from `loaded.ok === true ? loaded.project : undefined`
    and renders `<ProjectProvider preload={preload}><Shell /></ProjectProvider>`.
  - `Shell` (inside the provider, uses `useProject()`): renders the editable "Project name" `TextField`
    dispatching `PATCH_META`, `<Sidebar />`, a switch on `state.view` rendering `VisionForm`,
    `RequirementsForm`, `ArchitectureForm`, `TasksForm`, `TestingForm`, `TraceabilityView`, or `ExportPanel`,
    and a debounced-save `useEffect` keyed on `state.project` (500ms `setTimeout` calling `saveProject`,
    with `clearTimeout` cleanup as specified).
- `app/src/main.tsx` — minimal: renders `<App />` inside `React.StrictMode`, imports `./styles.css`.
- `app/src/styles.css` — new, minimal placeholder (full styling pass is Task 22).
- `app/src/App.integration.test.tsx` — created verbatim from the brief's exact test.

## TDD evidence

### RED (before implementation — App.tsx was still the stub)
Command:
```
MSYS_NO_PATHCONV=1 docker run --rm -v /c/Users/waseem.abbas/ThinkFlow/app:/app -w /app node:20-bookworm npx vitest run src/App.integration.test.tsx
```
Result: 1 failed — `Unable to find an accessible element with the role "button" and name /Requirements/i`
(only the stub `<h1>ThinkFlow Studio</h1>` was rendered). Confirms the test fails for the expected reason
before the shell exists.

### GREEN attempt (after implementing App.tsx/main.tsx/styles.css/PATCH_META)
Same focused command. Result: **still 1 failed**, but for a different, later reason — the test gets all the
way through Requirements → add story → add criterion → Tasks → add task → link "Traces to" = US-1 →
Testing → add test → link "Verifies" = AC-1.1 → Traceability, and the traceability matrix correctly shows
US-1 → AC-1.1 → TASK-1 → TEST-1 fully linked. But the final assertion `expect(screen.getByText(/No gaps/i))`
fails because the Gaps panel still lists one gap: **"US-1 serves no goal"**.

## Defect found in an already-built component (traceability.ts) — STOPPED per brief instructions

`app/src/model/traceability.ts`'s `detectGaps()` unconditionally emits a `goalless-story` gap for every
story whose `servesGoalId` is not set to an existing goal id:
```ts
if (!s.servesGoalId || !goalIds.has(s.servesGoalId))
  gaps.push({ kind: 'goalless-story', entityId: s.id, message: `${s.id} serves no goal` });
```
The brief's exact integration-test script (verbatim, not something I could alter) never creates a Goal or
sets `servesGoalId` on US-1 — it only exercises story → criterion → task → test linking. The brief's own
"Notes to make this test pass" state: *"After linking task→US-1 and test→AC-1.1, `detectGaps` returns `[]`
and TraceabilityView shows 'No gaps'."* That is inconsistent with the actual (already-committed, prior-task)
`detectGaps` behavior — a goalless story alone is enough to keep `gaps.length > 0`, regardless of
task/test linkage.

Per the standing rule ("If the integration test reveals a real defect in an already-built component, STOP
and report DONE_WITH_CONCERNS/NEEDS_CONTEXT rather than editing that component — the controller decides"),
I did **not** modify `traceability.ts`, `RequirementsForm.tsx`, or the test file. I only confirmed the App
wiring itself is correct (all navigation, linking, and gap-clearing for the three gap kinds the test does
address — `untested-criterion`, `orphan-task`, `unrealized-story` — work as expected; only `goalless-story`
remains).

Possible resolutions for the controller to choose between (not applied by me):
1. Change `detectGaps` so `goalless-story` doesn't count as a blocking gap (or is scoped differently).
2. Add a goal-creation + `servesGoalId` link step to the integration test (would deviate from the brief's
   "use this EXACT test" instruction).
3. Accept this is a spec inconsistency between Task ~(traceability model task) and Task 20's brief, and have
   the controller decide which document is authoritative.

## Full suite run (for evidence only — gate not met)
Command:
```
MSYS_NO_PATHCONV=1 docker run --rm -v /c/Users/waseem.abbas/ThinkFlow/app:/app -w /app node:20-bookworm npx vitest run
```
Result: `Test Files  1 failed | 19 passed (20)` / `Tests  1 failed | 59 passed (60)`. The pre-existing 59
tests (including `projectStore.test.tsx`) all still pass unchanged — `PATCH_META` did not regress anything.
Only the new integration test's final assertion fails, for the reason above.

Because the full suite does not reach the required 60/60 pristine pass, I did **not** run the production
build verification step or commit, per the task's gating ("Run the FULL suite in Docker → all pass ... Then
run the production build ... Commit").

## Files changed (uncommitted — left for controller)
- `app/src/App.tsx` (rewritten)
- `app/src/main.tsx` (rewritten, minimal)
- `app/src/state/projectStore.tsx` (added `PATCH_META` only)
- `app/src/App.integration.test.tsx` (new, verbatim from brief)
- `app/src/styles.css` (new, minimal placeholder)

`git status --short` at time of this report:
```
 M app/src/App.tsx
 M app/src/main.tsx
 M app/src/state/projectStore.tsx
?? app/src/App.integration.test.tsx
?? app/src/styles.css
```

## Self-review
- `PATCH_META` matches the brief's exact union member and reducer case, character for character.
- App/Shell split matches the brief's architecture: App owns `loadProject()` (called once via lazy
  `useState` initializer) + the recovery banner + `ProjectProvider`; `Shell` lives inside the provider and
  owns the project-name field, `Sidebar`, the view switch, and the debounced save effect with `clearTimeout`
  cleanup.
- Recovery banner exports the *raw* stored string (not a reserialized project), per the brief ("read the raw
  string with `localStorage.getItem(STORAGE_KEY)`").
- "Start fresh" calls `clearProject()` and flips a `fresh` flag so the app re-renders with no preload
  (fresh `emptyProject`), without needing a full page reload.
- All 7 views are wired to their real components; `TextField` reused from `components/inputs.tsx` for the
  project-name field per the brief's suggested snippet.
- `main.tsx` is minimal as instructed, importing `styles.css` and rendering `<App/>` in `StrictMode`.
- I touched only the 5 files enumerated in the brief. I did not edit `traceability.ts`, any stage form,
  `Sidebar.tsx`, `TraceabilityView.tsx`, or `ExportPanel.tsx`.
- No commit was created, honoring "no Claude co-author" is moot since nothing was committed.

## Concerns
- **Blocking**: the integration test as specified cannot pass against the current `detectGaps` behavior
  without either changing `traceability.ts` (out of my permitted scope) or changing the test (brief said use
  it verbatim). Needs a controller decision before this task can reach DONE.
- Production build was not verified (skipped per gating — full suite didn't reach pristine pass). The
  TypeScript surface used in App.tsx (imports, prop shapes) matches what's already used successfully by the
  stage forms/components in their own passing tests, so a build failure seems unlikely, but this is
  unverified.
