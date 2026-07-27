# Task — Template

> **Inputs:** Requirements, design docs. **Outputs:** feeds Implementation and Testing.
> _One task = one small, independently shippable unit of work. Every task traces to a
> requirement. Number them `TASK-n`._

# TASK-<n>: <imperative title, e.g. "Add task-completion toggle">

- **Traces to:** <requirement IDs, e.g. US-3 / AC-3.1, AC-3.2>
- **Depends on:** <TASK-n, or "none">
- **Owner:** <human or agent>
- **Status:** Todo | In progress | In review | Done

## Goal

_One or two sentences: what this task makes true when complete._

## Context for the agent

_The grounding an AI agent needs to do this well: which files/components, which design decisions
([ADRs](adr.md)) apply, and any gotchas. This is where documentation-first pays off — a
well-grounded task produces a far better result._

## Acceptance criteria (definition of done)

_Restate or reference the specific acceptance criteria this task satisfies. The task is done
only when these pass._

- [ ] <AC reference or concrete condition>
- [ ] Tests added/updated and passing (traced to the AC).
- [ ] Documentation updated if behavior or decisions changed.

## Out of scope

_What this task deliberately does not touch (prevents scope creep into neighbouring tasks)._

## Notes

_Links, decisions made during implementation, follow-up tasks discovered._
