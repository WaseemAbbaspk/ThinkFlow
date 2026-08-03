import { useState } from 'react';
import { useProject } from '../state/projectStore';
import { TextField, TextArea, SelectField, LinkSelect, RepeatableList } from '../components/inputs';
import { ListDetail } from '@/components/ListDetail';
import { StageTabs } from '@/components/StageTabs';
import { TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { DiagramView } from '@/components/DiagramView';
import { Badge } from '@/components/ui/badge';
import { subheadingClass } from '@/components/typography';
import type { FilterGroup, SortOption } from '@/lib/listView';
import type { Component, Flow, NfrConsideration, Adr, AdrOption, AdrStatus } from '../model/types';

const ADR_STATUSES: AdrStatus[] = ['Proposed', 'Accepted', 'Superseded', 'Deprecated'];
const ADR_STATUS_OPTIONS = ADR_STATUSES.map(s => ({ value: s, label: s }));

const ADR_SORTS: SortOption<Adr>[] = [
  { id: 'id', label: 'ID', compare: (a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }) },
  { id: 'title', label: 'Title A–Z', compare: (a, b) => a.title.localeCompare(b.title) },
  { id: 'status', label: 'Status',
    compare: (a, b) => ADR_STATUSES.indexOf(a.status) - ADR_STATUSES.indexOf(b.status) },
];

const ADR_FILTERS: FilterGroup<Adr>[] = [
  { id: 'status', label: 'Status', options: ADR_STATUS_OPTIONS, matches: (a, v) => a.status === v },
];

