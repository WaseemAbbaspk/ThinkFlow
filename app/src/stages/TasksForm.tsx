import { useProject } from '../state/projectStore';
import { TextField, TextArea, SelectField, LinkSelect, RepeatableList } from '../components/inputs';
import { ListDetail } from '@/components/ListDetail';
import { Badge } from '@/components/ui/badge';
import { subheadingClass } from '@/components/typography';
import type { FilterGroup, SortOption } from '@/lib/listView';
import type { Task, TaskStatus } from '../model/types';

const STATUS_ORDER: TaskStatus[] = ['Todo', 'In progress', 'In review', 'Done'];
const STATUS_OPTIONS = STATUS_ORDER.map(s => ({ value: s, label: s }));

/* Module-level so the references stay stable across renders. */
const SORTS: SortOption<Task>[] = [
  { id: 'id', label: 'ID', compare: (a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }) },
  { id: 'title', label: 'Title A–Z', compare: (a, b) => a.title.localeCompare(b.title) },
  { id: 'status', label: 'Status', compare: (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) },
];

const FILTERS: FilterGroup<Task>[] = [
  {
    id: 'status', label: 'Status',
    options: STATUS_OPTIONS,
    matches: (t, v) => t.status === v,
  },
  {
    id: 'traced', label: 'Tracing',
    options: [{ value: 'traced', label: 'Traced' }, { value: 'untraced', label: 'Untraced' }],
    matches: (t, v) => (v === 'traced' ? t.tracesTo.length > 0 : t.tracesTo.length === 0),
  },
];

export function TasksForm() {
  const { state, dispatch } = useProject();
  const project = state.project;
  const { requirements, tasks } = project;

  const tracesToOptions = [
    ...requirements.stories.map(s => ({ value: s.id, label: s.id })),
    ...requirements.criteria.map(c => ({ value: c.id, label: c.id })),
  ];

  return (
    <ListDetail<Task>
      items={tasks}
      getId={t => t.id}
      getTitle={t => t.title}
      getSearchText={t => `${t.id} ${t.title} ${t.goal}`}
      sorts={SORTS}
      filters={FILTERS}
      selectedId={state.selectedId}
      onSelect={id => dispatch({ type: 'SELECT_ENTITY', view: 'tasks', id })}
      onAdd={() => dispatch({ type: 'ADD_TASK' })}
      onDelete={id => dispatch({ type: 'DELETE_TASK', id })}
      onDuplicate={id => dispatch({ type: 'DUPLICATE_TASK', id })}
      addLabel="Add task"
      searchLabel="Search tasks"
      emptyMessage="No tasks yet. Add one to get started."
      renderRow={task => (
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Badge>{task.id}</Badge>
            <span className="min-w-0 flex-1 truncate font-medium">{task.title || 'Untitled task'}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{task.status}</span>
          </div>
          {task.tracesTo.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tracesTo.map(ref => <Badge key={ref} variant="outline">{ref}</Badge>)}
            </div>
          )}
        </div>
      )}
      renderInspector={task => {
        const dependsOnOptions = tasks
          .filter(t => t.id !== task.id)
          .map(t => ({ value: t.id, label: t.title || t.id }));

        return (
          <div>
            <TextField
              label="Title"
              value={task.title}
              onChange={v => dispatch({ type: 'UPDATE_TASK', id: task.id, patch: { title: v } })}
            />
            <SelectField
              label="Status"
              value={task.status}
              options={STATUS_OPTIONS}
              onChange={v => dispatch({ type: 'UPDATE_TASK', id: task.id, patch: { status: v as TaskStatus } })}
            />
            <LinkSelect
              label="Traces to"
              value={task.tracesTo}
              options={tracesToOptions}
              multiple
              onChange={v => dispatch({ type: 'UPDATE_TASK', id: task.id, patch: { tracesTo: v as string[] } })}
            />
            <LinkSelect
              label="Depends on"
              value={task.dependsOn}
              options={dependsOnOptions}
              multiple
              onChange={v => dispatch({ type: 'UPDATE_TASK', id: task.id, patch: { dependsOn: v as string[] } })}
            />
            <TextArea
              label="Goal"
              value={task.goal}
              onChange={v => dispatch({ type: 'UPDATE_TASK', id: task.id, patch: { goal: v } })}
            />
            <TextArea
              label="Context for agent"
              value={task.contextForAgent}
              onChange={v => dispatch({ type: 'UPDATE_TASK', id: task.id, patch: { contextForAgent: v } })}
            />
            <TextArea
              label="Out of scope"
              value={task.outOfScope}
              onChange={v => dispatch({ type: 'UPDATE_TASK', id: task.id, patch: { outOfScope: v } })}
            />

            <h4 className={subheadingClass}>Acceptance</h4>
            <RepeatableList<string>
              items={task.acceptance}
              addLabel="Add acceptance"
              onAdd={() => dispatch({
                type: 'UPDATE_TASK', id: task.id, patch: { acceptance: [...task.acceptance, ''] },
              })}
              onRemove={i => dispatch({
                type: 'UPDATE_TASK', id: task.id,
                patch: { acceptance: task.acceptance.filter((_, idx) => idx !== i) },
              })}
              renderItem={(item, i) => (
                <TextField
                  label="Acceptance"
                  value={item}
                  onChange={v => dispatch({
                    type: 'UPDATE_TASK', id: task.id,
                    patch: { acceptance: task.acceptance.map((a, idx) => idx === i ? v : a) },
                  })}
                />
              )}
            />
          </div>
        );
      }}
    />
  );
}
