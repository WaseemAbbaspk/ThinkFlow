import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { TopBar } from './TopBar';

describe('TopBar', () => {
  it('shows the project name and the current stage as a breadcrumb', () => {
    renderWithProviders(<TopBar saveState="saved" onOpenPalette={() => {}} />);
    expect(screen.getByLabelText('Project name')).toHaveValue('Untitled Project');
    expect(screen.getByText('Vision')).toBeInTheDocument();
  });

  it('opens the palette from the search trigger', async () => {
    const onOpenPalette = vi.fn();
    renderWithProviders(<TopBar saveState="saved" onOpenPalette={onOpenPalette} />);
    await userEvent.click(screen.getByRole('button', { name: /search anything/i }));
    expect(onOpenPalette).toHaveBeenCalled();
  });

  it('keeps the export trigger named so it cannot collide with the sidebar', () => {
    renderWithProviders(<TopBar saveState="saved" onOpenPalette={() => {}} />);
    expect(screen.getByRole('button', { name: 'Export actions' })).toBeInTheDocument();
  });
});
