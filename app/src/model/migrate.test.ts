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
