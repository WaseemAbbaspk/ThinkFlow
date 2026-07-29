## Task 8: Zip export

**Files:**
- Create: `app/src/export/zip.ts`
- Test: `app/src/export/zip.test.ts`

**Interfaces:**
- Consumes: `RenderedFile[]` (Task 6), JSZip.
- Produces: `buildZip(files: RenderedFile[]): Promise<Blob>`.

- [ ] **Step 1: Write the failing test (`zip.test.ts`)**

```ts
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
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement `zip.ts`**

```ts
import JSZip from 'jszip';
import type { RenderedFile } from './markdown';

export async function buildZip(files: RenderedFile[]): Promise<Blob> {
  const zip = new JSZip();
  for (const f of files) zip.file(f.name, f.content);
  return zip.generateAsync({ type: 'blob' });
}
```

- [ ] **Step 4: Run, expect PASS.**

- [ ] **Step 5: Commit**

```bash
git add app/src/export/zip.ts app/src/export/zip.test.ts
git commit -m "Add zip bundling for exported docs"
```

---

