import { useProject } from '../state/projectStore';
import { TextField, TextArea, SelectField, LinkSelect, RepeatableList } from '../components/inputs';
import type { Test, TestLevel, TestStatus } from '../model/types';

const LEVEL_OPTIONS = [
  { value: 'Unit', label: 'Unit' },
  { value: 'Integration', label: 'Integration' },
  { value: 'E2E', label: 'E2E' },
  { value: 'Non-functional', label: 'Non-functional' },
];

const STATUS_OPTIONS = [
  { value: 'Pass', label: 'Pass' },
  { value: 'Fail', label: 'Fail' },
  { value: 'Not run', label: 'Not run' },
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
    <div className="testing-form">
      <section>
        <h3>Entry / exit criteria</h3>
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
      </section>

      <section>
        <h3>Tests</h3>
        <RepeatableList<Test>
          items={testing.tests}
          addLabel="Add test"
          onAdd={() => dispatch({ type: 'ADD_TEST' })}
          onRemove={i => dispatch({ type: 'DELETE_TEST', id: testing.tests[i].id })}
          renderItem={(test) => (
            <div>
              <div className="id-tag">{test.id}</div>
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
      </section>
    </div>
  );
}
