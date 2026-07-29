## Task 5: Schema migration

**Files:**
- Create: `app/src/model/migrate.ts`
- Test: `app/src/model/migrate.test.ts`

**Interfaces:**
- Consumes: `Project`, `SCHEMA_VERSION`, `emptyProject`.
- Produces: `migrate(raw: unknown): { ok: true; project: Project } | { ok: false; reason: string }`.

- [ ] **Step 1: Write the failing test (`migrate.test.ts`)**

```ts
import { describe, it, expect } from 'vitest';
import { emptyProject } from './types';
import { migrate } from './migrate';

describe('migrate', () => {
  it('accepts a current-version project', () => {
    const p = emptyProject('x');
    const r = migrate(p);
    expect(r.ok).toBe(true);
  });
  it('rejects a newer schema than supported', () => {
    const p = emptyProject('x'); (p.meta as any).schemaVersion = 999;
    const r = migrate(p);
    expect(r.ok).toBe(false);
  });
  it('rejects non-object / missing meta', () => {
    expect(migrate(null).ok).toBe(false);
    expect(migrate({}).ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement `migrate.ts`**

```ts
import { SCHEMA_VERSION, type Project } from './types';

export function migrate(raw: unknown): { ok: true; project: Project } | { ok: false; reason: string } {
  if (!raw || typeof raw !== 'object') return { ok: false, reason: 'not an object' };
  const meta = (raw as any).meta;
  if (!meta || typeof meta.schemaVersion !== 'number') return { ok: false, reason: 'missing meta.schemaVersion' };
  if (meta.schemaVersion > SCHEMA_VERSION)
    return { ok: false, reason: `project schema v${meta.schemaVersion} is newer than app v${SCHEMA_VERSION}` };
  // v1 is the first version; no upgrade steps yet. Future versions add cases here.
  return { ok: true, project: raw as Project };
}
```

- [ ] **Step 4: Run, expect PASS.**

- [ ] **Step 5: Commit**

```bash
git add app/src/model/migrate.ts app/src/model/migrate.test.ts
git commit -m "Add schema migration/validation for persisted projects"
```

---

