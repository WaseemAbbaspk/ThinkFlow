import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

/* This flow ends on the Traceability stage, which renders a diagram. Mock mermaid so the
   real library and its d3/cytoscape dependencies stay out of jsdom. */
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: '<svg></svg>' }),
  },
}));

vi.mock('react-zoom-pan-pinch', () => ({
  TransformWrapper: ({ children }: { children: unknown }) =>
    typeof children === 'function'
      ? (children as (c: unknown) => React.ReactNode)({
          zoomIn: vi.fn(), zoomOut: vi.fn(), resetTransform: vi.fn(),
        })
      : (children as React.ReactNode),
  TransformComponent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

/** Entity links are typeahead comboboxes: open the popover, then pick the option. */
async function pickLink(label: RegExp, option: string) {
  await userEvent.click(screen.getByLabelText(label));
  await userEvent.click(await screen.findByRole('option', { name: option }));
}

describe('core traceability flow', () => {
  beforeEach(() => localStorage.clear());

  it('goal -> story -> criterion -> task -> test yields a fully-traced, gap-free project', async () => {
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: /Requirements/i }));

    // a goal, and a story that serves it (so no goalless-story gap)
    await userEvent.click(screen.getByRole('button', { name: /add goal/i }));

    await userEvent.click(screen.getByRole('tab', { name: /^Stories/ }));
    await userEvent.click(screen.getByRole('button', { name: /add story/i }));
    await userEvent.click(screen.getByRole('button', { name: /US-1/ }));
    await pickLink(/Serves goal/i, 'GOAL-1');
    await userEvent.click(screen.getByRole('button', { name: /add criterion/i }));

    await userEvent.click(screen.getByRole('button', { name: /^Tasks/i }));
    await userEvent.click(screen.getByRole('button', { name: /add task/i }));
    await userEvent.click(screen.getByRole('button', { name: /TASK-1/ }));
    await pickLink(/Traces to/i, 'US-1');

    await userEvent.click(screen.getByRole('button', { name: /Testing/i }));
    await userEvent.click(screen.getByRole('button', { name: /add test/i }));
    await userEvent.click(screen.getByRole('button', { name: /TEST-1/ }));
    await pickLink(/Verifies/i, 'AC-1.1');

    await userEvent.click(screen.getByRole('button', { name: /Traceability/i }));
    expect(screen.getByText(/No gaps/i)).toBeInTheDocument();
  });

  it('finds an entity through the command palette', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: /^Tasks/i }));
    await userEvent.click(screen.getByRole('button', { name: /add task/i }));

    await userEvent.keyboard('{Control>}k{/Control}');
    await userEvent.type(await screen.findByPlaceholderText(/search anything/i), 'TASK-1');
    await userEvent.click(await screen.findByRole('option', { name: /TASK-1/ }));

    expect(screen.getByRole('complementary', { name: 'Details' })).toBeInTheDocument();
  });
});
