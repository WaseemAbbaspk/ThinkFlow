## Task 9: localStorage persistence

**Files:**
- Create: `app/src/state/persistence.ts`
- Test: `app/src/state/persistence.test.ts`

**Interfaces:**
- Consumes: `Project`, `serialize`/`parse` (Task 7).
- Produces:
  - `STORAGE_KEY = 'thinkflow.studio.project.v1'`
  - `saveProject(p: Project): void` (writes synchronously; debouncing handled by caller/store)
  - `loadProject(): { ok: true; project: Project } | { ok: false; reason: string } | { ok: 'empty' }`
  - `clearProject(): void`

- [ ] **Step 1: Write the failing test (`persistence.test.ts`)**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { emptyProject } from '../model/types';
import { saveProject, loadProject, clearProject, STORAGE_KEY } from './persistence';

describe('persistence', () => {
  beforeEach(() => localStorage.clear());
  it('returns empty when nothing saved', () => {
    expect(loadProject()).toEqual({ ok: 'empty' });
  });
  it('saves and loads a project', () => {
    saveProject(emptyProject('Saved'));
    const r = loadProject();
    expect(r).toMatchObject({ ok: true });
    if (r.ok === true) expect(r.project.meta.name).toBe('Saved');
  });
  it('reports failure on corrupt data', () => {
    localStorage.setItem(STORAGE_KEY, '{bad json');
    const r = loadProject();
    expect(r.ok).toBe(false);
  });
  it('clears saved project', () => {
    saveProject(emptyProject('x')); clearProject();
    expect(loadProject()).toEqual({ ok: 'empty' });
  });
});
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement `persistence.ts`**

```ts
import type { Project } from '../model/types';
import { serialize, parse } from '../export/project';

export const STORAGE_KEY = 'thinkflow.studio.project.v1';

export function saveProject(p: Project): void {
  try { localStorage.setItem(STORAGE_KEY, serialize(p)); }
  catch { /* storage full/unavailable — caller surfaces a warning */ }
}
export function loadProject():
  { ok: true; project: Project } | { ok: false; reason: string } | { ok: 'empty' } {
  let text: string | null = null;
  try { text = localStorage.getItem(STORAGE_KEY); } catch { return { ok: false, reason: 'storage unavailable' }; }
  if (text === null) return { ok: 'empty' };
  return parse(text);
}
export function clearProject(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}
```

- [ ] **Step 4: Run, expect PASS.**

- [ ] **Step 5: Commit**

```bash
git add app/src/state/persistence.ts app/src/state/persistence.test.ts
git commit -m "Add localStorage persistence with safe load"
```

---

