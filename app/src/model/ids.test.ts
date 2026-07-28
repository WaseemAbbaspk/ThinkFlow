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
