import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectProvider } from '../state/projectStore';
import { TasksForm } from './TasksForm';

describe('TasksForm', () => {
  it('adds a task', async () => {
    render(<ProjectProvider><TasksForm /></ProjectProvider>);
    await userEvent.click(screen.getByRole('button', { name: /add task/i }));
    expect(screen.getByText(/TASK-1/)).toBeInTheDocument();
  });
});
