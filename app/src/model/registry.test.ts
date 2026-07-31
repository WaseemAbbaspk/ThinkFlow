import { describe, it, expect } from 'vitest';
import { entityIndex } from './registry';
import { reducer, initialState } from '@/state/projectStore';

function seeded() {
  let s = reducer(initialState(), { type: 'ADD_GOAL' });
  s = reducer(s, { type: 'ADD_STORY' });
  s = reducer(s, { type: 'ADD_CRITERION', storyId: 'US-1' });
  s = reducer(s, { type: 'ADD_NFR' });
  s = reducer(s, { type: 'ADD_ADR' });
  s = reducer(s, { type: 'ADD_TASK' });
  s = reducer(s, { type: 'ADD_TEST' });
  return s.project;
}

describe('entityIndex', () => {
  it('maps every entity kind to its owning view', () => {
    const idx = entityIndex(seeded());
    expect(idx.get('GOAL-1')?.view).toBe('requirements');
    expect(idx.get('US-1')?.view).toBe('requirements');
    expect(idx.get('AC-1.1')?.view).toBe('requirements');
    expect(idx.get('NFR-1')?.view).toBe('requirements');
    expect(idx.get('ADR-1')?.view).toBe('architecture');
    expect(idx.get('TASK-1')?.view).toBe('tasks');
    expect(idx.get('TEST-1')?.view).toBe('testing');
  });

  it('falls back to the id when the entity has no text yet', () => {
    expect(entityIndex(seeded()).get('TASK-1')?.label).toBe('TASK-1');
  });

  it('prefers the entity text as the label', () => {
    let s = reducer(initialState(), { type: 'ADD_TASK' });
    s = reducer(s, { type: 'UPDATE_TASK', id: 'TASK-1', patch: { title: 'Wire up CI' } });
    expect(entityIndex(s.project).get('TASK-1')?.label).toBe('Wire up CI');
  });

  it('returns an empty index for an empty project', () => {
    expect(entityIndex(initialState().project).size).toBe(0);
  });
});
