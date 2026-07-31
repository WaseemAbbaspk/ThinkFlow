import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextField, SelectField, LinkSelect, RepeatableList } from './inputs';

describe('inputs', () => {
  it('TextField calls onChange with typed value', async () => {
    const onChange = vi.fn();
    render(<TextField label="Name" value="" onChange={onChange} />);
    await userEvent.type(screen.getByLabelText('Name'), 'Hi');
    expect(onChange).toHaveBeenCalled();
  });

  it('RepeatableList renders add button and items', async () => {
    const onAdd = vi.fn();
    render(<RepeatableList items={[1]} addLabel="Add row" onAdd={onAdd}
      renderItem={(n) => <span>item {n}</span>} onRemove={() => {}} />);
    expect(screen.getByText('item 1')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Add row'));
    expect(onAdd).toHaveBeenCalled();
  });

  it('SelectField renders a native select so selectOptions works', async () => {
    const onChange = vi.fn();
    render(
      <SelectField
        label="Priority"
        value="Must"
        options={[{ value: 'Must', label: 'Must' }, { value: 'Should', label: 'Should' }]}
        onChange={onChange}
      />,
    );
    const select = screen.getByLabelText('Priority');
    expect(select.tagName).toBe('SELECT');
    await userEvent.selectOptions(select, 'Should');
    expect(onChange).toHaveBeenCalledWith('Should');
  });

  it('LinkSelect is a combobox that reports an array in multiple mode', async () => {
    const onChange = vi.fn();
    render(
      <LinkSelect
        label="Traces to"
        value={[]}
        multiple
        options={[{ value: 'US-1', label: 'US-1' }, { value: 'US-2', label: 'US-2' }]}
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByLabelText('Traces to'));
    await userEvent.click(await screen.findByRole('option', { name: 'US-2' }));
    expect(onChange).toHaveBeenCalledWith(['US-2']);
  });

  it('RepeatableList keeps the Remove accessible name', () => {
    render(
      <RepeatableList
        items={['a']}
        addLabel="Add row"
        onAdd={() => {}}
        onRemove={() => {}}
        renderItem={() => <span>row</span>}
      />,
    );
    expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
  });
});
