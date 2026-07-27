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
