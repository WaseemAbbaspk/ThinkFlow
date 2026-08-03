import React from 'react';
import { it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectProvider, useProject } from '../state/projectStore';
import { ThemeProvider } from '@/state/theme';
import { TraceabilityView } from './TraceabilityView';
import { emptyProject, type Project } from '../model/types';

/* This file is about the matrix, the gaps and the chain source — not about mermaid.
   Mocking keeps the real 800 kB library (and its d3/cytoscape deps) out of jsdom.
   render goes through a mock fn rather than a fixed value so the node-click test can
   swap in an SVG that actually contains a .node to click. */
const renderMock = vi.fn();

vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: (...args: unknown[]) => renderMock(...args),
  },
}));

beforeEach(() => {
  renderMock.mockReset();
  renderMock.mockResolvedValue({ svg: '<svg></svg>' });
});

vi.mock('react-zoom-pan-pinch', () => ({
  TransformWrapper: ({ children }: { children: unknown }) =>
    typeof children === 'function'
      ? (children as (c: unknown) => React.ReactNode)({
          zoomIn: vi.fn(), zoomOut: vi.fn(), resetTransform: vi.fn(),
        })
      : (children as React.ReactNode),
  TransformComponent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

function renderView(preload?: Project) {
  return render(
    <ThemeProvider>
      <ProjectProvider preload={preload}><TraceabilityView /></ProjectProvider>
    </ThemeProvider>,
  );
}

it('shows the no-gaps message for an empty project', () => {
  renderView();
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
  renderView(tracedProject());
  const row = screen.getByText('AC-1.1').closest('tr')!;
  expect(within(row).getByText('US-1')).toBeInTheDocument();
  expect(within(row).getByText('GOAL-1')).toBeInTheDocument();
  expect(within(row).getByText('TASK-1')).toBeInTheDocument();
  expect(within(row).getByText('TEST-1')).toBeInTheDocument();
  // a fully-traced project reports no gaps
  expect(screen.getByText(/No gaps/i)).toBeInTheDocument();
});

it('sanitizes dotted AC ids in the Mermaid chain but keeps the original label', async () => {
  const { container } = renderView(tracedProject());
  // the source now sits behind the View source toggle
  await userEvent.click(screen.getByRole('button', { name: /view source/i }));
  const chain = container.querySelector('pre')!.textContent ?? '';
  expect(chain).toContain('flowchart LR');
  expect(chain).toContain('AC_1_1["AC-1.1"]'); // dot & hyphen sanitized in node id, original id in label
  expect(chain).toContain('GOAL-1'); // goal -> story edge present
});

it('renders the traceability chain as a diagram', async () => {
  renderView(tracedProject());
  expect(await screen.findByRole('img', { name: /traceability chain/i })).toBeInTheDocument();
});

it('lists a gap message when a criterion is untested', () => {
  const p = tracedProject();
  p.testing.tests = []; // AC-1.1 now has no verifying test
  renderView(p);
  expect(screen.getByText(/AC-1\.1 has no test verifying it/i)).toBeInTheDocument();
  expect(screen.queryByText(/No gaps/i)).not.toBeInTheDocument();
});

/* Reads the store so a node click can be checked for BOTH halves of SELECT_ENTITY.
   Asserting only the view would not discriminate: the previous SET_VIEW dispatch
   navigated correctly too, and left selectedId null. */
function StateProbe() {
  const { state } = useProject();
  return <p data-testid="probe">{`${state.view}:${state.selectedId ?? 'none'}`}</p>;
}

it('selects the entity behind a clicked diagram node, not just its stage', async () => {
  renderMock.mockResolvedValue({ svg: '<svg><g class="node"><text>US-1</text></g></svg>' });
  const { container } = render(
    <ThemeProvider>
      <ProjectProvider preload={tracedProject()}>
        <TraceabilityView />
        <StateProbe />
      </ProjectProvider>
    </ThemeProvider>,
  );

  await waitFor(() => expect(container.querySelector('.node')).toBeInTheDocument());
  await userEvent.click(container.querySelector('.node text')!);

  expect(screen.getByTestId('probe')).toHaveTextContent('requirements:US-1');
});

it('filters matrix rows by the filter box', async () => {
  const p = emptyProject('Filterable');
  p.requirements.stories.push(
    { id: 'US-1', role: '', want: '', benefit: '', priority: 'Must', servesGoalId: null },
    { id: 'US-2', role: '', want: '', benefit: '', priority: 'Must', servesGoalId: null },
  );
  renderView(p);
  expect(screen.getByText('US-2')).toBeInTheDocument();

  await userEvent.type(screen.getByLabelText(/filter rows/i), 'US-1');
  expect(screen.queryByText('US-2')).not.toBeInTheDocument();
});
