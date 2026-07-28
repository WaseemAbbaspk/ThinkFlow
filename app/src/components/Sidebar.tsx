import React from 'react';
import { useProject, type View } from '../state/projectStore';
import { detectGaps, type Gap } from '../model/traceability';

const NAV_ITEMS: { view: View; label: string }[] = [
  { view: 'vision', label: 'Vision' },
  { view: 'requirements', label: 'Requirements' },
  { view: 'architecture', label: 'Architecture' },
  { view: 'tasks', label: 'Tasks' },
  { view: 'testing', label: 'Testing' },
  { view: 'traceability', label: 'Traceability' },
  { view: 'export', label: 'Export' },
];

const GAP_KIND_TO_VIEWS: Record<Gap['kind'], View[]> = {
  'untested-criterion': ['requirements', 'testing'],
  'goalless-story': ['requirements', 'testing'],
  'unrealized-story': ['requirements', 'testing'],
  'orphan-task': ['tasks'],
  'dangling-link': ['tasks'],
};

export function Sidebar() {
  const { state, dispatch } = useProject();
  const gaps = detectGaps(state.project);
  const gappyViews = new Set<View>(gaps.flatMap(g => GAP_KIND_TO_VIEWS[g.kind]));

  return (
    <nav className="sidebar">
      <ul>
        {NAV_ITEMS.map(({ view, label }) => {
          const active = state.view === view;
          const hasGap = gappyViews.has(view);
          return (
            <li key={view}>
              <button
                type="button"
                className={active ? 'active' : undefined}
                aria-current={active ? 'page' : undefined}
                onClick={() => dispatch({ type: 'SET_VIEW', view })}
              >
                {label}
                {hasGap && <span aria-hidden="true"> ⚠</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
