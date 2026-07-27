import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { buildZip } from './zip';

describe('buildZip', () => {
  it('bundles files into a readable zip', async () => {
    const blob = await buildZip([{ name: 'a.md', content: '# A' }]);
    const round = await JSZip.loadAsync(await blob.arrayBuffer());
    expect(await round.file('a.md')!.async('string')).toBe('# A');
  });
});
