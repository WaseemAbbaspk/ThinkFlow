import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { AppShell } from './AppShell';

/* Traceability renders a diagram; keep mermaid and its d3 dependencies out of jsdom. */
vi.mock('mermaid', () => ({
  default: { initialize: vi.fn(), render: vi.fn().mockResolvedValue({ svg: '<svg></svg>' }) },
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

describe('AppShell', () => {
  it('opens the palette on Ctrl+K', async () => {
    renderWithProviders(<AppShell />);
    expect(screen.queryByPlaceholderText(/search anything/i)).not.toBeInTheDocument();
    await userEvent.keyboard('{Control>}k{/Control}');
    expect(await screen.findByPlaceholderText(/search anything/i)).toBeInTheDocument();
  });

  it('opens the palette from the top bar trigger', async () => {
    renderWithProviders(<AppShell />);
    await userEvent.click(screen.getByRole('button', { name: /search anything/i }));
    expect(await screen.findByPlaceholderText(/search anything/i)).toBeInTheDocument();
  });
});
