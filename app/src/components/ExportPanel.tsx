import React, { useState } from 'react';
import { useProject } from '../state/projectStore';
import { renderAll } from '../export/markdown';
import { buildZip } from '../export/zip';
import { serialize, parse } from '../export/project';

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
    const blob = await buildZip(renderAll(project));
    download('thinkflow-docs.zip', blob);
  }

  function handleDownloadJson() {
    download('project.json', new Blob([serialize(project)], { type: 'application/json' }));
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
    } else {
      setImportError(result.reason);
    }
  }

  return (
    <div className="export-panel">
      <section>
        <h3>Preview</h3>
        <select
          value={selectedIndex}
          onChange={e => setSelectedIndex(Number(e.target.value))}
        >
          {files.map((f, i) => (
            <option key={f.name} value={i}>{f.name}</option>
          ))}
        </select>
        <pre>{files[selectedIndex].content}</pre>
      </section>

      <section>
        <h3>Download</h3>
        <button type="button" onClick={handleDownloadZip}>Download all (.zip)</button>
        <button type="button" onClick={handleDownloadJson}>Download project (.json)</button>
      </section>

      <section>
        <h3>Import</h3>
        <input type="file" accept="application/json" onChange={handleImport} />
        {importError && <p role="alert">{importError}</p>}
      </section>
    </div>
  );
}
