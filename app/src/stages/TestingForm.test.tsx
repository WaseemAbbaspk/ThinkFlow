import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { TestingForm } from './TestingForm';

describe('TestingForm', () => {
  it('keeps the entry and exit criteria fields', () => {
    renderWithProviders(<TestingForm />);
    expect(screen.getByLabelText('Entry criteria')).toBeInTheDocument();
    expect(screen.getByLabelText('Exit criteria')).toBeInTheDocument();
  });

  it('adds a test and lists it', async () => {
    renderWithProviders(<TestingForm />);
    await userEvent.click(screen.getByRole('button', { name: /add test/i }));
    expect(screen.getByText(/TEST-1/)).toBeInTheDocument();
  });

  it('opens the inspector for a test row', async () => {
    renderWithProviders(<TestingForm />);
    await userEvent.click(screen.getByRole('button', { name: /add test/i }));
    await userEvent.click(screen.getByRole('button', { name: /TEST-1/ }));
    expect(screen.getByRole('complementary', { name: 'Details' })).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  it('duplicates a test from the inspector', async () => {
    renderWithProviders(<TestingForm />);
    await userEvent.click(screen.getByRole('button', { name: /add test/i }));
    await userEvent.click(screen.getByRole('button', { name: /TEST-1/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Duplicate TEST-1' }));
    expect(screen.getByText(/TEST-2/)).toBeInTheDocument();
  });
});
