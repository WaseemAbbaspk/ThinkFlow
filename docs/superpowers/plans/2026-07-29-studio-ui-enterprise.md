# ThinkFlow Studio Enterprise UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild ThinkFlow Studio's presentation layer on shadcn/ui + Tailwind v4 + Radix so it reads as enterprise software, and close the interaction gaps (crude confirms, invisible autosave, unsortable matrix, no theme control).

**Architecture:** A token layer in `styles.css` drives vendored shadcn primitives under `src/components/ui/`. The existing `inputs.tsx` public API is held stable so the five stage forms and their tests need no edits. New cross-cutting concerns (theme, confirm dialogs, toasts, save status) become providers composed in a new `AppShell`. The data model, reducer, and export code are not touched.

**Tech Stack:** React 18, TypeScript 5.5, Vite 5, Tailwind CSS v4, Radix UI, lucide-react, TanStack Table v8, sonner, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-07-29-studio-ui-enterprise-design.md`

## Global Constraints

- All work happens in `app/`. Run every command from `app/`.
- **The 63-test suite must stay green.** Only `src/stages/RequirementsForm.test.tsx` may be modified, and only as specified in Task 6.
- **Never change** `src/model/`, `src/export/`, `src/state/persistence.ts`, or the reducer in `src/state/projectStore.tsx`. Export output must stay byte-identical.
- **`inputs.tsx` exports keep identical prop signatures**: `TextField`, `TextArea`, `SelectField`, `LinkSelect`, `RepeatableList`.
- **`SelectField` and `LinkSelect` must render native `<select>` elements.** Radix Select has no multiple-selection mode, and tests drive them via `userEvent.selectOptions`.
- **Accessible names are load-bearing.** These must not change:
  - Remove buttons: accessible name matches `/remove/i`
  - Sidebar buttons: names match `/Vision/i`, `/Requirements/i`, `/Architecture/i`, **`/^Tasks/i` (anchored — name must START with "Tasks")**, `/Testing/i`, `/Traceability/i`, `/Export/i`
  - Add buttons: `/add goal/i`, `/add story/i`, `/add criterion/i`, `/add task/i`, `/add test/i`
- **Any decorative DOM text or icon inside a button must carry `aria-hidden="true"`** so it stays out of the accessible name. This is why the sidebar's `01`–`05` numbering cannot become plain text.
- The mermaid chain must stay inside a `<pre>` element (`TraceabilityView.test.tsx` uses `container.querySelector('pre')`).
- Fonts are self-hosted via `@fontsource-variable/*`. **No external CDN** — the site is served from GitHub Pages.
- Palette (light / dark), used verbatim:

  | Token | Light | Dark |
  |---|---|---|
  | canvas | `#F5F7F9` | `#0F1319` |
  | surface | `#FFFFFF` | `#171C24` |
  | ink | `#1B2430` | `#E7ECF2` |
  | muted | `#5B6672` | `#93A0AF` |
  | hairline | `#E2E7EC` | `#262E3A` |
  | accent | `#2450C8` | `#6E93F0` |
  | warn | `#B25E00` | `#E0A356` |
  | ok | `#1F7A4D` | `#4FC28A` |

- Form language: 6px radius, hairline borders, shadows almost nowhere, uppercase mono microlabels.
- Commit after every task. Never use `--no-verify`.

## File Structure

**Created:**

| Path | Responsibility |
|---|---|
| `src/lib/utils.ts` | `cn()` class merger |
| `src/components/ui/*.tsx` | Vendored shadcn primitives (owned source) |
| `src/components/SectionCard.tsx` | Titled, counted, collapsible section wrapper |
| `src/components/TopBar.tsx` | Project name, save status, theme toggle, export menu |
| `src/components/SaveStatus.tsx` | Three-state save indicator |
| `src/components/AppShell.tsx` | Layout + provider composition + view routing |
| `src/state/theme.tsx` | `ThemeProvider`, `useTheme` |
| `src/state/confirm.tsx` | `ConfirmProvider`, `useConfirm` |
| `src/state/useSaveStatus.ts` | Debounced save + status state |
| `src/test/renderWithProviders.tsx` | Test helper wrapping the provider stack |

**Modified:** `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `src/main.tsx`, `src/styles.css`, `src/App.tsx`, `src/components/inputs.tsx`, `src/components/Sidebar.tsx`, `src/components/TraceabilityView.tsx`, `src/components/ExportPanel.tsx`, the five files in `src/stages/`, `src/stages/RequirementsForm.test.tsx`.

---

### Task 1: Build foundation — Tailwind v4, path alias, fonts, tokens

**Files:**
- Modify: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `src/main.tsx`
- Rewrite: `src/styles.css`
- Test: `src/lib/alias.test.ts` (new)

**Interfaces:**
- Consumes: nothing.
- Produces: the `@/` → `src/` import alias, resolvable from app code **and** tests; Tailwind utility classes backed by the palette tokens; `Inter Variable` and `JetBrains Mono Variable` font families.

- [ ] **Step 1: Install dependencies**

```bash
npm install tailwindcss@^4 @tailwindcss/vite@^4 class-variance-authority clsx tailwind-merge lucide-react @fontsource-variable/inter @fontsource-variable/jetbrains-mono
```

- [ ] **Step 2: Write the failing alias test**

Create `src/lib/alias.test.ts`. This guards the trap where the alias works in the build but not in Vitest.

```ts
import { it, expect } from 'vitest';
import { cn } from '@/lib/utils';

it('resolves the @/ alias inside vitest', () => {
  expect(cn('a', 'b')).toBe('a b');
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run src/lib/alias.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/utils"`.

- [ ] **Step 4: Create the `cn()` utility**

Create `src/lib/utils.ts`:

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 5: Add the alias in all three configs**

In `tsconfig.json`, add to `compilerOptions` (TS 5 permits `paths` without `baseUrl`):

```json
"paths": { "@/*": ["./src/*"] }
```

Replace `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  base: '/ThinkFlow/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
});
```

Replace `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: { environment: 'jsdom', globals: true, setupFiles: ['./src/setupTests.ts'] },
});
```

- [ ] **Step 6: Run the alias test to verify it passes**

Run: `npx vitest run src/lib/alias.test.ts`
Expected: PASS.

- [ ] **Step 7: Rewrite `src/styles.css` as the token layer**

Replace the entire file. `@custom-variant dark` makes `dark:` respond to a `.dark` class rather than the OS query, so the toggle in Task 3 can drive it.

```css
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

:root {
  --background: #F5F7F9;
  --foreground: #1B2430;
  --card: #FFFFFF;
  --card-foreground: #1B2430;
  --popover: #FFFFFF;
  --popover-foreground: #1B2430;
  --primary: #2450C8;
  --primary-foreground: #FFFFFF;
  --secondary: #E9EEFC;
  --secondary-foreground: #2450C8;
  --muted: #F5F7F9;
  --muted-foreground: #5B6672;
  --accent: #E9EEFC;
  --accent-foreground: #2450C8;
  --destructive: #B3261E;
  --destructive-foreground: #FFFFFF;
  --border: #E2E7EC;
  --input: #E2E7EC;
  --ring: #2450C8;
  --warn: #B25E00;
  --warn-soft: #FBEFD9;
  --ok: #1F7A4D;
  --radius: 6px;
}

.dark {
  --background: #0F1319;
  --foreground: #E7ECF2;
  --card: #171C24;
  --card-foreground: #E7ECF2;
  --popover: #171C24;
  --popover-foreground: #E7ECF2;
  --primary: #6E93F0;
  --primary-foreground: #0F1319;
  --secondary: #212C47;
  --secondary-foreground: #6E93F0;
  --muted: #171C24;
  --muted-foreground: #93A0AF;
  --accent: #212C47;
  --accent-foreground: #6E93F0;
  --destructive: #F2545B;
  --destructive-foreground: #0F1319;
  --border: #262E3A;
  --input: #262E3A;
  --ring: #6E93F0;
  --warn: #E0A356;
  --warn-soft: #3A2E17;
  --ok: #4FC28A;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-warn: var(--warn);
  --color-warn-soft: var(--warn-soft);
  --color-ok: var(--ok);
  --radius-DEFAULT: var(--radius);
  --font-sans: "Inter Variable", system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: "JetBrains Mono Variable", ui-monospace, SFMono-Regular, Consolas, monospace;
}

@layer base {
  * {
    border-color: var(--border);
  }
  html, body, #root {
    height: 100%;
  }
  body {
    margin: 0;
    background: var(--background);
    color: var(--foreground);
    font-family: var(--font-sans);
    font-size: 15px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }
  :focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }
  @media (prefers-reduced-motion: reduce) {
    * {
      transition: none !important;
      animation: none !important;
    }
  }
}
```

- [ ] **Step 8: Import the fonts in `src/main.tsx`**

Add these two lines above the existing `import './styles.css';`:

```ts
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
```

- [ ] **Step 9: Run the full suite and the build**

Run: `npm test && npx tsc -b && npm run build`
Expected: all 64 tests pass (63 existing + the alias test), no TS errors, build succeeds.

**Note:** the app will look unstyled at this point — every old class name in the JSX now has no CSS behind it. That is expected and is repaired progressively from Task 4 onward.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts vitest.config.ts src/styles.css src/main.tsx src/lib/
git commit -m "Add Tailwind v4 token layer, @/ alias, and self-hosted fonts"
```

---

### Task 2: Vendor the shadcn primitives

**Files:**
- Create: `src/components/ui/button.tsx`, `input.tsx`, `textarea.tsx`, `label.tsx`, `card.tsx`, `badge.tsx`, `separator.tsx`
- Test: `src/components/ui/button.test.tsx` (new)

**Interfaces:**
- Consumes: `cn` from `@/lib/utils`.
- Produces:
  - `Button` — props `{ variant?: 'default'|'secondary'|'ghost'|'outline'|'destructive'; size?: 'default'|'sm'|'icon' } & React.ButtonHTMLAttributes<HTMLButtonElement>`
  - `Input` — `React.InputHTMLAttributes<HTMLInputElement>`
  - `Textarea` — `React.TextareaHTMLAttributes<HTMLTextAreaElement>`
  - `Label` — `React.LabelHTMLAttributes<HTMLLabelElement>`
  - `Card`, `CardHeader`, `CardTitle`, `CardContent` — all `React.HTMLAttributes<HTMLDivElement>`
  - `Badge` — `{ variant?: 'default'|'outline'|'warn'|'ok' } & React.HTMLAttributes<HTMLSpanElement>`
  - `Separator` — `{ orientation?: 'horizontal'|'vertical' }`

- [ ] **Step 1: Install the Radix packages used across the whole plan**

```bash
npm install @radix-ui/react-label @radix-ui/react-separator @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-alert-dialog @radix-ui/react-collapsible @radix-ui/react-tooltip @radix-ui/react-dropdown-menu @radix-ui/react-scroll-area
```

- [ ] **Step 2: Write the failing Button test**

Create `src/components/ui/button.test.tsx`:

```tsx
import { it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

it('renders a button with its accessible name and variant classes', () => {
  render(<Button variant="ghost">Remove</Button>);
  const btn = screen.getByRole('button', { name: /remove/i });
  expect(btn).toBeInTheDocument();
  expect(btn.className).toContain('hover:bg-accent');
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run src/components/ui/button.test.tsx`
Expected: FAIL — cannot resolve `@/components/ui/button`.

- [ ] **Step 4: Create `src/components/ui/button.tsx`**

```tsx
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[6px] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:opacity-90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-accent',
        outline: 'border border-border bg-card hover:border-primary hover:text-primary',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        destructive: 'bg-destructive text-destructive-foreground hover:opacity-90',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 px-3 text-[13px]',
        icon: 'h-8 w-8',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : (type ?? 'button')}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';
export { buttonVariants };
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/components/ui/button.test.tsx`
Expected: PASS.

- [ ] **Step 6: Create the remaining primitives**

`src/components/ui/input.tsx`:

```tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-9 w-full rounded-[6px] border border-input bg-card px-3 py-1 text-sm text-foreground',
        'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring',
        'focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
```

`src/components/ui/textarea.tsx`:

```tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-20 w-full resize-y rounded-[6px] border border-input bg-card px-3 py-2 text-sm text-foreground',
        'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring',
        'focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';
```

`src/components/ui/label.tsx`:

```tsx
import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '@/lib/utils';

export const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn('text-[12.5px] font-medium text-muted-foreground', className)}
    {...props}
  />
));
Label.displayName = 'Label';
```

`src/components/ui/card.tsx`:

```tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('rounded-[6px] border border-border bg-card text-card-foreground', className)} {...props} />
  ),
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center justify-between gap-2 px-4 py-3', className)} {...props} />
  ),
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-[15px] font-semibold tracking-tight', className)} {...props} />
  ),
);
CardTitle.displayName = 'CardTitle';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-4 pb-4', className)} {...props} />
  ),
);
CardContent.displayName = 'CardContent';
```

`src/components/ui/badge.tsx`:

```tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-[3px] border px-1.5 py-0.5 font-mono text-[11px] tracking-wide',
  {
    variants: {
      variant: {
        default: 'border-border bg-muted text-muted-foreground',
        outline: 'border-border text-foreground',
        warn: 'border-warn bg-warn-soft text-warn',
        ok: 'border-ok/40 text-ok',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
```

`src/components/ui/separator.tsx`:

```tsx
import * as React from 'react';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import { cn } from '@/lib/utils';

export const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(({ className, orientation = 'horizontal', decorative = true, ...props }, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={cn('shrink-0 bg-border', orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px', className)}
    {...props}
  />
));
Separator.displayName = 'Separator';
```

- [ ] **Step 7: Run the full suite and typecheck**

Run: `npm test && npx tsc -b`
Expected: 65 tests pass, no TS errors.

- [ ] **Step 8: Commit**

```bash
git add src/components/ui/ package.json package-lock.json
git commit -m "Vendor shadcn primitives: button, input, textarea, label, card, badge, separator"
```

---

### Task 3: Theme system

**Files:**
- Create: `src/state/theme.tsx`, `src/components/ThemeToggle.tsx`
- Test: `src/state/theme.test.tsx` (new)

**Interfaces:**
- Consumes: `Button` from `@/components/ui/button`.
- Produces:
  - `type Theme = 'light' | 'dark' | 'system'`
  - `ThemeProvider({ children }: { children: React.ReactNode })`
  - `useTheme(): { theme: Theme; setTheme: (t: Theme) => void; resolved: 'light' | 'dark' }`
  - `THEME_STORAGE_KEY = 'thinkflow.theme'`
  - `ThemeToggle()` — a button whose accessible name is `Toggle theme`
- Behavior: `resolved` follows `window.matchMedia('(prefers-color-scheme: dark)')` when theme is `system`. The provider adds/removes the `dark` class on `document.documentElement`.

- [ ] **Step 1: Write the failing test**

Create `src/state/theme.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, THEME_STORAGE_KEY } from '@/state/theme';
import { ThemeToggle } from '@/components/ThemeToggle';

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('applies the dark class and persists the choice when toggled', async () => {
    render(<ThemeProvider><ThemeToggle /></ThemeProvider>);
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    await userEvent.click(screen.getByRole('button', { name: /toggle theme/i }));

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('restores a persisted theme on mount', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    render(<ThemeProvider><ThemeToggle /></ThemeProvider>);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/state/theme.test.tsx`
Expected: FAIL — cannot resolve `@/state/theme`.

- [ ] **Step 3: Add the matchMedia stub to `src/setupTests.ts`**

jsdom does not implement `matchMedia`. Append to the file:

```ts
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}
```

- [ ] **Step 4: Create `src/state/theme.tsx`**

```tsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export const THEME_STORAGE_KEY = 'thinkflow.theme';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  resolved: 'light' | 'dark';
}

const Ctx = createContext<ThemeContextValue | null>(null);

function readStored(): Theme {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : 'system';
  } catch {
    return 'system';
  }
}

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readStored);
  const [systemDark, setSystemDark] = useState<boolean>(systemPrefersDark);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setSystemDark(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const resolved: 'light' | 'dark' =
    theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark');
  }, [resolved]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, t);
    } catch {
      /* storage unavailable; the in-memory theme still applies */
    }
  }, []);

  const value = useMemo(() => ({ theme, setTheme, resolved }), [theme, setTheme, resolved]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTheme must be used inside ThemeProvider');
  return v;
}
```

- [ ] **Step 5: Create `src/components/ThemeToggle.tsx`**

The icons are `aria-hidden` so the accessible name stays exactly `Toggle theme`.

```tsx
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/state/theme';

