export interface SortOption<T> {
  /** Stable key stored in ListViewState.sortId. */
  id: string;
  label: string;
  compare: (a: T, b: T) => number;
}

export interface FilterGroup<T> {
  id: string;
  label: string;
  options: { value: string; label: string }[];
  /** True when `item` belongs to `value`. */
  matches: (item: T, value: string) => boolean;
}

export interface ListViewState {
  query: string;
  /** Group id -> selected values. Empty or absent means "all". */
  active: Record<string, string[]>;
  sortId: string;
}

export interface ListViewConfig<T> {
  getSearchText: (item: T) => string;
  sorts: SortOption<T>[];
  filters: FilterGroup<T>[];
}

/**
 * Search, then filter, then sort. Values inside one filter group are OR-ed;
 * separate groups are AND-ed. Never mutates `items`.
 */
export function applyListView<T>(
  items: T[],
  state: ListViewState,
  config: ListViewConfig<T>,
): T[] {
  let out = items;

  const query = state.query.trim().toLowerCase();
  if (query) {
    out = out.filter(item => config.getSearchText(item).toLowerCase().includes(query));
  }

  for (const group of config.filters) {
    const values = state.active[group.id];
    if (!values || values.length === 0) continue;
    out = out.filter(item => values.some(v => group.matches(item, v)));
  }

  const sort = config.sorts.find(s => s.id === state.sortId);
  if (sort) out = [...out].sort(sort.compare);

  return out;
}
