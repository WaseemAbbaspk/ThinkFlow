import type { Project } from '../model/types';
import { migrate } from '../model/migrate';

export function serialize(p: Project): string {
  return JSON.stringify(p, null, 2);
}
export function parse(text: string): { ok: true; project: Project } | { ok: false; reason: string } {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return { ok: false, reason: 'invalid JSON' }; }
  return migrate(raw);
}
