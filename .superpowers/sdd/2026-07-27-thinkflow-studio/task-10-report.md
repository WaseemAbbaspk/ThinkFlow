# Task 10 Report: Project Store (context + reducer + actions)

## Status: COMPLETE

## Files
- Created `app/src/state/projectStore.tsx`
- Created `app/src/state/projectStore.test.tsx`

## Commit
`2fcef9f` — "Add project store: context, reducer, actions with cascade deletes"

## TDD Process

### Step 1: Test file written
Wrote the brief's 3 tests plus 8 additional tests covering every action not
shown in the brief's representative reducer excerpt: ADD_GOAL, ADD_NFR,
ADD_ADR, ADD_TASK, UPDATE_TASK, DELETE_TASK, ADD_TEST, UPDATE_TEST/DELETE_TEST
(combined in one test). Total: 11 tests.

### Step 2: RED (confirmed FAIL before implementation)
Command:
```
MSYS_NO_PATHCONV=1 docker run --rm -v /c/Users/waseem.abbas/ThinkFlow/app:/app -w /app node:20-bookworm npx vitest run src/state/projectStore.test.tsx
```
Output:
```
 FAIL  src/state/projectStore.test.tsx [ src/state/projectStore.test.tsx ]
Error: Failed to resolve import "./projectStore" from "src/state/projectStore.test.tsx". Does the file exist?
...
 Test Files  1 failed (1)
      Tests  no tests
```
Confirmed RED — `projectStore.tsx` did not exist yet.

### Step 3: Implementation
Implemented `app/src/state/projectStore.tsx` following the brief's exact
pattern for all 18 action types in the `Action` union:
- SET_VIEW, REPLACE_PROJECT, PATCH_VISION (shown in brief)
- ADD_STORY / UPDATE_STORY / DELETE_STORY (shown in brief, cascades to criteria + task.tracesTo)
- ADD_CRITERION / UPDATE_CRITERION / DELETE_CRITERION (shown in brief, cascades to task.tracesTo + test.verifies)
- ADD_GOAL — mints `GOAL-` id, pushes `{id, text:'', metric:''}` to `project.goals`
- ADD_NFR — mints `NFR-` id, pushes `{id, name:'', target:''}` to `requirements.nfrs`
- ADD_ADR — mints `ADR-` id, pushes a blank `Adr` (status 'Proposed', all string fields '', options/relatesTo: []) to `architecture.adrs`
- ADD_TASK — mints `TASK-` id, pushes a blank `Task` (tracesTo/dependsOn/acceptance: [], status 'Todo', other strings '')
- UPDATE_TASK / DELETE_TASK — map/filter `project.tasks`
- ADD_TEST — mints `TEST-` id, pushes a blank `Test` (verifies/description: '', level 'Unit', status 'Not run')
- UPDATE_TEST / DELETE_TEST — map/filter `project.testing.tests`

Every mutating case calls `touch()` to bump `meta.updatedAt`, and every add
threads `meta.counters` through `nextId()`.

`ProjectProvider` / `useProject()` wired via `useReducer` + React context, matching the brief.

One deviation from the brief's literal code: the `useReducer(reducer, undefined, () => ...)`
call needed an explicit generic annotation
(`useReducer<React.Reducer<State, Action>, undefined>(...)`) to satisfy
TypeScript's overload resolution under `@types/react@18.3.31` — without it,
`tsc -b` failed with "Argument of type 'undefined' is not assignable to
parameter of type 'State'" because TS picked the wrong overload. This is a
typing-only fix; runtime behavior is unchanged.

### Step 4: GREEN (confirmed PASS after implementation)
Command:
```
MSYS_NO_PATHCONV=1 docker run --rm -v /c/Users/waseem.abbas/ThinkFlow/app:/app -w /app node:20-bookworm npx vitest run src/state/projectStore.test.tsx
```
Output:
```
 ✓ src/state/projectStore.test.tsx (11 tests) 9ms

 Test Files  1 passed (1)
      Tests  11 passed (11)
```

TypeScript check:
```
MSYS_NO_PATHCONV=1 docker run --rm -v /c/Users/waseem.abbas/ThinkFlow/app:/app -w /app node:20-bookworm npx tsc -b
```
First run failed (see deviation note above); after adding the explicit
`useReducer` generic annotation, re-run produced no output / exit 0 (pass).

Full suite:
```
MSYS_NO_PATHCONV=1 docker run --rm -v /c/Users/waseem.abbas/ThinkFlow/app:/app -w /app node:20-bookworm npm test
```
Output:
```
 ✓ src/model/ids.test.ts (3 tests)
 ✓ src/state/persistence.test.ts (4 tests)
 ✓ src/model/traceability.test.ts (9 tests)
 ✓ src/export/project.test.ts (3 tests)
 ✓ src/state/projectStore.test.tsx (11 tests)
 ✓ src/export/markdown.test.ts (3 tests)
 ✓ src/export/zip.test.ts (1 test)
 ✓ src/model/migrate.test.ts (3 tests)
 ✓ src/smoke.test.ts (1 test)
 ✓ src/model/types.test.ts (1 test)

 Test Files  10 passed (10)
      Tests  39 passed (39)
```
No regressions.

### Step 5: Commit
```
git add app/src/state/projectStore.tsx app/src/state/projectStore.test.tsx
git commit -m "Add project store: context, reducer, actions with cascade deletes"
```
Commit `2fcef9f`.

## Self-review: every Action union member has an explicit reducer case

Verified all 18 members of the `Action` type have a corresponding `case` in
the `switch` (no reliance on `default` for any real action):

1. SET_VIEW ✓
2. REPLACE_PROJECT ✓
3. PATCH_VISION ✓
4. ADD_STORY ✓
5. UPDATE_STORY ✓
6. DELETE_STORY ✓ (cascades to criteria + task.tracesTo)
7. ADD_CRITERION ✓
8. UPDATE_CRITERION ✓
9. DELETE_CRITERION ✓ (cascades to task.tracesTo + test.verifies)
10. ADD_GOAL ✓
11. ADD_NFR ✓
12. ADD_ADR ✓
13. ADD_TASK ✓
14. UPDATE_TASK ✓
15. DELETE_TASK ✓
16. ADD_TEST ✓
17. UPDATE_TEST ✓
18. DELETE_TEST ✓

All actions implementable per the brief and `types.ts`/`ids.ts` — none were
skipped or left unimplemented.

## Report path
`C:\Users\waseem.abbas\ThinkFlow\.superpowers\sdd\2026-07-27-thinkflow-studio\task-10-report.md`
