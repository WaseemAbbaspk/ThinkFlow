import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { RequirementsForm } from './RequirementsForm';

describe('RequirementsForm', () => {
  it('adds a story with an auto id shown', async () => {
    renderWithProviders(<RequirementsForm />);
    await userEvent.click(screen.getByRole('button', { name: /add story/i }));
    expect(screen.getByText(/US-1/)).toBeInTheDocument();
  });

  it('adds a criterion under a story', async () => {
    renderWithProviders(<RequirementsForm />);
    await userEvent.click(screen.getByRole('button', { name: /add story/i }));
    await userEvent.click(screen.getByRole('button', { name: /add criterion/i }));
    expect(screen.getByText(/AC-1\.1/)).toBeInTheDocument();
  });

  it('keeps the story when the delete dialog is cancelled', async () => {
    renderWithProviders(<RequirementsForm />);
    await userEvent.click(screen.getByRole('button', { name: /add story/i }));
    await userEvent.click(screen.getByRole('button', { name: /add criterion/i }));
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    await userEvent.click(removeButtons[removeButtons.length - 1]);

    expect(await screen.findByText('Delete US-1?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.getByText(/US-1/)).toBeInTheDocument();
  });

  it('removes the story when the delete dialog is confirmed', async () => {
    renderWithProviders(<RequirementsForm />);
    await userEvent.click(screen.getByRole('button', { name: /add story/i }));
    await userEvent.click(screen.getByRole('button', { name: /add criterion/i }));
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    await userEvent.click(removeButtons[removeButtons.length - 1]);

    expect(await screen.findByText('Delete US-1?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }));

    expect(screen.queryByText(/US-1/)).not.toBeInTheDocument();
  });

  it('deletes a story with no dependents without prompting', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm');
    renderWithProviders(<RequirementsForm />);
    await userEvent.click(screen.getByRole('button', { name: /add story/i }));
    await userEvent.click(screen.getByRole('button', { name: /remove/i }));

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.queryByText(/US-1/)).not.toBeInTheDocument();
    confirmSpy.mockRestore();
  });
});
