# Requirements Checklist

**Use when:** before exiting the [Requirements stage](../methodology/stages/requirements.md).
**Owner:** Product Manager.
**Related:** [Requirements stage](../methodology/stages/requirements.md),
[requirements/PRD template](../templates/requirements-prd.md).

## Gate items

### Coverage
- [ ] Every in-scope need maps to at least one user story.
- [ ] Nothing outside the agreed [Scope] has crept in.
- [ ] Non-goals are stated explicitly.

### Quality of stories & criteria
- [ ] Every story has a unique, stable `US-n` ID.
- [ ] Every story has ≥1 acceptance criterion with an `AC-n.m` ID.
- [ ] Every acceptance criterion is objectively testable (two reviewers would agree pass/fail).
- [ ] Error paths, empty states, and permission cases are covered — not just the happy path.

### Non-functional
- [ ] Non-functional requirements captured with **measurable** targets (`NFR-n`), no adjectives.

### Traceability
- [ ] Every story links to the business goal it serves.
- [ ] IDs that downstream work will reference are final (no planned renumbering).

### Hygiene
- [ ] No solutioning — no technologies, frameworks, or UI implementation prescribed.
- [ ] Assumptions and constraints documented.
- [ ] Priorities assigned.

## Evidence

Link the requirements document and the goal/scope docs it traces to.

## Sign-off

- Gate result: **Pass / Fail**
- Signed off by: **<PM name>**  Date: **<date>**
- If Fail: **<what must change before re-running>**
