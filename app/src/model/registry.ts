import type { Project } from './types';
import type { View } from '@/state/projectStore';

export interface EntityLocation {
  id: string;
  view: View;
  label: string;
}

/**
 * Every addressable entity in the project, keyed by id.
 * Type-only import of `View` keeps this a leaf module at runtime.
 */
export function entityIndex(project: Project): Map<string, EntityLocation> {
  const index = new Map<string, EntityLocation>();
  const add = (id: string, view: View, text: string) => {
    if (id) index.set(id, { id, view, label: text.trim() || id });
  };

  for (const p of project.vision.problems) add(p.id, 'vision', p.text);
  for (const g of project.goals) add(g.id, 'requirements', g.text);
  for (const s of project.requirements.stories) add(s.id, 'requirements', s.want);
  for (const c of project.requirements.criteria) add(c.id, 'requirements', c.text);
  for (const n of project.requirements.nfrs) add(n.id, 'requirements', n.name);
  for (const a of project.architecture.adrs) add(a.id, 'architecture', a.title);
  for (const t of project.tasks) add(t.id, 'tasks', t.title);
  for (const t of project.testing.tests) add(t.id, 'testing', t.description);

  return index;
}
