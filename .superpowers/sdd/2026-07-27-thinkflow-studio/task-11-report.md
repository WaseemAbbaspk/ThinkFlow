# Task 11 report — Shared input components

## Summary

Implemented `app/src/components/inputs.tsx` with the five presentational, framework-only form
components required by the brief: `TextField`, `TextArea`, `SelectField`, `LinkSelect`, and
generic `RepeatableList<T>`. None of them import from `state/` or access the store — they are
pure controlled components. Labels are wired to inputs via `useId()` + `htmlFor`/`id` so
`getByLabelText` resolves correctly.

## TDD evidence

### RED — write failing test, run in Docker

Command:
```
MSYS_NO_PATHCONV=1 docker run --rm -v /c/Users/waseem.abbas/ThinkFlow/app:/app -w /app node:20-bookworm npx vitest run src/components/inputs.test.tsx
```

Output (relevant excerpt):
```
 ❯ src/components/inputs.test.tsx (0 test)

⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/components/inputs.test.tsx [ src/components/inputs.test.tsx ]
Error: Failed to resolve import "./inputs" from "src/components/inputs.test.tsx". Does the file exist?
...
 Test Files  1 failed (1)
      Tests  no tests
```

Confirmed the test fails for the expected reason: `inputs.tsx` doesn't exist yet.

### GREEN — implement `inputs.tsx`, run focused test in Docker

Command:
```
MSYS_NO_PATHCONV=1 docker run --rm -v /c/Users/waseem.abbas/ThinkFlow/app:/app -w /app node:20-bookworm npx vitest run src/components/inputs.test.tsx
```

Output:
```
 RUN  v2.1.9 /app

 ✓ src/components/inputs.test.tsx (2 tests) 143ms

 Test Files  1 passed (1)
      Tests  2 passed (2)
```

### Full suite — run once before commit

Command:
```
MSYS_NO_PATHCONV=1 docker run --rm -v /c/Users/waseem.abbas/ThinkFlow/app:/app -w /app node:20-bookworm npx vitest run
```

Output:
```
 RUN  v2.1.9 /app

 ✓ src/export/project.test.ts (3 tests) 7ms
 ✓ src/export/markdown.test.ts (3 tests) 10ms
 ✓ src/state/projectStore.test.tsx (17 tests) 20ms
 ✓ src/model/ids.test.ts (3 tests) 10ms
 ✓ src/state/persistence.test.ts (4 tests) 16ms
 ✓ src/components/inputs.test.tsx (2 tests) 244ms
 ✓ src/model/traceability.test.ts (9 tests) 15ms
 ✓ src/export/zip.test.ts (1 test) 11ms
 ✓ src/model/types.test.ts (1 test) 6ms
 ✓ src/model/migrate.test.ts (3 tests) 6ms
 ✓ src/smoke.test.ts (1 test) 4ms

 Test Files  11 passed (11)
      Tests  47 passed (47)
```

47/47 tests passing (45 existing + 2 new), output pristine (only an unrelated npm
version-upgrade notice appended by the Docker image, no test warnings/errors).

## Files changed

- `app/src/components/inputs.tsx` (new) — `TextField`, `TextArea`, `SelectField`, `LinkSelect`,
  `RepeatableList<T>` plus their prop interfaces (`TextFieldProps`, `TextAreaProps`,
  `SelectOption`, `SelectFieldProps`, `LinkSelectProps`, `RepeatableListProps<T>`).
- `app/src/components/inputs.test.tsx` (new) — the exact test from the brief.

## Implementation notes

- `TextField`/`TextArea`/`SelectField` use `React.useId()` to generate a stable, unique
  `id`/`htmlFor` pair per instance (SSR-safe, no collisions across multiple instances of the
  same field on one page).
- `LinkSelect` renders a `<select multiple={multiple}>`; on change it branches — if `multiple`
  is set, it maps `Array.from(e.target.selectedOptions)` to a `string[]`, otherwise it passes
  the single `e.target.value` string. `value` prop accepts `string | string[]` to match.
- `RepeatableList<T>` keeps the generic type parameter and renders `items.map(renderItem)`,
  each wrapped with a "Remove" button calling `onRemove(index)`, plus a trailing button labeled
  `addLabel` calling `onAdd()`.
- Style matches `app/src/state/projectStore.tsx`: 2-space indent, concise inline JSX, no
  unnecessary blank lines, `export interface` + `export function` pattern.
- No imports from `state/` anywhere in `inputs.tsx` — verified by inspection; components are
  purely presentational (controlled via props only).

## Self-review findings

- Confirmed via `git status`/`git diff` that only the two intended files were touched.
- Confirmed no `state/` imports and no store/context usage in `inputs.tsx`.
- Confirmed labels use `htmlFor`/`id` so `getByLabelText` works (proven by the passing
  `TextField` test using `screen.getByLabelText('Name')`).
- Confirmed `RepeatableList` generic typing (`<T>`) is preserved rather than hardcoded to a
  specific item type, satisfying reusability for later Vision/Requirements/etc. form tasks.
- No concerns found; nothing else needed changing.

## Concerns

None. All 47 tests pass, commit is clean, no attribution trailer was added per the hard rule.
