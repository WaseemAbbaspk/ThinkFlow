import { useState } from 'react';
import { useProject } from '../state/projectStore';
import { useConfirm } from '@/state/confirm';
import { TextField, LinkSelect, RepeatableList, SelectField } from '../components/inputs';
import { ListDetail } from '@/components/ListDetail';
import { StageTabs } from '@/components/StageTabs';
import { TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { subheadingClass } from '@/components/typography';
import type { FilterGroup, SortOption } from '@/lib/listView';
import type { Goal, UserStory, Criterion, Nfr, Priority } from '../model/types';

const PRIORITY_ORDER: Priority[] = ['Must', 'Should', 'Could'];
const PRIORITY_OPTIONS = PRIORITY_ORDER.map(p => ({ value: p, label: p }));

const byId = <T extends { id: string }>(a: T, b: T) =>
  a.id.localeCompare(b.id, undefined, { numeric: true });

const GOAL_SORTS: SortOption<Goal>[] = [
  { id: 'id', label: 'ID', compare: byId },
  { id: 'text', label: 'Text A–Z', compare: (a, b) => a.text.localeCompare(b.text) },
];

const STORY_SORTS: SortOption<UserStory>[] = [
  { id: 'id', label: 'ID', compare: byId },
  { id: 'want', label: 'Want A–Z', compare: (a, b) => a.want.localeCompare(b.want) },
  { id: 'priority', label: 'Priority',
    compare: (a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority) },
];

const STORY_FILTERS: FilterGroup<UserStory>[] = [
  { id: 'priority', label: 'Priority', options: PRIORITY_OPTIONS, matches: (s, v) => s.priority === v },
  { id: 'goal', label: 'Goal',
    options: [{ value: 'linked', label: 'Has goal' }, { value: 'unlinked', label: 'No goal' }],
    matches: (s, v) => (v === 'linked' ? s.servesGoalId !== null : s.servesGoalId === null) },
];

const NFR_SORTS: SortOption<Nfr>[] = [
  { id: 'id', label: 'ID', compare: byId },
  { id: 'name', label: 'Name A–Z', compare: (a, b) => a.name.localeCompare(b.name) },
];

/** Assumptions, constraints and non-goals are bare string[] with no ids, so they
    get an inline list rather than a ListDetail — sorting them would break the
    index addressing they depend on. */
function StringList({ label, addLabel, items, onChange }: {
  label: string; addLabel: string; items: string[]; onChange: (next: string[]) => void;
}) {
  return (
    <RepeatableList<string>
      items={items}
      addLabel={addLabel}
      onAdd={() => onChange([...items, ''])}
      onRemove={i => onChange(items.filter((_, idx) => idx !== i))}
      renderItem={(item, i) => (
        <TextField
          label={label}
          value={item}
          onChange={v => onChange(items.map((x, idx) => (idx === i ? v : x)))}
        />
      )}
    />
  );
}

export function RequirementsForm() {
  const { state, dispatch } = useProject();
  const confirm = useConfirm();
  const project = state.project;
  const { requirements, tasks, testing } = project;
  const [tab, setTab] = useState('goals');

  function replaceRequirements(patch: Partial<typeof requirements>) {
    dispatch({ type: 'REPLACE_PROJECT', project: { ...project, requirements: { ...requirements, ...patch } } });
  }

  const goalOptions = project.goals.map(g => ({ value: g.id, label: g.text || g.id }));
  const select = (id: string | null) => dispatch({ type: 'SELECT_ENTITY', view: 'requirements', id });

  async function deleteStory(id: string) {
    const dependentCriteria = requirements.criteria.filter(c => c.storyId === id);
    const dependentTasks = tasks.filter(t => t.tracesTo.includes(id));
    if (dependentCriteria.length > 0 || dependentTasks.length > 0) {
      const ok = await confirm({
        title: `Delete ${id}?`,
        description: `This also removes ${dependentCriteria.length} criteria and unlinks ${dependentTasks.length} tasks.`,
        confirmLabel: 'Delete',
      });
      if (!ok) return;
    }
    dispatch({ type: 'DELETE_STORY', id });
  }

  async function deleteCriterion(id: string) {
    const dependentTasks = tasks.filter(t => t.tracesTo.includes(id));
    const dependentTests = testing.tests.filter(t => t.verifies === id);
    if (dependentTasks.length > 0 || dependentTests.length > 0) {
      const ok = await confirm({
        title: `Delete ${id}?`,
        description: `This unlinks ${dependentTasks.length} tasks and ${dependentTests.length} tests.`,
        confirmLabel: 'Delete',
      });
      if (!ok) return;
    }
    dispatch({ type: 'DELETE_CRITERION', id });
  }

  const tabs = [
    { value: 'goals', label: 'Goals', count: project.goals.length },
    { value: 'stories', label: 'Stories', count: requirements.stories.length },
    { value: 'nfrs', label: 'Non-functional', count: requirements.nfrs.length },
    { value: 'assumptions', label: 'Assumptions', count: requirements.assumptions.length },
    { value: 'constraints', label: 'Constraints', count: requirements.constraints.length },
    { value: 'nonGoals', label: 'Non-goals', count: requirements.nonGoals.length },
    { value: 'signoff', label: 'Signoff' },
  ];

  return (
    <StageTabs tabs={tabs} value={tab} onValueChange={setTab}>
      <TabsContent value="goals">
        <ListDetail<Goal>
          items={project.goals}
          getId={g => g.id}
          getTitle={g => g.text}
          getSearchText={g => `${g.id} ${g.text} ${g.metric}`}
          sorts={GOAL_SORTS}
          selectedId={state.selectedId}
          onSelect={select}
          onAdd={() => dispatch({ type: 'ADD_GOAL' })}
          onDelete={id => dispatch({ type: 'DELETE_GOAL', id })}
          addLabel="Add goal"
          searchLabel="Search goals"
          emptyMessage="No goals yet. Add one to get started."
          renderRow={goal => (
            <div className="flex min-w-0 items-center gap-2">
              <Badge>{goal.id}</Badge>
              <span className="min-w-0 flex-1 truncate">{goal.text || 'Untitled goal'}</span>
              {goal.metric && <span className="shrink-0 text-xs text-muted-foreground">{goal.metric}</span>}
            </div>
          )}
          renderInspector={goal => (
            <div>
              <TextField
                label="Text"
                value={goal.text}
                onChange={v => dispatch({ type: 'UPDATE_GOAL', id: goal.id, patch: { text: v } })}
              />
              <TextField
                label="Metric"
                value={goal.metric}
                onChange={v => dispatch({ type: 'UPDATE_GOAL', id: goal.id, patch: { metric: v } })}
              />
            </div>
          )}
        />
      </TabsContent>

      <TabsContent value="stories">
        <ListDetail<UserStory>
          items={requirements.stories}
          getId={s => s.id}
          getTitle={s => s.want}
          getSearchText={s => `${s.id} ${s.role} ${s.want} ${s.benefit}`}
          sorts={STORY_SORTS}
          filters={STORY_FILTERS}
          selectedId={state.selectedId}
          onSelect={select}
          onAdd={() => dispatch({ type: 'ADD_STORY' })}
          onDelete={deleteStory}
          onDuplicate={id => dispatch({ type: 'DUPLICATE_STORY', id })}
          addLabel="Add story"
          searchLabel="Search stories"
          emptyMessage="No stories yet. Add one to get started."
          renderRow={story => {
            const count = requirements.criteria.filter(c => c.storyId === story.id).length;
            return (
              <div className="flex min-w-0 flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <Badge>{story.id}</Badge>
                  <span className="min-w-0 flex-1 truncate font-medium">{story.want || 'Untitled story'}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{story.priority}</span>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {story.servesGoalId && <Badge variant="outline">{story.servesGoalId}</Badge>}
                  <span className="text-xs text-muted-foreground">{count} criteria</span>
                </div>
              </div>
            );
          }}
          renderInspector={story => (
            <div>
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
                  type: 'UPDATE_STORY', id: story.id, patch: { servesGoalId: (v as string) || null },
                })}
              />

              <h4 className={subheadingClass}>Criteria</h4>
              <RepeatableList<Criterion>
                items={requirements.criteria.filter(c => c.storyId === story.id)}
                addLabel="Add criterion"
                onAdd={() => dispatch({ type: 'ADD_CRITERION', storyId: story.id })}
                onRemove={i => {
                  const storyCriteria = requirements.criteria.filter(c => c.storyId === story.id);
                  void deleteCriterion(storyCriteria[i].id);
                }}
                renderItem={criterion => (
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
      </TabsContent>

      <TabsContent value="nfrs">
        <ListDetail<Nfr>
          items={requirements.nfrs}
          getId={n => n.id}
          getTitle={n => n.name}
          getSearchText={n => `${n.id} ${n.name} ${n.target}`}
          sorts={NFR_SORTS}
          selectedId={state.selectedId}
          onSelect={select}
          onAdd={() => dispatch({ type: 'ADD_NFR' })}
          onDelete={id => dispatch({ type: 'DELETE_NFR', id })}
          addLabel="Add NFR"
          searchLabel="Search NFRs"
          emptyMessage="No non-functional requirements yet."
          renderRow={nfr => (
            <div className="flex min-w-0 items-center gap-2">
              <Badge>{nfr.id}</Badge>
              <span className="min-w-0 flex-1 truncate">{nfr.name || 'Untitled NFR'}</span>
              {nfr.target && <span className="shrink-0 text-xs text-muted-foreground">{nfr.target}</span>}
            </div>
          )}
          renderInspector={nfr => (
            <div>
              <TextField
                label="Name"
                value={nfr.name}
                onChange={v => dispatch({ type: 'UPDATE_NFR', id: nfr.id, patch: { name: v } })}
              />
              <TextField
                label="Target"
                value={nfr.target}
                onChange={v => dispatch({ type: 'UPDATE_NFR', id: nfr.id, patch: { target: v } })}
              />
            </div>
          )}
        />
      </TabsContent>

      <TabsContent value="assumptions">
        <StringList
          label="Assumption"
          addLabel="Add assumption"
          items={requirements.assumptions}
          onChange={next => replaceRequirements({ assumptions: next })}
        />
      </TabsContent>

      <TabsContent value="constraints">
        <StringList
          label="Constraint"
          addLabel="Add constraint"
          items={requirements.constraints}
          onChange={next => replaceRequirements({ constraints: next })}
        />
      </TabsContent>

      <TabsContent value="nonGoals">
        <StringList
          label="Non-goal"
          addLabel="Add non-goal"
          items={requirements.nonGoals}
          onChange={next => replaceRequirements({ nonGoals: next })}
        />
      </TabsContent>

      <TabsContent value="signoff">
        <Card className="max-w-md p-4">
          <TextField
            label="Signed off by"
            value={requirements.signoff?.by ?? ''}
            onChange={v => replaceRequirements({ signoff: { by: v, date: requirements.signoff?.date ?? '' } })}
          />
          <TextField
            label="Signoff date"
            value={requirements.signoff?.date ?? ''}
            onChange={v => replaceRequirements({ signoff: { by: requirements.signoff?.by ?? '', date: v } })}
          />
        </Card>
      </TabsContent>
    </StageTabs>
  );
}
