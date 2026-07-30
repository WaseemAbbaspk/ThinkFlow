import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Combobox } from './Combobox';

const OPTIONS = [
  { value: 'US-1', label: 'US-1' },
  { value: 'US-2', label: 'US-2' },
  { value: 'AC-1.1', label: 'AC-1.1' },
];

describe('Combobox', () => {
  it('is reachable by its label', () => {
    render(<Combobox label="Traces to" value={[]} options={OPTIONS} multiple onChange={vi.fn()} />);
    expect(screen.getByLabelText('Traces to')).toBeInTheDocument();
  });

  it('selects a single value and closes', async () => {
    const onChange = vi.fn();
    render(<Combobox label="Serves goal" value="" options={OPTIONS} onChange={onChange} />);
    await userEvent.click(screen.getByLabelText('Serves goal'));
    await userEvent.click(await screen.findByRole('option', { name: 'US-2' }));
    expect(onChange).toHaveBeenCalledWith('US-2');
  });

  it('accumulates values in multiple mode', async () => {
    const onChange = vi.fn();
    render(<Combobox label="Traces to" value={['US-1']} options={OPTIONS} multiple onChange={onChange} />);
    await userEvent.click(screen.getByLabelText('Traces to'));
    await userEvent.click(await screen.findByRole('option', { name: 'AC-1.1' }));
    expect(onChange).toHaveBeenCalledWith(['US-1', 'AC-1.1']);
  });

  it('deselects an already-selected value in multiple mode', async () => {
    const onChange = vi.fn();
    render(<Combobox label="Traces to" value={['US-1', 'US-2']} options={OPTIONS} multiple onChange={onChange} />);
    await userEvent.click(screen.getByLabelText('Traces to'));
    await userEvent.click(await screen.findByRole('option', { name: 'US-1' }));
    expect(onChange).toHaveBeenCalledWith(['US-2']);
  });

  it('filters options by the typed query', async () => {
    render(<Combobox label="Traces to" value={[]} options={OPTIONS} multiple onChange={vi.fn()} />);
    await userEvent.click(screen.getByLabelText('Traces to'));
    await userEvent.type(screen.getByPlaceholderText(/search/i), 'AC');
    expect(await screen.findByRole('option', { name: 'AC-1.1' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'US-1' })).not.toBeInTheDocument();
  });

  it('removes a value from its chip, using a name that does not collide with RepeatableList', async () => {
    const onChange = vi.fn();
    render(<Combobox label="Traces to" value={['US-1', 'US-2']} options={OPTIONS} multiple onChange={onChange} />);
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Remove US-1' }));
    expect(onChange).toHaveBeenCalledWith(['US-2']);
  });

  it('shows an empty state when nothing matches', async () => {
    render(<Combobox label="Traces to" value={[]} options={OPTIONS} multiple onChange={vi.fn()} />);
    await userEvent.click(screen.getByLabelText('Traces to'));
    await userEvent.type(screen.getByPlaceholderText(/search/i), 'zzz');
    expect(await screen.findByText(/no matches/i)).toBeInTheDocument();
  });
});
