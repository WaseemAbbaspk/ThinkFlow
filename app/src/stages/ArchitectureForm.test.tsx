import { it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectProvider } from '../state/projectStore';
import { ArchitectureForm } from './ArchitectureForm';

it('adds an ADR', async () => {
  render(<ProjectProvider><ArchitectureForm /></ProjectProvider>);
  await userEvent.click(screen.getByRole('button', { name: /add adr/i }));
  expect(screen.getByText(/ADR-1/)).toBeInTheDocument();
});
