import { it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ProjectProvider } from '../state/projectStore';
import { TraceabilityView } from './TraceabilityView';
import { emptyProject, type Project } from '../model/types';

it('shows the no-gaps message for an empty project', () => {
  render(<ProjectProvider><TraceabilityView /></ProjectProvider>);
  expect(screen.getByText(/No gaps/i)).toBeInTheDocument();
});

function tracedProject(): Project {
  const p = emptyProject('Demo');
  p.goals.push({ id: 'GOAL-1', text: 'Be fast', metric: '<100ms' });
  p.requirements.stories.push({
    id: 'US-1', role: 'user', want: 'todos', benefit: 'stay organized',
    priority: 'Must', servesGoalId: 'GOAL-1',
  });
  p.requirements.criteria.push({ id: 'AC-1.1', storyId: 'US-1', text: 'can add a todo' });
  p.tasks.push({
    id: 'TASK-1', title: 'build add', tracesTo: ['AC-1.1'], dependsOn: [],
    goal: '', contextForAgent: '', acceptance: [], outOfScope: '', status: 'Todo',
  });
  p.testing.tests.push({ id: 'TEST-1', verifies: 'AC-1.1', description: 'adds', level: 'Unit', status: 'Pass' });
  return p;
}

it('renders a fully-traced matrix row with its task and test ids', () => {
  render(<ProjectProvider preload={tracedProject()}><TraceabilityView /></ProjectProvider>);
  const row = screen.getByText('AC-1.1').closest('tr')!;
  expect(within(row).getByText('US-1')).toBeInTheDocument();
  expect(within(row).getByText('GOAL-1')).toBeInTheDocument();
  expect(within(row).getByText('TASK-1')).toBeInTheDocument();
  expect(within(row).getByText('TEST-1')).toBeInTheDocument();
  // a fully-traced project reports no gaps
  expect(screen.getByText(/No gaps/i)).toBeInTheDocument();
});

it('sanitizes dotted AC ids in the Mermaid chain but keeps the original label', () => {
  const { container } = render(
    <ProjectProvider preload={tracedProject()}><TraceabilityView /></ProjectProvider>,
  );
  const chain = container.querySelector('pre')!.textContent ?? '';
  expect(chain).toContain('flowchart LR');
  expect(chain).toContain('AC_1_1["AC-1.1"]'); // dot & hyphen sanitized in node id, original id in label
  expect(chain).toContain('GOAL-1'); // goal -> story edge present
});

it('lists a gap message when a criterion is untested', () => {
  const p = tracedProject();
  p.testing.tests = []; // AC-1.1 now has no verifying test
  render(<ProjectProvider preload={p}><TraceabilityView /></ProjectProvider>);
  expect(screen.getByText(/AC-1\.1 has no test verifying it/i)).toBeInTheDocument();
  expect(screen.queryByText(/No gaps/i)).not.toBeInTheDocument();
});