export function ThemeToggle() {
  const { resolved, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolved === 'dark' ? 'light' : 'dark')}
    >
      {resolved === 'dark'
        ? <Sun aria-hidden="true" />
        : <Moon aria-hidden="true" />}
    </Button>
  );
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run src/state/theme.test.tsx`
Expected: PASS — 2 tests.

- [ ] **Step 7: Run the full suite**

Run: `npm test`
Expected: 67 tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/state/theme.tsx src/state/theme.test.tsx src/components/ThemeToggle.tsx src/setupTests.ts
git commit -m "Add theme provider with explicit light/dark toggle and persistence"
```

---

### Task 4: Rebuild `inputs.tsx` on shadcn with a stable API

**Files:**
- Rewrite: `src/components/inputs.tsx`
- Test: `src/components/inputs.test.tsx` (extend — do not remove existing cases)

**Interfaces:**
- Consumes: `Input`, `Textarea`, `Label`, `Card`, `Badge`, `Button`, `cn`.
- Produces: the same five exports with unchanged prop types — `TextField`, `TextArea`, `SelectField`, `LinkSelect`, `RepeatableList`, plus `SelectOption`, and the `*Props` interfaces.

- [ ] **Step 1: Add the failing native-select guard test**

Append to `src/components/inputs.test.tsx` (keep the two existing cases):

