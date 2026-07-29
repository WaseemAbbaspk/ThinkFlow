# Task 14 report — Architecture stage form

## Summary
Implemented `app/src/stages/ArchitectureForm.tsx` and its test
`app/src/stages/ArchitectureForm.test.tsx` covering every field under
`project.architecture`: `overview`, `contextDiagram`, `componentDiagram`,
`components[]` (name/responsibility/adrIds multi-LinkSelect), `keyFlows[]`
(name/description), `nfrConsiderations[]` (concern/approach), and full ADR
editing (title/status/date/deciders/relatesTo multi-LinkSelect/context/
decision/rationale/options[]/consequencesPositive/consequencesTradeoffs/
followUps). ADRs are added via the dedicated `ADD_ADR` action; every other
mutation (including the nested ADR `options[]` list) goes through
`REPLACE_PROJECT` via a `replace()` / `replaceArch()` helper pair, matching
the pattern established in `RequirementsForm.tsx`. The store
(`app/src/state/projectStore.tsx`) was not touched.

## TDD evidence

### RED
Command:
```
MSYS_NO_PATHCONV=1 docker run --rm -v /c/Users/waseem.abbas/ThinkFlow/app:/app -w /app node:20-bookworm npx vitest run src/stages/ArchitectureForm.test.tsx
```
Output (abridged):
```
 FAIL  src/stages/ArchitectureForm.test.tsx [ src/stages/ArchitectureForm.test.tsx ]
Error: Failed to resolve import "./ArchitectureForm" from "src/stages/ArchitectureForm.test.tsx". Does the file exist?
...
 Test Files  1 failed (1)
      Tests  no tests
```
Confirms the test was written first and fails because `ArchitectureForm.tsx` did not yet exist.

### GREEN (focused)
Same command, after implementing `ArchitectureForm.tsx`:
```
 RUN  v2.1.9 /app

 ✓ src/stages/ArchitectureForm.test.tsx (1 test) 176ms

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
 Test Files  14 passed (14)
      Tests  51 passed (51)
```
Baseline was 50 passing across 13 files; now 51 across 14 files (13 pre-existing + this task's new file). Output pristine, no warnings other than npm's routine version-upgrade notice.

## Files changed
- `app/src/stages/ArchitectureForm.tsx` (new, 294 lines)
- `app/src/stages/ArchitectureForm.test.tsx` (new, 11 lines — exact brief test, no describe wrapper needed since the bare `it` runs fine)

Commit: `273ed9e` — "Add Architecture stage form" (no co-author/attribution trailer). `git show --stat HEAD` confirms only these two files changed; the store was not modified.

## Implementation notes
- `replace()` / `replaceArch()` helpers mirror `RequirementsForm.tsx` exactly (rebuild `project.architecture` immutably, dispatch `REPLACE_PROJECT`).
- ADR add: `dispatch({ type: 'ADD_ADR' })` — store mints `ADR-1`, `ADR-2`, ... and renders the id as `<div>{adr.id}</div>` text, matching the test's `getByText(/ADR-1/)`.
- ADR remove and all field edits (including nested `options[]` add/edit/remove) go through `replaceArch({ adrs: architecture.adrs.map(a => a.id === adr.id ? {...} : a) })`.
- Component `adrIds`: `LinkSelect multiple` sourced from `architecture.adrs.map(a => ({ value: a.id, label: a.title || a.id }))`.
- ADR `relatesTo`: `LinkSelect multiple` sourced from the union of `requirements.stories`, `requirements.criteria`, `requirements.nfrs` ids, each `{ value: id, label: id }`.
- `options[]` nested RepeatableList keyed by `oi` index within each ADR's own `renderItem` closure; add/remove/edit all rebuild the specific ADR's `options` array immutably before rebuilding the full `adrs` array.
- 2-space indent, function components, no new dependencies; matches repo style used in `RequirementsForm.tsx`.

## Self-review
- Verified `git show --stat HEAD` touched only the two intended files — store untouched.
- Verified every field listed in the brief has a corresponding input (TextField/TextArea/SelectField/LinkSelect) and every repeatable section (components, keyFlows, nfrConsiderations, adrs, adr.options) has add/remove wired.
- Verified ADR status uses `AdrStatus` union via `SelectField` with the four required options (Proposed/Accepted/Superseded/Deprecated).
- Verified LinkSelect multiple usage matches the documented contract (`value: string[]`, `onChange(string[])`) with an `as string[]` cast on the union `onChange` param, consistent with how `RequirementsForm.tsx` casts `UPDATE_STORY` patch values.
- Full suite run once at the end, all 51 tests green, no flakiness observed.

## Concerns
None. No store changes were needed; `ADD_ADR` plus `REPLACE_PROJECT` covered every required mutation including the nested `options[]` list.
