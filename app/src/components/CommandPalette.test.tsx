import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { CommandPalette } from './CommandPalette';

describe('CommandPalette', () => {
  it('renders nothing while closed', () => {
    renderWithProviders(<CommandPalette open={false} onOpenChange={() => {}} />);
    expect(screen.queryByPlaceholderText(/search anything/i)).not.toBeInTheDocument();
  });

  it('lists every stage when open', async () => {
    renderWithProviders(<CommandPalette open onOpenChange={() => {}} />);
    expect(await screen.findByPlaceholderText(/search anything/i)).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Requirements/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Traceability/ })).toBeInTheDocument();
  });

  it('narrows the options as you type', async () => {
    renderWithProviders(<CommandPalette open onOpenChange={() => {}} />);
    await userEvent.type(await screen.findByPlaceholderText(/search anything/i), 'trace');
    expect(screen.getByRole('option', { name: /Traceability/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /^Vision/ })).not.toBeInTheDocument();
  });

  it('closes after a command is chosen', async () => {
    const onOpenChange = vi.fn();
    renderWithProviders(<CommandPalette open onOpenChange={onOpenChange} />);
    await userEvent.click(await screen.findByRole('option', { name: /Requirements/ }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('offers a theme toggle', async () => {
    renderWithProviders(<CommandPalette open onOpenChange={() => {}} />);
    expect(await screen.findByRole('option', { name: /toggle theme/i })).toBeInTheDocument();
  });
});
