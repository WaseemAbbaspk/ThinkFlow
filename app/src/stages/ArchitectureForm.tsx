import { useProject } from '../state/projectStore';
import { TextField, TextArea, SelectField, LinkSelect, RepeatableList } from '../components/inputs';
import type { Component, Flow, NfrConsideration, Adr, AdrOption, AdrStatus } from '../model/types';

const ADR_STATUS_OPTIONS = [
  { value: 'Proposed', label: 'Proposed' },
  { value: 'Accepted', label: 'Accepted' },
  { value: 'Superseded', label: 'Superseded' },
  { value: 'Deprecated', label: 'Deprecated' },
];

export function ArchitectureForm() {
  const { state, dispatch } = useProject();
  const project = state.project;
  const { architecture, requirements } = project;

  function replace(patch: Partial<typeof project>) {
    dispatch({ type: 'REPLACE_PROJECT', project: { ...project, ...patch } });
  }
  function replaceArch(patch: Partial<typeof architecture>) {
    replace({ architecture: { ...architecture, ...patch } });
  }

  const adrOptions = architecture.adrs.map(a => ({ value: a.id, label: a.title || a.id }));
  const relatesToOptions = [
    ...requirements.stories.map(s => ({ value: s.id, label: s.id })),
    ...requirements.criteria.map(c => ({ value: c.id, label: c.id })),
    ...requirements.nfrs.map(n => ({ value: n.id, label: n.id })),
  ];

  return (
    <div className="architecture-form">
      <section>
        <h3>Overview</h3>
        <TextArea
          label="Overview"
          value={architecture.overview}
          onChange={v => replaceArch({ overview: v })}
        />
      </section>

      <section>
        <h3>Diagrams</h3>
        <TextArea
          label="Context diagram (Mermaid)"
          value={architecture.contextDiagram}
          onChange={v => replaceArch({ contextDiagram: v })}
        />
        <TextArea
          label="Component diagram (Mermaid)"
          value={architecture.componentDiagram}
          onChange={v => replaceArch({ componentDiagram: v })}
        />
      </section>

      <section>
        <h3>Components</h3>
        <RepeatableList<Component>
          items={architecture.components}
          addLabel="Add component"
          onAdd={() => replaceArch({ components: [...architecture.components, { name: '', responsibility: '', adrIds: [] }] })}
          onRemove={i => replaceArch({ components: architecture.components.filter((_, idx) => idx !== i) })}
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
      </section>

      <section>
        <h3>Key flows</h3>
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
      </section>

      <section>
        <h3>NFR considerations</h3>
        <RepeatableList<NfrConsideration>
          items={architecture.nfrConsiderations}
          addLabel="Add NFR consideration"
          onAdd={() => replaceArch({ nfrConsiderations: [...architecture.nfrConsiderations, { concern: '', approach: '' }] })}
          onRemove={i => replaceArch({ nfrConsiderations: architecture.nfrConsiderations.filter((_, idx) => idx !== i) })}
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
      </section>

      <section>
        <h3>Architecture decision records</h3>
        <RepeatableList<Adr>
          items={architecture.adrs}
          addLabel="Add ADR"
          onAdd={() => dispatch({ type: 'ADD_ADR' })}
          onRemove={i => replaceArch({ adrs: architecture.adrs.filter((_, idx) => idx !== i) })}
          renderItem={(adr) => (
            <div>
              <div>{adr.id}</div>
              <TextField
                label="Title"
                value={adr.title}
                onChange={v => replaceArch({
                  adrs: architecture.adrs.map(a => a.id === adr.id ? { ...a, title: v } : a),
                })}
              />
              <SelectField
                label="Status"
                value={adr.status}
                options={ADR_STATUS_OPTIONS}
                onChange={v => replaceArch({
                  adrs: architecture.adrs.map(a => a.id === adr.id ? { ...a, status: v as AdrStatus } : a),
                })}
              />
              <TextField
                label="Date"
                value={adr.date}
                onChange={v => replaceArch({
                  adrs: architecture.adrs.map(a => a.id === adr.id ? { ...a, date: v } : a),
                })}
              />
              <TextField
                label="Deciders"
                value={adr.deciders}
                onChange={v => replaceArch({
                  adrs: architecture.adrs.map(a => a.id === adr.id ? { ...a, deciders: v } : a),
                })}
              />
              <LinkSelect
                label="Relates to"
                multiple
                value={adr.relatesTo}
                options={relatesToOptions}
                onChange={v => replaceArch({
                  adrs: architecture.adrs.map(a => a.id === adr.id ? { ...a, relatesTo: v as string[] } : a),
                })}
              />
              <TextArea
                label="Context"
                value={adr.context}
                onChange={v => replaceArch({
                  adrs: architecture.adrs.map(a => a.id === adr.id ? { ...a, context: v } : a),
                })}
              />
              <TextArea
                label="Decision"
                value={adr.decision}
                onChange={v => replaceArch({
                  adrs: architecture.adrs.map(a => a.id === adr.id ? { ...a, decision: v } : a),
                })}
              />
              <TextArea
                label="Rationale"
                value={adr.rationale}
                onChange={v => replaceArch({
                  adrs: architecture.adrs.map(a => a.id === adr.id ? { ...a, rationale: v } : a),
                })}
              />

              <h4>Options</h4>
              <RepeatableList<AdrOption>
                items={adr.options}
                addLabel="Add option"
                onAdd={() => replaceArch({
                  adrs: architecture.adrs.map(a => a.id === adr.id
                    ? { ...a, options: [...a.options, { name: '', pros: '', cons: '' }] }
                    : a),
                })}
                onRemove={oi => replaceArch({
                  adrs: architecture.adrs.map(a => a.id === adr.id
                    ? { ...a, options: a.options.filter((_, idx) => idx !== oi) }
                    : a),
                })}
                renderItem={(option, oi) => (
                  <>
                    <TextField
                      label="Name"
                      value={option.name}
                      onChange={v => replaceArch({
                        adrs: architecture.adrs.map(a => a.id === adr.id
                          ? { ...a, options: a.options.map((o, idx) => idx === oi ? { ...o, name: v } : o) }
                          : a),
                      })}
                    />
                    <TextArea
                      label="Pros"
                      value={option.pros}
                      onChange={v => replaceArch({
                        adrs: architecture.adrs.map(a => a.id === adr.id
                          ? { ...a, options: a.options.map((o, idx) => idx === oi ? { ...o, pros: v } : o) }
                          : a),
                      })}
                    />
                    <TextArea
                      label="Cons"
                      value={option.cons}
                      onChange={v => replaceArch({
                        adrs: architecture.adrs.map(a => a.id === adr.id
                          ? { ...a, options: a.options.map((o, idx) => idx === oi ? { ...o, cons: v } : o) }
                          : a),
                      })}
                    />
                  </>
                )}
              />

              <TextArea
                label="Consequences (positive)"
                value={adr.consequencesPositive}
                onChange={v => replaceArch({
                  adrs: architecture.adrs.map(a => a.id === adr.id ? { ...a, consequencesPositive: v } : a),
                })}
              />
              <TextArea
                label="Consequences (tradeoffs)"
                value={adr.consequencesTradeoffs}
                onChange={v => replaceArch({
                  adrs: architecture.adrs.map(a => a.id === adr.id ? { ...a, consequencesTradeoffs: v } : a),
                })}
              />
              <TextArea
                label="Follow-ups"
                value={adr.followUps}
                onChange={v => replaceArch({
                  adrs: architecture.adrs.map(a => a.id === adr.id ? { ...a, followUps: v } : a),
                })}
              />
            </div>
          )}
        />
      </section>
    </div>
  );
}
