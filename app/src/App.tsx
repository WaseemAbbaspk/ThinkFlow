import { useEffect, useState } from 'react';
import { ProjectProvider, useProject } from './state/projectStore';
import { loadProject, saveProject, clearProject, STORAGE_KEY } from './state/persistence';
import { Sidebar } from './components/Sidebar';
import { TextField } from './components/inputs';
import { VisionForm } from './stages/VisionForm';
import { RequirementsForm } from './stages/RequirementsForm';
import { ArchitectureForm } from './stages/ArchitectureForm';
import { TasksForm } from './stages/TasksForm';
import { TestingForm } from './stages/TestingForm';
import { TraceabilityView } from './components/TraceabilityView';
import { ExportPanel } from './components/ExportPanel';
import type { Project } from './model/types';

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
    <div className="recovery-banner" role="alert">
      <p>Could not load your saved project: {reason}</p>
      <button type="button" onClick={handleExportRaw}>Export raw</button>
      <button type="button" onClick={handleStartFresh}>Start fresh</button>
    </div>
  );
}

function Shell() {
  const { state, dispatch } = useProject();
  const [saveHealthy, setSaveHealthy] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setSaveHealthy(saveProject(state.project)), 500);
    return () => clearTimeout(id);
  }, [state.project]);

  return (
    <div className="app-shell">
      <aside className="sidebar-col">
        <div className="brand">
          <span className="brand-name">ThinkFlow Studio</span>
          <span className="brand-tag">REV-01</span>
        </div>
        <TextField
          label="Project name"
          value={state.project.meta.name}
          onChange={v => dispatch({ type: 'PATCH_META', patch: { name: v } })}
        />
        <Sidebar />
      </aside>
      <main>
        {!saveHealthy && (
          <div className="storage-warning" role="status">
            Your work could not be saved to this browser. Export your project to avoid losing it.
          </div>
        )}
        {state.view === 'vision' && <VisionForm />}
        {state.view === 'requirements' && <RequirementsForm />}
        {state.view === 'architecture' && <ArchitectureForm />}
        {state.view === 'tasks' && <TasksForm />}
        {state.view === 'testing' && <TestingForm />}
        {state.view === 'traceability' && <TraceabilityView />}
        {state.view === 'export' && <ExportPanel />}
      </main>
    </div>
  );
}

function App() {
  const [loaded] = useState(() => loadProject());
  const [fresh, setFresh] = useState(false);

  if (loaded.ok === false && !fresh) {
    return (
      <div className="recovery-page">
        <RecoveryBanner reason={loaded.reason} onFresh={() => setFresh(true)} />
      </div>
    );
  }

  const preload: Project | undefined = !fresh && loaded.ok === true ? loaded.project : undefined;
  return (
    <ProjectProvider preload={preload}>
      <Shell />
    </ProjectProvider>
  );
}

export default App;
