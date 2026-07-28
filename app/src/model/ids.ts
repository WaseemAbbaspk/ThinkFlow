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
