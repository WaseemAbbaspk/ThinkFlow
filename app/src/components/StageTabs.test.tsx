import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StageTabs } from './StageTabs';

const tabs = [
  { value: 'goals', label: 'Goals', count: 3 },
  { value: 'stories', label: 'Stories', count: 12 },
];

describe('StageTabs', () => {
  it('renders a tab per entry with its count', () => {
    render(<StageTabs tabs={tabs} value="goals" onValueChange={() => {}}><p>body</p></StageTabs>);
    expect(screen.getByRole('tab', { name: /^Goals/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^Stories/ })).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('marks the active tab as selected', () => {
    render(<StageTabs tabs={tabs} value="stories" onValueChange={() => {}}><p>body</p></StageTabs>);
    expect(screen.getByRole('tab', { name: /^Stories/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('reports the chosen tab value', async () => {
    const onValueChange = vi.fn();
    render(<StageTabs tabs={tabs} value="goals" onValueChange={onValueChange}><p>body</p></StageTabs>);
    await userEvent.click(screen.getByRole('tab', { name: /^Stories/ }));
    expect(onValueChange).toHaveBeenCalledWith('stories');
  });

  it('renders its children', () => {
    render(<StageTabs tabs={tabs} value="goals" onValueChange={() => {}}><p>body</p></StageTabs>);
    expect(screen.getByText('body')).toBeInTheDocument();
  });
});
