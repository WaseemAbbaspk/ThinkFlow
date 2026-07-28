import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('core traceability flow', () => {
  beforeEach(() => localStorage.clear());
  it('goal -> story -> criterion -> task -> test yields a fully-traced, gap-free project', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: /Requirements/i }));
    // a goal, and a story that serves it (so no goalless-story gap)
    await userEvent.click(screen.getByRole('button', { name: /add goal/i }));
    await userEvent.click(screen.getByRole('button', { name: /add story/i }));
    await userEvent.selectOptions(screen.getByLabelText(/Serves goal/i), 'GOAL-1');
    await userEvent.click(screen.getByRole('button', { name: /add criterion/i }));
    await userEvent.click(screen.getByRole('button', { name: /^Tasks/i }));
    await userEvent.click(screen.getByRole('button', { name: /add task/i }));
    await userEvent.selectOptions(screen.getByLabelText(/Traces to/i), 'US-1');
    await userEvent.click(screen.getByRole('button', { name: /Testing/i }));
    await userEvent.click(screen.getByRole('button', { name: /add test/i }));
    await userEvent.selectOptions(screen.getByLabelText(/Verifies/i), 'AC-1.1');
    await userEvent.click(screen.getByRole('button', { name: /Traceability/i }));
    expect(screen.getByText(/No gaps/i)).toBeInTheDocument();
  });
});
