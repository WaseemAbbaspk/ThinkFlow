## Task 3: ID generation

**Files:**
- Create: `app/src/model/ids.ts`
- Test: `app/src/model/ids.test.ts`

**Interfaces:**
- Consumes: `Project['meta']['counters']` (a `Record<string, number>`).
- Produces:
  - `type IdKind = 'PROB'|'GOAL'|'US'|'AC'|'NFR'|'ADR'|'TASK'|'TEST'`
  - `nextId(counters, kind, ctx?): { id: string; counters: Record<string, number> }` where `ctx` is `{ storyNumber: number }` for `AC` only.

- [ ] **Step 1: Write the failing test (`ids.test.ts`)**

```ts
import { describe, it, expect } from 'vitest';
import { nextId } from './ids';

describe('nextId', () => {
  it('increments per kind and never reuses within a session', () => {
    let c: Record<string, number> = {};
    let r = nextId(c, 'US'); expect(r.id).toBe('US-1'); c = r.counters;
    r = nextId(c, 'US'); expect(r.id).toBe('US-2'); c = r.counters;
    r = nextId(c, 'TASK'); expect(r.id).toBe('TASK-1'); c = r.counters;
  });
  it('formats AC ids per story and counts per story', () => {
    let c: Record<string, number> = {};
    let r = nextId(c, 'AC', { storyNumber: 3 }); expect(r.id).toBe('AC-3.1'); c = r.counters;
    r = nextId(c, 'AC', { storyNumber: 3 }); expect(r.id).toBe('AC-3.2'); c = r.counters;
    r = nextId(c, 'AC', { storyNumber: 5 }); expect(r.id).toBe('AC-5.1');
  });
  it('does not reuse a number after deletion (counter is high-water)', () => {
    let c: Record<string, number> = { US: 3 };
    const r = nextId(c, 'US'); expect(r.id).toBe('US-4');
  });
});
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement `ids.ts`**

```ts
export type IdKind = 'PROB' | 'GOAL' | 'US' | 'AC' | 'NFR' | 'ADR' | 'TASK' | 'TEST';

export function nextId(
  counters: Record<string, number>,
  kind: IdKind,
  ctx?: { storyNumber: number },
): { id: string; counters: Record<string, number> } {
  if (kind === 'AC') {
    if (!ctx) throw new Error('AC id requires ctx.storyNumber');
    const key = `AC:${ctx.storyNumber}`;
    const n = (counters[key] ?? 0) + 1;
    return { id: `AC-${ctx.storyNumber}.${n}`, counters: { ...counters, [key]: n } };
  }
  const n = (counters[kind] ?? 0) + 1;
  return { id: `${kind}-${n}`, counters: { ...counters, [kind]: n } };
}
```

- [ ] **Step 4: Run, expect PASS.**

- [ ] **Step 5: Commit**

```bash
git add app/src/model/ids.ts app/src/model/ids.test.ts
git commit -m "Add counter-based ID generation"
```

---

