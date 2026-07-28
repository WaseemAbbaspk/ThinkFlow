import { useProject } from '../state/projectStore';
import { TextField, SelectField, LinkSelect, RepeatableList } from '../components/inputs';
import type { Goal, UserStory, Criterion, Nfr, Priority } from '../model/types';

const PRIORITY_OPTIONS = [
  { value: 'Must', label: 'Must' },
  { value: 'Should', label: 'Should' },
  { value: 'Could', label: 'Could' },
];

function confirmDelete(message: string): boolean {
  return window.confirm(message);
}

export function RequirementsForm() {
  const { state, dispatch } = useProject();
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
      <section>
        <h3>Goals</h3>
        <RepeatableList<Goal>
          items={project.goals}
          addLabel="Add goal"
          onAdd={() => dispatch({ type: 'ADD_GOAL' })}
          onRemove={i => replace({ goals: project.goals.filter((_, idx) => idx !== i) })}
          renderItem={(item, i) => (
            <>
              <div className="id-tag">{item.id}</div>
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
      </section>

      <section>
        <h3>Stories</h3>
        <RepeatableList<UserStory>
          items={requirements.stories}
          addLabel="Add story"
          onAdd={() => dispatch({ type: 'ADD_STORY' })}
          onRemove={i => {
            const story = requirements.stories[i];
            const dependentCriteria = requirements.criteria.filter(c => c.storyId === story.id);
            const dependentTasks = tasks.filter(t => t.tracesTo.includes(story.id));
            if (dependentCriteria.length > 0 || dependentTasks.length > 0) {
              const message = `Delete ${story.id}? This also removes ${dependentCriteria.length} criteria and unlinks ${dependentTasks.length} tasks.`;
              if (!confirmDelete(message)) return;
            }
            dispatch({ type: 'DELETE_STORY', id: story.id });
          }}
          renderItem={(story) => (
            <div>
              <div className="id-tag">{story.id}</div>
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

              <h4>Criteria</h4>
              <RepeatableList<Criterion>
                items={requirements.criteria.filter(c => c.storyId === story.id)}
                addLabel="Add criterion"
                onAdd={() => dispatch({ type: 'ADD_CRITERION', storyId: story.id })}
                onRemove={i => {
                  const storyCriteria = requirements.criteria.filter(c => c.storyId === story.id);
                  const criterion = storyCriteria[i];
                  const dependentTasks = tasks.filter(t => t.tracesTo.includes(criterion.id));
                  const dependentTests = testing.tests.filter(t => t.verifies === criterion.id);
                  if (dependentTasks.length > 0 || dependentTests.length > 0) {
                    const message = `Delete ${criterion.id}? This unlinks ${dependentTasks.length} tasks and ${dependentTests.length} tests.`;
                    if (!confirmDelete(message)) return;
                  }
                  dispatch({ type: 'DELETE_CRITERION', id: criterion.id });
                }}
                renderItem={(criterion) => (
                  <div>
                    <div className="id-tag">{criterion.id}</div>
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
      </section>

      <section>
        <h3>Non-functional requirements</h3>
        <RepeatableList<Nfr>
          items={requirements.nfrs}
          addLabel="Add NFR"
          onAdd={() => dispatch({ type: 'ADD_NFR' })}
          onRemove={i => replaceRequirements({ nfrs: requirements.nfrs.filter((_, idx) => idx !== i) })}
          renderItem={(item, i) => (
            <>
              <div className="id-tag">{item.id}</div>
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
      </section>

      <section>
        <h3>Assumptions</h3>
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
      </section>

      <section>
        <h3>Constraints</h3>
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
      </section>

      <section>
        <h3>Non-goals</h3>
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
      </section>

      <section>
        <h3>Signoff</h3>
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
      </section>
    </div>
  );
}
