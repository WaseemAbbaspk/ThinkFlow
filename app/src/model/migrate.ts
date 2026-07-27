import { SCHEMA_VERSION, type Project } from './types';

export function migrate(raw: unknown): { ok: true; project: Project } | { ok: false; reason: string } {
  if (!raw || typeof raw !== 'object') return { ok: false, reason: 'not an object' };
  const meta = (raw as any).meta;
  if (!meta || typeof meta.schemaVersion !== 'number') return { ok: false, reason: 'missing meta.schemaVersion' };
  if (meta.schemaVersion > SCHEMA_VERSION)
    return { ok: false, reason: `project schema v${meta.schemaVersion} is newer than app v${SCHEMA_VERSION}` };
  // v1 is the first version; no upgrade steps yet. Future versions add cases here.
  return { ok: true, project: raw as Project };
}
