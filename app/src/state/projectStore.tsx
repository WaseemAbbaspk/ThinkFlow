import React, { createContext, useContext, useReducer, type Dispatch } from 'react';
import {
  emptyProject,
  type Project,
  type UserStory,
  type Criterion,
  type Goal,
  type Nfr,
  type Adr,
  type Task,
  type Test,
} from '../model/types';
import { nextId } from '../model/ids';
import { reclaimCounters } from '../model/reclaim';
import { entityIndex } from '../model/registry';

export type View = 'vision'|'requirements'|'architecture'|'tasks'|'testing'|'traceability'|'export';
export interface State { project: Project; view: View; selectedId: string | null; }
export const initialState = (): State => ({
  project: emptyProject('Untitled Project'), view: 'vision', selectedId: null,
});

export type Action =
  | { type: 'SET_VIEW'; view: View }
  | { type: 'SELECT_ENTITY'; view: View; id: string | null }
  | { type: 'REPLACE_PROJECT'; project: Project }
  | { type: 'PATCH_VISION'; patch: Partial<Project['vision']> }
  | { type: 'PATCH_META'; patch: Partial<Project['meta']> }
  | { type: 'ADD_STORY' } | { type: 'UPDATE_STORY'; id: string; patch: Partial<UserStory> } | { type: 'DELETE_STORY'; id: string }
  | { type: 'ADD_CRITERION'; storyId: string } | { type: 'UPDATE_CRITERION'; id: string; patch: Partial<Criterion> } | { type: 'DELETE_CRITERION'; id: string }
  | { type: 'ADD_GOAL' } | { type: 'UPDATE_GOAL'; id: string; patch: Partial<Goal> } | { type: 'DELETE_GOAL'; id: string }
  | { type: 'ADD_NFR' } | { type: 'UPDATE_NFR'; id: string; patch: Partial<Nfr> } | { type: 'DELETE_NFR'; id: string }
  | { type: 'ADD_ADR' } | { type: 'DELETE_ADR'; id: string }
  | { type: 'ADD_TASK' } | { type: 'UPDATE_TASK'; id: string; patch: Partial<Project['tasks'][number]> } | { type: 'DELETE_TASK'; id: string }
  | { type: 'ADD_TEST' } | { type: 'UPDATE_TEST'; id: string; patch: Partial<Project['testing']['tests'][number]> } | { type: 'DELETE_TEST'; id: string }
  | { type: 'DUPLICATE_STORY'; id: string }
  | { type: 'DUPLICATE_TASK'; id: string }
  | { type: 'DUPLICATE_TEST'; id: string };

function touch(p: Project): Project { return { ...p, meta: { ...p.meta, updatedAt: new Date().toISOString() } }; }
function storyNumber(id: string): number { return parseInt(id.split('-')[1], 10); }

