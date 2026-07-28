import { useProject } from '../state/projectStore';
import { buildMatrix, detectGaps, type Gap } from '../model/traceability';
import type { Project } from '../model/types';

function GapPanel({ gaps }: { gaps: Gap[] }) {
  if (gaps.length === 0) return <p>No gaps — every artifact is traced ✓</p>;
  return (
    <ul>
      {gaps.map(g => <li key={`${g.kind}-${g.entityId}-${g.message}`}>{g.message}</li>)}
    </ul>
  );
}

function mermaidId(id: string): string {
  return id.replace(/[^A-Za-z0-9_]/g, '_');
}

function mermaidNode(id: string): string {
  return `${mermaidId(id)}["${id}"]`;
}

function buildMermaidChain(project: Project): string {
  const lines: string[] = ['flowchart LR'];
  for (const s of project.requirements.stories) {
    if (s.servesGoalId) {
      const goal = project.goals.find(g => g.id === s.servesGoalId);
      if (goal) lines.push(`  ${mermaidNode(goal.id)} --> ${mermaidNode(s.id)}`);
    }
  }
  for (const c of project.requirements.criteria) {
    lines.push(`  ${mermaidNode(c.storyId)} --> ${mermaidNode(c.id)}`);
  }
  for (const t of project.tasks) {
    for (const ref of t.tracesTo) {
      lines.push(`  ${mermaidNode(ref)} --> ${mermaidNode(t.id)}`);
    }
  }
  for (const test of project.testing.tests) {
    if (test.verifies) {
      lines.push(`  ${mermaidNode(test.verifies)} --> ${mermaidNode(test.id)}`);
    }
  }
  return lines.join('\n');
}

export function TraceabilityView() {
  const { state } = useProject();
  const project = state.project;
  const rows = buildMatrix(project);
  const gaps = detectGaps(project);
  const mermaid = buildMermaidChain(project);

  return (
    <div className="traceability-view">
      <section>
        <h3>Traceability matrix</h3>
        <table>
          <thead>
            <tr>
              <th>Story</th>
              <th>Goal</th>
              <th>Criterion</th>
              <th>Tasks</th>
              <th>Tests</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={`${row.storyId}-${row.criterionId ?? 'none'}-${i}`}>
                <td>{row.storyId}</td>
                <td>{row.goalId ?? '—'}</td>
                <td>{row.criterionId ?? '—'}</td>
                <td>{row.taskIds.join(', ')}</td>
                <td>{row.testIds.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h3>Gaps</h3>
        <GapPanel gaps={gaps} />
      </section>

      <section>
        <h3>Traceability chain</h3>
        <pre>{mermaid}</pre>
      </section>
    </div>
  );
}
