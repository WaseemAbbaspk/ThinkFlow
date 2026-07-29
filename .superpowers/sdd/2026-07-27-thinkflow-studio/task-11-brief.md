# Task 11 brief — Shared input components

Full task text from the plan (`docs/superpowers/plans/2026-07-27-thinkflow-studio.md`, "Task 11: Shared input components"):

**Files:**
- Create: `app/src/components/inputs.tsx`
- Test: `app/src/components/inputs.test.tsx`

**Interfaces — Produces:**
- `TextField({ label, value, onChange })`, `TextArea({ label, value, onChange })`
- `SelectField({ label, value, options, onChange })` where `options: {value:string;label:string}[]`
- `LinkSelect({ label, value, options, onChange, multiple })` — value `string|string[]`
- `RepeatableList({ items, onAdd, renderItem, onRemove, addLabel })`

**Step 1: Write the failing test (`inputs.test.tsx`)** — use this exact test:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextField, RepeatableList } from './inputs';

describe('inputs', () => {
  it('TextField calls onChange with typed value', async () => {
    const onChange = vi.fn();
    render(<TextField label="Name" value="" onChange={onChange} />);
    await userEvent.type(screen.getByLabelText('Name'), 'Hi');
    expect(onChange).toHaveBeenCalled();
  });
  it('RepeatableList renders add button and items', async () => {
    const onAdd = vi.fn();
    render(<RepeatableList items={[1]} addLabel="Add row" onAdd={onAdd}
      renderItem={(n) => <span>item {n}</span>} onRemove={() => {}} />);
    expect(screen.getByText('item 1')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Add row'));
    expect(onAdd).toHaveBeenCalled();
  });
});
```

**Step 2: Run, expect FAIL.**

**Step 3: Implement `inputs.tsx`** — Write `TextField`/`TextArea`/`SelectField` as controlled
inputs wired to a `<label>` (use `htmlFor`/`id` so `getByLabelText` works). `LinkSelect` is a
`<select>` (with `multiple` when the prop is set) mapping selected `<option>`s to the `onChange`
value. `RepeatableList<T>` renders `items.map(renderItem)` each with a "Remove" button calling
`onRemove(index)`, and an "add" button calling `onAdd`. Keep them presentational (no store access).

**Step 4: Run, expect PASS.**

**Step 5: Commit** — `git commit -m "Add shared form input components"`

## CRITICAL ENVIRONMENT — read carefully

This Windows machine's IT policy BLOCKS execution of npm-installed native binaries (vitest.exe →
"Access is denied"). `node` runs but `npx vitest` natively does NOT. **You MUST run all tests in
Docker.** `node_modules` is already installed (Linux binaries) — do NOT run `npm install`.

Run the full suite (from a bash-capable shell / the Bash tool):
```
MSYS_NO_PATHCONV=1 docker run --rm -v /c/Users/waseem.abbas/ThinkFlow/app:/app -w /app node:20-bookworm npx vitest run
```
For a focused run append the file path, e.g. `... npx vitest run src/components/inputs.test.tsx`.
Each run takes ~30s. Run the focused test while iterating; run the FULL suite once before committing.
Current baseline: 45 tests passing across 10 files — your commit must keep all green.

## Standing rules
- Work from `C:\Users\waseem.abbas\ThinkFlow`. Only touch the two Task 11 files.
- Commits must NOT add any Claude/Claude Code co-author or attribution trailer.
- Write your full report to `.superpowers/sdd/2026-07-27-thinkflow-studio/task-11-report.md`
  with TDD evidence (RED command+output, GREEN command+output), files changed, self-review.
