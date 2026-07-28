import React from 'react';
import { useProject } from '../state/projectStore';
import { TextField, TextArea, RepeatableList } from '../components/inputs';
import type { Problem, Beneficiary, AssumptionRisk } from '../model/types';

function nextProblemId(problems: Problem[]): string {
  const max = Math.max(0, ...problems.map(p => parseInt(p.id.split('-')[1], 10) || 0));
  return `PROB-${max + 1}`;
}

export function VisionForm() {
  const { state, dispatch } = useProject();
  const vision = state.project.vision;

  function patch(p: Partial<typeof vision>) {
    dispatch({ type: 'PATCH_VISION', patch: p });
  }

  return (
    <div className="vision-form">
      <TextArea
        label="Vision statement"
        value={vision.statement}
        onChange={v => patch({ statement: v })}
      />
      <TextArea
        label="Why now"
        value={vision.whyNow}
        onChange={v => patch({ whyNow: v })}
      />
      <TextArea
        label="Success narrative"
        value={vision.successNarrative}
        onChange={v => patch({ successNarrative: v })}
      />

      <RepeatableList<Problem>
        items={vision.problems}
        addLabel="Add problem"
        onAdd={() => patch({ problems: [...vision.problems, { id: nextProblemId(vision.problems), text: '' }] })}
        onRemove={i => patch({ problems: vision.problems.filter((_, idx) => idx !== i) })}
        renderItem={(item, i) => (
          <TextField
            label={`Problem ${item.id}`}
            value={item.text}
            onChange={v => patch({
              problems: vision.problems.map((p, idx) => idx === i ? { ...p, text: v } : p),
            })}
          />
        )}
      />

      <RepeatableList<Beneficiary>
        items={vision.beneficiaries}
        addLabel="Add beneficiary"
        onAdd={() => patch({ beneficiaries: [...vision.beneficiaries, { audience: '', change: '' }] })}
        onRemove={i => patch({ beneficiaries: vision.beneficiaries.filter((_, idx) => idx !== i) })}
        renderItem={(item, i) => (
          <>
            <TextField
              label="Audience"
              value={item.audience}
              onChange={v => patch({
                beneficiaries: vision.beneficiaries.map((b, idx) => idx === i ? { ...b, audience: v } : b),
              })}
            />
            <TextField
              label="Change"
              value={item.change}
              onChange={v => patch({
                beneficiaries: vision.beneficiaries.map((b, idx) => idx === i ? { ...b, change: v } : b),
              })}
            />
          </>
        )}
      />

      <RepeatableList<string>
        items={vision.nonGoals}
        addLabel="Add non-goal"
        onAdd={() => patch({ nonGoals: [...vision.nonGoals, ''] })}
        onRemove={i => patch({ nonGoals: vision.nonGoals.filter((_, idx) => idx !== i) })}
        renderItem={(item, i) => (
          <TextField
            label="Non-goal"
            value={item}
            onChange={v => patch({
              nonGoals: vision.nonGoals.map((g, idx) => idx === i ? v : g),
            })}
          />
        )}
      />

      <RepeatableList<AssumptionRisk>
        items={vision.assumptions}
        addLabel="Add assumption"
        onAdd={() => patch({ assumptions: [...vision.assumptions, { text: '', note: '' }] })}
        onRemove={i => patch({ assumptions: vision.assumptions.filter((_, idx) => idx !== i) })}
        renderItem={(item, i) => (
          <>
            <TextField
              label="Assumption"
              value={item.text}
              onChange={v => patch({
                assumptions: vision.assumptions.map((a, idx) => idx === i ? { ...a, text: v } : a),
              })}
            />
            <TextField
              label="Validation"
              value={item.note}
              onChange={v => patch({
                assumptions: vision.assumptions.map((a, idx) => idx === i ? { ...a, note: v } : a),
              })}
            />
          </>
        )}
      />

      <RepeatableList<AssumptionRisk>
        items={vision.risks}
        addLabel="Add risk"
        onAdd={() => patch({ risks: [...vision.risks, { text: '', note: '' }] })}
        onRemove={i => patch({ risks: vision.risks.filter((_, idx) => idx !== i) })}
        renderItem={(item, i) => (
          <>
            <TextField
              label="Risk"
              value={item.text}
              onChange={v => patch({
                risks: vision.risks.map((r, idx) => idx === i ? { ...r, text: v } : r),
              })}
            />
            <TextField
              label="Mitigation"
              value={item.note}
              onChange={v => patch({
                risks: vision.risks.map((r, idx) => idx === i ? { ...r, note: v } : r),
              })}
            />
          </>
        )}
      />
    </div>
  );
}
