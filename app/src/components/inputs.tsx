import React, { useId } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/* Radix Select has no multiple-selection mode, and the stage forms are driven in tests via
   userEvent.selectOptions(getByLabelText(...)). Both need native <select> semantics, so these
   stay native elements and are styled to match the shadcn inputs. */
const selectClass = cn(
  'flex w-full rounded-[6px] border border-input bg-card px-3 py-1.5 text-sm text-foreground',
  'focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-accent',
);

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 flex flex-col gap-1">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

export interface TextFieldProps { label: string; value: string; onChange: (value: string) => void; }
export function TextField({ label, value, onChange }: TextFieldProps) {
  const id = useId();
  return (
    <Field id={id} label={label}>
      <Input id={id} type="text" value={value} onChange={e => onChange(e.target.value)} />
    </Field>
  );
}

export interface TextAreaProps { label: string; value: string; onChange: (value: string) => void; }
export function TextArea({ label, value, onChange }: TextAreaProps) {
  const id = useId();
  return (
    <Field id={id} label={label}>
      <Textarea id={id} value={value} onChange={e => onChange(e.target.value)} />
    </Field>
  );
}

export interface SelectOption { value: string; label: string; }
export interface SelectFieldProps {
  label: string; value: string; options: SelectOption[]; onChange: (value: string) => void;
}
export function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  const id = useId();
  return (
    <Field id={id} label={label}>
      <select id={id} className={selectClass} value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  );
}

export interface LinkSelectProps {
  label: string; value: string | string[]; options: SelectOption[];
  onChange: (value: string | string[]) => void; multiple?: boolean;
}
export function LinkSelect({ label, value, options, onChange, multiple }: LinkSelectProps) {
  const id = useId();
  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (multiple) {
      onChange(Array.from(e.target.selectedOptions).map(o => o.value));
    } else {
      onChange(e.target.value);
    }
  }
  return (
    <Field id={id} label={label}>
      <select
        id={id}
        multiple={multiple}
        className={cn(selectClass, multiple && 'min-h-24')}
        value={value}
        onChange={handleChange}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  );
}

export interface RepeatableListProps<T> {
  items: T[]; onAdd: () => void; renderItem: (item: T, index: number) => React.ReactNode;
  onRemove: (index: number) => void; addLabel: string;
}
export function RepeatableList<T>({ items, onAdd, renderItem, onRemove, addLabel }: RepeatableListProps<T>) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <Card key={i} className="p-4">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">{renderItem(item, i)}</div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Remove"
              className="text-muted-foreground hover:text-warn"
              onClick={() => onRemove(i)}
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </div>
        </Card>
      ))}
      <Button variant="secondary" size="sm" className="self-start" onClick={onAdd}>
        <Plus aria-hidden="true" />
        {addLabel}
      </Button>
    </div>
  );
}
