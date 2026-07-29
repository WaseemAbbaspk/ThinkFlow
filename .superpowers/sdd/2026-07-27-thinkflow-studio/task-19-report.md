# Task 19 report — Sidebar navigation with gap markers

## Summary

Implemented `app/src/components/Sidebar.tsx`, a nav component with 7 buttons (one per `View`:
vision/requirements/architecture/tasks/testing/traceability/export), dispatching `SET_VIEW`,
marking the active view, and showing a `⚠` marker on stages that own open gaps per
`detectGaps(project)`.

## Files changed

- `app/src/components/Sidebar.test.tsx` (new) — exact test from the brief.
- `app/src/components/Sidebar.tsx` (new) — the component.

No other files touched; store and `traceability.ts` untouched.

## Implementation notes

- `NAV_ITEMS: { view: View; label: string }[]` — the 7 views with their exact button labels.
- `GAP_KIND_TO_VIEWS: Record<Gap['kind'], View[]>` — lookup table implementing the brief's mapping:
  - `untested-criterion`, `goalless-story`, `unrealized-story` → `['requirements', 'testing']`
  - `orphan-task`, `dangling-link` → `['tasks']`
- `gappyViews = new Set<View>(gaps.flatMap(g => GAP_KIND_TO_VIEWS[g.kind]))` computed once per render
  from `detectGaps(state.project)`.
- Active view: `className={active ? 'active' : undefined}` plus `aria-current={active ? 'page' : undefined}`.
- `SET_VIEW` dispatched via `dispatch({ type: 'SET_VIEW', view })` on each button's `onClick`.
- Gap marker rendered as `<span aria-hidden="true"> ⚠</span>` appended after the label text, inside
  the `<button>` but outside the accessible name computation (aria-hidden), so
  `getByRole('button', { name: /Tasks/i })` etc. resolve uniquely to "Tasks" even when the ⚠ is present.

## TDD evidence

### RED

Command:
```
MSYS_NO_PATHCONV=1 docker run --rm -v /c/Users/waseem.abbas/ThinkFlow/app:/app -w /app node:20-bookworm npx vitest run src/components/Sidebar.test.tsx
```
Output (abridged):
```
 FAIL  src/components/Sidebar.test.tsx [ src/components/Sidebar.test.tsx ]
Error: Failed to resolve import "./Sidebar" from "src/components/Sidebar.test.tsx". Does the file exist?
...
 Test Files  1 failed (1)
      Tests  no tests
```

### GREEN (focused)

Same command, after implementing `Sidebar.tsx`:
```
 ✓ src/components/Sidebar.test.tsx (1 test) 173ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
```

### GREEN (full suite)

Command:
```
MSYS_NO_PATHCONV=1 docker run --rm -v /c/Users/waseem.abbas/ThinkFlow/app:/app -w /app node:20-bookworm npx vitest run
```
Output (summary):
```
 Test Files  19 passed (19)
      Tests  59 passed (59)
```
All 18 baseline files + Sidebar.test.tsx pass; baseline 58 + 1 new = 59. Output pristine, no warnings
beyond the standard npm-version notice.

## Commit

```
216d5ae Add sidebar navigation with gap markers
```
Verified via `git show -s --format='%H%n%s%n%b' HEAD` — subject only, no body, no co-author/attribution
trailer.

## Self-review

- Labels match the brief exactly: Vision, Requirements, Architecture, Tasks, Testing, Traceability, Export.
- `View` union used directly from `projectStore.tsx` (`vision|requirements|architecture|tasks|testing|traceability|export`) — no hardcoded duplicate type.
- Gap-kind → stage mapping matches the brief's table exactly; implemented as a `Record<Gap['kind'], View[]>` lookup as suggested.
- ⚠ marker kept out of the accessible name via `aria-hidden="true"` span — verified indirectly by the
  passing test, which relies on unambiguous `getByRole` name matches (e.g. `/Tasks/i` doesn't collide
  with the `⚠` text since it's aria-hidden and not part of the computed accessible name).
- Active state exposed both via `className="active"` (for CSS) and `aria-current="page"` (for
  accessibility/testability) — belt and suspenders, doesn't conflict with existing repo conventions
  (checked `ExportPanel.tsx`, `TraceabilityView.tsx` for style; both are plain functional components
  with 2-space indent and no className-based active-state precedent, so this is a reasonable convention
  set by this component).
- Only the two Task 19 files were created/modified; store and traceability model untouched.
- No `npm install` run; Docker image `node:20-bookworm` used per the brief with existing `node_modules`.

## Concerns

None. The Sidebar is not yet wired into a parent App/layout component (that's presumably a later
task per the plan) — this task's scope was limited to the component itself per the brief's file list.
