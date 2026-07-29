## Task 4: Traceability engine (matrix + gap detection)

**Files:**
- Create: `app/src/model/traceability.ts`
- Test: `app/src/model/traceability.test.ts`

**Interfaces:**
- Consumes: `Project` (Task 2), `emptyProject`.
- Produces:
  - `interface Gap { kind: 'untested-criterion'|'orphan-task'|'unrealized-story'|'goalless-story'|'dangling-link'; entityId: string; message: string; }`
  - `detectGaps(project: Project): Gap[]`
  - `interface MatrixRow { storyId: string; goalId: string | null; criterionId: string | null; taskIds: string[]; testIds: string[]; }`
  - `buildMatrix(project: Project): MatrixRow[]`

- [ ] **Step 1: Write the failing test (`traceability.test.ts`)**

```ts
import { describe, it, expect } from 'vitest';
import { emptyProject } from './types';
import { detectGaps, buildMatrix } from './traceability';

function seed() {
  const p = emptyProject('t');
  p.goals.push({ id: 'GOAL-1', text: 'g', metric: 'm' });
  p.requirements.stories.push({ id: 'US-1', role: 'u', want: 'w', benefit: 'b', priority: 'Must', servesGoalId: 'GOAL-1' });
  p.requirements.criteria.push({ id: 'AC-1.1', storyId: 'US-1', text: 'c' });
  p.tasks.push({ id: 'TASK-1', title: 't', tracesTo: ['US-1'], dependsOn: [], goal: '', contextForAgent: '', acceptance: [], outOfScope: '', status: 'Todo' });
  p.testing.tests.push({ id: 'TEST-1', verifies: 'AC-1.1', description: 'd', level: 'Unit', status: 'Not run' });
  return p;
}

describe('detectGaps', () => {
  it('finds no gaps when fully linked', () => {
    expect(detectGaps(seed())).toEqual([]);
  });
  it('flags an untested criterion', () => {
    const p = seed(); p.testing.tests = [];
    expect(detectGaps(p).map(g => g.kind)).toContain('untested-criterion');
  });
  it('flags an orphan task (empty tracesTo)', () => {
    const p = seed(); p.tasks[0].tracesTo = [];
    expect(detectGaps(p).map(g => g.kind)).toContain('orphan-task');
  });
  it('flags an unrealized story (no task traces to it or its criteria)', () => {
    const p = seed(); p.tasks = [];
    expect(detectGaps(p).map(g => g.kind)).toContain('unrealized-story');
  });
  it('flags a goalless story', () => {
    const p = seed(); p.requirements.stories[0].servesGoalId = null;
    expect(detectGaps(p).map(g => g.kind)).toContain('goalless-story');
  });
  it('flags a dangling link (task points to missing id)', () => {
    const p = seed(); p.tasks[0].tracesTo = ['US-999'];
    expect(detectGaps(p).map(g => g.kind)).toContain('dangling-link');
  });
});

describe('buildMatrix', () => {
  it('links story -> goal, criterion, tasks, tests', () => {
    const rows = buildMatrix(seed());
    const row = rows.find(r => r.criterionId === 'AC-1.1')!;
    expect(row.storyId).toBe('US-1');
    expect(row.goalId).toBe('GOAL-1');
    expect(row.taskIds).toContain('TASK-1');
    expect(row.testIds).toContain('TEST-1');
  });
});
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement `traceability.ts`**

```ts
import type { Project } from './types';

export interface Gap {
  kind: 'untested-criterion' | 'orphan-task' | 'unrealized-story' | 'goalless-story' | 'dangling-link';
  entityId: string; message: string;
}
export interface MatrixRow {
  storyId: string; goalId: string | null; criterionId: string | null;
  taskIds: string[]; testIds: string[];
}

export function detectGaps(p: Project): Gap[] {
  const gaps: Gap[] = [];
  const storyIds = new Set(p.requirements.stories.map(s => s.id));
  const criterionIds = new Set(p.requirements.criteria.map(c => c.id));
  const goalIds = new Set(p.goals.map(g => g.id));

  // untested criterion
  for (const c of p.requirements.criteria) {
    if (!p.testing.tests.some(t => t.verifies === c.id))
      gaps.push({ kind: 'untested-criterion', entityId: c.id, message: `${c.id} has no test verifying it` });
  }
  // orphan / dangling for tasks
  for (const t of p.tasks) {
    if (t.tracesTo.length === 0)
      gaps.push({ kind: 'orphan-task', entityId: t.id, message: `${t.id} traces to nothing` });
    for (const ref of t.tracesTo)
      if (!storyIds.has(ref) && !criterionIds.has(ref))
        gaps.push({ kind: 'dangling-link', entityId: t.id, message: `${t.id} traces to missing ${ref}` });
  }
  // dangling for tests
  for (const test of p.testing.tests)
    if (test.verifies && !criterionIds.has(test.verifies))
      gaps.push({ kind: 'dangling-link', entityId: test.id, message: `${test.id} verifies missing ${test.verifies}` });
  // unrealized / goalless stories
  const criteriaByStory = new Map<string, string[]>();
  for (const c of p.requirements.criteria)
    criteriaByStory.set(c.storyId, [...(criteriaByStory.get(c.storyId) ?? []), c.id]);
  for (const s of p.requirements.stories) {
    const acIds = criteriaByStory.get(s.id) ?? [];
    const realized = p.tasks.some(t => t.tracesTo.some(ref => ref === s.id || acIds.includes(ref)));
    if (!realized)
      gaps.push({ kind: 'unrealized-story', entityId: s.id, message: `${s.id} has no task realizing it` });
    if (!s.servesGoalId || !goalIds.has(s.servesGoalId))
      gaps.push({ kind: 'goalless-story', entityId: s.id, message: `${s.id} serves no goal` });
  }
  return gaps;
}

export function buildMatrix(p: Project): MatrixRow[] {
  const rows: MatrixRow[] = [];
  for (const s of p.requirements.stories) {
    const crits = p.requirements.criteria.filter(c => c.storyId === s.id);
    const storyTasks = p.tasks.filter(t => t.tracesTo.includes(s.id));
    if (crits.length === 0) {
      rows.push({ storyId: s.id, goalId: s.servesGoalId, criterionId: null,
                  taskIds: storyTasks.map(t => t.id), testIds: [] });
    }
    for (const c of crits) {
      const acTasks = p.tasks.filter(t => t.tracesTo.includes(c.id) || t.tracesTo.includes(s.id));
      const tests = p.testing.tests.filter(t => t.verifies === c.id);
      rows.push({ storyId: s.id, goalId: s.servesGoalId, criterionId: c.id,
                  taskIds: acTasks.map(t => t.id), testIds: tests.map(t => t.id) });
    }
  }
  return rows;
}
```

- [ ] **Step 4: Run, expect PASS.**

- [ ] **Step 5: Commit**

```bash
git add app/src/model/traceability.ts app/src/model/traceability.test.ts
git commit -m "Add traceability engine: matrix and gap detection"
```

---

