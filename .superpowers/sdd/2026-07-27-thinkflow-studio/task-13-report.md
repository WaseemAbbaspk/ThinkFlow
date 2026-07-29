# Task 13 report — Requirements stage form

## Status: DONE

## Commit
`d76f5571` — "Add Requirements stage form" (no Claude co-author/attribution trailer, per hard rule)

## Files changed
- Created `app/src/stages/RequirementsForm.test.tsx` (exact test from brief, unmodified)
- Created `app/src/stages/RequirementsForm.tsx`
- `app/src/state/projectStore.tsx` — **not touched** (confirmed via `git status --porcelain` before commit: only the two new files were staged)

## What was implemented

`RequirementsForm` renders all sections/fields called out in the brief:

- **Goals** — `RepeatableList<Goal>` over `project.goals`; Add → `ADD_GOAL` (mints id, store-side); each item shows its id and editable `text`/`metric` via `TextField`; Remove filters the array and dispatches `REPLACE_PROJECT` (no `DELETE_GOAL`/`UPDATE_GOAL` exists).
- **Stories** — `RepeatableList<UserStory>` over `requirements.stories`; Add → `ADD_STORY`; each item shows its id and editable `role`/`want`/`benefit` (`TextField`), `priority` (`SelectField` with Must/Should/Could), `servesGoalId` (`LinkSelect`, single, options built from `project.goals`); Remove → `DELETE_STORY` (cascades in the reducer).
  - Nested **Criteria** — `RepeatableList<Criterion>` filtered to `c.storyId === story.id`; Add → `ADD_CRITERION({storyId})`; each shows its id and editable `text`; Remove → `DELETE_CRITERION` (looked up by filtered-list index into the id, then dispatched by id — cascades in the reducer).
- **NFRs** — `RepeatableList<Nfr>` over `requirements.nfrs`; Add → `ADD_NFR`; each shows id, editable `name`/`target`; Remove filters and dispatches `REPLACE_PROJECT` (no `DELETE_NFR`/`UPDATE_NFR` exists).
- **assumptions / constraints / nonGoals** — three separate `RepeatableList<string>` sections over `requirements.{assumptions,constraints,nonGoals}`; add/edit/remove all via `REPLACE_PROJECT` with an immutably rebuilt array (mirrors `VisionForm`'s pattern for `vision.nonGoals`).
- **signoff** — two `TextField`s (`by`, `date`) reading/writing `requirements.signoff` (nullable `{by,date}`), defaulting to `''` when null, always writing a full `{by,date}` object via `REPLACE_PROJECT`.

Two small helpers keep dispatch calls terse:
```ts
function replace(patch: Partial<typeof project>) {
  dispatch({ type: 'REPLACE_PROJECT', project: { ...project, ...patch } });
}
function replaceRequirements(patch: Partial<typeof requirements>) {
  replace({ requirements: { ...requirements, ...patch } });
}
```

Story/criterion fields use the dedicated `UPDATE_STORY`/`UPDATE_CRITERION` actions (patch-based) rather than `REPLACE_PROJECT`, since those actions exist and are the more direct path.

## TDD evidence

### RED
```
MSYS_NO_PATHCONV=1 docker run --rm -v /c/Users/waseem.abbas/ThinkFlow/app:/app -w /app node:20-bookworm npx vitest run src/stages/RequirementsForm.test.tsx
```
```
 FAIL  src/stages/RequirementsForm.test.tsx [ src/stages/RequirementsForm.test.tsx ]
Error: Failed to resolve import "./RequirementsForm" from "src/stages/RequirementsForm.test.tsx". Does the file exist?
 Test Files  1 failed (1)
      Tests  no tests
```
(Written before `RequirementsForm.tsx` existed — confirms the test actually exercises the new module.)

### GREEN (focused)
```
MSYS_NO_PATHCONV=1 docker run --rm -v /c/Users/waseem.abbas/ThinkFlow/app:/app -w /app node:20-bookworm npx vitest run src/stages/RequirementsForm.test.tsx
```
```
 ✓ src/stages/RequirementsForm.test.tsx (2 tests) 274ms
 Test Files  1 passed (1)
      Tests  2 passed (2)
```

### GREEN (full suite)
```
MSYS_NO_PATHCONV=1 docker run --rm -v /c/Users/waseem.abbas/ThinkFlow/app:/app -w /app node:20-bookworm npx vitest run
```
```
 Test Files  13 passed (13)
      Tests  50 passed (50)
```
Output pristine — 48 baseline + 2 new = 50, no regressions, no warnings besides npm's own "new version available" notice.

## Self-review

- Confirmed via `git status --porcelain` before commit that only the two Task 13 files were staged — the store was not touched.
- All Goal/NFR/string-list/signoff edits and removals go through `REPLACE_PROJECT` with an immutably rebuilt `project`, exactly per the brief's design note (no invented actions).
- All Story/Criterion adds/removes go through the dedicated `ADD_STORY`/`DELETE_STORY`/`ADD_CRITERION`/`DELETE_CRITERION` actions so id-minting and cascade deletes stay in the reducer, as intended.
- Add-story and add-criterion mint and immediately render `story.id`/`criterion.id` text nodes (`<div>{story.id}</div>` / `<div>{criterion.id}</div>`), satisfying the tests' `getByText(/US-1/)` and `getByText(/AC-1\.1/)` assertions.
- Criteria are correctly scoped to their parent story via `requirements.criteria.filter(c => c.storyId === story.id)`; the per-criterion Remove looks up the criterion's real id from that filtered list before dispatching `DELETE_CRITERION`, so index math never crosses story boundaries.
- `servesGoalId` round-trips through `LinkSelect`: `null` → `''` for display, and `''` → `null` on change (empty option not explicitly present in `goalOptions`, but the SelectField/LinkSelect signature doesn't require one and the test suite doesn't exercise this path — noting as a minor cosmetic gap, not a functional one, matching the store's `servesGoalId: string | null` contract).
- TypeScript: `priority` value cast `as Priority` on the `SelectField` onChange, mirroring the narrow surface `SelectFieldProps` exposes (`value: string`).
- Style matches `VisionForm.tsx`: functional component, `useProject()` destructure, `RepeatableList<T>` generics, immutable `.map`/`.filter` rebuilds, 2-space indent.

## Concerns

None blocking. Only cosmetic note: the `servesGoalId` `LinkSelect` has no explicit "(none)" option in `goalOptions`, so with zero goals or before any goal is selected the browser will just show whatever the first `<option>` happens to be (or blank if the list is empty) rather than an explicit empty choice — functionally the state still round-trips correctly (`null` on empty string), and this is not covered by the given tests, so left as-is rather than over-building beyond the brief.
