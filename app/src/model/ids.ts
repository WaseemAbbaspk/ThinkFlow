export type IdKind = 'PROB' | 'GOAL' | 'US' | 'AC' | 'NFR' | 'ADR' | 'TASK' | 'TEST';

export function nextId(
  counters: Record<string, number>,
  kind: IdKind,
  ctx?: { storyNumber: number },
): { id: string; counters: Record<string, number> } {
  if (kind === 'AC') {
    if (!ctx) throw new Error('AC id requires ctx.storyNumber');
    const key = `AC:${ctx.storyNumber}`;
    const n = (counters[key] ?? 0) + 1;
    return { id: `AC-${ctx.storyNumber}.${n}`, counters: { ...counters, [key]: n } };
  }
  const n = (counters[kind] ?? 0) + 1;
  return { id: `${kind}-${n}`, counters: { ...counters, [kind]: n } };
}

function counterKey(kind: IdKind, ctx?: { storyNumber: number }): string {
  if (kind !== 'AC') return kind;
  if (!ctx) throw new Error('AC counter key requires ctx.storyNumber');
  return `AC:${ctx.storyNumber}`;
}

/** Numeric suffix of an id, or null when it does not match the kind's shape. */
export function idNumber(kind: IdKind, id: string): number | null {
  const m = kind === 'AC'
    ? /^AC-\d+\.(\d+)$/.exec(id)
    : new RegExp(`^${kind}-(\\d+)$`).exec(id);
  return m ? Number(m[1]) : null;
}

/**
 * Hands a number back to the pool, but only when `id` is the current high-water mark for its
 * kind. Anything older leaves a permanent gap, so an id that other artifacts may already cite is
 * never reissued. Callers are responsible for checking the entity is genuinely disposable.
 */
export function releaseId(
  counters: Record<string, number>,
  kind: IdKind,
  id: string,
  ctx?: { storyNumber: number },
): Record<string, number> {
  const n = idNumber(kind, id);
  if (n === null) return counters;
  const key = counterKey(kind, ctx);
  if (counters[key] !== n) return counters;
  return { ...counters, [key]: n - 1 };
}
