import {
  Eye, ListChecks, Boxes, SquareCheckBig, FlaskConical, Network, Download,
  TriangleAlert, type LucideIcon,
} from 'lucide-react';
import { useProject, type View } from '@/state/projectStore';
import { detectGaps, type Gap } from '@/model/traceability';
import { cn } from '@/lib/utils';

const NAV_ITEMS: { view: View; label: string; icon: LucideIcon }[] = [
  { view: 'vision', label: 'Vision', icon: Eye },
  { view: 'requirements', label: 'Requirements', icon: ListChecks },
  { view: 'architecture', label: 'Architecture', icon: Boxes },
  { view: 'tasks', label: 'Tasks', icon: SquareCheckBig },
  { view: 'testing', label: 'Testing', icon: FlaskConical },
  { view: 'traceability', label: 'Traceability', icon: Network },
  { view: 'export', label: 'Export', icon: Download },
];

const STAGE_COUNT = 5;

const GAP_KIND_TO_VIEWS: Record<Gap['kind'], View[]> = {
  'untested-criterion': ['requirements', 'testing'],
  'goalless-story': ['requirements', 'testing'],
  'unrealized-story': ['requirements', 'testing'],
  'orphan-task': ['tasks'],
  'dangling-link': ['tasks'],
};

export interface SidebarProps {
  /** Called after a stage is chosen, so a containing sheet can close itself. */
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps = {}) {
  const { state, dispatch } = useProject();
  const gaps = detectGaps(state.project);
  const gappyViews = new Set<View>(gaps.flatMap(g => GAP_KIND_TO_VIEWS[g.kind]));

  return (
    <nav className="sidebar">
      <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
        {NAV_ITEMS.map(({ view, label, icon: Icon }, index) => {
          const active = state.view === view;
          const hasGap = gappyViews.has(view);
          const isStage = index < STAGE_COUNT;
          return (
            <li
              key={view}
              className={cn(index === STAGE_COUNT && 'mt-2 border-t border-border pt-2')}
            >
              {/* The step number and every icon are aria-hidden so the accessible name stays
                  exactly the stage label — App.integration.test.tsx matches /^Tasks/i, anchored. */}
              <button
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => {
                  dispatch({ type: 'SET_VIEW', view });
                  onNavigate?.();
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-[6px] px-2.5 py-2 text-left text-[13.5px] transition-colors',
                  active
                    ? 'bg-accent font-semibold text-accent-foreground shadow-[inset_3px_0_0_var(--primary)]'
                    : 'text-foreground hover:bg-muted',
                )}
              >
                {isStage && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      'flex size-5 shrink-0 items-center justify-center rounded-full border font-mono text-[10px]',
                      hasGap
                        ? 'border-warn bg-warn-soft text-warn'
                        : active
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border text-muted-foreground',
                    )}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                )}
                <Icon aria-hidden="true" className="size-4 shrink-0 opacity-70" />
                <span className="min-w-0 flex-1 truncate">{label}</span>
                {hasGap && <TriangleAlert aria-hidden="true" className="size-3.5 shrink-0 text-warn" />}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
