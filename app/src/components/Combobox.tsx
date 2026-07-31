import { useId, useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';

export interface ComboboxOption { value: string; label: string; }

export interface ComboboxProps {
  label: string;
  value: string | string[];
  options: ComboboxOption[];
  multiple?: boolean;
  onChange: (value: string | string[]) => void;
}

export function Combobox({ label, value, options, multiple, onChange }: ComboboxProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const selected = multiple ? (value as string[]) : value ? [value as string] : [];

  function toggle(next: string) {
    if (!multiple) {
      onChange(next);
      setOpen(false);
      return;
    }
    onChange(selected.includes(next) ? selected.filter(v => v !== next) : [...selected, next]);
  }

  const triggerText = selected.length
    ? multiple
      ? `${selected.length} selected`
      : (options.find(o => o.value === selected[0])?.label ?? selected[0])
    : 'None';

  return (
    <div className="mb-3 flex flex-col gap-1">
      <Label htmlFor={id}>{label}</Label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'flex w-full items-center justify-between rounded-[6px] border border-input bg-card',
              'px-3 py-1.5 text-left text-sm text-foreground',
              'focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-accent',
              !selected.length && 'text-muted-foreground',
            )}
          >
            {triggerText}
            <ChevronsUpDown aria-hidden="true" className="size-4 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>

        <PopoverContent>
          <Command>
            <CommandInput placeholder={`Search ${label.toLowerCase()}...`} />
            <CommandList>
              <CommandEmpty>No matches.</CommandEmpty>
              {options.map(o => (
                <CommandItem key={o.value} value={o.label} onSelect={() => toggle(o.value)}>
                  <Check
                    aria-hidden="true"
                    className={cn('size-4', !selected.includes(o.value) && 'opacity-0')}
                  />
                  {o.label}
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Chips live outside the trigger: a button inside a button is invalid HTML.
          The label is `Remove <value>`, never a bare `Remove` — that would collide
          with RepeatableList's remove button in every stage form. */}
      {multiple && selected.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {selected.map(v => (
            <Badge key={v} className="gap-1 pr-1">
              {v}
              <button
                type="button"
                aria-label={`Remove ${v}`}
                onClick={() => onChange(selected.filter(s => s !== v))}
                className="rounded-[3px] hover:text-warn"
              >
                <X aria-hidden="true" className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
