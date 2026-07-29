import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ConfirmOptions {
  title: string;
  description: string;
  confirmLabel?: string;
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const Ctx = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>(options => {
    setOpts(options);
    return new Promise<boolean>(resolve => {
      resolverRef.current = resolve;
    });
  }, []);

  function settle(result: boolean) {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setOpts(null);
  }

  return (
    <Ctx.Provider value={confirm}>
      {children}
      <AlertDialog open={opts !== null} onOpenChange={open => { if (!open) settle(false); }}>
        {opts && (
          <AlertDialogContent>
            <AlertDialogTitle>{opts.title}</AlertDialogTitle>
            <AlertDialogDescription>{opts.description}</AlertDialogDescription>
            <div className="mt-5 flex justify-end gap-2">
              <AlertDialogCancel
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                onClick={() => settle(false)}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className={cn(buttonVariants({ variant: 'destructive', size: 'sm' }))}
                onClick={() => settle(true)}
              >
                {opts.confirmLabel ?? 'Confirm'}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </Ctx.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const v = useContext(Ctx);
  if (!v) throw new Error('useConfirm must be used inside ConfirmProvider');
  return v;
}
