## Task 7: Project JSON serialize/parse

**Files:**
- Create: `app/src/export/project.ts`
- Test: `app/src/export/project.test.ts`

**Interfaces:**
- Consumes: `Project`, `migrate` (Task 5).
- Produces: `serialize(p: Project): string`; `parse(text: string): { ok: true; project: Project } | { ok: false; reason: string }`.

- [ ] **Step 1: Write the failing test (`project.test.ts`)**

```ts
import { describe, it, expect } from 'vitest';
import { emptyProject } from '../model/types';
import { serialize, parse } from './project';

describe('serialize/parse', () => {
  it('round-trips a project', () => {
    const p = emptyProject('Round Trip');
    const r = parse(serialize(p));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.project.meta.name).toBe('Round Trip');
  });
  it('rejects invalid JSON', () => {
    expect(parse('not json').ok).toBe(false);
  });
  it('rejects a newer schema (via migrate)', () => {
    const p: any = emptyProject('x'); p.meta.schemaVersion = 999;
    expect(parse(JSON.stringify(p)).ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement `project.ts`**

```ts
import type { Project } from '../model/types';
import { migrate } from '../model/migrate';

export function serialize(p: Project): string {
  return JSON.stringify(p, null, 2);
}
export function parse(text: string): { ok: true; project: Project } | { ok: false; reason: string } {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return { ok: false, reason: 'invalid JSON' }; }
  return migrate(raw);
}
```

- [ ] **Step 4: Run, expect PASS.**

- [ ] **Step 5: Commit**

```bash
git add app/src/export/project.ts app/src/export/project.test.ts
git commit -m "Add project JSON serialize/parse with schema validation"
```

---

