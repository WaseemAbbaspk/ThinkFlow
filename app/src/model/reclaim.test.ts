import { describe, it, expect } from 'vitest';
import { emptyProject, type Project } from './types';
import { isBlank, isReferenced, reclaimCounters } from './reclaim';

function seeded(): Project {
  const p = emptyProject('Demo');
  p.meta.counters = { GOAL: 1, US: 1, NFR: 1, ADR: 1, TASK: 1, TEST: 1, 'AC:1': 1 };
  return p;
}

describe('isBlank', () => {
  it('treats a freshly added goal as blank and a filled one as not', () => {
    expect(isBlank({ kind: 'GOAL', entity: { id: 'GOAL-1', text: '', metric: '' } })).toBe(true);
    expect(isBlank({ kind: 'GOAL', entity: { id: 'GOAL-1', text: 'Be fast', metric: '' } })).toBe(false);
    expect(isBlank({ kind: 'GOAL', entity: { id: 'GOAL-1', text: '', metric: '<100ms' } })).toBe(false);
  });

  it('ignores default enum values when judging stories, tasks and tests', () => {
    expect(isBlank({
      kind: 'US',
      entity: { id: 'US-1', role: '', want: '', benefit: '', priority: 'Must', servesGoalId: null },
    })).toBe(true);
    expect(isBlank({
      kind: 'US',
      entity: { id: 'US-1', role: 'user', want: '', benefit: '', priority: 'Must', servesGoalId: null },
    })).toBe(false);

    expect(isBlank({
      kind: 'TASK',
      entity: {
        id: 'TASK-1', title: '', tracesTo: [], dependsOn: [], goal: '',
        contextForAgent: '', acceptance: [], outOfScope: '', status: 'Todo',
      },
    })).toBe(true);

    expect(isBlank({
      kind: 'TEST',
      entity: { id: 'TEST-1', verifies: '', description: '', level: 'Unit', status: 'Not run' },
    })).toBe(true);
    expect(isBlank({
      kind: 'TEST',
      entity: { id: 'TEST-1', verifies: 'AC-1.1', description: '', level: 'Unit', status: 'Not run' },
    })).toBe(false);
  });

  it('treats whitespace-only text as blank', () => {
    expect(isBlank({ kind: 'NFR', entity: { id: 'NFR-1', name: '   ', target: '\t' } })).toBe(true);
  });
});

describe('isReferenced', () => {
  it('sees a goal referenced by a story', () => {
    const p = seeded();
    p.requirements.stories.push({
      id: 'US-1', role: '', want: '', benefit: '', priority: 'Must', servesGoalId: 'GOAL-1',
    });
    expect(isReferenced(p, 'GOAL-1')).toBe(true);
    expect(isReferenced(p, 'GOAL-2')).toBe(false);
  });

  it('sees a story referenced by its criteria and by task links', () => {
    const p = seeded();
    p.requirements.criteria.push({ id: 'AC-1.1', storyId: 'US-1', text: '' });
    expect(isReferenced(p, 'US-1')).toBe(true);

    const q = seeded();
    q.tasks.push({
      id: 'TASK-1', title: '', tracesTo: ['US-1'], dependsOn: [], goal: '',
      contextForAgent: '', acceptance: [], outOfScope: '', status: 'Todo',
    });
    expect(isReferenced(q, 'US-1')).toBe(true);
  });

  it('sees an NFR referenced by an ADR and an ADR referenced by a component', () => {
    const p = seeded();
    p.architecture.adrs.push({
      id: 'ADR-1', title: '', status: 'Proposed', date: '', deciders: '',
      relatesTo: ['NFR-1'], context: '', options: [], decision: '',
      rationale: '', consequencesPositive: '', consequencesTradeoffs: '', followUps: '',
    });
    expect(isReferenced(p, 'NFR-1')).toBe(true);

    p.architecture.components.push({ name: 'api', responsibility: '', adrIds: ['ADR-1'] });
    expect(isReferenced(p, 'ADR-1')).toBe(true);
  });
});

describe('reclaimCounters', () => {
  it('rewinds when the deleted entity is blank, unreferenced and highest-numbered', () => {
    const p = seeded();
    const counters = reclaimCounters(p, { kind: 'GOAL', entity: { id: 'GOAL-1', text: '', metric: '' } });
    expect(counters.GOAL).toBe(0);
  });

  it('does not rewind when the entity holds data', () => {
    const p = seeded();
    const counters = reclaimCounters(p, { kind: 'GOAL', entity: { id: 'GOAL-1', text: 'Be fast', metric: '' } });
    expect(counters.GOAL).toBe(1);
  });

  it('does not rewind when the entity is referenced', () => {
    const p = seeded();
    p.requirements.stories.push({
      id: 'US-1', role: '', want: '', benefit: '', priority: 'Must', servesGoalId: 'GOAL-1',
    });
    const counters = reclaimCounters(p, { kind: 'GOAL', entity: { id: 'GOAL-1', text: '', metric: '' } });
    expect(counters.GOAL).toBe(1);
  });

  it('does not rewind when the entity is not the highest-numbered', () => {
    const p = seeded();
    p.meta.counters = { ...p.meta.counters, GOAL: 3 };
    const counters = reclaimCounters(p, { kind: 'GOAL', entity: { id: 'GOAL-1', text: '', metric: '' } });
    expect(counters.GOAL).toBe(3);
  });

  it('rewinds a criterion against its per-story counter', () => {
    const p = seeded();
    const counters = reclaimCounters(p, {
      kind: 'AC', entity: { id: 'AC-1.1', storyId: 'US-1', text: '' },
    });
    expect(counters['AC:1']).toBe(0);
  });
});
