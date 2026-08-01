import { useProject } from '@/state/projectStore';
import type { View } from '@/state/projectStore';
import { useSaveStatus } from '@/state/useSaveStatus';
import { Sidebar } from '@/components/Sidebar';
import { Brand } from '@/components/Brand';
import { TopBar } from '@/components/TopBar';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import { VisionForm } from '@/stages/VisionForm';
import { RequirementsForm } from '@/stages/RequirementsForm';
import { ArchitectureForm } from '@/stages/ArchitectureForm';
import { TasksForm } from '@/stages/TasksForm';
import { TestingForm } from '@/stages/TestingForm';
import { TraceabilityView } from '@/components/TraceabilityView';
import { ExportPanel } from '@/components/ExportPanel';

/* Stages built on ListDetail need the full width for their inspector rail;
   the prose-shaped stages stay in a comfortable reading column. */
const WIDE_VIEWS: View[] = ['requirements', 'tasks', 'testing'];

export function AppShell() {
  const { state } = useProject();
  const saveState = useSaveStatus(state.project);

  return (
    <div className="flex h-full">
      <aside className="hidden w-64 shrink-0 flex-col gap-4 overflow-y-auto border-r border-border bg-card p-4 md:flex">
        <Brand />
        <Sidebar />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar saveState={saveState} onOpenPalette={() => {}} />
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto p-6">
          <div
            className={cn(
              'flex min-h-0 w-full flex-1 flex-col',
              !WIDE_VIEWS.includes(state.view) && 'mx-auto max-w-3xl',
            )}
          >
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