```tsx
it('SelectField renders a native select so selectOptions works', async () => {
  const onChange = vi.fn();
  render(
    <SelectField
      label="Priority"
      value="Must"
      options={[{ value: 'Must', label: 'Must' }, { value: 'Should', label: 'Should' }]}
      onChange={onChange}
    />,
  );
  const select = screen.getByLabelText('Priority');
  expect(select.tagName).toBe('SELECT');
  await userEvent.selectOptions(select, 'Should');
  expect(onChange).toHaveBeenCalledWith('Should');
});

it('LinkSelect supports multiple selection', async () => {
  const onChange = vi.fn();
  render(
    <LinkSelect
      label="Traces to"
      value={[]}
      multiple
      options={[{ value: 'US-1', label: 'US-1' }, { value: 'US-2', label: 'US-2' }]}
      onChange={onChange}
    />,
  );
  const select = screen.getByLabelText('Traces to');
  expect(select).toHaveAttribute('multiple');
  await userEvent.selectOptions(select, 'US-2');
  expect(onChange).toHaveBeenCalledWith(['US-2']);
});

it('RepeatableList keeps the Remove accessible name', () => {
  render(
    <RepeatableList
      items={['a']}
      addLabel="Add row"
      onAdd={() => {}}
      onRemove={() => {}}
      renderItem={() => <span>row</span>}
    />,
  );
  expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
});
```

Update that file's import line to `import { TextField, SelectField, LinkSelect, RepeatableList } from './inputs';`

- [ ] **Step 2: Run to verify the new cases fail**

Run: `npx vitest run src/components/inputs.test.tsx`
Expected: FAIL — `SelectField` / `LinkSelect` not exported from the test's import list, or assertions unmet.

- [ ] **Step 3: Rewrite `src/components/inputs.tsx`**

```tsx
import React, { useId } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const selectClass = cn(
  'flex w-full rounded-[6px] border border-input bg-card px-3 py-1.5 text-sm text-foreground',
  'focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-accent',
);

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 flex flex-col gap-1">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

export interface TextFieldProps { label: string; value: string; onChange: (value: string) => void; }
export function TextField({ label, value, onChange }: TextFieldProps) {
  const id = useId();
  return (
    <Field id={id} label={label}>
      <Input id={id} type="text" value={value} onChange={e => onChange(e.target.value)} />
    </Field>
  );
}

export interface TextAreaProps { label: string; value: string; onChange: (value: string) => void; }
export function TextArea({ label, value, onChange }: TextAreaProps) {
  const id = useId();
  return (
    <Field id={id} label={label}>
      <Textarea id={id} value={value} onChange={e => onChange(e.target.value)} />
    </Field>
  );
}

export interface SelectOption { value: string; label: string; }
export interface SelectFieldProps {
  label: string; value: string; options: SelectOption[]; onChange: (value: string) => void;
}
export function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  const id = useId();
  return (
    <Field id={id} label={label}>
      <select id={id} className={selectClass} value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  );
}

export interface LinkSelectProps {
  label: string; value: string | string[]; options: SelectOption[];
  onChange: (value: string | string[]) => void; multiple?: boolean;
}
export function LinkSelect({ label, value, options, onChange, multiple }: LinkSelectProps) {
  const id = useId();
  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (multiple) {
      onChange(Array.from(e.target.selectedOptions).map(o => o.value));
    } else {
      onChange(e.target.value);
    }
  }
  return (
    <Field id={id} label={label}>
      <select
        id={id}
        multiple={multiple}
        className={cn(selectClass, multiple && 'min-h-24')}
        value={value}
        onChange={handleChange}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  );
}

export interface RepeatableListProps<T> {
  items: T[]; onAdd: () => void; renderItem: (item: T, index: number) => React.ReactNode;
  onRemove: (index: number) => void; addLabel: string;
}
export function RepeatableList<T>({ items, onAdd, renderItem, onRemove, addLabel }: RepeatableListProps<T>) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <Card key={i} className="p-4">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">{renderItem(item, i)}</div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Remove"
              className="text-muted-foreground hover:text-warn"
              onClick={() => onRemove(i)}
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </div>
        </Card>
      ))}
      <Button variant="secondary" size="sm" className="self-start" onClick={onAdd}>
        <Plus aria-hidden="true" />
        {addLabel}
      </Button>
    </div>
  );
}
```

- [ ] **Step 4: Run the inputs tests to verify they pass**

Run: `npx vitest run src/components/inputs.test.tsx`
Expected: PASS — 5 tests.

- [ ] **Step 5: Run the full suite**

The five stage forms consume this module and were not edited; they must still pass.

Run: `npm test`
Expected: 70 tests pass. If `RequirementsForm` or `App.integration` fail on an accessible-name lookup, the cause is a missing `aria-hidden` on an icon — fix that, do not change the test.

- [ ] **Step 6: Commit**

```bash
git add src/components/inputs.tsx src/components/inputs.test.tsx
git commit -m "Rebuild form inputs on shadcn primitives, keeping native selects and the public API"
```

---

### Task 5: SectionCard

**Files:**
- Create: `src/components/ui/collapsible.tsx`, `src/components/SectionCard.tsx`
- Test: `src/components/SectionCard.test.tsx` (new)

**Interfaces:**
- Consumes: `Card`, `CardHeader`, `CardTitle`, `CardContent`, `Badge`, `Button`, Radix Collapsible.
- Produces: `SectionCard({ title, count, defaultOpen = true, children }: { title: string; count?: number; defaultOpen?: boolean; children: React.ReactNode })`. Renders `title` inside a heading, `count` in a Badge when provided, and a collapsible body.

- [ ] **Step 1: Write the failing test**

Create `src/components/SectionCard.test.tsx`:

```tsx
import { it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SectionCard } from '@/components/SectionCard';

it('renders the title, the count, and collapses its body', async () => {
  render(<SectionCard title="Goals" count={3}><p>body content</p></SectionCard>);
  expect(screen.getByText('Goals')).toBeInTheDocument();
  expect(screen.getByText('3')).toBeInTheDocument();
  expect(screen.getByText('body content')).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: /collapse goals/i }));
  expect(screen.queryByText('body content')).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/components/SectionCard.test.tsx`
Expected: FAIL — cannot resolve `@/components/SectionCard`.

- [ ] **Step 3: Create `src/components/ui/collapsible.tsx`**

```tsx
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';

export const Collapsible = CollapsiblePrimitive.Root;
export const CollapsibleTrigger = CollapsiblePrimitive.Trigger;
export const CollapsibleContent = CollapsiblePrimitive.Content;
```

- [ ] **Step 4: Create `src/components/SectionCard.tsx`**

```tsx
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

export interface SectionCardProps {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function SectionCard({ title, count, defaultOpen = true, children }: SectionCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="mb-4">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="border-b border-border">
          <div className="flex items-center gap-2">
            <CardTitle>{title}</CardTitle>
            {count !== undefined && <Badge>{count}</Badge>}
          </div>
          <CollapsibleTrigger
            aria-label={`${open ? 'Collapse' : 'Expand'} ${title}`}
            className="rounded-[6px] p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <ChevronDown
              aria-hidden="true"
              className={cn('size-4 transition-transform', !open && '-rotate-90')}
            />
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-4">{children}</CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/components/SectionCard.test.tsx`
Expected: PASS.

- [ ] **Step 6: Run the full suite**

Run: `npm test`
Expected: 71 tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/SectionCard.tsx src/components/SectionCard.test.tsx src/components/ui/collapsible.tsx
git commit -m "Add collapsible SectionCard wrapper with item counts"
```

---

### Task 6: Confirm dialogs replacing `window.confirm`

**Files:**
- Create: `src/components/ui/alert-dialog.tsx`, `src/state/confirm.tsx`, `src/test/renderWithProviders.tsx`
- Modify: `src/stages/RequirementsForm.tsx`
- Test: `src/state/confirm.test.tsx` (new), `src/stages/RequirementsForm.test.tsx` (rewrite three cases, wrap all five)

**Interfaces:**
- Consumes: `Button`, Radix AlertDialog.
- Produces:
  - `ConfirmProvider({ children }: { children: React.ReactNode })`
  - `useConfirm(): (opts: { title: string; description: string; confirmLabel?: string }) => Promise<boolean>`
  - `renderWithProviders(ui: React.ReactElement): RenderResult` — wraps in `ThemeProvider` → `ConfirmProvider` → `ProjectProvider`.
- Behavior: resolves `true` on confirm; `false` on cancel, Escape, or overlay dismissal.

**Critical:** `useConfirm()` is called during render, so it throws without a provider. All five tests in `RequirementsForm.test.tsx` must move to `renderWithProviders`, not only the three being rewritten.

- [ ] **Step 1: Write the failing confirm test**

Create `src/state/confirm.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmProvider, useConfirm } from '@/state/confirm';

function Harness({ onResult }: { onResult: (v: boolean) => void }) {
  const confirm = useConfirm();
  return (
    <button
      type="button"
      onClick={async () => onResult(await confirm({ title: 'Delete US-1?', description: 'This removes 2 criteria.' }))}
    >
      Delete
    </button>
  );
}

