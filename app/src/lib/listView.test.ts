import { describe, it, expect } from 'vitest';
import { applyListView, type FilterGroup, type ListViewConfig, type SortOption } from './listView';

interface Row { id: string; name: string; status: string; }

const rows: Row[] = [
  { id: 'A-2', name: 'banana', status: 'open' },
  { id: 'A-1', name: 'apple', status: 'done' },
  { id: 'A-3', name: 'cherry', status: 'open' },
];

const sorts: SortOption<Row>[] = [
  { id: 'id', label: 'ID', compare: (a, b) => a.id.localeCompare(b.id) },
  { id: 'name', label: 'Name', compare: (a, b) => a.name.localeCompare(b.name) },
];

const filters: FilterGroup<Row>[] = [
  {
    id: 'status', label: 'Status',
    options: [{ value: 'open', label: 'Open' }, { value: 'done', label: 'Done' }],
    matches: (r, v) => r.status === v,
  },
];

const config: ListViewConfig<Row> = {
  getSearchText: r => `${r.id} ${r.name}`,
  sorts,
  filters,
};

const base = { query: '', active: {}, sortId: '' };

describe('applyListView', () => {
  it('returns everything when nothing is set', () => {
    expect(applyListView(rows, base, config)).toHaveLength(3);
  });

  it('matches the search query case-insensitively', () => {
    const out = applyListView(rows, { ...base, query: 'BAN' }, config);
    expect(out.map(r => r.id)).toEqual(['A-2']);
  });

  it('searches across every field getSearchText returns', () => {
    const out = applyListView(rows, { ...base, query: 'a-3' }, config);
    expect(out.map(r => r.id)).toEqual(['A-3']);
  });

  it('ORs values within one filter group', () => {
    const out = applyListView(rows, { ...base, active: { status: ['open', 'done'] } }, config);
    expect(out).toHaveLength(3);
  });

  it('treats an empty value list as no filter', () => {
    const out = applyListView(rows, { ...base, active: { status: [] } }, config);
    expect(out).toHaveLength(3);
  });

  it('ANDs the query with a filter group', () => {
    const out = applyListView(rows, { query: 'a', active: { status: ['open'] }, sortId: '' }, config);
    expect(out.map(r => r.id)).toEqual(['A-2', 'A-3']);
  });

  it('applies the named sort', () => {
    const out = applyListView(rows, { ...base, sortId: 'name' }, config);
    expect(out.map(r => r.name)).toEqual(['apple', 'banana', 'cherry']);
  });

  it('leaves order untouched when sortId matches nothing', () => {
    const out = applyListView(rows, { ...base, sortId: 'nope' }, config);
    expect(out.map(r => r.id)).toEqual(['A-2', 'A-1', 'A-3']);
  });

  it('does not mutate the input array', () => {
    const input = [...rows];
    applyListView(input, { ...base, sortId: 'name' }, config);
    expect(input.map(r => r.id)).toEqual(['A-2', 'A-1', 'A-3']);
  });

  it('returns an empty array when nothing matches', () => {
    expect(applyListView(rows, { ...base, query: 'zzz' }, config)).toEqual([]);
  });
});
