# Task 17 report — Traceability view (matrix + gap panel + Mermaid chain)

## Summary
Implemented `TraceabilityView` as a read-only React component that renders:
1. A traceability matrix table (`buildMatrix(project)`), one `<tr>` per `MatrixRow`, with columns
   Story / Goal / Criterion / Tasks / Tests. `null` goal/criterion IDs render as em-dash "—";
   `taskIds`/`testIds` arrays are comma-joined.
2. A `GapPanel` local component listing `detectGaps(project)` messages as `<li>` items. When there
   are zero gaps it renders exactly `No gaps — every artifact is traced ✓`.
3. A `<pre>` block containing a Mermaid `flowchart LR` chain string built purely from `project`
   (goal→story, story→criterion, task tracesTo→task, test verifies→test edges), with node ids
   sanitized for Mermaid compatibility.

No changes were made to `traceability.ts` or `projectStore.tsx` (read-only consumers only).

## Files changed
- Created: `app/src/components/TraceabilityView.tsx`
- Created: `app/src/components/TraceabilityView.test.tsx`

## TDD evidence

### RED
Command:
```
MSYS_NO_PATHCONV=1 docker run --rm -v /c/Users/waseem.abbas/ThinkFlow/app:/app -w /app node:20-bookworm npx vitest run src/components/TraceabilityView.test.tsx
```
Output (abridged):
```
 RUN  v2.1.9 /app

 ❯ src/components/TraceabilityView.test.tsx (0 test)

⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/components/TraceabilityView.test.tsx [ src/components/TraceabilityView.test.tsx ]
Error: Failed to resolve import "./TraceabilityView" from "src/components/TraceabilityView.test.tsx". Does the file exist?
...
 Test Files  1 failed (1)
      Tests  no tests
```
Confirmed failing for the expected reason (module doesn't exist yet).

### GREEN (focused)
Command:
```
MSYS_NO_PATHCONV=1 docker run --rm -v /c/Users/waseem.abbas/ThinkFlow/app:/app -w /app node:20-bookworm npx vitest run src/components/TraceabilityView.test.tsx
```
Output:
```
 RUN  v2.1.9 /app

 ✓ src/components/TraceabilityView.test.tsx (1 test) 43ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
```

### GREEN (full suite)
Command:
```
MSYS_NO_PATHCONV=1 docker run --rm -v /c/Users/waseem.abbas/ThinkFlow/app:/app -w /app node:20-bookworm npx vitest run
```
Output:
```
 RUN  v2.1.9 /app

 ✓ src/model/ids.test.ts (3 tests) 9ms
 ✓ src/state/projectStore.test.tsx (17 tests) 19ms
 ✓ src/model/traceability.test.ts (9 tests) 16ms
 ✓ src/export/markdown.test.ts (3 tests) 9ms
 ✓ src/components/inputs.test.tsx (2 tests) 237ms
 ✓ src/stages/RequirementsForm.test.tsx (2 tests) 443ms
 ✓ src/state/persistence.test.ts (4 tests) 11ms
 ✓ src/model/migrate.test.ts (3 tests) 6ms
 ✓ src/export/project.test.ts (3 tests) 7ms
 ✓ src/stages/VisionForm.test.tsx (1 test) 363ms
 ✓ src/stages/TestingForm.test.tsx (1 test) 294ms
 ✓ src/model/types.test.ts (1 test) 6ms
 ✓ src/smoke.test.ts (1 test) 5ms
 ✓ src/stages/TasksForm.test.tsx (1 test) 206ms
 ✓ src/stages/ArchitectureForm.test.tsx (1 test) 192ms
 ✓ src/export/zip.test.ts (1 test) 10ms
 ✓ src/components/TraceabilityView.test.tsx (1 test) 40ms

 Test Files  17 passed (17)
      Tests  54 passed (54)
```
Baseline was 53 tests / 16 files; now 54 tests / 17 files, all passing, output pristine (no warnings
beyond npm's unrelated version-upgrade notice).

## Mermaid chain construction and sanitization
`buildMermaidChain(project)` is a pure function of `project` (no state/dispatch). It builds a
`flowchart LR` string with one edge line per traceability relationship, in this order:
- `GOAL --> STORY` for each story with a resolvable `servesGoalId`
- `STORY --> CRITERION` for each criterion, via `criterion.storyId --> criterion.id`
- `REF --> TASK` for each entry in a task's `tracesTo` (covers both story- and criterion-level task links)
- `VERIFIES --> TEST` for each test with a non-empty `verifies` field

Node id sanitization: `mermaidId(id)` strips every character that isn't `[A-Za-z0-9_]` (replacing
with `_`), which handles dots in AC ids (`AC-1.1` → `AC_1_1`) as well as any other punctuation.
`mermaidNode(id)` combines the sanitized id with the original id as a quoted label:
`AC_1_1["AC-1.1"]`, so the human-readable original id is always visible in the rendered diagram
even though the graph-internal id had to be sanitized. Every edge line uses `mermaidNode()` on both
endpoints, so labels are consistent and the string is a syntactically valid, parseable Mermaid
flowchart regardless of which id formats appear in the project (GOAL-n, US-n, AC-n.n, TASK-n, TEST-n).

## Self-review
- Matches repo conventions: 2-space indent, function components, `useProject()` destructuring,
  strict TS, no unused imports beyond what's needed (dropped the brief test's unused `describe`
  import concern doesn't apply — I used the exact test text as given, which does import `describe`
  but only uses `it`; this matched the brief's exact-text requirement and vitest didn't flag it).
- `TraceabilityView` only reads `state.project` via `useProject()` — never calls `dispatch`, so the
  view is genuinely read-only per the spec.
- `GapPanel` is kept as a small local (non-exported) component in the same file, as permitted by
  the brief.
- Table renders `null` goalId/criterionId as "—" and joins `taskIds`/`testIds` with ", ".
- No changes to `app/src/model/traceability.ts` or `app/src/state/projectStore.tsx`.
- Full test suite run once before committing, all 54 tests green, output pristine.

## Concerns
None. The task was implemented within scope, using only the two permitted files. Docker was
already running, no `npm install` was needed, and no other files were touched.