describe('useConfirm', () => {
  it('resolves true when confirmed', async () => {
    const onResult = vi.fn();
    render(<ConfirmProvider><Harness onResult={onResult} /></ConfirmProvider>);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('Delete US-1?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^confirm$/i }));
    expect(onResult).toHaveBeenCalledWith(true);
  });

  it('resolves false when cancelled', async () => {
    const onResult = vi.fn();
    render(<ConfirmProvider><Harness onResult={onResult} /></ConfirmProvider>);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(await screen.findByRole('button', { name: /cancel/i }));
    expect(onResult).toHaveBeenCalledWith(false);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/state/confirm.test.tsx`
Expected: FAIL — cannot resolve `@/state/confirm`.

- [ ] **Step 3: Create `src/components/ui/alert-dialog.tsx`**

```tsx
import * as React from 'react';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { cn } from '@/lib/utils';

export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogAction = AlertDialogPrimitive.Action;
export const AlertDialogCancel = AlertDialogPrimitive.Cancel;

export const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Portal>
    <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40" />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2',
        'rounded-[6px] border border-border bg-card p-5 text-card-foreground shadow-lg',
        className,
      )}
      {...props}
    />
  </AlertDialogPrimitive.Portal>
));
AlertDialogContent.displayName = 'AlertDialogContent';

export const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title ref={ref} className={cn('text-[15px] font-semibold', className)} {...props} />
));
AlertDialogTitle.displayName = 'AlertDialogTitle';

