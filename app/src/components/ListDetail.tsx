import React, { useState } from 'react';
import { ArrowLeft, ArrowUpDown, ListFilter, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Inspector } from '@/components/Inspector';
import { applyListView, type FilterGroup, type ListViewState, type SortOption } from '@/lib/listView';
import { cn } from '@/lib/utils';

export interface ListDetailProps<T> {
  items: T[];
  getId: (item: T) => string;
  getTitle: (item: T) => string;
  /** Everything the search box should match against, concatenated. */
  getSearchText: (item: T) => string;
  sorts: SortOption<T>[];
  filters?: FilterGroup<T>[];
  renderRow: (item: T) => React.ReactNode;
  renderInspector: (item: T) => React.ReactNode;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAdd: () => void;
  onDelete: (id: string) => void | Promise<void>;
  onDuplicate?: (id: string) => void;
  addLabel: string;
  searchLabel: string;
  emptyMessage: string;
}

export function ListDetail<T>({
  items, getId, getTitle, getSearchText, sorts, filters = [],
  renderRow, renderInspector, selectedId, onSelect,
  onAdd, onDelete, onDuplicate, addLabel, searchLabel, emptyMessage,
}: ListDetailProps<T>) {
  const [view, setView] = useState<ListViewState>({
    query: '', active: {}, sortId: sorts[0]?.id ?? '',
  });

  /* Not memoised on purpose. These lists hold tens of records, and the config
     object is rebuilt each render anyway, so a useMemo here would recompute
     every time while adding a stale-dependency footgun. */
  const visible = applyListView(items, view, { getSearchText, sorts, filters });
  const selected = items.find(item => getId(item) === selectedId) ?? null;
  const activeSort = sorts.find(s => s.id === view.sortId);

  function toggleFilter(groupId: string, value: string) {
    setView(v => {
      const current = v.active[groupId] ?? [];
      return {
        ...v,
        active: {
          ...v.active,
          [groupId]: current.includes(value)
            ? current.filter(x => x !== value)
            : [...current, value],
        },
      };
    });
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 gap-4">
      {/* Below lg the inspector replaces the list instead of sitting beside it. */}
      <div className={cn('flex min-w-0 flex-1 flex-col gap-3', selected && 'hidden lg:flex')}>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-48 flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              aria-label={searchLabel}
              placeholder={`${searchLabel}...`}
              className="h-9 pl-8"
              value={view.query}
              onChange={e => setView(v => ({ ...v, query: e.target.value }))}
            />
          </div>

          {filters.map(group => (
            <DropdownMenu key={group.id}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <ListFilter aria-hidden="true" />
                  {group.label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {group.options.map(o => (
                  <DropdownMenuCheckboxItem
                    key={o.value}
                    checked={(view.active[group.id] ?? []).includes(o.value)}
                    onCheckedChange={() => toggleFilter(group.id, o.value)}
                  >
                    {o.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ))}

          {sorts.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <ArrowUpDown aria-hidden="true" />
                  {activeSort?.label ?? 'Sort'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {sorts.map(s => (
                  <DropdownMenuItem key={s.id} onSelect={() => setView(v => ({ ...v, sortId: s.id }))}>
                    {s.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button size="sm" onClick={onAdd}>
            <Plus aria-hidden="true" />
            {addLabel}
          </Button>
        </div>

        {visible.length === 0 ? (
          <p className="rounded-[8px] border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {visible.map(item => {
              const id = getId(item);
              const active = id === selectedId;
              return (
                <li key={id}>
                  {/* One button per row. Never nest interactive elements in renderRow. */}
                  <button
                    type="button"
                    aria-current={active ? 'true' : undefined}
                    onClick={() => onSelect(id)}
                    className={cn(
                      'w-full rounded-[8px] border p-3 text-left transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                      active ? 'border-primary bg-accent' : 'border-border bg-card hover:bg-muted',
                    )}
                  >
                    {renderRow(item)}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <p className="text-xs text-muted-foreground">
          Showing {visible.length} of {items.length}
        </p>
      </div>

      {selected && (
        <aside aria-label="Details" className="flex min-w-0 flex-1 flex-col lg:max-w-96">
          <Button
            variant="ghost"
            size="sm"
            className="mb-2 self-start lg:hidden"
            onClick={() => onSelect(null)}
          >
            <ArrowLeft aria-hidden="true" />
            Back to list
          </Button>
          <Inspector
            id={getId(selected)}
            title={getTitle(selected)}
            onClose={() => onSelect(null)}
            onDelete={() => onDelete(getId(selected))}
            onDuplicate={onDuplicate ? () => onDuplicate(getId(selected)) : undefined}
          >
            {renderInspector(selected)}
          </Inspector>
        </aside>
      )}
    </div>
  );
}
