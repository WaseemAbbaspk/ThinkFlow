import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListDetail } from './ListDetail';
import type { FilterGroup, SortOption } from '@/lib/listView';

interface Row { id: string; name: string; flag: boolean; }

const rows: Row[] = [
  { id: 'R-1', name: 'alpha', flag: true },
  { id: 'R-2', name: 'beta', flag: false },
];

const sorts: SortOption<Row>[] = [
  { id: 'id', label: 'ID', compare: (a, b) => a.id.localeCompare(b.id) },
  { id: 'name', label: 'Name', compare: (a, b) => a.name.localeCompare(b.name) },
];

const filters: FilterGroup<Row>[] = [
  {
    id: 'flag', label: 'Flag',
    options: [{ value: 'on', label: 'On' }],
    matches: (r, v) => (v === 'on' ? r.flag : true),
  },
];

function setup(overrides: Partial<React.ComponentProps<typeof ListDetail<Row>>> = {}) {
  const props = {
    items: rows,
    getId: (r: Row) => r.id,
    getTitle: (r: Row) => r.name,
    getSearchText: (r: Row) => `${r.id} ${r.name}`,
    sorts,
    filters,
    selectedId: null as string | null,
    onSelect: vi.fn(),
    onAdd: vi.fn(),
    onDelete: vi.fn(),
    addLabel: 'Add row',
    searchLabel: 'Search rows',
    emptyMessage: 'Nothing here.',
    renderRow: (r: Row) => <span>{r.id} {r.name}</span>,
    renderInspector: (r: Row) => <p>inspecting {r.name}</p>,
    ...overrides,
  };
  render(<ListDetail<Row> {...props} />);
  return props;
}

describe('ListDetail', () => {
  it('renders a row per item and a count', () => {
    setup();
    expect(screen.getByText(/R-1 alpha/)).toBeInTheDocument();
    expect(screen.getByText(/R-2 beta/)).toBeInTheDocument();
    expect(screen.getByText(/Showing 2 of 2/)).toBeInTheDocument();
  });

  it('narrows the list as you search', async () => {
    setup();
    await userEvent.type(screen.getByLabelText('Search rows'), 'beta');
    expect(screen.queryByText(/R-1 alpha/)).not.toBeInTheDocument();
    expect(screen.getByText(/R-2 beta/)).toBeInTheDocument();
    expect(screen.getByText(/Showing 1 of 2/)).toBeInTheDocument();
  });

  it('shows the empty message when nothing matches', async () => {
    setup();
    await userEvent.type(screen.getByLabelText('Search rows'), 'zzz');
    expect(screen.getByText('Nothing here.')).toBeInTheDocument();
  });

  it('reports the clicked row id', async () => {
    const props = setup();
    await userEvent.click(screen.getByRole('button', { name: /R-1 alpha/ }));
    expect(props.onSelect).toHaveBeenCalledWith('R-1');
  });

  it('hides the inspector until something is selected', () => {
    setup();
    expect(screen.queryByRole('complementary', { name: 'Details' })).not.toBeInTheDocument();
  });

  it('renders the inspector for the selected item', () => {
    setup({ selectedId: 'R-2' });
    expect(screen.getByRole('complementary', { name: 'Details' })).toBeInTheDocument();
    expect(screen.getByText('inspecting beta')).toBeInTheDocument();
  });

  it('deselects from the inspector close button', async () => {
    const props = setup({ selectedId: 'R-2' });
    await userEvent.click(screen.getByRole('button', { name: 'Close details' }));
    expect(props.onSelect).toHaveBeenCalledWith(null);
  });

  it('passes the selected id to onDelete', async () => {
    const props = setup({ selectedId: 'R-2' });
    await userEvent.click(screen.getByRole('button', { name: 'Delete R-2' }));
    expect(props.onDelete).toHaveBeenCalledWith('R-2');
  });

  it('renders no inspector when the selected id is absent from items', () => {
    setup({ selectedId: 'R-9' });
    expect(screen.queryByRole('complementary', { name: 'Details' })).not.toBeInTheDocument();
  });

  it('keeps the inspector open when a search excludes the selected row', async () => {
    setup({ selectedId: 'R-1' });
    await userEvent.type(screen.getByLabelText('Search rows'), 'beta');
    // R-1 is filtered out of the list but stays selected — filtering is not deselection.
    expect(screen.queryByText(/R-1 alpha/)).not.toBeInTheDocument();
    expect(screen.getByText('inspecting alpha')).toBeInTheDocument();
  });

  it('calls onAdd from the add button', async () => {
    const props = setup();
    await userEvent.click(screen.getByRole('button', { name: /Add row/ }));
    expect(props.onAdd).toHaveBeenCalled();
  });
});
