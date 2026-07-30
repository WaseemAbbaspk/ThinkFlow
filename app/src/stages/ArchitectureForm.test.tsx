import React from 'react';
import { it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectProvider } from '../state/projectStore';
import { ThemeProvider } from '@/state/theme';
import { ArchitectureForm } from './ArchitectureForm';

/* The form now renders diagram previews. Mock mermaid so the real library and its
   d3/cytoscape dependencies stay out of jsdom. */
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

function renderForm() {
  return render(
    <ThemeProvider>
      <ProjectProvider><ArchitectureForm /></ProjectProvider>
    </ThemeProvider>,
  );
}

it('adds an ADR', async () => {
  renderForm();
  await userEvent.click(screen.getByRole('button', { name: /add adr/i }));
  expect(screen.getByText(/ADR-1/)).toBeInTheDocument();
});

it('previews the context diagram as you type', async () => {
  renderForm();
  // Exact label: the rendered diagram also carries aria-label="Context diagram",
  // so a loose /Context diagram/i would match two elements once the preview appears.
  await userEvent.type(
    screen.getByLabelText('Context diagram (Mermaid)'),
    'flowchart LR{enter}  A --> B',
  );
  // a single header line has no edges, so the preview stays a placeholder until line two
  expect(await screen.findByRole('img', { name: 'Context diagram' })).toBeInTheDocument();
});
