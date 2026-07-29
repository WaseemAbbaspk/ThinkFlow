# Task 4 Report: Traceability Engine (Matrix + Gap Detection)

## Summary
Successfully implemented the traceability engine with matrix building and gap detection capabilities following strict TDD workflow.

## TDD Workflow

### RED Phase (Test Fails)
Created `app/src/model/traceability.test.ts` with 7 test cases covering all 5 gap kinds plus the matrix. Initial run failed with expected error:
```
FAIL  src/model/traceability.test.ts
Error: Failed to resolve import "./traceability" from "src/model/traceability.test.ts". 
Does the file exist?
```

### GREEN Phase (Test Passes)
Created `app/src/model/traceability.ts` implementing:
- `detectGaps(project: Project): Gap[]` - Detects 5 gap kinds:
  - untested-criterion: criterion with no verifying test
  - orphan-task: task with empty tracesTo list
  - unrealized-story: story with no tasks tracing to it or its criteria
  - goalless-story: story without a goal or missing goal reference
  - dangling-link: task/test referencing non-existent story/criterion

- `buildMatrix(project: Project): MatrixRow[]` - Creates traceability matrix linking:
  - Story to Goal
  - Story to Criteria
  - Criteria to Tasks
  - Criteria to Tests

Test results:
```
✓ src/model/traceability.test.ts (7 tests) 8ms

Test Files  1 passed (1)
     Tests  7 passed (7)
```

### Full Suite Verification
Ran complete test suite to verify no regressions:
```
✓ src/smoke.test.ts (1 test)
✓ src/model/traceability.test.ts (7 tests)
✓ src/model/types.test.ts (1 test)
✓ src/model/ids.test.ts (3 tests)

Test Files  4 passed (4)
     Tests  12 passed (12)
```

## Files Created
- `app/src/model/traceability.test.ts` - 68 lines (test file)
- `app/src/model/traceability.ts` - 65 lines (implementation)

## Commit
```
Commit: 7368785
Subject: Add traceability engine: matrix and gap detection
```

## Test Coverage
All 7 test cases pass:
1. detectGaps: no gaps when fully linked
2. detectGaps: flags untested criterion
3. detectGaps: flags orphan task (empty tracesTo)
4. detectGaps: flags unrealized story
5. detectGaps: flags goalless story
6. detectGaps: flags dangling link
7. buildMatrix: links story -> goal, criterion, tasks, tests

## Code Quality
- Pure TypeScript implementation (no React/DOM)
- Follows brief specifications exactly
- No external dependencies beyond existing types
- Passes all edge cases and gap detection scenarios
- Full traceability matrix construction working correctly

## Status: COMPLETE
TDD workflow verified: RED -> GREEN -> No regressions. All code committed.

---

## Post-Review Fix: Edge-Case Test Coverage

### Coverage Gap Found
Code review identified two uncovered branches in the implementation:
1. `buildMatrix`: The `crits.length === 0` branch for stories with no criteria
2. `detectGaps`: The test-side dangling link detection path

### Added Test Cases

**Test 1: buildMatrix — story with zero criteria**
```typescript
it('creates matrix row for story with zero criteria', () => {
  const p = emptyProject('t');
  p.goals.push({ id: 'GOAL-1', text: 'g', metric: 'm' });
  p.requirements.stories.push({ id: 'US-1', role: 'u', want: 'w', benefit: 'b', priority: 'Must', servesGoalId: 'GOAL-1' });
  p.tasks.push({ id: 'TASK-1', title: 't', tracesTo: ['US-1'], dependsOn: [], goal: '', contextForAgent: '', acceptance: [], outOfScope: '', status: 'Todo' });
  const rows = buildMatrix(p);
  const row = rows.find(r => r.storyId === 'US-1')!;
  expect(row.criterionId).toBeNull();
  expect(row.taskIds).toContain('TASK-1');
});
```
Covers the `crits.length === 0` branch where a story without criteria still creates a matrix row.

**Test 2: detectGaps — dangling test→criterion link**
```typescript
it('flags a dangling link (test verifies missing criterion)', () => {
  const p = seed(); p.testing.tests[0].verifies = 'AC-9.9';
  expect(detectGaps(p).map(g => g.kind)).toContain('dangling-link');
});
```
Covers the test verification dangling path distinct from task-side dangling links.

### Test Execution

Command:
```bash
MSYS_NO_PATHCONV=1 docker run --rm -v /c/Users/waseem.abbas/ThinkFlow/app:/app -w /app node:20-bookworm npx vitest run src/model/traceability.test.ts
```

Output:
```
 RUN  v2.1.9 /app

 ✓ src/model/traceability.test.ts (9 tests) 16ms

 Test Files  1 passed (1)
      Tests  9 passed (9)
   Start at  11:32:31
   Duration  16.85s (transform 219ms, setup 3.09s, collect 285ms, tests 16ms, environment 11.39s, prepare 1.21s)
```

### Full Suite Verification

Full test suite after edge-case additions:
```
 RUN  v2.1.9 /app

 ✓ src/model/ids.test.ts (3 tests) 9ms
 ✓ src/model/traceability.test.ts (9 tests) 21ms
 ✓ src/smoke.test.ts (1 test) 3ms
 ✓ src/model/types.test.ts (1 test) 4ms

 Test Files  4 passed (4)
      Tests  14 passed (14)
   Start at  11:33:16
   Duration  15.16s (transform 435ms, setup 6.24s, collect 773ms, tests 38ms, environment 35.37s, prepare 4.78s)
```

### Commit
```
Commit: bc22005
Subject: Add edge-case tests for traceability zero-criteria and dangling test link
Files: app/src/model/traceability.test.ts (+14 insertions)
```

### Summary
- Coverage gap fixed with 2 targeted edge-case tests
- Test count: 7 → 9 (traceability.test.ts)
- Full suite: 12 → 14 tests
- All tests passing with no regressions
- Implementation code unchanged (no modifications to traceability.ts)
