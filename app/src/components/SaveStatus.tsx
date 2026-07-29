import { Check, CircleAlert, Loader } from 'lucide-react';
import type { SaveState } from '@/state/useSaveStatus';

const ERROR_HELP = 'Your work could not be saved to this browser. Export your project to avoid losing it.';

export function SaveStatus({ state }: { state: SaveState }) {
  if (state === 'error') {
    return (
      <span role="status" title={ERROR_HELP} className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-warn">
        <CircleAlert aria-hidden="true" className="size-3.5" />
        Not saved
      </span>
    );
  }
  if (state === 'saving') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
        <Loader aria-hidden="true" className="size-3.5" />
        Saving…
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
      <Check aria-hidden="true" className="size-3.5 text-ok" />
      Saved
    </span>
  );
}
