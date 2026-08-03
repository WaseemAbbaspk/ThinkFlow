import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { VisionForm } from './VisionForm';

async function openTab(name: RegExp) {
  await userEvent.click(screen.getByRole('tab', { name }));
}

describe('VisionForm', () => {
  it('opens on the Statement tab and edits the vision statement', async () => {
    renderWithProviders(<VisionForm />);
    const field = screen.getByLabelText(/Vision statement/i);
    await userEvent.type(field, 'A trustworthy tool');
    expect(field).toHaveValue('A trustworthy tool');
  });

  it('adds a problem with an auto id shown', async () => {
    renderWithProviders(<VisionForm />);
    await openTab(/^Problems/);
    await userEvent.click(screen.getByRole('button', { name: /add problem/i }));
    expect(screen.getByText('PROB-1')).toBeInTheDocument();
  });

  it('opens the inspector for a selected problem and edits it', async () => {
    renderWithProviders(<VisionForm />);
    await openTab(/^Problems/);
    await userEvent.click(screen.getByRole('button', { name: /add problem/i }));
    expect(screen.queryByRole('complementary', { name: 'Details' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /PROB-1/ }));
    expect(screen.getByRole('complementary', { name: 'Details' })).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Problem'), 'Context is lost at handoff');
    expect(screen.getByLabelText('Problem')).toHaveValue('Context is lost at handoff');
  });

  /* Rows are addressed by id, not array position, so deleting the FIRST of two must
     remove PROB-1 and leave PROB-2 intact. Vision wires onDelete straight through —
     there is no confirm dialog here, unlike the Requirements stage. */
  it('deletes the selected problem by id and closes the rail', async () => {
    renderWithProviders(<VisionForm />);
    await openTab(/^Problems/);
    await userEvent.click(screen.getByRole('button', { name: /add problem/i }));
    await userEvent.click(screen.getByRole('button', { name: /add problem/i }));
    await userEvent.click(screen.getByRole('button', { name: /PROB-1/ }));

    await userEvent.click(screen.getByRole('button', { name: 'Delete PROB-1' }));

    expect(screen.queryByText('PROB-1')).not.toBeInTheDocument();
    expect(screen.getByText('PROB-2')).toBeInTheDocument();
    expect(screen.queryByRole('complementary', { name: 'Details' })).not.toBeInTheDocument();
  });

  it('adds a non-goal on its own tab', async () => {
    renderWithProviders(<VisionForm />);
    await openTab(/^Non-goals/);
    await userEvent.click(screen.getByRole('button', { name: /add non-goal/i }));
    expect(screen.getByLabelText('Non-goal')).toBeInTheDocument();
  });

  it('adds a beneficiary with both of its fields', async () => {
    renderWithProviders(<VisionForm />);
    await openTab(/^Beneficiaries/);
    await userEvent.click(screen.getByRole('button', { name: /add beneficiary/i }));
    expect(screen.getByLabelText('Audience')).toBeInTheDocument();
    expect(screen.getByLabelText('Change')).toBeInTheDocument();
  });

  it('keeps assumptions and risks on separate tabs with their own field labels', async () => {
    renderWithProviders(<VisionForm />);
    await openTab(/^Assumptions/);
    await userEvent.click(screen.getByRole('button', { name: /add assumption/i }));
    expect(screen.getByLabelText('Validation')).toBeInTheDocument();

    await openTab(/^Risks/);
    await userEvent.click(screen.getByRole('button', { name: /add risk/i }));
    expect(screen.getByLabelText('Mitigation')).toBeInTheDocument();
  });
});
