import { describe, it, expect } from 'vitest';
import { emptyProject, SCHEMA_VERSION } from './types';

describe('emptyProject', () => {
  it('creates a versioned project with empty collections', () => {
    const p = emptyProject('My App');
    expect(p.meta.name).toBe('My App');
    expect(p.meta.schemaVersion).toBe(SCHEMA_VERSION);
    expect(p.requirements.stories).toEqual([]);
    expect(p.tasks).toEqual([]);
    expect(p.meta.counters).toEqual({});
    expect(typeof p.meta.createdAt).toBe('string');
  });
});
