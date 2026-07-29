# Task 18 brief — Export panel (download + import)

Full task text from the plan (`docs/superpowers/plans/2026-07-27-thinkflow-studio.md`, "Task 18"):

**Files:**
- Create: `app/src/components/ExportPanel.tsx`
- Test: `app/src/components/ExportPanel.test.tsx`

**Interfaces:**
- Consumes: `useProject()`; `renderAll` (Task 6); `buildZip` (Task 8); `serialize`/`parse` (Task 7);
  dispatch `REPLACE_PROJECT`.
- Renders:
  - A preview `<select>` of the 6 rendered files; the chosen file's content shown in a `<pre>`.
  - Buttons "Download all (.zip)", "Download project (.json)".
  - A file `<input type="file">` to import a `.json`: read the text, `parse(text)` → on success
    `dispatch({ type:'REPLACE_PROJECT', project })`; on failure show the `reason` string.
  - Downloads use an anchor + `URL.createObjectURL`.

**Exact signatures (all already built — do NOT modify these modules):**
```ts
// app/src/export/markdown.ts
interface RenderedFile { name: string; content: string; }
renderAll(p: Project): RenderedFile[]   // returns 6 files: 01-vision.md,02-requirements.md,03-architecture.md,04-tasks.md,05-testing.md,README.md
// app/src/export/zip.ts
buildZip(files: RenderedFile[]): Promise<Blob>
// app/src/export/project.ts
serialize(p: Project): string
parse(text: string): { ok: true; project: Project } | { ok: false; reason: string }
```
The store's `useProject()` returns `{ state, dispatch }`; project at `state.project`; `REPLACE_PROJECT`
action is `{ type: 'REPLACE_PROJECT'; project }`.

**Step 1: Write the failing test** — use this EXACT test:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectProvider } from '../state/projectStore';
import { ExportPanel } from './ExportPanel';

it('previews a rendered markdown file', () => {
  render(<ProjectProvider><ExportPanel /></ProjectProvider>);
  expect(screen.getByText(/# Untitled Project — Vision/)).toBeInTheDocument();
});
```
(The default project name is "Untitled Project" — the first rendered file `01-vision.md` starts with
`# Untitled Project — Vision`, so previewing the first file by default satisfies this.)

**Step 2: Run, expect FAIL.**
**Step 3: Implement `ExportPanel.tsx`.**
**Step 4: Run, expect PASS.**
**Step 5: Commit** — `git commit -m "Add export panel with download and import"`

## CRITICAL implementation detail — keep render DOM-safe (jsdom)

`URL.createObjectURL` is NOT implemented in jsdom and will throw if called during render. **Only call it
inside button-click handlers**, never at module/render top level. Structure the download like:
```ts
function download(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```
- "Download all (.zip)": `const blob = await buildZip(renderAll(project)); download('thinkflow-docs.zip', blob);`
- "Download project (.json)": `download('project.json', new Blob([serialize(project)], { type: 'application/json' }));`
- Preview: default the `<select>` to the first file; show `files[selectedIndex].content` in a `<pre>`.
  Compute `const files = renderAll(project)` in render (that's pure and DOM-safe).
- Import: `<input type="file" accept="application/json">`; on change read `file.text()`, call `parse`,
  dispatch on success or set an error state string shown to the user on failure.

## Read before coding
- `app/src/export/markdown.ts`, `app/src/export/zip.ts`, `app/src/export/project.ts` — signatures above.
- `app/src/state/projectStore.tsx` — `useProject()`, `REPLACE_PROJECT`.
- `app/src/components/TraceabilityView.tsx` — recent component style reference.
Match repo style (2-space indent, concise, strict TS). Do NOT modify the export modules or the store.

## CRITICAL ENVIRONMENT — tests run in Docker ONLY

Windows IT policy blocks npm native binaries. `node_modules` already installed — do NOT run `npm install`.
Use the Bash tool:
```
MSYS_NO_PATHCONV=1 docker run --rm -v /c/Users/waseem.abbas/ThinkFlow/app:/app -w /app node:20-bookworm npx vitest run src/components/ExportPanel.test.tsx
```
Drop the trailing path for the full suite. ~30-45s per run. Focused test while iterating; FULL suite once
before committing. Baseline: 57 tests passing across 17 files — must stay green (your new test(s) → 58+).
If the Docker daemon isn't running, report BLOCKED (don't start it yourself).

## Standing rules
- Work from `C:\Users\waseem.abbas\ThinkFlow`. Only touch the two Task 18 files.
- Commits must NOT add any Claude/Claude Code co-author or attribution trailer.
- Write your full report to `.superpowers/sdd/2026-07-27-thinkflow-studio/task-18-report.md`
  with TDD evidence (RED cmd+output, GREEN cmd+output), files changed, self-review, concerns.
