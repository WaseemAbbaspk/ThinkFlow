import { useMemo, useState } from 'react';
import {
  createColumnHelper, flexRender, getCoreRowModel, getFilteredRowModel,
  getSortedRowModel, useReactTable, type SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, Copy, TriangleAlert, CircleCheck } from 'lucide-react';
import { useProject } from '@/state/projectStore';
import { buildMatrix, detectGaps, type Gap, type MatrixRow } from '@/model/traceability';
import { SectionCard } from '@/components/SectionCard';
import { Table, TableHead, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DiagramView } from '@/components/DiagramView';
import { entityIndex } from '@/model/registry';
import type { Project } from '@/model/types';
import { cn } from '@/lib/utils';

function mermaidId(id: string): string {
  return id.replace(/[^A-Za-z0-9_]/g, '_');
}

function mermaidNode(id: string): string {
  return `${mermaidId(id)}["${id}"]`;
}

function buildMermaidChain(project: Project): string {
  const lines: string[] = ['flowchart LR'];
  for (const s of project.requirements.stories) {
    if (s.servesGoalId) {
      const goal = project.goals.find(g => g.id === s.servesGoalId);
      if (goal) lines.push(`  ${mermaidNode(goal.id)} --> ${mermaidNode(s.id)}`);
    }
  }
  for (const c of project.requirements.criteria) {
    lines.push(`  ${mermaidNode(c.storyId)} --> ${mermaidNode(c.id)}`);
  }
  for (const t of project.tasks) {
    for (const ref of t.tracesTo) {
      lines.push(`  ${mermaidNode(ref)} --> ${mermaidNode(t.id)}`);
    }
  }
  for (const test of project.testing.tests) {
    if (test.verifies) {
      lines.push(`  ${mermaidNode(test.verifies)} --> ${mermaidNode(test.id)}`);
    }
  }
  return lines.join('\n');
}

const GAP_KIND_LABEL: Record<Gap['kind'], string> = {
  'untested-criterion': 'Untested criteria',
  'orphan-task': 'Orphan tasks',
  'unrealized-story': 'Unrealized stories',
  'goalless-story': 'Goalless stories',
  'dangling-link': 'Dangling links',
};

function GapPanel({ gaps }: { gaps: Gap[] }) {
  if (gaps.length === 0) {
    return (
      <p className="inline-flex items-center gap-2 font-semibold text-ok">
        <CircleCheck aria-hidden="true" className="size-4" />
        No gaps — every artifact is traced
      </p>
    );
  }
  const byKind = new Map<Gap['kind'], Gap[]>();
  for (const g of gaps) byKind.set(g.kind, [...(byKind.get(g.kind) ?? []), g]);

  return (
    <div className="flex flex-col gap-3">
      {[...byKind.entries()].map(([kind, list]) => (
        <div key={kind} className="rounded-[6px] border border-warn/40 bg-warn-soft/50 p-3">
          <div className="mb-1.5 flex items-center gap-2">
            <TriangleAlert aria-hidden="true" className="size-4 text-warn" />
            <span className="text-[13px] font-semibold text-warn">{GAP_KIND_LABEL[kind]}</span>
            <Badge variant="warn">{list.length}</Badge>
          </div>
          <ul className="m-0 list-disc pl-5 text-[13px]">
            {list.map(g => <li key={`${g.kind}-${g.entityId}-${g.message}`}>{g.message}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}

const columnHelper = createColumnHelper<MatrixRow>();

export function TraceabilityView() {
  const { state, dispatch } = useProject();
  const project = state.project;
  const rows = useMemo(() => buildMatrix(project), [project]);
  const gaps = detectGaps(project);
  const mermaid = buildMermaidChain(project);
  const gappyIds = useMemo(() => new Set(gaps.map(g => g.entityId)), [gaps]);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [filter, setFilter] = useState('');

  const columns = useMemo(
    () => [
      columnHelper.accessor('storyId', { header: 'Story' }),
      columnHelper.accessor(r => r.goalId ?? '—', { id: 'goalId', header: 'Goal' }),
      columnHelper.accessor(r => r.criterionId ?? '—', { id: 'criterionId', header: 'Criterion' }),
      columnHelper.accessor(r => r.taskIds.join(', '), { id: 'taskIds', header: 'Tasks' }),
      columnHelper.accessor(r => r.testIds.join(', '), { id: 'testIds', header: 'Tests' }),
    ],
    [],
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, globalFilter: filter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="traceability-view">
      <SectionCard title="Traceability matrix" count={rows.length}>
        <div className="mb-3 flex flex-col gap-1">
          <Label htmlFor="matrix-filter">Filter rows</Label>
          <Input
            id="matrix-filter"
            className="max-w-64"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>
        <Table>
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(header => (
                  <TableHead key={header.id}>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:text-foreground"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <ArrowUpDown aria-hidden="true" className="size-3 opacity-50" />
                    </button>
                  </TableHead>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => {
              const hasGap =
                gappyIds.has(row.original.storyId) ||
                (row.original.criterionId !== null && gappyIds.has(row.original.criterionId));
              return (
                <tr
                  key={row.id}
                  className={cn('hover:bg-muted', hasGap && 'border-l-2 border-l-warn bg-warn-soft/30')}
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </Table>
      </SectionCard>

      <SectionCard title="Gaps" count={gaps.length}>
        <GapPanel gaps={gaps} />
      </SectionCard>

      <SectionCard title="Traceability chain">
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            aria-label="Copy chain"
            onClick={() => navigator.clipboard?.writeText(mermaid)}
          >
            <Copy aria-hidden="true" />
            Copy
          </Button>
        </div>
        <DiagramView
          source={mermaid}
          label="Traceability chain"
          onNodeClick={id => {
            const target = entityIndex(project).get(id);
            if (target) dispatch({ type: 'SELECT_ENTITY', view: target.view, id: target.id });
          }}
        />
      </SectionCard>
    </div>
  );
}
