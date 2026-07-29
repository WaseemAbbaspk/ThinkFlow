## Task 6: Markdown export

**Files:**
- Create: `app/src/export/markdown.ts`
- Test: `app/src/export/markdown.test.ts`

**Interfaces:**
- Consumes: `Project`, `buildMatrix` (Task 4).
- Produces:
  - `interface RenderedFile { name: string; content: string; }`
  - `renderAll(p: Project): RenderedFile[]` returning files named `01-vision.md`, `02-requirements.md`, `03-architecture.md`, `04-tasks.md`, `05-testing.md`, `README.md`.

- [ ] **Step 1: Write the failing test (`markdown.test.ts`)**

```ts
import { describe, it, expect } from 'vitest';
import { emptyProject } from '../model/types';
import { renderAll } from './markdown';

describe('renderAll', () => {
  it('produces the six expected files', () => {
    const files = renderAll(emptyProject('Todo App'));
    expect(files.map(f => f.name)).toEqual(
      ['01-vision.md','02-requirements.md','03-architecture.md','04-tasks.md','05-testing.md','README.md']);
  });
  it('renders a story and its criterion in the requirements file', () => {
    const p = emptyProject('Todo App');
    p.requirements.stories.push({ id:'US-1', role:'user', want:'add a task', benefit:'capture it', priority:'Must', servesGoalId:null });
    p.requirements.criteria.push({ id:'AC-1.1', storyId:'US-1', text:'Enter creates a task' });
    const req = renderAll(p).find(f => f.name === '02-requirements.md')!.content;
    expect(req).toContain('US-1');
    expect(req).toContain('As a **user**, I want **add a task**');
    expect(req).toContain('AC-1.1');
  });
  it('README includes a traceability matrix heading', () => {
    const readme = renderAll(emptyProject('X')).find(f => f.name === 'README.md')!.content;
    expect(readme).toContain('## Traceability');
  });
});
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement `markdown.ts`**

Mirror the structure of `docs/templates/*.md` and `examples/todo/*.md`. Full implementation:

```ts
import type { Project } from '../model/types';
import { buildMatrix } from '../model/traceability';

export interface RenderedFile { name: string; content: string; }

const bullets = (items: string[]) => items.filter(Boolean).map(i => `- ${i}`).join('\n') || '_none_';

function vision(p: Project): string {
  const v = p.vision;
  return `# ${p.meta.name} — Vision

## Problem
${v.problems.map(pr => `- **${pr.id}** ${pr.text}`).join('\n') || '_none_'}

## Vision statement
${v.statement || '_TBD_'}

## Who benefits
| Audience | What changes |
|----------|--------------|
${v.beneficiaries.map(b => `| ${b.audience} | ${b.change} |`).join('\n') || '| | |'}

## Why now
${v.whyNow}

## What success looks like
${v.successNarrative}

## Non-goals
${bullets(v.nonGoals)}

## Assumptions & risks
${v.assumptions.map(a => `- **Assumption:** ${a.text} — _${a.note}_`).join('\n')}
${v.risks.map(r => `- **Risk:** ${r.text} — _${r.note}_`).join('\n')}
`;
}

function requirements(p: Project): string {
  const r = p.requirements;
  const goals = p.goals.map(g => `- **${g.id}** ${g.text} _(metric: ${g.metric})_`).join('\n') || '_none_';
  const stories = r.stories.map(s => {
    const crit = r.criteria.filter(c => c.storyId === s.id)
      .map(c => `- **${c.id}** ${c.text}`).join('\n');
    return `### ${s.id} — _Priority: ${s.priority}_\n> As a **${s.role}**, I want **${s.want}** so that **${s.benefit}**.\n\n${crit}`;
  }).join('\n\n');
  const nfrs = r.nfrs.map(n => `| ${n.id} | ${n.name} | ${n.target} |`).join('\n');
  return `# ${p.meta.name} — Requirements

## Goals
${goals}

## User stories
${stories || '_none_'}

## Non-functional requirements
| ID | Requirement | Target |
|----|-------------|--------|
${nfrs || '| | | |'}

## Assumptions
${bullets(r.assumptions)}

## Constraints
${bullets(r.constraints)}

## Non-goals
${bullets(r.nonGoals)}

## Sign-off
${r.signoff ? `Approved by **${r.signoff.by}** on ${r.signoff.date}` : '_pending_'}
`;
}

function architecture(p: Project): string {
  const a = p.architecture;
  const comps = a.components.map(c => `| ${c.name} | ${c.responsibility} | ${c.adrIds.join(', ')} |`).join('\n');
  const adrs = a.adrs.map(adr => `### ${adr.id}: ${adr.title}
- **Status:** ${adr.status}
- **Date:** ${adr.date}
- **Deciders:** ${adr.deciders}
- **Relates to:** ${adr.relatesTo.join(', ')}

**Context.** ${adr.context}

**Options.**
${adr.options.map(o => `- **${o.name}** — pros: ${o.pros}; cons: ${o.cons}`).join('\n')}

**Decision.** ${adr.decision}

**Rationale.** ${adr.rationale}

**Consequences.** Positive: ${adr.consequencesPositive}. Trade-offs: ${adr.consequencesTradeoffs}. Follow-ups: ${adr.followUps}`).join('\n\n');
  return `# ${p.meta.name} — Architecture

## Overview
${a.overview}

## Context diagram
\`\`\`mermaid
${a.contextDiagram || 'flowchart LR\\n  User --> System'}
\`\`\`

## Components
\`\`\`mermaid
${a.componentDiagram || 'flowchart TD\\n  UI --> Logic'}
\`\`\`

| Component | Responsibility | ADRs |
|-----------|----------------|------|
${comps || '| | | |'}

## Key flows
${a.keyFlows.map(f => `- **${f.name}:** ${f.description}`).join('\n') || '_none_'}

## Non-functional considerations
| Concern | Approach |
|---------|----------|
${a.nfrConsiderations.map(n => `| ${n.concern} | ${n.approach} |`).join('\n') || '| | |'}

## Decisions
${adrs || '_none_'}
`;
}

function tasks(p: Project): string {
  return `# ${p.meta.name} — Tasks

${p.tasks.map(t => `## ${t.id}: ${t.title}
- **Traces to:** ${t.tracesTo.join(', ') || '_none_'}
- **Depends on:** ${t.dependsOn.join(', ') || 'none'}
- **Status:** ${t.status}
- **Goal:** ${t.goal}
- **Context for the agent:** ${t.contextForAgent}
- **Acceptance:**
${t.acceptance.map(a => `  - [ ] ${a}`).join('\n')}
- **Out of scope:** ${t.outOfScope}`).join('\n\n') || '_none_'}
`;
}

function testing(p: Project): string {
  const rows = p.testing.tests.map(t => `| ${t.verifies} | ${t.id} | ${t.level} | ${t.status} |`).join('\n');
  return `# ${p.meta.name} — Testing

## Traceability matrix
| Acceptance criterion | Test ID | Level | Status |
|----------------------|---------|-------|--------|
${rows || '| | | | |'}

## Entry criteria
${p.testing.entryCriteria}

## Exit criteria
${p.testing.exitCriteria}
`;
}

function readme(p: Project): string {
  const matrix = buildMatrix(p).map(r =>
    `| ${r.storyId} | ${r.goalId ?? '—'} | ${r.criterionId ?? '—'} | ${r.taskIds.join(', ') || '—'} | ${r.testIds.join(', ') || '—'} |`
  ).join('\n');
  return `# ${p.meta.name}

_Generated by ThinkFlow Studio._

## Documents
- [Vision](01-vision.md)
- [Requirements](02-requirements.md)
- [Architecture](03-architecture.md)
- [Tasks](04-tasks.md)
- [Testing](05-testing.md)

## Traceability
| Story | Goal | Criterion | Tasks | Tests |
|-------|------|-----------|-------|-------|
${matrix || '| | | | | |'}
`;
}

export function renderAll(p: Project): RenderedFile[] {
  return [
    { name: '01-vision.md', content: vision(p) },
    { name: '02-requirements.md', content: requirements(p) },
    { name: '03-architecture.md', content: architecture(p) },
    { name: '04-tasks.md', content: tasks(p) },
    { name: '05-testing.md', content: testing(p) },
    { name: 'README.md', content: readme(p) },
  ];
}
```

- [ ] **Step 4: Run, expect PASS.**

- [ ] **Step 5: Commit**

```bash
git add app/src/export/markdown.ts app/src/export/markdown.test.ts
git commit -m "Add markdown export matching repo templates"
```

---

