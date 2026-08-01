import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useProject, type View } from '@/state/projectStore';
import { useTheme } from '@/state/theme';
import { entityIndex } from '@/model/registry';
import {
  Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,
} from '@/components/ui/command';

const STAGES: { view: View; label: string }[] = [
  { view: 'vision', label: 'Vision' },
  { view: 'requirements', label: 'Requirements' },
  { view: 'architecture', label: 'Architecture' },
  { view: 'tasks', label: 'Tasks' },
  { view: 'testing', label: 'Testing' },
  { view: 'traceability', label: 'Traceability' },
  { view: 'export', label: 'Export' },
];

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const { state, dispatch } = useProject();
  const { resolved, setTheme } = useTheme();
  const entities = [...entityIndex(state.project).values()];

  function run(action: () => void) {
    action();
    onOpenChange(false);
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <DialogPrimitive.Content className="fixed left-1/2 top-24 z-50 w-[92vw] max-w-lg -translate-x-1/2 overflow-hidden rounded-[8px] border border-border bg-card shadow-lg">
          <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Search stages, entities and actions.
          </DialogPrimitive.Description>

          <Command>
            <CommandInput placeholder="Search anything..." />
            <CommandList>
              <CommandEmpty>No matches.</CommandEmpty>

              <CommandGroup heading="Go to stage">
                {STAGES.map(stage => (
                  <CommandItem
                    key={stage.view}
                    value={`stage ${stage.label}`}
                    onSelect={() => run(() => dispatch({ type: 'SET_VIEW', view: stage.view }))}
                  >
                    {stage.label}
                  </CommandItem>
                ))}
              </CommandGroup>

              {entities.length > 0 && (
                <CommandGroup heading="Jump to">
                  {entities.map(entity => (
                    <CommandItem
                      key={entity.id}
                      value={`${entity.id} ${entity.label}`}
                      onSelect={() => run(() =>
                        dispatch({ type: 'SELECT_ENTITY', view: entity.view, id: entity.id }))}
                    >
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">{entity.id}</span>
                      <span className="min-w-0 truncate">{entity.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              <CommandGroup heading="Actions">
                <CommandItem
                  value="toggle theme"
                  onSelect={() => run(() => setTheme(resolved === 'dark' ? 'light' : 'dark'))}
                >
                  Toggle theme
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
