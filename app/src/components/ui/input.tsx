import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-9 w-full rounded-[6px] border border-input bg-card px-3 py-1 text-sm text-foreground',
        'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring',
        'focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
