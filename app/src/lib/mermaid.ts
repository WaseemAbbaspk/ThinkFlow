type MermaidApi = (typeof import('mermaid'))['default'];

let modulePromise: Promise<MermaidApi> | null = null;

/**
 * Dynamic import so mermaid (~800 kB) becomes its own async chunk rather than
 * loading for every visitor. A static import here would fail the CI bundle budget.
 *
 * securityLevel 'strict' and htmlLabels false matter: diagram source is user-typed
 * and can arrive from an imported project file, so the generated SVG is sanitised
 * and mermaid `click` directives are refused.
 */
export async function loadMermaid(dark: boolean): Promise<MermaidApi> {
  if (!modulePromise) modulePromise = import('mermaid').then(m => m.default);
  const mermaid = await modulePromise;
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    htmlLabels: false,
    theme: dark ? 'dark' : 'base',
  });
  return mermaid;
}
