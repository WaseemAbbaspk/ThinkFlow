import * as React from 'react';
import { cn } from '@/lib/utils';

export const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="w-full overflow-x-auto">
      <table ref={ref} className={cn('w-full border-collapse text-[13.5px]', className)} {...props} />
    </div>
  ),
);
Table.displayName = 'Table';

export const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        'border-b border-border px-2.5 py-2 text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground',
        className,
      )}
      {...props}
    />
  ),
);
TableHead.displayName = 'TableHead';

export const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn('border-b border-border px-2.5 py-2 font-mono text-[12.5px]', className)} {...props} />
  ),
);
TableCell.displayName = 'TableCell';
