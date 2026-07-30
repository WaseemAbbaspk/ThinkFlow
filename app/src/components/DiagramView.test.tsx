import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/state/theme';
import { DiagramView } from './DiagramView';

const renderMock = vi.fn();

vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: (...args: unknown[]) => renderMock(...args),
  },
}));

// jsdom has no layout, so the real TransformWrapper measures zeroes. Passthrough stub.
vi.mock('react-zoom-pan-pinch', () => ({
  TransformWrapper: ({ children }: { children: unknown }) =>
    typeof children === 'function'
      ? (children as (c: unknown) => React.ReactNode)({
          zoomIn: vi.fn(), zoomOut: vi.fn(), resetTransform: vi.fn(),
        })
      : (children as React.ReactNode),
  TransformComponent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

function renderDiagram(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

const SOURCE = 'flowchart LR\n  US_1["US-1"] --> TASK_1["TASK-1"]';

beforeEach(() => {
  renderMock.mockReset();
  renderMock.mockResolvedValue({
    svg: '<svg><g class="node"><text>US-1</text></g></svg>',
  });
});

describe('DiagramView', () => {
  it('shows a placeholder and never loads mermaid when there is nothing to draw', () => {
    renderDiagram(<DiagramView source="flowchart LR" label="Chain" debounceMs={0} />);
    expect(screen.getByText(/nothing to diagram yet/i)).toBeInTheDocument();
    expect(renderMock).not.toHaveBeenCalled();
  });

  it('renders the mermaid svg', async () => {
    const { container } = renderDiagram(
      <DiagramView source={SOURCE} label="Chain" debounceMs={0} />,
    );
    await waitFor(() => expect(container.querySelector('svg')).toBeInTheDocument());
  });

  it('exposes the source behind a View source toggle', async () => {
    renderDiagram(<DiagramView source={SOURCE} label="Chain" debounceMs={0} />);
    expect(screen.queryByText(SOURCE)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /view source/i }));
    expect(screen.getByText(SOURCE)).toBeInTheDocument();
  });

  it('shows the parse error when nothing has ever rendered', async () => {
    renderMock.mockRejectedValue(new Error('Parse error on line 2'));
    renderDiagram(<DiagramView source={SOURCE} label="Chain" debounceMs={0} />);
    expect(await screen.findByText(/parse error on line 2/i)).toBeInTheDocument();
  });

  it('keeps the last good render on screen when a later edit fails to parse', async () => {
    const { container, rerender } = renderDiagram(
      <DiagramView source={SOURCE} label="Chain" debounceMs={0} />,
    );
    await waitFor(() => expect(container.querySelector('svg')).toBeInTheDocument());

    renderMock.mockRejectedValue(new Error('Parse error on line 3'));
    rerender(
      <ThemeProvider>
        <DiagramView source={`${SOURCE}\n  broken[[`} label="Chain" debounceMs={0} />
      </ThemeProvider>,
    );

    expect(await screen.findByText(/parse error on line 3/i)).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('offers zoom and reset controls', async () => {
    renderDiagram(<DiagramView source={SOURCE} label="Chain" debounceMs={0} />);
    await screen.findByRole('button', { name: /zoom in/i });
    expect(screen.getByRole('button', { name: /zoom out/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset view/i })).toBeInTheDocument();
  });

  it('reports the clicked node label', async () => {
    const onNodeClick = vi.fn();
    const { container } = renderDiagram(
      <DiagramView source={SOURCE} label="Chain" debounceMs={0} onNodeClick={onNodeClick} />,
    );
    await waitFor(() => expect(container.querySelector('.node')).toBeInTheDocument());
    await userEvent.click(container.querySelector('.node text')!);
    expect(onNodeClick).toHaveBeenCalledWith('US-1');
  });

  it('ignores clicks that miss a node', async () => {
    const onNodeClick = vi.fn();
    const { container } = renderDiagram(
      <DiagramView source={SOURCE} label="Chain" debounceMs={0} onNodeClick={onNodeClick} />,
    );
    await waitFor(() => expect(container.querySelector('svg')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('img', { name: 'Chain' }));
    expect(onNodeClick).not.toHaveBeenCalled();
  });
});