export function ArchitectureForm() {
  const { state, dispatch } = useProject();
  const project = state.project;
  const { architecture, requirements } = project;
  const [tab, setTab] = useState('overview');

  function replace(patch: Partial<typeof project>) {
    dispatch({ type: 'REPLACE_PROJECT', project: { ...project, ...patch } });
  }
  function replaceArch(patch: Partial<typeof architecture>) {
    replace({ architecture: { ...architecture, ...patch } });
  }
  /** Every ADR edit is keyed by id, never by array position — the list is sortable. */
  function patchAdr(id: string, patch: Partial<Adr>) {
    replaceArch({ adrs: architecture.adrs.map(a => (a.id === id ? { ...a, ...patch } : a)) });
  }

  const select = (id: string | null) => dispatch({ type: 'SELECT_ENTITY', view: 'architecture', id });

  const adrOptions = architecture.adrs.map(a => ({ value: a.id, label: a.title || a.id }));
  const relatesToOptions = [
    ...requirements.stories.map(s => ({ value: s.id, label: s.id })),
    ...requirements.criteria.map(c => ({ value: c.id, label: c.id })),
    ...requirements.nfrs.map(n => ({ value: n.id, label: n.id })),
  ];

  const tabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'diagrams', label: 'Diagrams' },
    { value: 'components', label: 'Components', count: architecture.components.length },
    { value: 'flows', label: 'Key flows', count: architecture.keyFlows.length },
    { value: 'nfrs', label: 'NFR considerations', count: architecture.nfrConsiderations.length },
    { value: 'adrs', label: 'ADRs', count: architecture.adrs.length },
  ];

  return (
    <StageTabs tabs={tabs} value={tab} onValueChange={setTab}>
      <TabsContent value="overview">
        <Card className="p-4">
          <TextArea
            label="Overview"
            value={architecture.overview}
            onChange={v => replaceArch({ overview: v })}
          />
        </Card>
      </TabsContent>

      <TabsContent value="diagrams">
        <Card className="p-4">
          <TextArea
            label="Context diagram (Mermaid)"
            value={architecture.contextDiagram}
            onChange={v => replaceArch({ contextDiagram: v })}
          />
          <DiagramView source={architecture.contextDiagram} label="Context diagram" />

          <TextArea
            label="Component diagram (Mermaid)"
            value={architecture.componentDiagram}
            onChange={v => replaceArch({ componentDiagram: v })}
          />
          <DiagramView source={architecture.componentDiagram} label="Component diagram" />
        </Card>
      </TabsContent>

      <TabsContent value="components">
        <RepeatableList<Component>
          items={architecture.components}
          addLabel="Add component"
          onAdd={() => replaceArch({
            components: [...architecture.components, { name: '', responsibility: '', adrIds: [] }],
          })}
          onRemove={i => replaceArch({
            components: architecture.components.filter((_, idx) => idx !== i),
          })}
          renderItem={(item, i) => (
            <>
              <TextField
                label="Name"
                value={item.name}
                onChange={v => replaceArch({
                  components: architecture.components.map((c, idx) => idx === i ? { ...c, name: v } : c),
                })}
              />
              <TextField
                label="Responsibility"
                value={item.responsibility}
                onChange={v => replaceArch({
                  components: architecture.components.map((c, idx) => idx === i ? { ...c, responsibility: v } : c),
                })}
              />
              <LinkSelect
                label="ADRs"
                multiple
                value={item.adrIds}
                options={adrOptions}
                onChange={v => replaceArch({
                  components: architecture.components.map((c, idx) => idx === i ? { ...c, adrIds: v as string[] } : c),
                })}
              />
            </>
          )}
        />
      </TabsContent>

      <TabsContent value="flows">
        <RepeatableList<Flow>
          items={architecture.keyFlows}
          addLabel="Add key flow"
          onAdd={() => replaceArch({ keyFlows: [...architecture.keyFlows, { name: '', description: '' }] })}
          onRemove={i => replaceArch({ keyFlows: architecture.keyFlows.filter((_, idx) => idx !== i) })}
          renderItem={(item, i) => (
            <>
              <TextField
                label="Name"
                value={item.name}
                onChange={v => replaceArch({
                  keyFlows: architecture.keyFlows.map((f, idx) => idx === i ? { ...f, name: v } : f),
                })}
              />
              <TextArea
                label="Description"
                value={item.description}
                onChange={v => replaceArch({
                  keyFlows: architecture.keyFlows.map((f, idx) => idx === i ? { ...f, description: v } : f),
                })}
              />
            </>
          )}
        />
      </TabsContent>

      <TabsContent value="nfrs">
        <RepeatableList<NfrConsideration>
          items={architecture.nfrConsiderations}
          addLabel="Add NFR consideration"
          onAdd={() => replaceArch({
            nfrConsiderations: [...architecture.nfrConsiderations, { concern: '', approach: '' }],
          })}
          onRemove={i => replaceArch({
            nfrConsiderations: architecture.nfrConsiderations.filter((_, idx) => idx !== i),
          })}
          renderItem={(item, i) => (
            <>
              <TextField
                label="Concern"
                value={item.concern}
                onChange={v => replaceArch({
                  nfrConsiderations: architecture.nfrConsiderations.map((n, idx) => idx === i ? { ...n, concern: v } : n),
                })}
              />
              <TextArea
                label="Approach"
                value={item.approach}
                onChange={v => replaceArch({
                  nfrConsiderations: architecture.nfrConsiderations.map((n, idx) => idx === i ? { ...n, approach: v } : n),
                })}
              />
            </>
          )}
        />
      </TabsContent>

      <TabsContent value="adrs">
        <ListDetail<Adr>
          items={architecture.adrs}
          getId={a => a.id}
          getTitle={a => a.title}
          getSearchText={a => `${a.id} ${a.title} ${a.status} ${a.decision}`}
          sorts={ADR_SORTS}
          filters={ADR_FILTERS}
          selectedId={state.selectedId}
          onSelect={select}
          onAdd={() => dispatch({ type: 'ADD_ADR' })}
          onDelete={id => dispatch({ type: 'DELETE_ADR', id })}
          addLabel="Add ADR"
          searchLabel="Search ADRs"
          emptyMessage="No ADRs yet. Add one to record a decision."
          renderRow={adr => (
            <div className="flex min-w-0 items-center gap-2">
              <Badge>{adr.id}</Badge>
              <span className="min-w-0 flex-1 truncate font-medium">{adr.title || 'Untitled ADR'}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{adr.status}</span>
            </div>
          )}
          renderInspector={adr => (
            <div>
              <TextField
                label="Title"
                value={adr.title}
                onChange={v => patchAdr(adr.id, { title: v })}
              />
              <SelectField
                label="Status"
                value={adr.status}
                options={ADR_STATUS_OPTIONS}
                onChange={v => patchAdr(adr.id, { status: v as AdrStatus })}
              />
              <TextField label="Date" value={adr.date} onChange={v => patchAdr(adr.id, { date: v })} />
              <TextField
                label="Deciders"
                value={adr.deciders}
                onChange={v => patchAdr(adr.id, { deciders: v })}
              />
              <LinkSelect
                label="Relates to"
                multiple
                value={adr.relatesTo}
                options={relatesToOptions}
                onChange={v => patchAdr(adr.id, { relatesTo: v as string[] })}
              />
              <TextArea
                label="Context"
                value={adr.context}
                onChange={v => patchAdr(adr.id, { context: v })}
              />
              <TextArea
                label="Decision"
                value={adr.decision}
                onChange={v => patchAdr(adr.id, { decision: v })}
              />
              <TextArea
                label="Rationale"
                value={adr.rationale}
                onChange={v => patchAdr(adr.id, { rationale: v })}
              />

              <h4 className={subheadingClass}>Options</h4>
              <RepeatableList<AdrOption>
                items={adr.options}
                addLabel="Add option"
                onAdd={() => patchAdr(adr.id, {
                  options: [...adr.options, { name: '', pros: '', cons: '' }],
                })}
                onRemove={oi => patchAdr(adr.id, {
                  options: adr.options.filter((_, idx) => idx !== oi),
                })}
                renderItem={(option, oi) => (
                  <>
                    <TextField
                      label="Name"
                      value={option.name}
                      onChange={v => patchAdr(adr.id, {
                        options: adr.options.map((o, idx) => idx === oi ? { ...o, name: v } : o),
                      })}
                    />
                    <TextArea
                      label="Pros"
                      value={option.pros}
                      onChange={v => patchAdr(adr.id, {
                        options: adr.options.map((o, idx) => idx === oi ? { ...o, pros: v } : o),
                      })}
                    />
                    <TextArea
                      label="Cons"
                      value={option.cons}
                      onChange={v => patchAdr(adr.id, {
                        options: adr.options.map((o, idx) => idx === oi ? { ...o, cons: v } : o),
                      })}
                    />
                  </>
                )}
              />

              <TextArea
                label="Consequences (positive)"
                value={adr.consequencesPositive}
                onChange={v => patchAdr(adr.id, { consequencesPositive: v })}
              />
              <TextArea
                label="Consequences (tradeoffs)"
                value={adr.consequencesTradeoffs}
                onChange={v => patchAdr(adr.id, { consequencesTradeoffs: v })}
              />
              <TextArea
                label="Follow-ups"
                value={adr.followUps}
                onChange={v => patchAdr(adr.id, { followUps: v })}
              />
            </div>
          )}
        />
      </TabsContent>
    </StageTabs>
  );
}
