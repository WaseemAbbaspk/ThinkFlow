import { describe, it, expect } from 'vitest';
import { reducer, initialState } from './projectStore';

describe('reducer', () => {
  it('adds a story with an auto id and bumps counters', () => {
    const s1 = reducer(initialState(), { type: 'ADD_STORY' });
    expect(s1.project.requirements.stories[0].id).toBe('US-1');
    expect(s1.project.meta.counters.US).toBe(1);
  });

  it('deletes a story and unlinks criteria that belong to it', () => {
    let s = reducer(initialState(), { type: 'ADD_STORY' });
    const sid = s.project.requirements.stories[0].id;
    s = reducer(s, { type: 'ADD_CRITERION', storyId: sid });
    s = reducer(s, { type: 'DELETE_STORY', id: sid });
    expect(s.project.requirements.stories).toHaveLength(0);
    expect(s.project.requirements.criteria).toHaveLength(0); // cascade
  });

  it('deletes a story and strips it from task tracesTo links', () => {
    let s = reducer(initialState(), { type: 'ADD_STORY' });
    const sid = s.project.requirements.stories[0].id;
    s = reducer(s, { type: 'ADD_TASK' });
    const tid = s.project.tasks[0].id;
    s = reducer(s, { type: 'UPDATE_TASK', id: tid, patch: { tracesTo: [sid] } });
    s = reducer(s, { type: 'DELETE_STORY', id: sid });
    expect(s.project.tasks[0].tracesTo).not.toContain(sid); // cascade unlink
  });

  it('updates a story by id', () => {
    let s = reducer(initialState(), { type: 'ADD_STORY' });
    const sid = s.project.requirements.stories[0].id;
    s = reducer(s, { type: 'UPDATE_STORY', id: sid, patch: { role: 'user', want: 'a todo', priority: 'Should' } });
    expect(s.project.requirements.stories[0].role).toBe('user');
    expect(s.project.requirements.stories[0].want).toBe('a todo');
    expect(s.project.requirements.stories[0].priority).toBe('Should');
  });

  it('updates a criterion by id', () => {
    let s = reducer(initialState(), { type: 'ADD_STORY' });
    const sid = s.project.requirements.stories[0].id;
    s = reducer(s, { type: 'ADD_CRITERION', storyId: sid });
    const cid = s.project.requirements.criteria[0].id;
    s = reducer(s, { type: 'UPDATE_CRITERION', id: cid, patch: { text: 'must persist' } });
    expect(s.project.requirements.criteria[0].text).toBe('must persist');
  });

  it('deletes a criterion and cascades to task links and test.verifies', () => {
    let s = reducer(initialState(), { type: 'ADD_STORY' });
    const sid = s.project.requirements.stories[0].id;
    s = reducer(s, { type: 'ADD_CRITERION', storyId: sid });
    const cid = s.project.requirements.criteria[0].id;
    // a task traces to the criterion, and a test verifies it
    s = reducer(s, { type: 'ADD_TASK' });
    const tid = s.project.tasks[0].id;
    s = reducer(s, { type: 'UPDATE_TASK', id: tid, patch: { tracesTo: [cid] } });
    s = reducer(s, { type: 'ADD_TEST' });
    const testId = s.project.testing.tests[0].id;
    s = reducer(s, { type: 'UPDATE_TEST', id: testId, patch: { verifies: cid } });

    s = reducer(s, { type: 'DELETE_CRITERION', id: cid });

    expect(s.project.requirements.criteria).toHaveLength(0);        // removed
    expect(s.project.tasks[0].tracesTo).not.toContain(cid);        // task link stripped
    expect(s.project.testing.tests[0].verifies).toBe('');          // test.verifies cleared
  });

  it('patches vision fields', () => {
    const s = reducer(initialState(), { type: 'PATCH_VISION', patch: { statement: 'ship it', whyNow: 'because' } });
    expect(s.project.vision.statement).toBe('ship it');
    expect(s.project.vision.whyNow).toBe('because');
  });

  it('replaces the whole project', () => {
    const seeded = reducer(initialState(), { type: 'ADD_STORY' }).project;
    const s = reducer(initialState(), { type: 'REPLACE_PROJECT', project: seeded });
    expect(s.project.requirements.stories).toHaveLength(1);
    expect(s.project.requirements.stories[0].id).toBe('US-1');
  });

  it('changes the active view', () => {
    const s = reducer(initialState(), { type: 'SET_VIEW', view: 'export' });
    expect(s.view).toBe('export');
  });

  it('adds a goal with an auto id GOAL-1', () => {
    const s = reducer(initialState(), { type: 'ADD_GOAL' });
    expect(s.project.goals[0].id).toBe('GOAL-1');
    expect(s.project.meta.counters.GOAL).toBe(1);
  });

  it('adds an nfr with an auto id NFR-1', () => {
    const s = reducer(initialState(), { type: 'ADD_NFR' });
    expect(s.project.requirements.nfrs[0].id).toBe('NFR-1');
    expect(s.project.meta.counters.NFR).toBe(1);
  });

  it('adds an adr with an auto id ADR-1', () => {
    const s = reducer(initialState(), { type: 'ADD_ADR' });
    expect(s.project.architecture.adrs[0].id).toBe('ADR-1');
    expect(s.project.meta.counters.ADR).toBe(1);
  });

  it('adds a task with an auto id TASK-1', () => {
    const s = reducer(initialState(), { type: 'ADD_TASK' });
    expect(s.project.tasks[0].id).toBe('TASK-1');
    expect(s.project.meta.counters.TASK).toBe(1);
  });

  it('updates a task by id', () => {
    let s = reducer(initialState(), { type: 'ADD_TASK' });
    const tid = s.project.tasks[0].id;
    s = reducer(s, { type: 'UPDATE_TASK', id: tid, patch: { title: 'Do the thing', status: 'In progress' } });
    expect(s.project.tasks[0].title).toBe('Do the thing');
    expect(s.project.tasks[0].status).toBe('In progress');
  });

  it('deletes a task by id', () => {
    let s = reducer(initialState(), { type: 'ADD_TASK' });
    const tid = s.project.tasks[0].id;
    s = reducer(s, { type: 'DELETE_TASK', id: tid });
    expect(s.project.tasks).toHaveLength(0);
  });

  it('adds a test with an auto id TEST-1', () => {
    const s = reducer(initialState(), { type: 'ADD_TEST' });
    expect(s.project.testing.tests[0].id).toBe('TEST-1');
    expect(s.project.meta.counters.TEST).toBe(1);
  });

  it('updates and deletes a test by id', () => {
    let s = reducer(initialState(), { type: 'ADD_TEST' });
    const tid = s.project.testing.tests[0].id;
    s = reducer(s, { type: 'UPDATE_TEST', id: tid, patch: { description: 'Checks the thing', status: 'Pass' } });
    expect(s.project.testing.tests[0].description).toBe('Checks the thing');
    expect(s.project.testing.tests[0].status).toBe('Pass');
    s = reducer(s, { type: 'DELETE_TEST', id: tid });
    expect(s.project.testing.tests).toHaveLength(0);
  });

  it('starts with nothing selected', () => {
    expect(initialState().selectedId).toBeNull();
  });

  it('SELECT_ENTITY sets both the view and the id', () => {
    // The entity must exist first: the reducer wrapper prunes a selection that
    // names nothing, and that pruning runs on EVERY action, including this one.
    let s = reducer(initialState(), { type: 'ADD_TASK' });
    s = reducer(s, { type: 'SELECT_ENTITY', view: 'tasks', id: 'TASK-1' });
    expect(s.view).toBe('tasks');
    expect(s.selectedId).toBe('TASK-1');
  });

  it('refuses to select an id that names no entity', () => {
    const s = reducer(initialState(), { type: 'SELECT_ENTITY', view: 'tasks', id: 'TASK-9' });
    expect(s.view).toBe('tasks');
    expect(s.selectedId).toBeNull();
  });

  it('SET_VIEW clears the selection', () => {
    let s = reducer(initialState(), { type: 'SELECT_ENTITY', view: 'tasks', id: 'TASK-1' });
    s = reducer(s, { type: 'SET_VIEW', view: 'testing' });
    expect(s.selectedId).toBeNull();
  });

  it('clears the selection when the selected entity is deleted', () => {
    let s = reducer(initialState(), { type: 'ADD_TASK' });
    s = reducer(s, { type: 'SELECT_ENTITY', view: 'tasks', id: 'TASK-1' });
    s = reducer(s, { type: 'DELETE_TASK', id: 'TASK-1' });
    expect(s.selectedId).toBeNull();
  });

  it('keeps the selection when a different entity is deleted', () => {
    let s = reducer(initialState(), { type: 'ADD_TASK' });
    s = reducer(s, { type: 'ADD_TASK' });
    s = reducer(s, { type: 'SELECT_ENTITY', view: 'tasks', id: 'TASK-1' });
    s = reducer(s, { type: 'DELETE_TASK', id: 'TASK-2' });
    expect(s.selectedId).toBe('TASK-1');
  });
});

