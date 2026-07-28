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
