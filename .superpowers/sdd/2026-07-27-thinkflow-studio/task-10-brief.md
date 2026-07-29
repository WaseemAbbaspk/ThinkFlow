## Task 10: Project store (context + reducer + actions)

**Files:**
- Create: `app/src/state/projectStore.tsx`
- Test: `app/src/state/projectStore.test.tsx`

**Interfaces:**
- Consumes: `Project`, `emptyProject`, `nextId` (Task 3).
- Produces:
  - `type View = 'vision'|'requirements'|'architecture'|'tasks'|'testing'|'traceability'|'export'`
  - `reducer(state, action)` where state is `{ project: Project; view: View }`.
  - Action union (exact): `{type:'SET_VIEW',view}`, `{type:'PATCH_VISION',patch}`, `{type:'ADD_STORY'}`, `{type:'UPDATE_STORY',id,patch}`, `{type:'DELETE_STORY',id}`, `{type:'ADD_CRITERION',storyId}`, `{type:'UPDATE_CRITERION',id,patch}`, `{type:'DELETE_CRITERION',id}`, `{type:'ADD_GOAL'}`, `{type:'ADD_NFR'}`, `{type:'ADD_ADR'}`, `{type:'ADD_TASK'}`, `{type:'UPDATE_TASK',id,patch}`, `{type:'DELETE_TASK',id}`, `{type:'ADD_TEST'}`, `{type:'UPDATE_TEST',id,patch}`, `{type:'DELETE_TEST',id}`, `{type:'REPLACE_PROJECT',project}`. (Add analogous update/delete for goal/nfr/adr/problem/beneficiary following the same shape.)
  - `ProjectProvider` component and `useProject()` returning `{ state, dispatch }`.
- The reducer must **bump `meta.updatedAt`** and, for any add that mints an id, update `meta.counters` via `nextId`.

- [ ] **Step 1: Write the failing test (`projectStore.test.tsx`)** — test the reducer directly (it is exported):

```ts
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
  it('changes the active view', () => {
    const s = reducer(initialState(), { type: 'SET_VIEW', view: 'export' });
    expect(s.view).toBe('export');
  });
});
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement `projectStore.tsx`**

Implement the reducer as a pure function. Key rules: every mutating action returns a new state with `project.meta.updatedAt = new Date().toISOString()`; adds use `nextId`; `DELETE_STORY` cascades to its criteria and strips references from `task.tracesTo`; `DELETE_CRITERION` strips `test.verifies` and `task.tracesTo` references. Provide `initialState()` = `{ project: emptyProject('Untitled Project'), view: 'vision' }`. Wrap with a context provider and `useProject()` hook using `useReducer`. (Full reducer code — write each case explicitly; representative cases shown, follow the same immutable pattern for the analogous goal/nfr/adr/problem/beneficiary/task/test actions):

```tsx
import React, { createContext, useContext, useReducer, type Dispatch } from 'react';
import { emptyProject, type Project, type UserStory, type Criterion } from '../model/types';
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
    // ADD_GOAL / ADD_NFR / ADD_ADR / ADD_TASK / UPDATE_TASK / DELETE_TASK / ADD_TEST / UPDATE_TEST / DELETE_TEST:
    // follow the exact same immutable + nextId + touch pattern, minting GOAL-/NFR-/ADR-/TASK-/TEST- ids.
    default: return state;
  }
}

const Ctx = createContext<{ state: State; dispatch: Dispatch<Action> } | null>(null);
export function ProjectProvider({ children, preload }: { children: React.ReactNode; preload?: Project }) {
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    preload ? { project: preload, view: 'vision' } : initialState());
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}
export function useProject() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useProject must be used inside ProjectProvider');
  return v;
}
```

Implement the remaining actions (goal/nfr/adr/task/test add/update/delete) explicitly following the shown pattern before moving on.

- [ ] **Step 4: Run, expect PASS.**

- [ ] **Step 5: Commit**

```bash
git add app/src/state/projectStore.tsx app/src/state/projectStore.test.tsx
git commit -m "Add project store: context, reducer, actions with cascade deletes"
```

---

