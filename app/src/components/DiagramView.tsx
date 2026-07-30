import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/state/theme';
import { loadMermaid } from '@/lib/mermaid';
import { cn } from '@/lib/utils';

export interface DiagramViewProps {
  source: string;
  /** Accessible label for the diagram region. */
  label: string;
  /** Fires with a node's label text when clicked. Omit to disable navigation. */
  onNodeClick?: (entityId: string) => void;
  /** Tests pass 0. Production debounces because architecture sources change per keystroke. */
  debounceMs?: number;
}

/** A bare `flowchart LR` header with no edges is not worth loading mermaid for. */
function hasEdges(source: string): boolean {
  return source.trim().split('\n').filter(l => l.trim()).length > 1;
}

export function DiagramView({ source, label, onNodeClick, debounceMs = 300 }: DiagramViewProps) {
  const { resolved } = useTheme();
  const [svg, setSvg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showSource, setShowSource] = useState(false);
  const seqRef = useRef(0);

  const drawable = hasEdges(source);

  useEffect(() => {
    if (!drawable) {
      setSvg('');
      setError(null);
      return;
    }
    const seq = ++seqRef.current;
    const timer = setTimeout(async () => {
      try {
        const mermaid = await loadMermaid(resolved === 'dark');
        const { svg: out } = await mermaid.render(`thinkflow-diagram-${seq}`, source);
        if (seq !== seqRef.current) return; // a newer edit already won
        setSvg(out);
        setError(null);
      } catch (e) {
        if (seq !== seqRef.current) return;
        setError(e instanceof Error ? e.message : String(e));
      }
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [source, resolved, drawable, debounceMs]);

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!onNodeClick) return;
    const node = (e.target as Element).closest?.('.node');
    const text = node?.textContent?.trim();
    if (text) onNodeClick(text);
  }

  if (!drawable) {
    return (
      <p className="rounded-[6px] border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Nothing to diagram yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <p
          role="status"
          className="rounded-[6px] border border-warn bg-warn-soft px-3 py-2 font-mono text-[12.5px] text-warn"
        >
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => setShowSource(s => !s)}>
          View source
        </Button>
      </div>

      {/* dangerouslySetInnerHTML is safe here only because of how the SVG was produced:
          mermaid ran with securityLevel 'strict', under which it HTML-encodes label text,
          refuses `click` directives, and pipes its own output through DOMPurify (a direct
          mermaid dependency, 3.4.12). A second sanitiser pass here would be redundant and
          would risk stripping legitimate SVG that mermaid's own profile allows.
          If securityLevel in lib/mermaid.ts is ever relaxed, this line becomes an XSS hole. */}
      <div
        role="img"
        aria-label={label}
        onClick={handleClick}
        className={cn(
          'overflow-auto rounded-[6px] border border-border bg-card p-3',
          error && 'opacity-50',
        )}
        dangerouslySetInnerHTML={{ __html: svg }}
      />

      {showSource && (
        <pre className="overflow-auto rounded-[6px] border border-border bg-muted p-3 font-mono text-[12.5px] leading-relaxed">
          {source}
        </pre>
      )}
    </div>
  );
}
