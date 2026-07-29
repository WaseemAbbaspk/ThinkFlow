import { useProject } from '../state/projectStore';
import { useConfirm } from '@/state/confirm';
import { TextField, SelectField, LinkSelect, RepeatableList } from '../components/inputs';
import { SectionCard } from '@/components/SectionCard';
import { Badge } from '@/components/ui/badge';
import { subheadingClass } from '@/components/typography';
import type { Goal, UserStory, Criterion, Nfr, Priority } from '../model/types';

const PRIORITY_OPTIONS = [
  { value: 'Must', label: 'Must' },
  { value: 'Should', label: 'Should' },
  { value: 'Could', label: 'Could' },
];

export function RequirementsForm() {
  const { state, dispatch } = useProject();
  const confirm = useConfirm();
  const project = state.project;
  const { requirements, tasks, testing } = project;

  function replace(patch: Partial<typeof project>) {
    dispatch({ type: 'REPLACE_PROJECT', project: { ...project, ...patch } });
  }
  function replaceRequirements(patch: Partial<typeof requirements>) {
    replace({ requirements: { ...requirements, ...patch } });
  }

  const goalOptions = project.goals.map(g => ({ value: g.id, label: g.text || g.id }));

  return (
    <div className="requirements-form">
      <SectionCard title="Goals" count={project.goals.length}>
        <RepeatableList<Goal>
          items={project.goals}
          addLabel="Add goal"
          onAdd={() => dispatch({ type: 'ADD_GOAL' })}
          onRemove={i => replace({ goals: project.goals.filter((_, idx) => idx !== i) })}
          renderItem={(item, i) => (
            <>
              <Badge className="mb-2">{item.id}</Badge>
              <TextField
                label="Text"
                value={item.text}
                onChange={v => replace({
                  goals: project.goals.map((g, idx) => idx === i ? { ...g, text: v } : g),
                })}
              />
              <TextField
                label="Metric"
                value={item.metric}
                onChange={v => replace({
                  goals: project.goals.map((g, idx) => idx === i ? { ...g, metric: v } : g),
                })}
              />
            </>
          )}
        />
      </SectionCard>

      <SectionCard title="Stories" count={requirements.stories.length}>
        <RepeatableList<UserStory>
          items={requirements.stories}
          addLabel="Add story"
          onAdd={() => dispatch({ type: 'ADD_STORY' })}
          onRemove={async i => {
            const story = requirements.stories[i];
            const dependentCriteria = requirements.criteria.filter(c => c.storyId === story.id);
            const dependentTasks = tasks.filter(t => t.tracesTo.includes(story.id));
            if (dependentCriteria.length > 0 || dependentTasks.length > 0) {
              const ok = await confirm({
                title: `Delete ${story.id}?`,
                description: `This also removes ${dependentCriteria.length} criteria and unlinks ${dependentTasks.length} tasks.`,
                confirmLabel: 'Delete',
              });
              if (!ok) return;
            }
            dispatch({ type: 'DELETE_STORY', id: story.id });
          }}
          renderItem={(story) => (
            <div>
              <Badge className="mb-2">{story.id}</Badge>
              <TextField
                label="Role"
                value={story.role}
                onChange={v => dispatch({ type: 'UPDATE_STORY', id: story.id, patch: { role: v } })}
              />
              <TextField
                label="Want"
                value={story.want}
                onChange={v => dispatch({ type: 'UPDATE_STORY', id: story.id, patch: { want: v } })}
              />
              <TextField
                label="Benefit"
                value={story.benefit}
                onChange={v => dispatch({ type: 'UPDATE_STORY', id: story.id, patch: { benefit: v } })}
              />
              <SelectField
                label="Priority"
                value={story.priority}
                options={PRIORITY_OPTIONS}
                onChange={v => dispatch({ type: 'UPDATE_STORY', id: story.id, patch: { priority: v as Priority } })}
              />
              <LinkSelect
                label="Serves goal"
                value={story.servesGoalId ?? ''}
                options={goalOptions}
                onChange={v => dispatch({
                  type: 'UPDATE_STORY', id: story.id,
                  patch: { servesGoalId: (v as string) || null },
                })}
              />

              <h4 className={subheadingClass}>Criteria</h4>
              <RepeatableList<Criterion>
                items={requirements.criteria.filter(c => c.storyId === story.id)}
                addLabel="Add criterion"
                onAdd={() => dispatch({ type: 'ADD_CRITERION', storyId: story.id })}
                onRemove={async i => {
                  const storyCriteria = requirements.criteria.filter(c => c.storyId === story.id);
                  const criterion = storyCriteria[i];
                  const dependentTasks = tasks.filter(t => t.tracesTo.includes(criterion.id));
                  const dependentTests = testing.tests.filter(t => t.verifies === criterion.id);
                  if (dependentTasks.length > 0 || dependentTests.length > 0) {
                    const ok = await confirm({
                      title: `Delete ${criterion.id}?`,
                      description: `This unlinks ${dependentTasks.length} tasks and ${dependentTests.length} tests.`,
                      confirmLabel: 'Delete',
                    });
                    if (!ok) return;
                  }
                  dispatch({ type: 'DELETE_CRITERION', id: criterion.id });
                }}
                renderItem={(criterion) => (
                  <div>
                    <Badge className="mb-2">{criterion.id}</Badge>
                    <TextField
                      label="Text"
                      value={criterion.text}
                      onChange={v => dispatch({ type: 'UPDATE_CRITERION', id: criterion.id, patch: { text: v } })}
                    />
                  </div>
                )}
              />
            </div>
          )}
        />
      </SectionCard>

      <SectionCard title="Non-functional requirements" count={requirements.nfrs.length}>
        <RepeatableList<Nfr>
          items={requirements.nfrs}
          addLabel="Add NFR"
          onAdd={() => dispatch({ type: 'ADD_NFR' })}
          onRemove={i => replaceRequirements({ nfrs: requirements.nfrs.filter((_, idx) => idx !== i) })}
          renderItem={(item, i) => (
            <>
              <Badge className="mb-2">{item.id}</Badge>
              <TextField
                label="Name"
                value={item.name}
                onChange={v => replaceRequirements({
                  nfrs: requirements.nfrs.map((n, idx) => idx === i ? { ...n, name: v } : n),
                })}
              />
              <TextField
                label="Target"
                value={item.target}
                onChange={v => replaceRequirements({
                  nfrs: requirements.nfrs.map((n, idx) => idx === i ? { ...n, target: v } : n),
                })}
              />
            </>
          )}
        />
      </SectionCard>

      <SectionCard title="Assumptions" count={requirements.assumptions.length}>
        <RepeatableList<string>
          items={requirements.assumptions}
          addLabel="Add assumption"
          onAdd={() => replaceRequirements({ assumptions: [...requirements.assumptions, ''] })}
          onRemove={i => replaceRequirements({ assumptions: requirements.assumptions.filter((_, idx) => idx !== i) })}
          renderItem={(item, i) => (
            <TextField
              label="Assumption"
              value={item}
              onChange={v => replaceRequirements({
                assumptions: requirements.assumptions.map((a, idx) => idx === i ? v : a),
              })}
            />
          )}
        />
      </SectionCard>

      <SectionCard title="Constraints" count={requirements.constraints.length}>
        <RepeatableList<string>
          items={requirements.constraints}
          addLabel="Add constraint"
          onAdd={() => replaceRequirements({ constraints: [...requirements.constraints, ''] })}
          onRemove={i => replaceRequirements({ constraints: requirements.constraints.filter((_, idx) => idx !== i) })}
          renderItem={(item, i) => (
            <TextField
              label="Constraint"
              value={item}
              onChange={v => replaceRequirements({
                constraints: requirements.constraints.map((c, idx) => idx === i ? v : c),
              })}
            />
          )}
        />
      </SectionCard>

      <SectionCard title="Non-goals" count={requirements.nonGoals.length}>
        <RepeatableList<string>
          items={requirements.nonGoals}
          addLabel="Add non-goal"
          onAdd={() => replaceRequirements({ nonGoals: [...requirements.nonGoals, ''] })}
          onRemove={i => replaceRequirements({ nonGoals: requirements.nonGoals.filter((_, idx) => idx !== i) })}
          renderItem={(item, i) => (
            <TextField
              label="Non-goal"
              value={item}
              onChange={v => replaceRequirements({
                nonGoals: requirements.nonGoals.map((g, idx) => idx === i ? v : g),
              })}
            />
          )}
        />
      </SectionCard>

      <SectionCard title="Signoff">
        <TextField
          label="Signed off by"
          value={requirements.signoff?.by ?? ''}
          onChange={v => replaceRequirements({
            signoff: { by: v, date: requirements.signoff?.date ?? '' },
          })}
        />
        <TextField
          label="Signoff date"
          value={requirements.signoff?.date ?? ''}
          onChange={v => replaceRequirements({
            signoff: { by: requirements.signoff?.by ?? '', date: v },
          })}
        />
      </SectionCard>
    </div>
  );
}
