## Task 1: Scaffold the app and test runner

**Files:**
- Create: `app/package.json`, `app/vite.config.ts`, `app/tsconfig.json`, `app/vitest.config.ts`, `app/index.html`, `app/src/main.tsx`, `app/src/App.tsx`, `app/src/setupTests.ts`
- Test: `app/src/smoke.test.ts`

**Interfaces:**
- Produces: a buildable Vite React+TS app; `npm test` runs Vitest with jsdom.

- [ ] **Step 1: Create the app with Vite**

Run from repo root:
```bash
cd app 2>/dev/null || (npm create vite@latest app -- --template react-ts && cd app)
```
If `npm create` is unavailable offline, create files manually per the steps below.

- [ ] **Step 2: Set dependencies in `app/package.json`**

```json
{
  "name": "thinkflow-studio",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": { "react": "^18.3.1", "react-dom": "^18.3.1", "jszip": "^3.10.1" },
  "devDependencies": {
    "@testing-library/react": "^16.0.0", "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/user-event": "^14.5.0", "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0", "@vitejs/plugin-react": "^4.3.0",
    "jsdom": "^24.0.0", "typescript": "^5.5.0", "vite": "^5.4.0", "vitest": "^2.0.0"
  }
}
```
Run: `npm install`

- [ ] **Step 3: Configure Vite base path (`app/vite.config.ts`)**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/ThinkFlow/',
  plugins: [react()],
});
```

- [ ] **Step 4: Configure Vitest (`app/vitest.config.ts`)**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', globals: true, setupFiles: ['./src/setupTests.ts'] },
});
```

`app/src/setupTests.ts`:
```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 5: Write the smoke test (`app/src/smoke.test.ts`)**

```ts
import { describe, it, expect } from 'vitest';
describe('smoke', () => { it('runs', () => { expect(1 + 1).toBe(2); }); });
```

- [ ] **Step 6: Run the test, expect PASS**

Run: `cd app && npm test`
Expected: 1 passing test.

- [ ] **Step 7: Verify the build works**

Run: `cd app && npm run build`
Expected: build succeeds, `dist/` produced.

- [ ] **Step 8: Commit**

```bash
git add app .gitignore
git commit -m "Scaffold ThinkFlow Studio (Vite + React + TS + Vitest)"
```
Ensure `app/node_modules` and `app/dist` are gitignored (Vite's template `.gitignore` covers this; add an `app/.gitignore` if needed).

---

