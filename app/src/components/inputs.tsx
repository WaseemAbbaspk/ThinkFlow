import React, { useId } from 'react';

export interface TextFieldProps { label: string; value: string; onChange: (value: string) => void; }
export function TextField({ label, value, onChange }: TextFieldProps) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} type="text" value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

export interface TextAreaProps { label: string; value: string; onChange: (value: string) => void; }
export function TextArea({ label, value, onChange }: TextAreaProps) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <textarea id={id} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

export interface SelectOption { value: string; label: string; }
export interface SelectFieldProps {
  label: string; value: string; options: SelectOption[]; onChange: (value: string) => void;
}
export function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
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
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} multiple={multiple} value={value} onChange={handleChange}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export interface RepeatableListProps<T> {
  items: T[]; onAdd: () => void; renderItem: (item: T, index: number) => React.ReactNode;
  onRemove: (index: number) => void; addLabel: string;
}
export function RepeatableList<T>({ items, onAdd, renderItem, onRemove, addLabel }: RepeatableListProps<T>) {
  return (
    <div className="repeatable-list">
      {items.map((item, i) => (
        <div className="repeatable-list-item" key={i}>
          {renderItem(item, i)}
          <button type="button" onClick={() => onRemove(i)}>Remove</button>
        </div>
      ))}
      <button type="button" onClick={onAdd}>{addLabel}</button>
    </div>
  );
}
