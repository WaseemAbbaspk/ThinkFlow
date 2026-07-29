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