describe('id reclamation on delete', () => {
  it('reuses the number when a blank goal is added then removed', () => {
    let s = reducer(initialState(), { type: 'ADD_GOAL' });
    expect(s.project.goals[0].id).toBe('GOAL-1');

    s = reducer(s, { type: 'DELETE_GOAL', id: 'GOAL-1' });
    expect(s.project.meta.counters.GOAL).toBe(0);

    s = reducer(s, { type: 'ADD_GOAL' });
    expect(s.project.goals[0].id).toBe('GOAL-1');
  });

  it('keeps the gap when the removed goal had content', () => {
    let s = reducer(initialState(), { type: 'ADD_GOAL' });
    s = reducer(s, {
      type: 'REPLACE_PROJECT',
      project: { ...s.project, goals: [{ ...s.project.goals[0], text: 'Ship faster' }] },
    });

    s = reducer(s, { type: 'DELETE_GOAL', id: 'GOAL-1' });
    s = reducer(s, { type: 'ADD_GOAL' });
    expect(s.project.goals[0].id).toBe('GOAL-2');
  });

  it('keeps the gap when the removed goal is still referenced by a story', () => {
    let s = reducer(initialState(), { type: 'ADD_GOAL' });
    s = reducer(s, { type: 'ADD_STORY' });
    s = reducer(s, { type: 'UPDATE_STORY', id: 'US-1', patch: { servesGoalId: 'GOAL-1' } });

    s = reducer(s, { type: 'DELETE_GOAL', id: 'GOAL-1' });
    expect(s.project.requirements.stories[0].servesGoalId).toBeNull();

    s = reducer(s, { type: 'ADD_GOAL' });
    expect(s.project.goals[0].id).toBe('GOAL-2');
  });

  it('only reclaims the newest, leaving older numbers permanently spent', () => {
    let s = reducer(initialState(), { type: 'ADD_GOAL' });
    s = reducer(s, { type: 'ADD_GOAL' });
    expect(s.project.goals[1].id).toBe('GOAL-2');

    s = reducer(s, { type: 'DELETE_GOAL', id: 'GOAL-1' });
    s = reducer(s, { type: 'ADD_GOAL' });
    expect(s.project.goals.map(g => g.id)).toEqual(['GOAL-2', 'GOAL-3']);
  });

  it('reuses numbers for blank stories, tasks and tests too', () => {
    let s = reducer(initialState(), { type: 'ADD_TASK' });
    s = reducer(s, { type: 'DELETE_TASK', id: 'TASK-1' });
    s = reducer(s, { type: 'ADD_TASK' });
    expect(s.project.tasks[0].id).toBe('TASK-1');

    s = reducer(s, { type: 'ADD_TEST' });
    s = reducer(s, { type: 'DELETE_TEST', id: 'TEST-1' });
    s = reducer(s, { type: 'ADD_TEST' });
    expect(s.project.testing.tests[0].id).toBe('TEST-1');

    s = reducer(s, { type: 'ADD_STORY' });
    s = reducer(s, { type: 'DELETE_STORY', id: 'US-1' });
    s = reducer(s, { type: 'ADD_STORY' });
    expect(s.project.requirements.stories[0].id).toBe('US-1');
  });

  it('reuses a blank criterion number within its story', () => {
    let s = reducer(initialState(), { type: 'ADD_STORY' });
    s = reducer(s, { type: 'ADD_CRITERION', storyId: 'US-1' });
    expect(s.project.requirements.criteria[0].id).toBe('AC-1.1');

    s = reducer(s, { type: 'DELETE_CRITERION', id: 'AC-1.1' });
    s = reducer(s, { type: 'ADD_CRITERION', storyId: 'US-1' });
    expect(s.project.requirements.criteria[0].id).toBe('AC-1.1');
  });
});
