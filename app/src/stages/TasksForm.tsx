import { useProject } from '../state/projectStore';
import { TextField, TextArea, SelectField, LinkSelect, RepeatableList } from '../components/inputs';
import { SectionCard } from '@/components/SectionCard';
import { Badge } from '@/components/ui/badge';
import { subheadingClass } from '@/components/typography';
import type { Task, TaskStatus } from '../model/types';

const STATUS_OPTIONS = [
  { value: 'Todo', label: 'Todo' },
  { value: 'In progress', label: 'In progress' },
  { value: 'In review', label: 'In review' },
  { value: 'Done', label: 'Done' },
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
    <div className="tasks-form">
      <SectionCard title="Tasks" count={tasks.length}>
        <RepeatableList<Task>
          items={tasks}
          addLabel="Add task"
          onAdd={() => dispatch({ type: 'ADD_TASK' })}
          onRemove={i => dispatch({ type: 'DELETE_TASK', id: tasks[i].id })}
          renderItem={(task) => {
            const dependsOnOptions = tasks
              .filter(t => t.id !== task.id)
              .map(t => ({ value: t.id, label: t.title || t.id }));

            return (
              <div>
                <Badge className="mb-2">{task.id}</Badge>
                <TextField
                  label="Title"
                  value={task.title}
                  onChange={v => dispatch({ type: 'UPDATE_TASK', id: task.id, patch: { title: v } })}
                />
                <LinkSelect
                  label="Traces to"
                  value={task.tracesTo}
                  options={tracesToOptions}
                  multiple
                  onChange={v => dispatch({
                    type: 'UPDATE_TASK', id: task.id, patch: { tracesTo: v as string[] },
                  })}
                />
                <LinkSelect
                  label="Depends on"
                  value={task.dependsOn}
                  options={dependsOnOptions}
                  multiple
                  onChange={v => dispatch({
                    type: 'UPDATE_TASK', id: task.id, patch: { dependsOn: v as string[] },
                  })}
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

                <SelectField
                  label="Status"
                  value={task.status}
                  options={STATUS_OPTIONS}
                  onChange={v => dispatch({ type: 'UPDATE_TASK', id: task.id, patch: { status: v as TaskStatus } })}
                />
              </div>
            );
          }}
        />
      </SectionCard>
    </div>
  );
}
