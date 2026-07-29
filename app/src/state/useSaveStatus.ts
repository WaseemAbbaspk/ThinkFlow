import { useEffect, useState } from 'react';
import { saveProject } from '@/state/persistence';
import type { Project } from '@/model/types';

export type SaveState = 'saving' | 'saved' | 'error';

export function useSaveStatus(project: Project): SaveState {
  const [state, setState] = useState<SaveState>('saved');

  useEffect(() => {
    setState('saving');
    const id = setTimeout(() => {
      setState(saveProject(project) ? 'saved' : 'error');
    }, 500);
    return () => clearTimeout(id);
  }, [project]);

  return state;
}
