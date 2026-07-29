import { Download, FileJson, FileArchive } from 'lucide-react';
import { toast } from 'sonner';
import { useProject } from '@/state/projectStore';
import { renderAll } from '@/export/markdown';
import { buildZip } from '@/export/zip';
import { serialize } from '@/export/project';
import { SaveStatus } from '@/components/SaveStatus';
import { MobileNav } from '@/components/MobileNav';
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
      <MobileNav />
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
      {/* Named "Export actions", not "Export" — App.integration.test.tsx resolves the sidebar's
          Export button by role and name, and a second /Export/i match would make it ambiguous. */}
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