export const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn('mt-2 text-sm text-muted-foreground', className)}
    {...props}
  />
));
AlertDialogDescription.displayName = 'AlertDialogDescription';
```

- [ ] **Step 4: Create `src/state/confirm.tsx`**

```tsx
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ConfirmOptions {
  title: string;
  description: string;
  confirmLabel?: string;
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const Ctx = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>(options => {
    setOpts(options);
    return new Promise<boolean>(resolve => {
      resolverRef.current = resolve;
    });
  }, []);

  function settle(result: boolean) {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setOpts(null);
  }

  return (
    <Ctx.Provider value={confirm}>
      {children}
      <AlertDialog open={opts !== null} onOpenChange={open => { if (!open) settle(false); }}>
        {opts && (
          <AlertDialogContent>
            <AlertDialogTitle>{opts.title}</AlertDialogTitle>
            <AlertDialogDescription>{opts.description}</AlertDialogDescription>
            <div className="mt-5 flex justify-end gap-2">
              <AlertDialogCancel
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                onClick={() => settle(false)}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className={cn(buttonVariants({ variant: 'destructive', size: 'sm' }))}
                onClick={() => settle(true)}
              >
                {opts.confirmLabel ?? 'Confirm'}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </Ctx.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const v = useContext(Ctx);
  if (!v) throw new Error('useConfirm must be used inside ConfirmProvider');
  return v;
}
```

- [ ] **Step 5: Run the confirm test to verify it passes**

Run: `npx vitest run src/state/confirm.test.tsx`
Expected: PASS — 2 tests.

- [ ] **Step 6: Create the test helper**

Create `src/test/renderWithProviders.tsx`:

```tsx
import React from 'react';
import { render, type RenderResult } from '@testing-library/react';
import { ThemeProvider } from '@/state/theme';
import { ConfirmProvider } from '@/state/confirm';
import { ProjectProvider } from '@/state/projectStore';

export function renderWithProviders(ui: React.ReactElement): RenderResult {
  return render(
    <ThemeProvider>
      <ConfirmProvider>
        <ProjectProvider>{ui}</ProjectProvider>
      </ConfirmProvider>
    </ThemeProvider>,
  );
}
```

- [ ] **Step 7: Migrate `RequirementsForm.tsx` to the hook**

Delete the `confirmDelete` helper (lines 11–13). Add the hook inside the component, immediately after the `useProject()` call:

```tsx
const confirm = useConfirm();
```

Add the import:

```tsx
import { useConfirm } from '@/state/confirm';
```

Replace the story `onRemove` with:

```tsx
onRemove={async i => {
  const story = requirements.stories[i];
  const dependentCriteria = requirements.criteria.filter(c => c.storyId === story.id);
  const dependentTasks = tasks.filter(t => t.tracesTo.includes(story.id));
  if (dependentCriteria.length > 0 || dependentTasks.length > 0) {
    const ok = await confirm({
      title: `Delete ${story.id}?`,
      description: `This also removes ${dependentCriteria.length} criteria and unlinks ${dependentTasks.length} tasks.`,
      confirmLabel: 'Delete',
    });
    if (!ok) return;
  }
  dispatch({ type: 'DELETE_STORY', id: story.id });
}}
```

Replace the criterion `onRemove` with:

```tsx
onRemove={async i => {
  const storyCriteria = requirements.criteria.filter(c => c.storyId === story.id);
  const criterion = storyCriteria[i];
  const dependentTasks = tasks.filter(t => t.tracesTo.includes(criterion.id));
  const dependentTests = testing.tests.filter(t => t.verifies === criterion.id);
  if (dependentTasks.length > 0 || dependentTests.length > 0) {
    const ok = await confirm({
      title: `Delete ${criterion.id}?`,
      description: `This unlinks ${dependentTasks.length} tasks and ${dependentTests.length} tests.`,
      confirmLabel: 'Delete',
    });
    if (!ok) return;
  }
  dispatch({ type: 'DELETE_CRITERION', id: criterion.id });
}}
```

- [ ] **Step 8: Rewrite `src/stages/RequirementsForm.test.tsx`**

Replace the whole file. Note the confirm-label is `Delete`, and the first two cases change only their render call.

```tsx
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { RequirementsForm } from './RequirementsForm';

describe('RequirementsForm', () => {
  it('adds a story with an auto id shown', async () => {
    renderWithProviders(<RequirementsForm />);
    await userEvent.click(screen.getByRole('button', { name: /add story/i }));
    expect(screen.getByText(/US-1/)).toBeInTheDocument();
  });

  it('adds a criterion under a story', async () => {
    renderWithProviders(<RequirementsForm />);
    await userEvent.click(screen.getByRole('button', { name: /add story/i }));
    await userEvent.click(screen.getByRole('button', { name: /add criterion/i }));
    expect(screen.getByText(/AC-1\.1/)).toBeInTheDocument();
  });

  it('keeps the story when the delete dialog is cancelled', async () => {
    renderWithProviders(<RequirementsForm />);
    await userEvent.click(screen.getByRole('button', { name: /add story/i }));
    await userEvent.click(screen.getByRole('button', { name: /add criterion/i }));
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    await userEvent.click(removeButtons[removeButtons.length - 1]);

    expect(await screen.findByText('Delete US-1?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.getByText(/US-1/)).toBeInTheDocument();
  });

  it('removes the story when the delete dialog is confirmed', async () => {
    renderWithProviders(<RequirementsForm />);
    await userEvent.click(screen.getByRole('button', { name: /add story/i }));
    await userEvent.click(screen.getByRole('button', { name: /add criterion/i }));
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    await userEvent.click(removeButtons[removeButtons.length - 1]);

    expect(await screen.findByText('Delete US-1?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }));

    expect(screen.queryByText(/US-1/)).not.toBeInTheDocument();
  });

  it('deletes a story with no dependents without prompting', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm');
    renderWithProviders(<RequirementsForm />);
    await userEvent.click(screen.getByRole('button', { name: /add story/i }));
    await userEvent.click(screen.getByRole('button', { name: /remove/i }));

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.queryByText(/US-1/)).not.toBeInTheDocument();
    confirmSpy.mockRestore();
  });
});
```

- [ ] **Step 9: Run the RequirementsForm tests**

Run: `npx vitest run src/stages/RequirementsForm.test.tsx`
Expected: PASS — 5 tests.

- [ ] **Step 10: Run the full suite**

Run: `npm test && npx tsc -b`
Expected: 73 tests pass, no TS errors.

- [ ] **Step 11: Commit**

```bash
git add src/state/confirm.tsx src/state/confirm.test.tsx src/components/ui/alert-dialog.tsx src/test/renderWithProviders.tsx src/stages/RequirementsForm.tsx src/stages/RequirementsForm.test.tsx
git commit -m "Replace window.confirm with a Radix AlertDialog-backed useConfirm hook"
```

---

### Task 7: Save status

**Files:**
- Create: `src/state/useSaveStatus.ts`, `src/components/SaveStatus.tsx`
- Test: `src/components/SaveStatus.test.tsx` (new)

**Interfaces:**
- Consumes: `saveProject` from `@/state/persistence`, `Badge`.
- Produces:
  - `type SaveState = 'saving' | 'saved' | 'error'`
  - `useSaveStatus(project: Project): SaveState` — debounces `saveProject` by 500ms; returns `'saving'` while pending, then `'saved'` or `'error'`.
  - `SaveStatus({ state }: { state: SaveState })` — renders `Saving…`, `Saved`, or `Not saved`. The error variant carries `role="status"` and the guidance copy `Your work could not be saved to this browser. Export your project to avoid losing it.` as its `title`.

- [ ] **Step 1: Write the failing test**

Create `src/components/SaveStatus.test.tsx`:

```tsx
import { it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SaveStatus } from '@/components/SaveStatus';

it('renders each of the three states', () => {
  const { rerender } = render(<SaveStatus state="saving" />);
  expect(screen.getByText(/saving/i)).toBeInTheDocument();

  rerender(<SaveStatus state="saved" />);
  expect(screen.getByText(/^saved$/i)).toBeInTheDocument();

  rerender(<SaveStatus state="error" />);
  expect(screen.getByText(/not saved/i)).toBeInTheDocument();
  expect(screen.getByRole('status')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/components/SaveStatus.test.tsx`
Expected: FAIL — cannot resolve `@/components/SaveStatus`.

- [ ] **Step 3: Create `src/state/useSaveStatus.ts`**

```ts
import { useEffect, useState } from 'react';
import { saveProject } from '@/state/persistence';
import type { Project } from '@/model/types';

export type SaveState = 'saving' | 'saved' | 'error';

export function useSaveStatus(project: Project): SaveState {
  const [state, setState] = useState<SaveState>('saved');

  useEffect(() => {
    setState('saving');
    const id = setTimeout(() => {
      setState(saveProject(project) ? 'saved' : 'error');
    }, 500);
    return () => clearTimeout(id);
  }, [project]);

  return state;
}
```

- [ ] **Step 4: Create `src/components/SaveStatus.tsx`**

```tsx
import { Check, CircleAlert, Loader } from 'lucide-react';
import type { SaveState } from '@/state/useSaveStatus';

const ERROR_HELP = 'Your work could not be saved to this browser. Export your project to avoid losing it.';

export function SaveStatus({ state }: { state: SaveState }) {
  if (state === 'error') {
    return (
      <span role="status" title={ERROR_HELP} className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-warn">
        <CircleAlert aria-hidden="true" className="size-3.5" />
        Not saved
      </span>
    );
  }
  if (state === 'saving') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
        <Loader aria-hidden="true" className="size-3.5" />
        Saving…
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
      <Check aria-hidden="true" className="size-3.5 text-ok" />
      Saved
    </span>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/components/SaveStatus.test.tsx`
Expected: PASS.

- [ ] **Step 6: Run the full suite**

Run: `npm test`
Expected: 74 tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/state/useSaveStatus.ts src/components/SaveStatus.tsx src/components/SaveStatus.test.tsx
git commit -m "Add three-state save indicator replacing the silent autosave"
```

---

### Task 8: Sidebar rewrite

**Files:**
- Rewrite: `src/components/Sidebar.tsx`
- Test: `src/components/Sidebar.test.tsx` (extend — keep the existing case verbatim)

**Interfaces:**
- Consumes: `useProject`, `detectGaps`, `Button`, `cn`, lucide icons.
- Produces: `Sidebar()` — unchanged export signature.

**Critical:** `App.integration.test.tsx` matches `/^Tasks/i`, **anchored to the start of the accessible name**. The `01`–`05` numbering and every icon must carry `aria-hidden="true"` so the accessible name remains exactly the label.

- [ ] **Step 1: Add the failing accessible-name guard test**

Append to `src/components/Sidebar.test.tsx`:

```tsx
it('keeps stage labels at the start of the accessible name', () => {
  render(<ProjectProvider><Sidebar /></ProjectProvider>);
  expect(screen.getByRole('button', { name: /^Tasks/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /^Vision/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run it to confirm it passes today**

Run: `npx vitest run src/components/Sidebar.test.tsx`
Expected: PASS — 2 tests. This is a regression guard, so it is green before the rewrite and must stay green after.

- [ ] **Step 3: Rewrite `src/components/Sidebar.tsx`**

```tsx
import {
  Eye, ListChecks, Boxes, SquareCheckBig, FlaskConical, Network, Download,
  TriangleAlert, type LucideIcon,
} from 'lucide-react';
import { useProject, type View } from '@/state/projectStore';
import { detectGaps, type Gap } from '@/model/traceability';
import { cn } from '@/lib/utils';

const NAV_ITEMS: { view: View; label: string; icon: LucideIcon }[] = [
  { view: 'vision', label: 'Vision', icon: Eye },
  { view: 'requirements', label: 'Requirements', icon: ListChecks },
  { view: 'architecture', label: 'Architecture', icon: Boxes },
  { view: 'tasks', label: 'Tasks', icon: SquareCheckBig },
  { view: 'testing', label: 'Testing', icon: FlaskConical },
  { view: 'traceability', label: 'Traceability', icon: Network },
  { view: 'export', label: 'Export', icon: Download },
];

const STAGE_COUNT = 5;

const GAP_KIND_TO_VIEWS: Record<Gap['kind'], View[]> = {
  'untested-criterion': ['requirements', 'testing'],
  'goalless-story': ['requirements', 'testing'],
  'unrealized-story': ['requirements', 'testing'],
  'orphan-task': ['tasks'],
  'dangling-link': ['tasks'],
};

export function Sidebar() {
  const { state, dispatch } = useProject();
  const gaps = detectGaps(state.project);
  const gappyViews = new Set<View>(gaps.flatMap(g => GAP_KIND_TO_VIEWS[g.kind]));

  return (
    <nav className="sidebar">
      <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
        {NAV_ITEMS.map(({ view, label, icon: Icon }, index) => {
          const active = state.view === view;
          const hasGap = gappyViews.has(view);
          const isStage = index < STAGE_COUNT;
          return (
            <li
              key={view}
              className={cn(index === STAGE_COUNT && 'mt-2 border-t border-border pt-2')}
            >
              <button
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => dispatch({ type: 'SET_VIEW', view })}
                className={cn(
                  'flex w-full items-center gap-2 rounded-[6px] px-2.5 py-2 text-left text-[13.5px] transition-colors',
                  active
                    ? 'bg-accent font-semibold text-accent-foreground shadow-[inset_3px_0_0_var(--primary)]'
                    : 'text-foreground hover:bg-muted',
                )}
              >
                {isStage && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      'flex size-5 shrink-0 items-center justify-center rounded-full border font-mono text-[10px]',
                      hasGap
                        ? 'border-warn bg-warn-soft text-warn'
                        : active
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border text-muted-foreground',
                    )}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                )}
                <Icon aria-hidden="true" className="size-4 shrink-0 opacity-70" />
                <span className="min-w-0 flex-1 truncate">{label}</span>
                {hasGap && <TriangleAlert aria-hidden="true" className="size-3.5 shrink-0 text-warn" />}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

Note the label `<span>` comes **after** the `aria-hidden` number and icon, but since those are hidden, the computed accessible name is just the label — which is what `/^Tasks/i` requires.

- [ ] **Step 4: Run the Sidebar tests**

Run: `npx vitest run src/components/Sidebar.test.tsx`
Expected: PASS — 2 tests. A failure here means an `aria-hidden` is missing.

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: 75 tests pass, including `App.integration.test.tsx`.

- [ ] **Step 6: Commit**

```bash
git add src/components/Sidebar.tsx src/components/Sidebar.test.tsx
git commit -m "Rewrite sidebar rail with icons and per-stage gap indicators"
```

---

### Task 9: TopBar and AppShell

**Files:**
- Create: `src/components/TopBar.tsx`, `src/components/AppShell.tsx`, `src/components/ui/dropdown-menu.tsx`, `src/components/ui/sonner.tsx`
- Rewrite: `src/App.tsx`
- Test: `src/App.integration.test.tsx` (must pass **unchanged**)

**Interfaces:**
- Consumes: `Sidebar`, `SaveStatus`, `useSaveStatus`, `ThemeToggle`, `ThemeProvider`, `ConfirmProvider`, `ProjectProvider`, `TextField`, all stage forms.
- Produces:
  - `TopBar({ saveState }: { saveState: SaveState })`
  - `AppShell()` — renders the whole authenticated surface, including view routing.
  - `App()` — default export, unchanged behavior for the recovery path.

**Critical:** `App.integration.test.tsx` queries `getByRole('button', { name: /Requirements/i })` against the entire app. Do not add any other button whose accessible name contains a stage label. The export dropdown trigger must be named exactly `Export actions`, not `Export`.

- [ ] **Step 1: Install sonner**

```bash
npm install sonner @tanstack/react-table
```

(`@tanstack/react-table` is installed here so Task 10 needs no separate install step.)

- [ ] **Step 2: Create `src/components/ui/dropdown-menu.tsx`**

```tsx
import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils';

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

export const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50 min-w-48 rounded-[6px] border border-border bg-popover p-1 text-popover-foreground shadow-md',
        className,
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = 'DropdownMenuContent';

export const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      'flex cursor-pointer items-center gap-2 rounded-[4px] px-2 py-1.5 text-sm outline-none',
      'focus:bg-accent focus:text-accent-foreground [&_svg]:size-4',
      className,
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = 'DropdownMenuItem';
```

- [ ] **Step 3: Create `src/components/ui/sonner.tsx`**

```tsx
import { Toaster as SonnerToaster } from 'sonner';
import { useTheme } from '@/state/theme';

export function Toaster() {
  const { resolved } = useTheme();
  return (
    <SonnerToaster
      theme={resolved}
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: 'rounded-[6px] border border-border bg-card text-card-foreground text-sm',
        },
      }}
    />
  );
}
```

- [ ] **Step 4: Create `src/components/TopBar.tsx`**

```tsx
import { Download, FileJson, FileArchive } from 'lucide-react';
import { toast } from 'sonner';
import { useProject } from '@/state/projectStore';
import { renderAll } from '@/export/markdown';
import { buildZip } from '@/export/zip';
import { serialize } from '@/export/project';
import { SaveStatus } from '@/components/SaveStatus';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { SaveState } from '@/state/useSaveStatus';

function download(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function TopBar({ saveState }: { saveState: SaveState }) {
  const { state, dispatch } = useProject();

  async function handleZip() {
    try {
      download('thinkflow-docs.zip', await buildZip(renderAll(state.project)));
      toast.success('Exported thinkflow-docs.zip');
    } catch {
      toast.error('Could not build the zip archive');
    }
  }

  function handleJson() {
    try {
      download('project.json', new Blob([serialize(state.project)], { type: 'application/json' }));
      toast.success('Exported project.json');
    } catch {
      toast.error('Could not export the project file');
    }
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
      <Input
        aria-label="Project name"
        className="h-8 max-w-72 font-medium"
        value={state.project.meta.name}
        onChange={e => dispatch({ type: 'PATCH_META', patch: { name: e.target.value } })}
      />
      <SaveStatus state={saveState} />
      <div className="flex-1" />
      <ThemeToggle />
      <Separator orientation="vertical" className="h-5" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" aria-label="Export actions">
            <Download aria-hidden="true" />
            <span aria-hidden="true">Export</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={handleZip}>
            <FileArchive aria-hidden="true" />
            Download all (.zip)
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleJson}>
            <FileJson aria-hidden="true" />
            Download project (.json)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
```

- [ ] **Step 5: Create `src/components/AppShell.tsx`**

```tsx
import { useProject } from '@/state/projectStore';
import { useSaveStatus } from '@/state/useSaveStatus';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { Toaster } from '@/components/ui/sonner';
import { VisionForm } from '@/stages/VisionForm';
import { RequirementsForm } from '@/stages/RequirementsForm';
import { ArchitectureForm } from '@/stages/ArchitectureForm';
import { TasksForm } from '@/stages/TasksForm';
import { TestingForm } from '@/stages/TestingForm';
import { TraceabilityView } from '@/components/TraceabilityView';
import { ExportPanel } from '@/components/ExportPanel';

export function AppShell() {
  const { state } = useProject();
  const saveState = useSaveStatus(state.project);

  return (
    <div className="flex h-full">
      <aside className="hidden w-64 shrink-0 flex-col gap-4 overflow-y-auto border-r border-border bg-card p-4 md:flex">
        <div className="flex items-baseline justify-between gap-2 border-b border-border pb-3">
          <span className="text-[15px] font-bold tracking-tight">ThinkFlow Studio</span>
          <span className="font-mono text-[11px] text-muted-foreground">REV-01</span>
        </div>
        <Sidebar />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar saveState={saveState} />
        <main className="min-w-0 flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-3xl">
            {state.view === 'vision' && <VisionForm />}
            {state.view === 'requirements' && <RequirementsForm />}
            {state.view === 'architecture' && <ArchitectureForm />}
            {state.view === 'tasks' && <TasksForm />}
            {state.view === 'testing' && <TestingForm />}
            {state.view === 'traceability' && <TraceabilityView />}
            {state.view === 'export' && <ExportPanel />}
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}
```

The sidebar is `hidden md:flex`; on narrow viewports the rail is not rendered. A Sheet-based mobile nav is deliberately out of scope here — the desktop breakpoint is what the tests and the deployed use case exercise.

- [ ] **Step 6: Rewrite `src/App.tsx`**

```tsx
import { useState } from 'react';
import { ProjectProvider } from '@/state/projectStore';
import { ThemeProvider } from '@/state/theme';
import { ConfirmProvider } from '@/state/confirm';
import { loadProject, clearProject, STORAGE_KEY } from '@/state/persistence';
import { AppShell } from '@/components/AppShell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Project } from '@/model/types';

function RecoveryBanner({ reason, onFresh }: { reason: string; onFresh: () => void }) {
  function handleExportRaw() {
    const raw = localStorage.getItem(STORAGE_KEY) ?? '';
    const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'thinkflow-project-raw.json';
    a.click();
    URL.revokeObjectURL(url);
  }
  function handleStartFresh() {
    clearProject();
    onFresh();
  }
  return (
    <Card className="max-w-md p-6" role="alert">
      <p className="mb-4 text-sm">Could not load your saved project: {reason}</p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleExportRaw}>Export raw</Button>
        <Button variant="outline" size="sm" onClick={handleStartFresh}>Start fresh</Button>
      </div>
    </Card>
  );
}

function App() {
  const [loaded] = useState(() => loadProject());
  const [fresh, setFresh] = useState(false);

  if (loaded.ok === false && !fresh) {
    return (
      <ThemeProvider>
        <div className="flex h-full items-center justify-center p-8">
          <RecoveryBanner reason={loaded.reason} onFresh={() => setFresh(true)} />
        </div>
      </ThemeProvider>
    );
  }

  const preload: Project | undefined = !fresh && loaded.ok === true ? loaded.project : undefined;
  return (
    <ThemeProvider>
      <ConfirmProvider>
        <ProjectProvider preload={preload}>
          <AppShell />
        </ProjectProvider>
      </ConfirmProvider>
    </ThemeProvider>
  );
}

export default App;
```

- [ ] **Step 7: Run the integration test unchanged**

Run: `npx vitest run src/App.integration.test.tsx`
Expected: PASS. If a stage-label query becomes ambiguous, the cause is a new button leaking a stage word into its accessible name — fix the component, not the test.

- [ ] **Step 8: Run the full suite, typecheck, and build**

Run: `npm test && npx tsc -b && npm run build`
Expected: 75 tests pass, no TS errors, build succeeds.

- [ ] **Step 9: Commit**

```bash
git add src/App.tsx src/components/AppShell.tsx src/components/TopBar.tsx src/components/ui/dropdown-menu.tsx src/components/ui/sonner.tsx package.json package-lock.json
git commit -m "Split App into AppShell + TopBar with save status, theme toggle, and export menu"
```

---

### Task 10: Traceability matrix on TanStack Table

**Files:**
- Create: `src/components/ui/table.tsx`
- Rewrite: `src/components/TraceabilityView.tsx`
- Test: `src/components/TraceabilityView.test.tsx` (extend — keep existing cases verbatim)

**Interfaces:**
- Consumes: `buildMatrix`, `detectGaps`, `MatrixRow`, `Gap`, TanStack `useReactTable`.
- Produces: `TraceabilityView()` — unchanged export signature.

**Critical:** the existing test reads `container.querySelector('pre')`. The mermaid chain must stay in a `<pre>`. The "No gaps" copy must still match `/No gaps/i` for `App.integration.test.tsx`.

- [ ] **Step 1: Add the failing sort/filter test**

Append to `src/components/TraceabilityView.test.tsx`:

```tsx
it('filters matrix rows by the filter box', async () => {
  const project = { ...emptyProject('P') };
  project.requirements.stories = [
    { id: 'US-1', role: '', want: '', benefit: '', priority: 'Must', servesGoalId: null },
    { id: 'US-2', role: '', want: '', benefit: '', priority: 'Must', servesGoalId: null },
  ];
  render(
    <ProjectProvider preload={project}>
      <TraceabilityView />
    </ProjectProvider>,
  );
  expect(screen.getByText('US-2')).toBeInTheDocument();

  await userEvent.type(screen.getByLabelText(/filter rows/i), 'US-1');
  expect(screen.queryByText('US-2')).not.toBeInTheDocument();
});
```

Add whatever imports that file is missing: `userEvent` from `@testing-library/user-event` and `emptyProject` from `@/model/types`.

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/components/TraceabilityView.test.tsx`
Expected: FAIL — no element labelled "Filter rows".

- [ ] **Step 3: Create `src/components/ui/table.tsx`**

```tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

export const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="w-full overflow-x-auto">
      <table ref={ref} className={cn('w-full border-collapse text-[13.5px]', className)} {...props} />
    </div>
  ),
);
Table.displayName = 'Table';

export const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        'border-b border-border px-2.5 py-2 text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground',
        className,
      )}
      {...props}
    />
  ),
);
TableHead.displayName = 'TableHead';

export const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn('border-b border-border px-2.5 py-2 font-mono text-[12.5px]', className)} {...props} />
  ),
);
TableCell.displayName = 'TableCell';
```

- [ ] **Step 4: Rewrite `src/components/TraceabilityView.tsx`**

Keep `mermaidId`, `mermaidNode`, and `buildMermaidChain` exactly as they are — copy them across unchanged.

```tsx
import { useMemo, useState } from 'react';
import {
  createColumnHelper, flexRender, getCoreRowModel, getFilteredRowModel,
  getSortedRowModel, useReactTable, type SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, Copy, TriangleAlert, CircleCheck } from 'lucide-react';
import { useProject } from '@/state/projectStore';
import { buildMatrix, detectGaps, type Gap, type MatrixRow } from '@/model/traceability';
import { SectionCard } from '@/components/SectionCard';
import { Table, TableHead, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { Project } from '@/model/types';
import { cn } from '@/lib/utils';

function mermaidId(id: string): string {
  return id.replace(/[^A-Za-z0-9_]/g, '_');
}

function mermaidNode(id: string): string {
  return `${mermaidId(id)}["${id}"]`;
}

function buildMermaidChain(project: Project): string {
  const lines: string[] = ['flowchart LR'];
  for (const s of project.requirements.stories) {
    if (s.servesGoalId) {
      const goal = project.goals.find(g => g.id === s.servesGoalId);
      if (goal) lines.push(`  ${mermaidNode(goal.id)} --> ${mermaidNode(s.id)}`);
    }
  }
  for (const c of project.requirements.criteria) {
    lines.push(`  ${mermaidNode(c.storyId)} --> ${mermaidNode(c.id)}`);
  }
  for (const t of project.tasks) {
    for (const ref of t.tracesTo) {
      lines.push(`  ${mermaidNode(ref)} --> ${mermaidNode(t.id)}`);
    }
  }
  for (const test of project.testing.tests) {
    if (test.verifies) {
      lines.push(`  ${mermaidNode(test.verifies)} --> ${mermaidNode(test.id)}`);
    }
  }
  return lines.join('\n');
}

const GAP_KIND_LABEL: Record<Gap['kind'], string> = {
  'untested-criterion': 'Untested criteria',
  'orphan-task': 'Orphan tasks',
  'unrealized-story': 'Unrealized stories',
  'goalless-story': 'Goalless stories',
  'dangling-link': 'Dangling links',
};

function GapPanel({ gaps }: { gaps: Gap[] }) {
  if (gaps.length === 0) {
    return (
      <p className="inline-flex items-center gap-2 font-semibold text-ok">
        <CircleCheck aria-hidden="true" className="size-4" />
        No gaps — every artifact is traced
      </p>
    );
  }
  const byKind = new Map<Gap['kind'], Gap[]>();
  for (const g of gaps) byKind.set(g.kind, [...(byKind.get(g.kind) ?? []), g]);

  return (
    <div className="flex flex-col gap-3">
      {[...byKind.entries()].map(([kind, list]) => (
        <div key={kind} className="rounded-[6px] border border-warn/40 bg-warn-soft/50 p-3">
          <div className="mb-1.5 flex items-center gap-2">
            <TriangleAlert aria-hidden="true" className="size-4 text-warn" />
            <span className="text-[13px] font-semibold text-warn">{GAP_KIND_LABEL[kind]}</span>
            <Badge variant="warn">{list.length}</Badge>
          </div>
          <ul className="m-0 list-disc pl-5 text-[13px]">
            {list.map(g => <li key={`${g.kind}-${g.entityId}-${g.message}`}>{g.message}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}

const columnHelper = createColumnHelper<MatrixRow>();

export function TraceabilityView() {
  const { state } = useProject();
  const project = state.project;
  const rows = useMemo(() => buildMatrix(project), [project]);
  const gaps = detectGaps(project);
  const mermaid = buildMermaidChain(project);
  const gappyIds = useMemo(() => new Set(gaps.map(g => g.entityId)), [gaps]);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [filter, setFilter] = useState('');

  const columns = useMemo(
    () => [
      columnHelper.accessor('storyId', { header: 'Story' }),
      columnHelper.accessor(r => r.goalId ?? '—', { id: 'goalId', header: 'Goal' }),
      columnHelper.accessor(r => r.criterionId ?? '—', { id: 'criterionId', header: 'Criterion' }),
      columnHelper.accessor(r => r.taskIds.join(', '), { id: 'taskIds', header: 'Tasks' }),
      columnHelper.accessor(r => r.testIds.join(', '), { id: 'testIds', header: 'Tests' }),
    ],
    [],
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, globalFilter: filter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="traceability-view">
      <SectionCard title="Traceability matrix" count={rows.length}>
        <div className="mb-3 flex flex-col gap-1">
          <Label htmlFor="matrix-filter">Filter rows</Label>
          <Input
            id="matrix-filter"
            className="max-w-64"
            value={filter}
            placeholder="US-1, AC-1.1, TASK-2…"
            onChange={e => setFilter(e.target.value)}
          />
        </div>
        <Table>
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(header => (
                  <TableHead key={header.id}>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:text-foreground"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <ArrowUpDown aria-hidden="true" className="size-3 opacity-50" />
                    </button>
                  </TableHead>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => {
              const hasGap =
                gappyIds.has(row.original.storyId) ||
                (row.original.criterionId !== null && gappyIds.has(row.original.criterionId));
              return (
                <tr
                  key={row.id}
                  className={cn('hover:bg-muted', hasGap && 'border-l-2 border-l-warn bg-warn-soft/30')}
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </Table>
      </SectionCard>

      <SectionCard title="Gaps" count={gaps.length}>
        <GapPanel gaps={gaps} />
      </SectionCard>

      <SectionCard title="Traceability chain">
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            aria-label="Copy chain"
            onClick={() => navigator.clipboard?.writeText(mermaid)}
          >
            <Copy aria-hidden="true" />
            Copy
          </Button>
        </div>
        <pre className="overflow-auto rounded-[6px] border border-border bg-muted p-3 font-mono text-[12.5px] leading-relaxed">
          {mermaid}
        </pre>
      </SectionCard>
    </div>
  );
}
```

- [ ] **Step 5: Run the TraceabilityView tests**

Run: `npx vitest run src/components/TraceabilityView.test.tsx`
Expected: PASS, including the pre-existing `container.querySelector('pre')` case.

- [ ] **Step 6: Run the full suite**

Run: `npm test && npx tsc -b`
Expected: 76 tests pass, no TS errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/TraceabilityView.tsx src/components/TraceabilityView.test.tsx src/components/ui/table.tsx
git commit -m "Rebuild traceability matrix on TanStack Table with sorting, filtering, and gap highlighting"
```

---

### Task 11: Export panel

**Files:**
- Rewrite: `src/components/ExportPanel.tsx`
- Test: `src/components/ExportPanel.test.tsx` (must pass **unchanged**)

**Interfaces:**
- Consumes: `renderAll`, `buildZip`, `serialize`, `parse`, `SectionCard`, `Button`, `Input`, `Label`, `toast`.
- Produces: `ExportPanel()` — unchanged export signature.

**Critical:** the existing test asserts `getByText(/# Untitled Project — Vision/)`, so the preview must still default to file index 0 and render its content as visible text.

- [ ] **Step 1: Add the failing import-error test**

Append to `src/components/ExportPanel.test.tsx`:

```tsx
it('keeps the preview select labelled', () => {
  render(<ProjectProvider><ExportPanel /></ProjectProvider>);
  const select = screen.getByLabelText(/preview file/i);
  expect(select.tagName).toBe('SELECT');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/components/ExportPanel.test.tsx`
Expected: FAIL — no element labelled "Preview file".

- [ ] **Step 3: Rewrite `src/components/ExportPanel.tsx`**

```tsx
import React, { useState } from 'react';
import { FileArchive, FileJson, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useProject } from '@/state/projectStore';
import { renderAll } from '@/export/markdown';
import { buildZip } from '@/export/zip';
import { serialize, parse } from '@/export/project';
import { SectionCard } from '@/components/SectionCard';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const selectClass = cn(
  'flex w-full max-w-72 rounded-[6px] border border-input bg-card px-3 py-1.5 text-sm text-foreground',
  'focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-accent',
);

function download(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportPanel() {
  const { state, dispatch } = useProject();
  const project = state.project;
  const files = renderAll(project);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [importError, setImportError] = useState<string | null>(null);

  async function handleDownloadZip() {
    try {
      download('thinkflow-docs.zip', await buildZip(renderAll(project)));
      toast.success('Exported thinkflow-docs.zip');
    } catch {
      toast.error('Could not build the zip archive');
    }
  }

  function handleDownloadJson() {
    try {
      download('project.json', new Blob([serialize(project)], { type: 'application/json' }));
      toast.success('Exported project.json');
    } catch {
      toast.error('Could not export the project file');
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const text = await file.text();
    const result = parse(text);
    if (result.ok) {
      setImportError(null);
      dispatch({ type: 'REPLACE_PROJECT', project: result.project });
      toast.success(`Imported ${file.name}`);
    } else {
      setImportError(result.reason);
      toast.error('Import failed');
    }
  }

  return (
    <div className="export-panel">
      <SectionCard title="Preview" count={files.length}>
        <div className="mb-3 flex flex-col gap-1">
          <Label htmlFor="preview-file">Preview file</Label>
          <select
            id="preview-file"
            className={selectClass}
            value={selectedIndex}
            onChange={e => setSelectedIndex(Number(e.target.value))}
          >
            {files.map((f, i) => <option key={f.name} value={i}>{f.name}</option>)}
          </select>
        </div>
        <pre className="max-h-96 overflow-auto rounded-[6px] border border-border bg-muted p-3 font-mono text-[12.5px] leading-relaxed">
          {files[selectedIndex].content}
        </pre>
      </SectionCard>

      <SectionCard title="Download">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[6px] border border-border p-4">
            <div className="mb-1 flex items-center gap-2 text-[14px] font-semibold">
              <FileArchive aria-hidden="true" className="size-4 text-muted-foreground" />
              Documents
            </div>
            <p className="mb-3 text-[13px] text-muted-foreground">
              Every rendered markdown document, zipped.
            </p>
            <Button variant="outline" size="sm" onClick={handleDownloadZip}>Download all (.zip)</Button>
          </div>
          <div className="rounded-[6px] border border-border p-4">
            <div className="mb-1 flex items-center gap-2 text-[14px] font-semibold">
              <FileJson aria-hidden="true" className="size-4 text-muted-foreground" />
              Project file
            </div>
            <p className="mb-3 text-[13px] text-muted-foreground">
              The full project state, re-importable below.
            </p>
            <Button variant="outline" size="sm" onClick={handleDownloadJson}>Download project (.json)</Button>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Import">
        <div className="flex flex-col gap-2 rounded-[6px] border border-dashed border-border p-4">
          <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <Upload aria-hidden="true" className="size-4" />
            Replace the current project with a saved <code className="font-mono">project.json</code>.
          </div>
          <input
            type="file"
            accept="application/json"
            aria-label="Import project file"
            onChange={handleImport}
            className="text-[13px] file:mr-3 file:rounded-[6px] file:border file:border-border file:bg-card file:px-3 file:py-1.5 file:text-[13px] file:text-foreground hover:file:border-primary"
          />
        </div>
        {importError && <p role="alert" className="mt-2 text-[13px] text-warn">{importError}</p>}
      </SectionCard>
    </div>
  );
}
```

- [ ] **Step 4: Run the ExportPanel tests**

Run: `npx vitest run src/components/ExportPanel.test.tsx`
Expected: PASS — 2 tests.

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: 77 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/ExportPanel.tsx src/components/ExportPanel.test.tsx
git commit -m "Redesign export panel with action cards, labelled preview, and toasts"
```

---

### Task 12: Apply SectionCard across the stage forms

**Files:**
- Modify: `src/stages/VisionForm.tsx`, `RequirementsForm.tsx`, `ArchitectureForm.tsx`, `TasksForm.tsx`, `TestingForm.tsx`
- Test: all five existing stage test files must pass **unchanged**

**Interfaces:**
- Consumes: `SectionCard`.
- Produces: no signature changes — each form keeps its current default export and props.

**Critical:** `SectionCard` renders its title inside an `<h3>`. Do not introduce a title that collides with an existing `getByRole('button', ...)` or `getByText(...)` query. Read each test file before editing its form.

- [ ] **Step 1: Read the five stage test files**

Run: `npx vitest run src/stages --reporter=verbose`
Note every string each test queries. These are the names that must not change.

- [ ] **Step 2: Convert `RequirementsForm.tsx`**

Replace each `<section><h3>Title</h3>…</section>` with a `SectionCard`. For example, the Goals section becomes:

```tsx
<SectionCard title="Goals" count={project.goals.length}>
  <RepeatableList<Goal>
    items={project.goals}
    addLabel="Add goal"
    onAdd={() => dispatch({ type: 'ADD_GOAL' })}
    onRemove={i => replace({ goals: project.goals.filter((_, idx) => idx !== i) })}
    renderItem={(item, i) => (
      <>
        <Badge className="mb-2">{item.id}</Badge>
        <TextField
          label="Text"
          value={item.text}
          onChange={v => replace({
            goals: project.goals.map((g, idx) => idx === i ? { ...g, text: v } : g),
          })}
        />
        <TextField
          label="Metric"
          value={item.metric}
          onChange={v => replace({
            goals: project.goals.map((g, idx) => idx === i ? { ...g, metric: v } : g),
          })}
        />
      </>
    )}
  />
</SectionCard>
```

Apply the same shape to Stories, Non-functional requirements, Assumptions, Constraints, Non-goals, and Signoff, using the matching `.length` for `count`. Replace every `<div className="id-tag">{x.id}</div>` with `<Badge className="mb-2">{x.id}</Badge>`. Replace the nested `<h4>Criteria</h4>` with:

```tsx
<h4 className="mb-2 mt-4 font-mono text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">
  Criteria
</h4>
```

Add the imports:

```tsx
import { SectionCard } from '@/components/SectionCard';
import { Badge } from '@/components/ui/badge';
```

- [ ] **Step 3: Run the RequirementsForm tests**

Run: `npx vitest run src/stages/RequirementsForm.test.tsx`
Expected: PASS — 5 tests.

- [ ] **Step 4: Convert `VisionForm.tsx`**

`VisionForm` currently has no `<section>` wrappers — its `RepeatableList`s are bare. Wrap each in a `SectionCard` and wrap the three leading `TextArea`s in one:

```tsx
<SectionCard title="Vision">
  <TextArea label="Vision statement" value={vision.statement} onChange={v => patch({ statement: v })} />
  <TextArea label="Why now" value={vision.whyNow} onChange={v => patch({ whyNow: v })} />
  <TextArea label="Success narrative" value={vision.successNarrative} onChange={v => patch({ successNarrative: v })} />
</SectionCard>
```

Then wrap the lists: `<SectionCard title="Problems" count={vision.problems.length}>`, `"Beneficiaries"`, `"Non-goals"`, `"Assumptions"`, `"Risks"` — each around its existing `RepeatableList`, which is otherwise unchanged.

- [ ] **Step 5: Convert the remaining three forms**

Apply the same pattern to `ArchitectureForm.tsx`, `TasksForm.tsx`, and `TestingForm.tsx`: every `<section><h3>X</h3>` becomes `<SectionCard title="X" count={…}>`, and every `<div className="id-tag">` becomes `<Badge className="mb-2">`. Leave all field labels, add-button labels, and dispatch calls untouched.

- [ ] **Step 6: Run the full suite, typecheck, and build**

Run: `npm test && npx tsc -b && npm run build`
Expected: 77 tests pass, no TS errors, build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/stages/
git commit -m "Adopt SectionCard and Badge across all five stage forms"
```

---

### Task 13: Final verification

**Files:** none created. This task only verifies and fixes fallout.

- [ ] **Step 1: Confirm no dead CSS class names remain**

Run: `grep -rn "id-tag\|repeatable-list\|storage-warning\|recovery-banner\|sidebar-col\|app-shell\|brand-name\|brand-tag" src/ --include=*.tsx`
Expected: no matches. Any hit is a leftover class with no CSS behind it — remove it.

- [ ] **Step 2: Run the full verification chain**

Run: `npm test && npx tsc -b && npm run build`
Expected: 77 tests pass, no TS errors, build succeeds.

- [ ] **Step 3: Check the built bundle size**

Run: `ls -la dist/assets/`
Note the JS and CSS sizes. If the JS bundle exceeds ~800 KB uncompressed, report it — do not silently accept it.

- [ ] **Step 4: Drive the app in a browser**

Run: `npm run dev`

Verify by hand, and capture a screenshot of each:
1. Light theme renders with the blueprint palette; the sidebar shows `01`–`05` numbering.
2. The theme toggle switches to dark and the choice survives a page reload.
3. Adding a story then deleting it with a criterion attached opens the AlertDialog; Cancel keeps it, Delete removes it.
4. The save indicator moves through `Saving…` → `Saved` as you type.
5. The traceability matrix sorts on a header click and filters from the box; gap rows show the warn edge.
6. An export raises a success toast.

- [ ] **Step 5: Report results**

State plainly which of the six checks passed and which did not, with the actual test count and bundle sizes. Do not claim completion for anything not observed.

- [ ] **Step 6: Commit any fixes**

```bash
git add -A
git commit -m "Clean up dead style hooks after the UI rebuild"
```

---

## Self-Review

**Spec coverage:**

| Spec section | Task |
|---|---|
| Token layer, palette, fonts | 1 |
| shadcn primitives vendored | 2 |
| Theme toggle, `.dark` class, `system` default | 3 |
| `inputs.tsx` API-stable, native selects, Remove name | 4 |
| `SectionCard` | 5 |
| `ConfirmProvider` / `useConfirm`, 3 tests rewritten | 6 |
| Save status three states | 7 |
| Sidebar icons + gap indicators | 8 |
| `AppShell` / `TopBar` split, sonner, export menu | 9 |
| TanStack matrix, grouped gaps, `<pre>` preserved | 10 |
| Export cards, toasts, styled import | 11 |
| SectionCard across stage forms | 12 |
| Full verification incl. browser | 13 |

**Known deviation from the spec:** the spec called for a Radix Sheet mobile nav. Task 9 renders the sidebar `hidden md:flex` instead and drops the Sheet. Rationale: it is the one piece with no test coverage and no bearing on the deployed desktop use case, and the Sheet primitive would otherwise be vendored for a single consumer. Flagging rather than silently omitting — say so if you want it built.

**Type consistency:** `SaveState` is defined once in `src/state/useSaveStatus.ts` and imported by `SaveStatus.tsx` and `TopBar.tsx`. `Theme` and `THEME_STORAGE_KEY` come from `src/state/theme.tsx`. `ConfirmOptions` comes from `src/state/confirm.tsx`. `Gap`, `MatrixRow`, `Project` are imported from the untouched model modules. `buttonVariants` is exported from `button.tsx` and consumed by `confirm.tsx`.

**Test count trajectory:** 63 → 64 (T1) → 65 (T2) → 67 (T3) → 70 (T4) → 71 (T5) → 73 (T6) → 74 (T7) → 75 (T8) → 76 (T10) → 77 (T11).
