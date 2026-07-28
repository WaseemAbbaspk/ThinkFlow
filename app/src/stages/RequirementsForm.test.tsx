import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectProvider } from '../state/projectStore';
import { RequirementsForm } from './RequirementsForm';

describe('RequirementsForm', () => {
  it('adds a story with an auto id shown', async () => {
    render(<ProjectProvider><RequirementsForm /></ProjectProvider>);
    await userEvent.click(screen.getByRole('button', { name: /add story/i }));
    expect(screen.getByText(/US-1/)).toBeInTheDocument();
  });
  it('adds a criterion under a story', async () => {
    render(<ProjectProvider><RequirementsForm /></ProjectProvider>);
    await userEvent.click(screen.getByRole('button', { name: /add story/i }));
    await userEvent.click(screen.getByRole('button', { name: /add criterion/i }));
    expect(screen.getByText(/AC-1\.1/)).toBeInTheDocument();
  });

  it('keeps the story when delete is not confirmed', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<ProjectProvider><RequirementsForm /></ProjectProvider>);
    await userEvent.click(screen.getByRole('button', { name: /add story/i }));
    await userEvent.click(screen.getByRole('button', { name: /add criterion/i }));
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    await userEvent.click(removeButtons[removeButtons.length - 1]);
    expect(confirmSpy).toHaveBeenCalled();
    expect(screen.getByText(/US-1/)).toBeInTheDocument();
    confirmSpy.mockRestore();
  });

  it('removes the story when delete is confirmed', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<ProjectProvider><RequirementsForm /></ProjectProvider>);
    await userEvent.click(screen.getByRole('button', { name: /add story/i }));
    await userEvent.click(screen.getByRole('button', { name: /add criterion/i }));
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    await userEvent.click(removeButtons[removeButtons.length - 1]);
    expect(confirmSpy).toHaveBeenCalled();
    expect(screen.queryByText(/US-1/)).not.toBeInTheDocument();
    confirmSpy.mockRestore();
  });

  it('deletes a story with no dependents without prompting', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm');
    render(<ProjectProvider><RequirementsForm /></ProjectProvider>);
    await userEvent.click(screen.getByRole('button', { name: /add story/i }));
    await userEvent.click(screen.getByRole('button', { name: /remove/i }));
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(screen.queryByText(/US-1/)).not.toBeInTheDocument();
    confirmSpy.mockRestore();
  });
});
