import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { ArchitectureForm } from './ArchitectureForm';

/* The form renders diagram previews. Mock mermaid so the real library and its
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

async function openTab(name: RegExp) {
  await userEvent.click(screen.getByRole('tab', { name }));
}

describe('ArchitectureForm', () => {
  /* Queried by role, not label: Radix points each TabsContent's aria-labelledby at its
     trigger, so the panel's accessible name is also "Overview" and getByLabelText would
     match both it and the textarea. Only the textarea has role="textbox". */
  it('opens on the Overview tab', async () => {
    renderWithProviders(<ArchitectureForm />);
    const field = screen.getByRole('textbox', { name: 'Overview' });
    await userEvent.type(field, 'Three services');
    expect(field).toHaveValue('Three services');
  });

  it('adds an ADR', async () => {
    renderWithProviders(<ArchitectureForm />);
    await openTab(/^ADRs/);
    await userEvent.click(screen.getByRole('button', { name: /add adr/i }));
    expect(screen.getByText(/ADR-1/)).toBeInTheDocument();
  });

  it('opens the inspector for a selected ADR and edits its title', async () => {
    renderWithProviders(<ArchitectureForm />);
    await openTab(/^ADRs/);
    await userEvent.click(screen.getByRole('button', { name: /add adr/i }));
    expect(screen.queryByRole('complementary', { name: 'Details' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /ADR-1/ }));
    expect(screen.getByRole('complementary', { name: 'Details' })).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Title'), 'Use Postgres');
    expect(screen.getByLabelText('Title')).toHaveValue('Use Postgres');
  });

  /* ADRs are edited and deleted by id, never by array position, because the list sorts. */
  it('deletes the selected ADR by id and closes the rail', async () => {
    renderWithProviders(<ArchitectureForm />);
    await openTab(/^ADRs/);
    await userEvent.click(screen.getByRole('button', { name: /add adr/i }));
    await userEvent.click(screen.getByRole('button', { name: /add adr/i }));
    await userEvent.click(screen.getByRole('button', { name: /ADR-1/ }));

    await userEvent.click(screen.getByRole('button', { name: 'Delete ADR-1' }));

    expect(screen.queryByText('ADR-1')).not.toBeInTheDocument();
    expect(screen.getByText('ADR-2')).toBeInTheDocument();
    expect(screen.queryByRole('complementary', { name: 'Details' })).not.toBeInTheDocument();
  });

  it('previews the context diagram as you type', async () => {
    renderWithProviders(<ArchitectureForm />);
    await openTab(/^Diagrams/);
    // Exact label: the rendered diagram also carries aria-label="Context diagram",
    // so a loose /Context diagram/i would match two elements once the preview appears.
    await userEvent.type(
      screen.getByLabelText('Context diagram (Mermaid)'),
      'flowchart LR{enter}  A --> B',
    );
    // a single header line has no edges, so the preview stays a placeholder until line two
    expect(await screen.findByRole('img', { name: 'Context diagram' })).toBeInTheDocument();
  });

  it('adds a component on its own tab', async () => {
    renderWithProviders(<ArchitectureForm />);
    await openTab(/^Components/);
    await userEvent.click(screen.getByRole('button', { name: /add component/i }));
    expect(screen.getByLabelText('Responsibility')).toBeInTheDocument();
  });

  it('keeps key flows and NFR considerations on separate tabs', async () => {
    renderWithProviders(<ArchitectureForm />);
    await openTab(/^Key flows/);
    await userEvent.click(screen.getByRole('button', { name: /add key flow/i }));
    expect(screen.getByLabelText('Description')).toBeInTheDocument();

    await openTab(/^NFR considerations/);
    await userEvent.click(screen.getByRole('button', { name: /add nfr consideration/i }));
    expect(screen.getByLabelText('Concern')).toBeInTheDocument();
  });
});
