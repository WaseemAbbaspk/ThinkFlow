import { TextField, RepeatableList } from '@/components/inputs';

/**
 * An inline editor for a bare `string[]`.
 *
 * Collections whose members have no id — requirements assumptions/constraints/non-goals,
 * vision non-goals — cannot go in a ListDetail: they are addressed by array position, so
 * sorting or filtering the list would make every edit land on the wrong entry.
 */
export function StringList({ label, addLabel, items, onChange }: {
  label: string; addLabel: string; items: string[]; onChange: (next: string[]) => void;
}) {
  return (
    <RepeatableList<string>
      items={items}
      addLabel={addLabel}
      onAdd={() => onChange([...items, ''])}
      onRemove={i => onChange(items.filter((_, idx) => idx !== i))}
      renderItem={(item, i) => (
        <TextField
          label={label}
          value={item}
          onChange={v => onChange(items.map((x, idx) => (idx === i ? v : x)))}
        />
      )}
    />
  );
}
