import { useState } from 'react';
import { useProject } from '../state/projectStore';
import { TextField, TextArea, RepeatableList } from '../components/inputs';
import { ListDetail } from '@/components/ListDetail';
import { StringList } from '@/components/StringList';
import { StageTabs } from '@/components/StageTabs';
import { TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { SortOption } from '@/lib/listView';
import type { Problem, Beneficiary, AssumptionRisk } from '../model/types';

const PROBLEM_SORTS: SortOption<Problem>[] = [
  { id: 'id', label: 'ID', compare: (a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }) },
  { id: 'text', label: 'Text A–Z', compare: (a, b) => a.text.localeCompare(b.text) },
];

/* PROB ids are derived from the highest existing one rather than the project's shared
   counters, so a deleted id can be reused. That is pre-existing behaviour and stays
   as-is here — changing it would touch the counter/reclaim system. */
function nextProblemId(problems: Problem[]): string {
  const max = Math.max(0, ...problems.map(p => parseInt(p.id.split('-')[1], 10) || 0));
  return `PROB-${max + 1}`;
}

/** Beneficiaries, assumptions and risks have no ids, so they stay inline lists —
    a sortable ListDetail would break the array-position addressing they rely on. */
function PairList<T>({ items, addLabel, blank, fields, onChange }: {
  items: T[];
  addLabel: string;
  blank: T;
  fields: { label: string; key: keyof T; area?: boolean }[];
  onChange: (next: T[]) => void;
}) {
  return (
    <RepeatableList<T>
      items={items}
      addLabel={addLabel}
      onAdd={() => onChange([...items, blank])}
      onRemove={i => onChange(items.filter((_, idx) => idx !== i))}
      renderItem={(item, i) => (
        <>
          {fields.map(f => {
            const Field = f.area ? TextArea : TextField;
            return (
              <Field
                key={String(f.key)}
                label={f.label}
                value={String(item[f.key] ?? '')}
                onChange={v => onChange(items.map((x, idx) => (idx === i ? { ...x, [f.key]: v } : x)))}
              />
            );
          })}
        </>
      )}
    />
  );
}

export function VisionForm() {
  const { state, dispatch } = useProject();
  const vision = state.project.vision;
  const [tab, setTab] = useState('statement');

  function patch(p: Partial<typeof vision>) {
    dispatch({ type: 'PATCH_VISION', patch: p });
  }

  const select = (id: string | null) => dispatch({ type: 'SELECT_ENTITY', view: 'vision', id });

  const tabs = [
    { value: 'statement', label: 'Statement' },
    { value: 'problems', label: 'Problems', count: vision.problems.length },
    { value: 'beneficiaries', label: 'Beneficiaries', count: vision.beneficiaries.length },
    { value: 'nonGoals', label: 'Non-goals', count: vision.nonGoals.length },
    { value: 'assumptions', label: 'Assumptions', count: vision.assumptions.length },
    { value: 'risks', label: 'Risks', count: vision.risks.length },
  ];

  return (
    <StageTabs tabs={tabs} value={tab} onValueChange={setTab}>
      <TabsContent value="statement">
        <Card className="p-4">
          <TextArea
            label="Vision statement"
            value={vision.statement}
            onChange={v => patch({ statement: v })}
          />
          <TextArea label="Why now" value={vision.whyNow} onChange={v => patch({ whyNow: v })} />
          <TextArea
            label="Success narrative"
            value={vision.successNarrative}
            onChange={v => patch({ successNarrative: v })}
          />
        </Card>
      </TabsContent>

      <TabsContent value="problems">
        <ListDetail<Problem>
          items={vision.problems}
          getId={p => p.id}
          getTitle={p => p.text}
          getSearchText={p => `${p.id} ${p.text}`}
          sorts={PROBLEM_SORTS}
          selectedId={state.selectedId}
          onSelect={select}
          onAdd={() => patch({
            problems: [...vision.problems, { id: nextProblemId(vision.problems), text: '' }],
          })}
          /* Keyed by id, not index — the list is sortable, so positions are not stable. */
          onDelete={id => patch({ problems: vision.problems.filter(p => p.id !== id) })}
          addLabel="Add problem"
          searchLabel="Search problems"
          emptyMessage="No problems yet. Add one to get started."
          renderRow={problem => (
            <div className="flex min-w-0 items-center gap-2">
              <Badge>{problem.id}</Badge>
              <span className="min-w-0 flex-1 truncate">{problem.text || 'Untitled problem'}</span>
            </div>
          )}
          renderInspector={problem => (
            <TextField
              label="Problem"
              value={problem.text}
              onChange={v => patch({
                problems: vision.problems.map(p => (p.id === problem.id ? { ...p, text: v } : p)),
              })}
            />
          )}
        />
      </TabsContent>

      <TabsContent value="beneficiaries">
        <PairList<Beneficiary>
          items={vision.beneficiaries}
          addLabel="Add beneficiary"
          blank={{ audience: '', change: '' }}
          fields={[{ label: 'Audience', key: 'audience' }, { label: 'Change', key: 'change' }]}
          onChange={next => patch({ beneficiaries: next })}
        />
      </TabsContent>

      <TabsContent value="nonGoals">
        <StringList
          label="Non-goal"
          addLabel="Add non-goal"
          items={vision.nonGoals}
          onChange={next => patch({ nonGoals: next })}
        />
      </TabsContent>

      <TabsContent value="assumptions">
        <PairList<AssumptionRisk>
          items={vision.assumptions}
          addLabel="Add assumption"
          blank={{ text: '', note: '' }}
          fields={[{ label: 'Assumption', key: 'text' }, { label: 'Validation', key: 'note' }]}
          onChange={next => patch({ assumptions: next })}
        />
      </TabsContent>

      <TabsContent value="risks">
        <PairList<AssumptionRisk>
          items={vision.risks}
          addLabel="Add risk"
          blank={{ text: '', note: '' }}
          fields={[{ label: 'Risk', key: 'text' }, { label: 'Mitigation', key: 'note' }]}
          onChange={next => patch({ risks: next })}
        />
      </TabsContent>
    </StageTabs>
  );
}
