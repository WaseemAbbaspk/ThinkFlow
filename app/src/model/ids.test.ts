import { describe, it, expect } from 'vitest';
import { nextId, releaseId } from './ids';

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

describe('releaseId', () => {
  it('rewinds only when the id is the current high-water mark', () => {
    expect(releaseId({ US: 3 }, 'US', 'US-3')).toEqual({ US: 2 });
    expect(releaseId({ US: 3 }, 'US', 'US-1')).toEqual({ US: 3 });
    expect(releaseId({ US: 3 }, 'US', 'US-9')).toEqual({ US: 3 });
  });

  it('rewinds a criterion against its per-story counter', () => {
    expect(releaseId({ 'AC:2': 4 }, 'AC', 'AC-2.4', { storyNumber: 2 })).toEqual({ 'AC:2': 3 });
    expect(releaseId({ 'AC:2': 4 }, 'AC', 'AC-2.1', { storyNumber: 2 })).toEqual({ 'AC:2': 4 });
  });

  it('leaves counters untouched for an unparseable id', () => {
    expect(releaseId({ US: 3 }, 'US', 'nonsense')).toEqual({ US: 3 });
  });

  it('round-trips: releasing then generating reuses the number', () => {
    const after = nextId({}, 'GOAL');
    expect(after.id).toBe('GOAL-1');
    const released = releaseId(after.counters, 'GOAL', 'GOAL-1');
    expect(nextId(released, 'GOAL').id).toBe('GOAL-1');
  });
});
