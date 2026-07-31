import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { TasksForm } from './TasksForm';

describe('TasksForm', () => {
  it('adds a task and lists it', async () => {
    renderWithProviders(<TasksForm />);
    await userEvent.click(screen.getByRole('button', { name: /add task/i }));
    expect(screen.getByText(/TASK-1/)).toBeInTheDocument();
  });

  it('opens the inspector when a task row is clicked', async () => {
    renderWithProviders(<TasksForm />);
    await userEvent.click(screen.getByRole('button', { name: /add task/i }));
    expect(screen.queryByRole('complementary', { name: 'Details' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /TASK-1/ }));
    expect(screen.getByRole('complementary', { name: 'Details' })).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
  });

  it('edits the title live from the inspector', async () => {
    renderWithProviders(<TasksForm />);
    await userEvent.click(screen.getByRole('button', { name: /add task/i }));
    await userEvent.click(screen.getByRole('button', { name: /TASK-1/ }));
    await userEvent.type(screen.getByLabelText('Title'), 'Ship it');
    expect(screen.getByLabelText('Title')).toHaveValue('Ship it');
  });

  it('duplicates a task from the inspector', async () => {
    renderWithProviders(<TasksForm />);
    await userEvent.click(screen.getByRole('button', { name: /add task/i }));
    await userEvent.click(screen.getByRole('button', { name: /TASK-1/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Duplicate TASK-1' }));
    expect(screen.getByText(/TASK-2/)).toBeInTheDocument();
  });

  it('closes the inspector when the selected task is deleted', async () => {
    renderWithProviders(<TasksForm />);
    await userEvent.click(screen.getByRole('button', { name: /add task/i }));
    await userEvent.click(screen.getByRole('button', { name: /TASK-1/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete TASK-1' }));
    expect(screen.queryByRole('complementary', { name: 'Details' })).not.toBeInTheDocument();
    expect(screen.queryByText(/TASK-1/)).not.toBeInTheDocument();
  });

  it('filters the list by search', async () => {
    renderWithProviders(<TasksForm />);
    await userEvent.click(screen.getByRole('button', { name: /add task/i }));
    await userEvent.click(screen.getByRole('button', { name: /add task/i }));
    await userEvent.type(screen.getByLabelText('Search tasks'), 'TASK-2');
    expect(screen.queryByText(/TASK-1/)).not.toBeInTheDocument();
    expect(screen.getByText(/TASK-2/)).toBeInTheDocument();
  });
});
