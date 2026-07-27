# Architecture Checklist

**Use when:** before exiting the Architecture stage (Task Breakdown depends on it).
**Owner:** Tech Lead.
**Related:** [system-design template](../templates/system-design.md), [ADR template](../templates/adr.md),
[Architect Agent](../agents/roles/architect.md).

## Gate items

### Traceability to requirements
- [ ] Every component exists to satisfy at least one requirement (`US`/`NFR`).
- [ ] No requirement is left without a home in the design.

### Decisions recorded
- [ ] Every significant, hard-to-reverse decision has an [ADR](../templates/adr.md).
- [ ] Each ADR lists real alternatives with trade-offs (not a single foregone option).
- [ ] Each ADR is marked **Accepted** by the Tech Lead (none left dangling as *Proposed*).
- [ ] No new ADR silently contradicts a standing one.

### Non-functional fit
- [ ] The design meets each `NFR` target, or the gap is documented and accepted.
- [ ] Trust boundaries and authn/authz approach are identified.
- [ ] Failure modes are considered (what happens when each component fails).

### Tool-agnostic & scope
- [ ] Technology choices are justified by requirements/constraints, not habit.
- [ ] The design stays high-level — no premature implementation detail that belongs in tasks.

### Diagrams & clarity
- [ ] Component and key-flow diagrams are present and parse (Mermaid renders).
- [ ] A new engineer could understand the structure from the design doc alone.

## Evidence

Link the system-design doc, the ADRs, and the requirements doc it traces to.

## Sign-off

- Gate result: **Pass / Fail**
- Signed off by: **<Tech Lead name>**  Date: **<date>**
- If Fail: **<what must change before re-running>**
