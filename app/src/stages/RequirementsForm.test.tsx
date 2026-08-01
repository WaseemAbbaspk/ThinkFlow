import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { RequirementsForm } from './RequirementsForm';

async function openTab(name: RegExp) {
  await userEvent.click(screen.getByRole('tab', { name }));
}

describe('RequirementsForm', () => {
  it('opens on the Goals tab and adds a goal', async () => {
    renderWithProviders(<RequirementsForm />);
    await userEvent.click(screen.getByRole('button', { name: /add goal/i }));
    expect(screen.getByText(/GOAL-1/)).toBeInTheDocument();
  });

  it('edits a goal from its inspector', async () => {
    renderWithProviders(<RequirementsForm />);
    await userEvent.click(screen.getByRole('button', { name: /add goal/i }));
    await userEvent.click(screen.getByRole('button', { name: /GOAL-1/ }));
    await userEvent.type(screen.getByLabelText('Text'), 'Ship fast');
    expect(screen.getByLabelText('Text')).toHaveValue('Ship fast');
  });

  it('adds a story with an auto id shown', async () => {
    renderWithProviders(<RequirementsForm />);
    await openTab(/^Stories/);
    await userEvent.click(screen.getByRole('button', { name: /add story/i }));
    expect(screen.getByText(/US-1/)).toBeInTheDocument();
  });

  it('adds a criterion from inside the story inspector', async () => {
    renderWithProviders(<RequirementsForm />);
    await openTab(/^Stories/);
    await userEvent.click(screen.getByRole('button', { name: /add story/i }));
    await userEvent.click(screen.getByRole('button', { name: /US-1/ }));
    await userEvent.click(screen.getByRole('button', { name: /add criterion/i }));
    expect(screen.getByText(/AC-1\.1/)).toBeInTheDocument();
  });

  it('keeps the story when the delete dialog is cancelled', async () => {
    renderWithProviders(<RequirementsForm />);
    await openTab(/^Stories/);
    await userEvent.click(screen.getByRole('button', { name: /add story/i }));
    await userEvent.click(screen.getByRole('button', { name: /US-1/ }));
    await userEvent.click(screen.getByRole('button', { name: /add criterion/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete US-1' }));

    expect(await screen.findByText('Delete US-1?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

    // US-1 is still selected here, so its id appears on the row badge, the
    // inspector badge and the inspector heading. Anchor to the row button.
    expect(screen.getByRole('button', { name: /^US-1/ })).toBeInTheDocument();
  });

  it('removes the story when the delete dialog is confirmed', async () => {
    renderWithProviders(<RequirementsForm />);
    await openTab(/^Stories/);
    await userEvent.click(screen.getByRole('button', { name: /add story/i }));
    await userEvent.click(screen.getByRole('button', { name: /US-1/ }));
    await userEvent.click(screen.getByRole('button', { name: /add criterion/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete US-1' }));

    expect(await screen.findByText('Delete US-1?')).toBeInTheDocument();
    // The inspector's own button is "Delete US-1", so /^delete$/i is unambiguous here.
    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }));

    expect(screen.queryByText(/US-1/)).not.toBeInTheDocument();
  });

  it('deletes a story with no dependents without prompting', async () => {
    renderWithProviders(<RequirementsForm />);
    await openTab(/^Stories/);
    await userEvent.click(screen.getByRole('button', { name: /add story/i }));
    await userEvent.click(screen.getByRole('button', { name: /US-1/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete US-1' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.queryByText(/US-1/)).not.toBeInTheDocument();
  });

  it('duplicates a story together with its criteria', async () => {
    renderWithProviders(<RequirementsForm />);
    await openTab(/^Stories/);
    await userEvent.click(screen.getByRole('button', { name: /add story/i }));
    await userEvent.click(screen.getByRole('button', { name: /US-1/ }));
    await userEvent.click(screen.getByRole('button', { name: /add criterion/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Duplicate US-1' }));

    expect(screen.getByText(/US-2/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /US-2/ }));
    expect(screen.getByText(/AC-2\.1/)).toBeInTheDocument();
  });

  it('edits assumptions inline without an inspector', async () => {
    renderWithProviders(<RequirementsForm />);
    await openTab(/^Assumptions/);
    await userEvent.click(screen.getByRole('button', { name: /add assumption/i }));
    await userEvent.type(screen.getByLabelText('Assumption'), 'Users have email');
    expect(screen.getByLabelText('Assumption')).toHaveValue('Users have email');
    expect(screen.queryByRole('complementary', { name: 'Details' })).not.toBeInTheDocument();
  });

  it('keeps the signoff fields', async () => {
    renderWithProviders(<RequirementsForm />);
    await openTab(/^Signoff/);
    expect(screen.getByLabelText('Signed off by')).toBeInTheDocument();
    expect(screen.getByLabelText('Signoff date')).toBeInTheDocument();
  });
});
