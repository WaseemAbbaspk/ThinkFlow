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

export type View = 'vision'|'requirements'|'architecture'|'tasks'|'testing'|'traceability'|'export';
export interface State { project: Project; view: View; }
export const initialState = (): State => ({ project: emptyProject('Untitled Project'), view: 'vision' });

export type Action =
  | { type: 'SET_VIEW'; view: View }
  | { type: 'REPLACE_PROJECT'; project: Project }
  | { type: 'PATCH_VISION'; patch: Partial<Project['vision']> }
  | { type: 'ADD_STORY' } | { type: 'UPDATE_STORY'; id: string; patch: Partial<UserStory> } | { type: 'DELETE_STORY'; id: string }
  | { type: 'ADD_CRITERION'; storyId: string } | { type: 'UPDATE_CRITERION'; id: string; patch: Partial<Criterion> } | { type: 'DELETE_CRITERION'; id: string }
  | { type: 'ADD_GOAL' } | { type: 'ADD_NFR' } | { type: 'ADD_ADR' }
  | { type: 'ADD_TASK' } | { type: 'UPDATE_TASK'; id: string; patch: Partial<Project['tasks'][number]> } | { type: 'DELETE_TASK'; id: string }
  | { type: 'ADD_TEST' } | { type: 'UPDATE_TEST'; id: string; patch: Partial<Project['testing']['tests'][number]> } | { type: 'DELETE_TEST'; id: string };

function touch(p: Project): Project { return { ...p, meta: { ...p.meta, updatedAt: new Date().toISOString() } }; }
function storyNumber(id: string): number { return parseInt(id.split('-')[1], 10); }

export function reducer(state: State, action: Action): State {
  const p = state.project;
  switch (action.type) {
    case 'SET_VIEW': return { ...state, view: action.view };
    case 'REPLACE_PROJECT': return { ...state, project: action.project };
    case 'PATCH_VISION':
      return { ...state, project: touch({ ...p, vision: { ...p.vision, ...action.patch } }) };
    case 'ADD_STORY': {
      const { id, counters } = nextId(p.meta.counters, 'US');
      const story: UserStory = { id, role: '', want: '', benefit: '', priority: 'Must', servesGoalId: null };
      return { ...state, project: touch({ ...p, meta: { ...p.meta, counters },
        requirements: { ...p.requirements, stories: [...p.requirements.stories, story] } }) };
    }
    case 'UPDATE_STORY':
      return { ...state, project: touch({ ...p, requirements: { ...p.requirements,
        stories: p.requirements.stories.map(s => s.id === action.id ? { ...s, ...action.patch } : s) } }) };
    case 'DELETE_STORY':
      return { ...state, project: touch({ ...p, requirements: { ...p.requirements,
        stories: p.requirements.stories.filter(s => s.id !== action.id),
        criteria: p.requirements.criteria.filter(c => c.storyId !== action.id) },
        tasks: p.tasks.map(t => ({ ...t, tracesTo: t.tracesTo.filter(r => r !== action.id) })) }) };
    case 'ADD_CRITERION': {
      const { id, counters } = nextId(p.meta.counters, 'AC', { storyNumber: storyNumber(action.storyId) });
      const crit: Criterion = { id, storyId: action.storyId, text: '' };
      return { ...state, project: touch({ ...p, meta: { ...p.meta, counters },
        requirements: { ...p.requirements, criteria: [...p.requirements.criteria, crit] } }) };
    }
    case 'UPDATE_CRITERION':
      return { ...state, project: touch({ ...p, requirements: { ...p.requirements,
        criteria: p.requirements.criteria.map(c => c.id === action.id ? { ...c, ...action.patch } : c) } }) };
    case 'DELETE_CRITERION':
      return { ...state, project: touch({ ...p,
        requirements: { ...p.requirements, criteria: p.requirements.criteria.filter(c => c.id !== action.id) },
        tasks: p.tasks.map(t => ({ ...t, tracesTo: t.tracesTo.filter(r => r !== action.id) })),
        testing: { ...p.testing, tests: p.testing.tests.map(t => t.verifies === action.id ? { ...t, verifies: '' } : t) } }) };

    case 'ADD_GOAL': {
      const { id, counters } = nextId(p.meta.counters, 'GOAL');
      const goal: Goal = { id, text: '', metric: '' };
      return { ...state, project: touch({ ...p, meta: { ...p.meta, counters },
        goals: [...p.goals, goal] }) };
    }

    case 'ADD_NFR': {
      const { id, counters } = nextId(p.meta.counters, 'NFR');
      const nfr: Nfr = { id, name: '', target: '' };
      return { ...state, project: touch({ ...p, meta: { ...p.meta, counters },
        requirements: { ...p.requirements, nfrs: [...p.requirements.nfrs, nfr] } }) };
    }

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
    case 'DELETE_TASK':
      return { ...state, project: touch({ ...p,
        tasks: p.tasks.filter(t => t.id !== action.id) }) };

    case 'ADD_TEST': {
      const { id, counters } = nextId(p.meta.counters, 'TEST');
      const test: Test = { id, verifies: '', description: '', level: 'Unit', status: 'Not run' };
      return { ...state, project: touch({ ...p, meta: { ...p.meta, counters },
        testing: { ...p.testing, tests: [...p.testing.tests, test] } }) };
    }
    case 'UPDATE_TEST':
      return { ...state, project: touch({ ...p, testing: { ...p.testing,
        tests: p.testing.tests.map(t => t.id === action.id ? { ...t, ...action.patch } : t) } }) };
    case 'DELETE_TEST':
      return { ...state, project: touch({ ...p, testing: { ...p.testing,
        tests: p.testing.tests.filter(t => t.id !== action.id) } }) };

    default: return state;
  }
}

const Ctx = createContext<{ state: State; dispatch: Dispatch<Action> } | null>(null);
export function ProjectProvider({ children, preload }: { children: React.ReactNode; preload?: Project }) {
  const [state, dispatch] = useReducer<React.Reducer<State, Action>, undefined>(reducer, undefined, () =>
    preload ? { project: preload, view: 'vision' } : initialState());
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}
export function useProject() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useProject must be used inside ProjectProvider');
  return v;
}
