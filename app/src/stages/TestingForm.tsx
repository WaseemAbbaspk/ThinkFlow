import { useProject } from '../state/projectStore';
import { TextField, TextArea, SelectField, LinkSelect } from '../components/inputs';
import { SectionCard } from '@/components/SectionCard';
import { ListDetail } from '@/components/ListDetail';
import { Badge } from '@/components/ui/badge';
import type { FilterGroup, SortOption } from '@/lib/listView';
import type { Test, TestLevel, TestStatus } from '../model/types';

const LEVELS: TestLevel[] = ['Unit', 'Integration', 'E2E', 'Non-functional'];
const STATUSES: TestStatus[] = ['Not run', 'Fail', 'Pass'];
const LEVEL_OPTIONS = LEVELS.map(l => ({ value: l, label: l }));
const STATUS_OPTIONS = STATUSES.map(s => ({ value: s, label: s }));

const SORTS: SortOption<Test>[] = [
  { id: 'id', label: 'ID', compare: (a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }) },
  { id: 'description', label: 'Description A–Z', compare: (a, b) => a.description.localeCompare(b.description) },
  { id: 'status', label: 'Status', compare: (a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) },
];

const FILTERS: FilterGroup<Test>[] = [
  { id: 'level', label: 'Level', options: LEVEL_OPTIONS, matches: (t, v) => t.level === v },
  { id: 'status', label: 'Status', options: STATUS_OPTIONS, matches: (t, v) => t.status === v },
];

export function TestingForm() {
  const { state, dispatch } = useProject();
  const project = state.project;
  const { requirements, testing } = project;

  function replaceTesting(patch: Partial<typeof project.testing>) {
    dispatch({ type: 'REPLACE_PROJECT', project: { ...project, testing: { ...project.testing, ...patch } } });
  }

  const verifiesOptions = [
    { value: '', label: '—' },
    ...requirements.criteria.map(c => ({ value: c.id, label: c.id })),
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <SectionCard title="Entry / exit criteria" defaultOpen={false}>
        <TextArea
          label="Entry criteria"
          value={testing.entryCriteria}
          onChange={v => replaceTesting({ entryCriteria: v })}
        />
        <TextArea
          label="Exit criteria"
          value={testing.exitCriteria}
          onChange={v => replaceTesting({ exitCriteria: v })}
        />
      </SectionCard>

      <ListDetail<Test>
        items={testing.tests}
        getId={t => t.id}
        getTitle={t => t.description}
        getSearchText={t => `${t.id} ${t.description} ${t.verifies}`}
        sorts={SORTS}
        filters={FILTERS}
        selectedId={state.selectedId}
        onSelect={id => dispatch({ type: 'SELECT_ENTITY', view: 'testing', id })}
        onAdd={() => dispatch({ type: 'ADD_TEST' })}
        onDelete={id => dispatch({ type: 'DELETE_TEST', id })}
        onDuplicate={id => dispatch({ type: 'DUPLICATE_TEST', id })}
        addLabel="Add test"
        searchLabel="Search tests"
        emptyMessage="No tests yet. Add one to get started."
        renderRow={test => (
          <div className="flex min-w-0 items-center gap-2">
            <Badge>{test.id}</Badge>
            <span className="min-w-0 flex-1 truncate">{test.description || 'Untitled test'}</span>
            {test.verifies && <Badge variant="outline">{test.verifies}</Badge>}
            <span className="shrink-0 text-xs text-muted-foreground">{test.level}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{test.status}</span>
          </div>
        )}
        renderInspector={test => (
          <div>
            <TextField
              label="Description"
              value={test.description}
              onChange={v => dispatch({ type: 'UPDATE_TEST', id: test.id, patch: { description: v } })}
            />
            <LinkSelect
              label="Verifies"
              value={test.verifies}
              options={verifiesOptions}
              onChange={v => dispatch({ type: 'UPDATE_TEST', id: test.id, patch: { verifies: v as string } })}
            />
            <SelectField
              label="Level"
              value={test.level}
              options={LEVEL_OPTIONS}
              onChange={v => dispatch({ type: 'UPDATE_TEST', id: test.id, patch: { level: v as TestLevel } })}
            />
            <SelectField
              label="Status"
              value={test.status}
              options={STATUS_OPTIONS}
              onChange={v => dispatch({ type: 'UPDATE_TEST', id: test.id, patch: { status: v as TestStatus } })}
            />
          </div>
        )}
      />
    </div>
  );
}
