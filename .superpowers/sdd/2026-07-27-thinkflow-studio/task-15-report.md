# Task 15 report — Tasks stage form

## Summary

Implemented `TasksForm.tsx`, the fourth stage form, rendering a repeatable list of
`Task` items with all fields from the brief. Used the existing `ADD_TASK` / `UPDATE_TASK`
/ `DELETE_TASK` store actions exclusively; the store (`app/src/state/projectStore.tsx`)
was not modified.

## Files changed

- `app/src/stages/TasksForm.tsx` (new)
- `app/src/stages/TasksForm.test.tsx` (new)

## TDD evidence

### RED

Command:
```
MSYS_NO_PATHCONV=1 docker run --rm -v /c/Users/waseem.abbas/ThinkFlow/app:/app -w /app node:20-bookworm npx vitest run src/stages/TasksForm.test.tsx
```

Output (abridged):
```
 FAIL  src/stages/TasksForm.test.tsx [ src/stages/TasksForm.test.tsx ]
Error: Failed to resolve import "./TasksForm" from "src/stages/TasksForm.test.tsx". Does the file exist?
...
 Test Files  1 failed (1)
      Tests  no tests
```
Confirmed failing as expected (module didn't exist yet).

### GREEN (focused)

Same command after implementing `TasksForm.tsx`:
```
 ✓ src/stages/TasksForm.test.tsx (1 test) 167ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
```

### GREEN (full suite)

Command:
```
MSYS_NO_PATHCONV=1 docker run --rm -v /c/Users/waseem.abbas/ThinkFlow/app:/app -w /app node:20-bookworm npx vitest run
```

Output:
```
 Test Files  15 passed (15)
      Tests  52 passed (52)
```
All 14 prior test files plus the new `TasksForm.test.tsx` pass. Baseline 51 + 1 new = 52, matches expectation. Output pristine (no warnings/errors besides unrelated npm update notice).

## Implementation notes

- `title` — `TextField`, updated via `UPDATE_TASK` patch `{ title }`.
- `tracesTo` — `LinkSelect` with `multiple`, options = union of `requirements.stories`
  (`{ value: id, label: id }`) and `requirements.criteria` (`{ value: id, label: id }`).
  Patch `{ tracesTo: string[] }`.
- `dependsOn` — `LinkSelect` with `multiple`, options = other tasks
  (`tasks.filter(t => t.id !== task.id).map(t => ({ value: t.id, label: t.title || t.id }))`).
  Patch `{ dependsOn: string[] }`.
- `goal`, `contextForAgent`, `outOfScope` — `TextArea`s, each patched independently.
- `acceptance[]` — nested `RepeatableList<string>` of `TextField`s; add appends `''`,
  remove filters by index, edit maps by index — all dispatched as
  `UPDATE_TASK` with a recomputed `acceptance` array (never touches the store).
- `status` — `SelectField` with options `Todo / In progress / In review / Done`
  (matches `TaskStatus` union exactly).
- Per-task `Remove` — handled by the outer `RepeatableList`'s `onRemove`, which
  dispatches `DELETE_TASK` with the task's id.
- "Add task" — outer `RepeatableList`'s `onAdd` dispatches `ADD_TASK`; the reducer
  mints `TASK-1` and the item's `id` is rendered as a `<div>{task.id}</div>`, matching
  the `RequirementsForm.tsx` style (id shown as plain text) and satisfying
  `getByText(/TASK-1/)`.

Style matches `RequirementsForm.tsx`: 2-space indent, `section`/`h3`/`h4` structure,
concise dispatch calls, strict TS (no `any`; casts limited to narrowing `string | string[]`
from `LinkSelect`'s generic `onChange` signature into the precise `Task` field types).

## Self-review

- Confirmed no edits to `app/src/state/projectStore.tsx` or any other file — `git status`
  before commit showed only the two new files staged.
- Every field edit dispatches `UPDATE_TASK`; no direct project/tasks array mutation,
  no `REPLACE_PROJECT` used for tasks.
- `tracesTo` and `dependsOn` option sources match the brief's exact spec.
- Verified via the passing test that `ADD_TASK` mints and renders `TASK-1` as text.
- Full 52-test suite green with no flakiness or stray console output.

## Concerns

None. The task was self-contained; store shapes and existing components covered every
requirement without needing store changes or NEEDS_CONTEXT.
