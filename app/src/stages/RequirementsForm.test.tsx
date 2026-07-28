import { describe, it, expect } from 'vitest';
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
});
