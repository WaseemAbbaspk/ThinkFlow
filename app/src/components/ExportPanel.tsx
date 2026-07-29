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
