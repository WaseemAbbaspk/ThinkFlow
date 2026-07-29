import { releaseId, type IdKind } from './ids';
import type { Project, Goal, Nfr, Adr, UserStory, Criterion, Task, Test } from './types';

/**
 * Deleting a row normally leaves a permanent gap in the numbering: ids are a stable handle, and
 * reissuing one would silently repoint any export, ADR or ticket that cited it.
 *
 * The exception this module implements is the mis-click: a row that was added, never filled in,
 * never referenced, and is still the newest of its kind. Nothing meaningful ever existed under
 * that id, so it can go back in the pool.
 */
export type Reclaimable =
  | { kind: 'GOAL'; entity: Goal }
  | { kind: 'NFR'; entity: Nfr }
  | { kind: 'ADR'; entity: Adr }
  | { kind: 'US'; entity: UserStory }
  | { kind: 'AC'; entity: Criterion }
  | { kind: 'TASK'; entity: Task }
  | { kind: 'TEST'; entity: Test };

const blank = (s: string) => s.trim() === '';

/** True when the entity carries no author-supplied content. Default enum values do not count. */
export function isBlank(r: Reclaimable): boolean {
  switch (r.kind) {
    case 'GOAL':
      return blank(r.entity.text) && blank(r.entity.metric);
    case 'NFR':
      return blank(r.entity.name) && blank(r.entity.target);
    case 'US':
      return blank(r.entity.role) && blank(r.entity.want) && blank(r.entity.benefit)
        && !r.entity.servesGoalId;
    case 'AC':
      return blank(r.entity.text);
    case 'TASK':
      return blank(r.entity.title) && blank(r.entity.goal) && blank(r.entity.contextForAgent)
        && blank(r.entity.outOfScope) && r.entity.tracesTo.length === 0
        && r.entity.dependsOn.length === 0 && r.entity.acceptance.length === 0;
    case 'TEST':
      return blank(r.entity.verifies) && blank(r.entity.description);
    case 'ADR':
      return blank(r.entity.title) && blank(r.entity.date) && blank(r.entity.deciders)
        && blank(r.entity.context) && blank(r.entity.decision) && blank(r.entity.rationale)
        && blank(r.entity.consequencesPositive) && blank(r.entity.consequencesTradeoffs)
        && blank(r.entity.followUps) && r.entity.relatesTo.length === 0
        && r.entity.options.length === 0;
  }
}

/** True when anything anywhere in the project points at this id. */
export function isReferenced(p: Project, id: string): boolean {
  return p.requirements.stories.some(s => s.servesGoalId === id)
    || p.requirements.criteria.some(c => c.storyId === id)
    || p.tasks.some(t => t.tracesTo.includes(id) || t.dependsOn.includes(id))
    || p.testing.tests.some(t => t.verifies === id)
    || p.architecture.adrs.some(a => a.relatesTo.includes(id))
    || p.architecture.components.some(c => c.adrIds.includes(id));
}

function storyNumberOf(storyId: string): number {
  return parseInt(storyId.split('-')[1], 10);
}

/**
 * Counters to use after deleting `r`. Call with the project as it stands *before* the deletion,
 * so reference checks see the links that are about to be removed.
 */
export function reclaimCounters(p: Project, r: Reclaimable): Record<string, number> {
  if (!isBlank(r) || isReferenced(p, r.entity.id)) return p.meta.counters;
  const ctx = r.kind === 'AC' ? { storyNumber: storyNumberOf(r.entity.storyId) } : undefined;
  return releaseId(p.meta.counters, r.kind as IdKind, r.entity.id, ctx);
}