function baseReducer(state: State, action: Action): State {
  const p = state.project;
  switch (action.type) {
    case 'SET_VIEW': return { ...state, view: action.view, selectedId: null };
    case 'SELECT_ENTITY': return { ...state, view: action.view, selectedId: action.id };
    case 'REPLACE_PROJECT': return { ...state, project: action.project };
    case 'PATCH_VISION':
      return { ...state, project: touch({ ...p, vision: { ...p.vision, ...action.patch } }) };
    case 'PATCH_META':
      return { ...state, project: touch({ ...p, meta: { ...p.meta, ...action.patch } }) };
    case 'ADD_STORY': {
      const { id, counters } = nextId(p.meta.counters, 'US');
      const story: UserStory = { id, role: '', want: '', benefit: '', priority: 'Must', servesGoalId: null };
      return { ...state, project: touch({ ...p, meta: { ...p.meta, counters },
        requirements: { ...p.requirements, stories: [...p.requirements.stories, story] } }) };
    }
    case 'UPDATE_STORY':
      return { ...state, project: touch({ ...p, requirements: { ...p.requirements,
        stories: p.requirements.stories.map(s => s.id === action.id ? { ...s, ...action.patch } : s) } }) };
    case 'DELETE_STORY': {
      const story = p.requirements.stories.find(s => s.id === action.id);
      const counters = story ? reclaimCounters(p, { kind: 'US', entity: story }) : p.meta.counters;
      return { ...state, project: touch({ ...p, meta: { ...p.meta, counters },
        requirements: { ...p.requirements,
        stories: p.requirements.stories.filter(s => s.id !== action.id),
        criteria: p.requirements.criteria.filter(c => c.storyId !== action.id) },
        tasks: p.tasks.map(t => ({ ...t, tracesTo: t.tracesTo.filter(r => r !== action.id) })) }) };
    }
    case 'ADD_CRITERION': {
      const { id, counters } = nextId(p.meta.counters, 'AC', { storyNumber: storyNumber(action.storyId) });
      const crit: Criterion = { id, storyId: action.storyId, text: '' };
      return { ...state, project: touch({ ...p, meta: { ...p.meta, counters },
        requirements: { ...p.requirements, criteria: [...p.requirements.criteria, crit] } }) };
    }
    case 'UPDATE_CRITERION':
      return { ...state, project: touch({ ...p, requirements: { ...p.requirements,
        criteria: p.requirements.criteria.map(c => c.id === action.id ? { ...c, ...action.patch } : c) } }) };
    case 'DELETE_CRITERION': {
      const crit = p.requirements.criteria.find(c => c.id === action.id);
      const counters = crit ? reclaimCounters(p, { kind: 'AC', entity: crit }) : p.meta.counters;
      return { ...state, project: touch({ ...p, meta: { ...p.meta, counters },
        requirements: { ...p.requirements, criteria: p.requirements.criteria.filter(c => c.id !== action.id) },
        tasks: p.tasks.map(t => ({ ...t, tracesTo: t.tracesTo.filter(r => r !== action.id) })),
        testing: { ...p.testing, tests: p.testing.tests.map(t => t.verifies === action.id ? { ...t, verifies: '' } : t) } }) };
    }

    case 'ADD_GOAL': {
      const { id, counters } = nextId(p.meta.counters, 'GOAL');
      const goal: Goal = { id, text: '', metric: '' };
      return { ...state, project: touch({ ...p, meta: { ...p.meta, counters },
        goals: [...p.goals, goal] }) };
    }

    case 'UPDATE_GOAL':
      return { ...state, project: touch({ ...p,
        goals: p.goals.map(g => g.id === action.id ? { ...g, ...action.patch } : g) }) };

    case 'DELETE_GOAL': {
      const goal = p.goals.find(g => g.id === action.id);
      const counters = goal ? reclaimCounters(p, { kind: 'GOAL', entity: goal }) : p.meta.counters;
      return { ...state, project: touch({ ...p, meta: { ...p.meta, counters },
        goals: p.goals.filter(g => g.id !== action.id),
        requirements: { ...p.requirements,
          stories: p.requirements.stories.map(s =>
            s.servesGoalId === action.id ? { ...s, servesGoalId: null } : s) } }) };
    }

    case 'DELETE_NFR': {
      const nfr = p.requirements.nfrs.find(n => n.id === action.id);
      const counters = nfr ? reclaimCounters(p, { kind: 'NFR', entity: nfr }) : p.meta.counters;
      return { ...state, project: touch({ ...p, meta: { ...p.meta, counters },
        requirements: { ...p.requirements, nfrs: p.requirements.nfrs.filter(n => n.id !== action.id) },
        architecture: { ...p.architecture,
          adrs: p.architecture.adrs.map(a => ({ ...a, relatesTo: a.relatesTo.filter(r => r !== action.id) })) } }) };
    }

    case 'DELETE_ADR': {
      const adr = p.architecture.adrs.find(a => a.id === action.id);
      const counters = adr ? reclaimCounters(p, { kind: 'ADR', entity: adr }) : p.meta.counters;
      return { ...state, project: touch({ ...p, meta: { ...p.meta, counters },
        architecture: { ...p.architecture,
          adrs: p.architecture.adrs.filter(a => a.id !== action.id),
          components: p.architecture.components.map(c => ({ ...c, adrIds: c.adrIds.filter(r => r !== action.id) })) } }) };
    }

    case 'ADD_NFR': {
      const { id, counters } = nextId(p.meta.counters, 'NFR');
      const nfr: Nfr = { id, name: '', target: '' };
      return { ...state, project: touch({ ...p, meta: { ...p.meta, counters },
        requirements: { ...p.requirements, nfrs: [...p.requirements.nfrs, nfr] } }) };
    }

    case 'UPDATE_NFR':
      return { ...state, project: touch({ ...p, requirements: { ...p.requirements,
        nfrs: p.requirements.nfrs.map(n => n.id === action.id ? { ...n, ...action.patch } : n) } }) };

    case 'ADD_ADR': {
      const { id, counters } = nextId(p.meta.counters, 'ADR');
      const adr: Adr = {
        id, title: '', status: 'Proposed', date: '', deciders: '',
        relatesTo: [], context: '', options: [], decision: '',
        rationale: '', consequencesPositive: '', consequencesTradeoffs: '', followUps: '',
      };
      return { ...state, project: touch({ ...p, meta: { ...p.meta, counters },
        architecture: { ...p.architecture, adrs: [...p.architecture.adrs, adr] } }) };
    }

    case 'ADD_TASK': {
      const { id, counters } = nextId(p.meta.counters, 'TASK');
      const task: Task = {
        id, title: '', tracesTo: [], dependsOn: [], goal: '', contextForAgent: '',
        acceptance: [], outOfScope: '', status: 'Todo',
      };
      return { ...state, project: touch({ ...p, meta: { ...p.meta, counters },
        tasks: [...p.tasks, task] }) };
    }
    case 'UPDATE_TASK':
      return { ...state, project: touch({ ...p,
        tasks: p.tasks.map(t => t.id === action.id ? { ...t, ...action.patch } : t) }) };
    case 'DELETE_TASK': {
      const task = p.tasks.find(t => t.id === action.id);
      const counters = task ? reclaimCounters(p, { kind: 'TASK', entity: task }) : p.meta.counters;
      return { ...state, project: touch({ ...p, meta: { ...p.meta, counters },
        tasks: p.tasks.filter(t => t.id !== action.id) }) };
    }

    case 'ADD_TEST': {
      const { id, counters } = nextId(p.meta.counters, 'TEST');
      const test: Test = { id, verifies: '', description: '', level: 'Unit', status: 'Not run' };
      return { ...state, project: touch({ ...p, meta: { ...p.meta, counters },
        testing: { ...p.testing, tests: [...p.testing.tests, test] } }) };
    }
    case 'UPDATE_TEST':
      return { ...state, project: touch({ ...p, testing: { ...p.testing,
        tests: p.testing.tests.map(t => t.id === action.id ? { ...t, ...action.patch } : t) } }) };
    case 'DELETE_TEST': {
      const test = p.testing.tests.find(t => t.id === action.id);
      const counters = test ? reclaimCounters(p, { kind: 'TEST', entity: test }) : p.meta.counters;
      return { ...state, project: touch({ ...p, meta: { ...p.meta, counters },
        testing: { ...p.testing, tests: p.testing.tests.filter(t => t.id !== action.id) } }) };
    }

    case 'DUPLICATE_STORY': {
      const src = p.requirements.stories.find(s => s.id === action.id);
      if (!src) return state;
      const { id, counters } = nextId(p.meta.counters, 'US');
      const story: UserStory = { ...src, id };
      /* Criteria come along. A story's criteria are visible in its inspector, so
         duplicating without them would look like silent data loss. Each copy gets
         a fresh AC id numbered under the NEW story. */
      let running = counters;
      const copies: Criterion[] = [];
      for (const c of p.requirements.criteria.filter(c => c.storyId === action.id)) {
        const allocated = nextId(running, 'AC', { storyNumber: storyNumber(id) });
        running = allocated.counters;
        copies.push({ ...c, id: allocated.id, storyId: id });
      }
      return { ...state, project: touch({ ...p, meta: { ...p.meta, counters: running },
        requirements: { ...p.requirements,
          stories: [...p.requirements.stories, story],
          criteria: [...p.requirements.criteria, ...copies] } }) };
    }

    case 'DUPLICATE_TASK': {
      const src = p.tasks.find(t => t.id === action.id);
      if (!src) return state;
      const { id, counters } = nextId(p.meta.counters, 'TASK');
      const task: Task = {
        ...src, id,
        tracesTo: [...src.tracesTo],
        dependsOn: [...src.dependsOn],
        acceptance: [...src.acceptance],
      };
      return { ...state, project: touch({ ...p, meta: { ...p.meta, counters },
        tasks: [...p.tasks, task] }) };
    }

    case 'DUPLICATE_TEST': {
      const src = p.testing.tests.find(t => t.id === action.id);
      if (!src) return state;
      const { id, counters } = nextId(p.meta.counters, 'TEST');
      return { ...state, project: touch({ ...p, meta: { ...p.meta, counters },
        testing: { ...p.testing, tests: [...p.testing.tests, { ...src, id }] } }) };
    }

    default: return state;
  }
}

/**
 * Selection must never point at an entity that no longer exists — deleting the
 * selected record has to close the inspector rather than leave it rendering a
 * stale row. Checking after the fact means every DELETE_* case gets this for
 * free instead of each one remembering to clear.
 */
export function reducer(state: State, action: Action): State {
  const next = baseReducer(state, action);
  if (next.selectedId !== null && !entityIndex(next.project).has(next.selectedId)) {
    return { ...next, selectedId: null };
  }
  return next;
}

const Ctx = createContext<{ state: State; dispatch: Dispatch<Action> } | null>(null);
export function ProjectProvider({ children, preload }: { children: React.ReactNode; preload?: Project }) {
  const [state, dispatch] = useReducer<React.Reducer<State, Action>, undefined>(reducer, undefined, () =>
    preload ? { project: preload, view: 'vision', selectedId: null } : initialState());
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}
export function useProject() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useProject must be used inside ProjectProvider');
  return v;
}
