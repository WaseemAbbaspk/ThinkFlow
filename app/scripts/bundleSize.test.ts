import { describe, it, expect } from 'vitest';
// @ts-expect-error -- plain .mjs helper, no type declarations
import { assertUnderBudget } from './bundleSize.mjs';

describe('assertUnderBudget', () => {
  it('passes when the chunk is under the limit', () => {
    expect(assertUnderBudget('index-abc.js', 159, 200)).toBe(true);
  });

  it('passes exactly at the limit', () => {
    expect(assertUnderBudget('index-abc.js', 200, 200)).toBe(true);
  });

  it('throws when the chunk is over the limit, naming both numbers', () => {
    expect(() => assertUnderBudget('index-abc.js', 240.4, 200))
      .toThrow(/index-abc\.js is 240\.4 kB gzipped, over the 200 kB budget/);
  });
});
