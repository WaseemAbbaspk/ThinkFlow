import type { Project } from '../model/types';
import { serialize, parse } from '../export/project';

export const STORAGE_KEY = 'thinkflow.studio.project.v1';

export function saveProject(p: Project): void {
  try { localStorage.setItem(STORAGE_KEY, serialize(p)); }
  catch { /* storage full/unavailable — caller surfaces a warning */ }
}
export function loadProject():
  { ok: true; project: Project } | { ok: false; reason: string } | { ok: 'empty' } {
  let text: string | null = null;
  try { text = localStorage.getItem(STORAGE_KEY); } catch { return { ok: false, reason: 'storage unavailable' }; }
  if (text === null) return { ok: 'empty' };
  return parse(text);
}
export function clearProject(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}
