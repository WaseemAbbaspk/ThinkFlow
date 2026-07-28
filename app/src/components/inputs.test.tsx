import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextField, RepeatableList } from './inputs';

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
});
