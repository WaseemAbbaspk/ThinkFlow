# Task 16 report — Testing stage form

## Summary
Implemented `TestingForm` (last of the five stage forms) covering `state.project.testing`:
`entryCriteria` / `exitCriteria` as TextAreas (edited via `REPLACE_PROJECT`, mirroring the
`replaceTesting` helper pattern from `RequirementsForm.tsx`), and a `tests` `RepeatableList`
where each test edits `description` (TextField), `verifies` (single `LinkSelect` of AC ids —
the core test→criterion link, with a blank `'—'` option to allow unlinking), `level`
(SelectField: Unit/Integration/E2E/Non-functional), and `status` (SelectField:
Pass/Fail/Not run). Add/Remove use the dedicated `ADD_TEST` / `DELETE_TEST` actions; field
edits use `UPDATE_TEST`. No store changes were needed or made — `ADD_TEST`, `UPDATE_TEST`,
`DELETE_TEST`, and `REPLACE_PROJECT` already existed exactly as documented in the brief.

## Files changed
- `app/src/stages/TestingForm.tsx` (new)
- `app/src/stages/TestingForm.test.tsx` (new)

Only these two files were touched. The store (`app/src/state/projectStore.tsx`) was read-only
reference material and was not edited.

## TDD evidence

### RED
Wrote `TestingForm.test.tsx` exactly as specified in the brief (wrapped in
`describe('TestingForm', ...)`). Ran:

```
MSYS_NO_PATHCONV=1 docker run --rm -v /c/Users/waseem.abbas/ThinkFlow/app:/app -w /app node:20-bookworm npx vitest run src/stages/TestingForm.test.tsx
```

Result: FAIL as expected — `Error: Failed to resolve import "./TestingForm" from
"src/stages/TestingForm.test.tsx". Does the file exist?` (0 tests collected, 1 failed suite).

### GREEN
Implemented `TestingForm.tsx`. Ran the same focused command:

```
MSYS_NO_PATHCONV=1 docker run --rm -v /c/Users/waseem.abbas/ThinkFlow/app:/app -w /app node:20-bookworm npx vitest run src/stages/TestingForm.test.tsx
```

Result: PASS — `Test Files 1 passed (1)`, `Tests 1 passed (1)`.

### Full suite
Ran the full suite (no trailing path):

```
MSYS_NO_PATHCONV=1 docker run --rm -v /c/Users/waseem.abbas/ThinkFlow/app:/app -w /app node:20-bookworm npx vitest run
```

Result: `Test Files  16 passed (16)`, `Tests  53 passed (53)` — baseline 52 + 1 new = 53, all
green, output pristine (no warnings/errors beyond the standard npm "new version available"
notice from the base image).

## Self-review
- Matches `TasksForm.tsx` / `RequirementsForm.tsx` style: 2-space indent, functional component,
  `useProject()` for state/dispatch, `RepeatableList<T>` generic usage, options arrays built
  inline from `requirements.criteria`.
- `replaceTesting` helper follows the exact pattern given in the brief (and mirrored from
  `RequirementsForm.tsx`'s `replaceRequirements`).
- `verifies` LinkSelect is single-select (no `multiple` prop) so `onChange` receives a
  `string`, matching `Test.verifies: string`.
- Minted `TEST-n` id renders as plain text (`<div>{test.id}</div>`) inside each repeatable
  item, same convention as `TasksForm`/`RequirementsForm`, satisfying `getByText(/TEST-1/)`.
- Enum casts (`as TestLevel`, `as TestStatus`, `as string` for `verifies`) mirror the casting
  style already used in `TasksForm.tsx` for `TaskStatus`.
- Per-test Remove is provided automatically by `RepeatableList`'s built-in "Remove" button,
  wired to `DELETE_TEST` via `onRemove`.
- No lint/build step was run beyond vitest (consistent with prior stage-form tasks in this
  series); TypeScript compiles as part of Vite's transform during the vitest run with no
  errors reported.

## Concerns
None. Store was not touched; all required actions already existed as documented. Full suite
is green at 53/53 with pristine output.
