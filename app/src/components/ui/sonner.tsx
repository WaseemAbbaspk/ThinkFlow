import { Toaster as SonnerToaster } from 'sonner';
import { useTheme } from '@/state/theme';

export function Toaster() {
  const { resolved } = useTheme();
  return (
    <SonnerToaster
      theme={resolved}
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: 'rounded-[6px] border border-border bg-card text-card-foreground text-sm',
        },
      }}
    />
  );
}
