import { useEffect, useState } from 'react';
import { useProject } from '@/state/projectStore';
import type { View } from '@/state/projectStore';
import { useSaveStatus } from '@/state/useSaveStatus';
import { Sidebar } from '@/components/Sidebar';
import { Brand } from '@/components/Brand';
import { TopBar } from '@/components/TopBar';
import { CommandPalette } from '@/components/CommandPalette';
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
const WIDE_VIEWS: View[] = ['vision', 'requirements', 'architecture', 'tasks', 'testing'];

export function AppShell() {
  const { state } = useProject();
  const saveState = useSaveStatus(state.project);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      /* Ctrl+K on Windows/Linux, Cmd+K on macOS. preventDefault stops the
         browser's own focus-address-bar binding. */
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(open => !open);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="flex h-full">
      {/* An icon rail that expands on hover or keyboard focus. The wrapper holds a fixed
          4rem slot in the layout and the panel floats above it, so expanding overlays the
          content instead of reflowing the whole page. */}
      <div className="group/rail relative hidden w-16 shrink-0 md:block">
        <aside
          className={cn(
            'absolute inset-y-0 left-0 z-30 flex w-16 flex-col gap-4 overflow-y-auto overflow-x-hidden',
            'border-r border-border bg-card p-3 transition-[width] duration-200',
            'group-hover/rail:w-64 group-hover/rail:shadow-lg',
            'focus-within:w-64 focus-within:shadow-lg',
          )}
        >
          <Brand />
          <Sidebar collapsible />
        </aside>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar saveState={saveState} onOpenPalette={() => setPaletteOpen(true)} />
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
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <Toaster />
    </div>
  );
}
