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
