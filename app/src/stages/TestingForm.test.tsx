import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectProvider } from '../state/projectStore';
import { TestingForm } from './TestingForm';

describe('TestingForm', () => {
  it('adds a test', async () => {
    render(<ProjectProvider><TestingForm /></ProjectProvider>);
    await userEvent.click(screen.getByRole('button', { name: /add test/i }));
    expect(screen.getByText(/TEST-1/)).toBeInTheDocument();
  });
});
