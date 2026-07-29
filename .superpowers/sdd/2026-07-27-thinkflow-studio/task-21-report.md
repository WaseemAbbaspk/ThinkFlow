# Task 21 Report — Delete-with-unlink confirmation + storage-warning banner

## What was implemented

### 1. Delete-with-unlink confirmation (`app/src/stages/RequirementsForm.tsx`)
- Added a tiny `confirmDelete(message: string): boolean { return window.confirm(message); }` helper.
- Pulled `tasks` and `testing` out of `project` (alongside existing `requirements`) so dependent counts can be computed.
- **Story `onRemove`**: computes `dependentCriteria` (`requirements.criteria.filter(c => c.storyId === story.id)`)
  and `dependentTasks` (`tasks.filter(t => t.tracesTo.includes(story.id))`). If either is non-empty, shows
  `Delete ${story.id}? This also removes ${n} criteria and unlinks ${m} tasks.` via `confirmDelete`; dispatches
  `DELETE_STORY` only if confirmed (or immediately if there are no dependents).
- **Criterion `onRemove`**: computes `dependentTasks` (`tasks.filter(t => t.tracesTo.includes(criterion.id))`)
  and `dependentTests` (`testing.tests.filter(t => t.verifies === criterion.id)`). Same confirm-or-direct-dispatch
  pattern with message `Delete ${criterion.id}? This unlinks ${n} tasks and ${m} tests.`
- Goal/NFR/task/test/assumption/constraint/non-goal deletes are untouched — no confirm guard added there.

### 2. Storage-failure banner (`app/src/state/persistence.ts` + `app/src/App.tsx`)
- `persistence.ts`: `saveProject` now returns `boolean` — `true` after a successful `setItem`, `false` in the
  `catch`. `loadProject`, `clearProject`, `STORAGE_KEY` untouched. This is the only change to the file.
- `App.tsx` `Shell`: added `const [saveHealthy, setSaveHealthy] = useState(true);`. The debounced-save effect
  now does `setTimeout(() => setSaveHealthy(saveProject(state.project)), 500)` with the same `clearTimeout`
  cleanup. When `!saveHealthy`, a non-blocking `<div className="storage-warning" role="status">` banner renders
  above `<TextField>`/`<Sidebar>`/`<main>` reading "Your work could not be saved to this browser. Export your
  project to avoid losing it." No modal, no blocked interaction.

### 3. Tests (`app/src/stages/RequirementsForm.test.tsx`)
Added three tests using `vi.spyOn(window, 'confirm')`:
- `keeps the story when delete is not confirmed` — mock returns `false`; asserts `confirm` was called and
  `US-1` is still present.
- `removes the story when delete is confirmed` — mock returns `true`; asserts `confirm` was called and `US-1`
  is gone.
- `deletes a story with no dependents without prompting` — spies on `confirm` (no mockReturnValue override,
  just presence check) and asserts it is NOT called when the story has no criteria/tasks, and the story is
  removed directly.

Did not duplicate the reducer `DELETE_CRITERION` cascade test (already in `projectStore.test.tsx`, commit
ddca290).

## TDD evidence

### RED
Stashed only the `RequirementsForm.tsx` implementation change (tests + other files stayed), then ran:
```
MSYS_NO_PATHCONV=1 docker run --rm -v /c/Users/waseem.abbas/ThinkFlow/app:/app -w /app node:20-bookworm npx vitest run src/stages/RequirementsForm.test.tsx
```
Result: 2 of 5 failed as expected —
```
× RequirementsForm > keeps the story when delete is not confirmed
  → expected "bound " to be called at least once
× RequirementsForm > removes the story when delete is confirmed
  → expected "bound " to be called at least once
Test Files  1 failed (1)
     Tests  2 failed | 3 passed (5)
```
(The "no dependents" test passed trivially pre-implementation since `window.confirm` was never called either way —
expected, since that assertion only checks it's *not* called.)

Restored the implementation (`git stash pop`).

### GREEN — focused
```
MSYS_NO_PATHCONV=1 docker run --rm -v /c/Users/waseem.abbas/ThinkFlow/app:/app -w /app node:20-bookworm npx vitest run src/stages/RequirementsForm.test.tsx
```
```
✓ src/stages/RequirementsForm.test.tsx (5 tests) 519ms
Test Files  1 passed (1)
     Tests  5 passed (5)
```

### GREEN — full suite
```
MSYS_NO_PATHCONV=1 docker run --rm -v /c/Users/waseem.abbas/ThinkFlow/app:/app -w /app node:20-bookworm npx vitest run
```
```
Test Files  20 passed (20)
     Tests  63 passed (63)
```
(Baseline 60 + 3 new = 63.) Output pristine — no jsdom "Not implemented: window.confirm" noise anywhere in the run.

### Build
```
MSYS_NO_PATHCONV=1 docker run --rm -v /c/Users/waseem.abbas/ThinkFlow/app:/app -w /app node:20-bookworm npm run build
```
```
tsc -b && vite build
✓ 52 modules transformed.
✓ built in 2.63s
```
Clean, no TS errors.

## Files changed
- `app/src/stages/RequirementsForm.tsx` — confirm guards for story/criterion delete.
- `app/src/stages/RequirementsForm.test.tsx` — 3 new confirm-guard tests.
- `app/src/state/persistence.ts` — `saveProject` returns `boolean`.
- `app/src/App.tsx` — `saveHealthy` state + non-blocking storage-warning banner.

`git diff --stat` confirms no files outside this list were touched:
```
 app/src/App.tsx                          |  8 ++++++-
 app/src/stages/RequirementsForm.test.tsx | 36 +++++++++++++++++++++++++++++++-
 app/src/stages/RequirementsForm.tsx      | 26 ++++++++++++++++++++---
 app/src/state/persistence.ts             |  6 +++---
 4 files changed, 68 insertions(+), 8 deletions(-)
```

## Self-review
- Scope: only the four listed files touched; reducer/store/traceability untouched; goal/NFR/task/test deletes
  unguarded as required.
- The `DELETE_CRITERION` cascade reducer test was not duplicated (verified it exists in `projectStore.test.tsx`
  before starting).
- `confirmDelete` helper keeps the guard logic terse and gives tests/future readers a single seam.
- Dependent counts are computed fresh from current `requirements`/`tasks`/`testing` state on each render, so the
  confirm message is always accurate at click time.
- No-dependents path dispatches directly with no `window.confirm` call at all (verified by the third test),
  matching the brief precisely ("If no dependents, dispatch directly (no confirm)").
- Banner uses `role="status"` (non-alerting, non-blocking) rather than `role="alert"`, distinguishing it from
  the existing blocking `RecoveryBanner` (`role="alert"`) — appropriate since the app is still fully usable, only
  persistence is degraded.
- `saveProject`'s existing Task 9 tests call it and ignore the return value, so they remain valid with the new
  `boolean` return type (confirmed all `persistence.test.ts` tests still pass in the full suite run).
- No new CSS was added for `.storage-warning` — brief only asked for the div/role/copy, not styling; app has
  no existing stylesheet system wired for this component tree beyond default browser rendering, consistent with
  how `.recovery-banner` and other classes are used unstyled elsewhere in the codebase as of this task.

## Concerns
None. All required tests pass, full suite pristine, build clean, scope kept to the four allowed files.
