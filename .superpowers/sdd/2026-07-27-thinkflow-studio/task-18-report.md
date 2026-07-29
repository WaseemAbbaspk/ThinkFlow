# Task 18 report — Export panel (download + import)

## Summary

Implemented `ExportPanel.tsx`: a preview `<select>` over the 6 rendered markdown files (defaulting
to the first, `01-vision.md`), two download buttons (zip via `buildZip(renderAll(project))`, project
JSON via `serialize(project)`), and a file `<input type="file">` import that reads the selected
file's text, calls `parse(text)`, dispatches `REPLACE_PROJECT` on success, and shows the `reason`
string on failure.

## TDD evidence

### RED

Command:
```
MSYS_NO_PATHCONV=1 docker run --rm -v /c/Users/waseem.abbas/ThinkFlow/app:/app -w /app node:20-bookworm npx vitest run src/components/ExportPanel.test.tsx
```
Output (abridged):
```
FAIL  src/components/ExportPanel.test.tsx [ src/components/ExportPanel.test.tsx ]
Error: Failed to resolve import "./ExportPanel" from "src/components/ExportPanel.test.tsx". Does the file exist?
Test Files  1 failed (1)
     Tests  no tests
```
Confirmed failing because `ExportPanel.tsx` did not yet exist.

### GREEN (focused)

Same command, after implementing `ExportPanel.tsx`:
```
✓ src/components/ExportPanel.test.tsx (1 test) 53ms

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
Test Files  18 passed (18)
     Tests  58 passed (58)
```
Baseline was 57 tests / 17 files; new file `ExportPanel.test.tsx` adds 1 test → 58/58, output pristine
(no warnings beyond the standard npm version notice, no console errors).

## Files changed

- `app/src/components/ExportPanel.test.tsx` (new) — exact test from the brief.
- `app/src/components/ExportPanel.tsx` (new) — the component.

No other files touched; export modules (`markdown.ts`, `zip.ts`, `project.ts`) and
`state/projectStore.tsx` left untouched as instructed.

## Implementation notes

- `const files = renderAll(project)` is computed directly in the render body — this is pure (no I/O,
  no browser APIs) and safe under jsdom.
- `URL.createObjectURL` is called ONLY inside the two button `onClick` handlers
  (`handleDownloadZip`, `handleDownloadJson`), via a local `download(filename, blob)` helper matching
  the brief's exact shape (create object URL → anchor → `.click()` → `revokeObjectURL`). It is never
  invoked at module scope or during render, so the RTL `render()` call in the test never touches it —
  confirmed by the test passing with no jsdom "not implemented" errors.
- `selectedIndex` state defaults to `0`, so the `<pre>` shows `files[0].content`
  (`01-vision.md`, starting with `# Untitled Project — Vision`), satisfying the test's regex match.
- Import handler is `async`, reads `file.text()`, calls `parse(text)`, and either dispatches
  `REPLACE_PROJECT` with the parsed project (clearing any prior error) or sets an `importError` string
  state rendered in a `<p role="alert">` for failure. The file input value is reset after each change
  so re-selecting the same file re-triggers `onChange`.
- Style matches `TraceabilityView.tsx`: function component, `useProject()` destructured to
  `{ state, dispatch }`, 2-space indentation, no unnecessary abstraction, strict TS (no `any`).

## Self-review

- Confirmed via full-suite Docker run that no other test regressed and the new test is additive
  (58 = 57 + 1).
- Checked that `files[selectedIndex]` is always safe: `renderAll` always returns exactly 6 entries and
  the `<select>` only ever offers indices `0..files.length-1`, so `selectedIndex` can't go out of
  bounds.
- Did not modify `app/src/export/*` or `app/src/state/projectStore.tsx`.
- Commit message is exactly `Add export panel with download and import`, no Claude/Claude Code
  co-author or attribution trailer (verified with `git log -1` after commit).

## Concerns

None. The download buttons and import flow are not exercised by the single required test (only the
preview default is), but they were implemented per the brief's exact specification and manually
reviewed against the documented signatures of `buildZip`, `serialize`, and `parse`. No further
automated coverage was requested by the task.
