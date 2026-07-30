import * as React from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn('flex w-full flex-col overflow-hidden rounded-[6px] bg-card text-foreground', className)}
    {...props}
  />
));
Command.displayName = 'Command';

export const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center gap-2 border-b border-border px-3">
    <Search aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        'h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground',
        className,
      )}
      {...props}
    />
  </div>
));
CommandInput.displayName = 'CommandInput';

export const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn('max-h-72 overflow-y-auto overflow-x-hidden p-1', className)}
    {...props}
  />
));
CommandList.displayName = 'CommandList';

export const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty ref={ref} className="py-6 text-center text-sm text-muted-foreground" {...props} />
));
CommandEmpty.displayName = 'CommandEmpty';

export const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      'overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5',
      '[&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold',
      '[&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide',
      '[&_[cmdk-group-heading]]:text-muted-foreground',
      className,
    )}
    {...props}
  />
));
CommandGroup.displayName = 'CommandGroup';

export const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center gap-2 rounded-[6px] px-2 py-1.5 text-sm outline-none',
      'data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground',
      className,
    )}
    {...props}
  />
));
CommandItem.displayName = 'CommandItem';

export const CommandSeparator = CommandPrimitive.Separator;
