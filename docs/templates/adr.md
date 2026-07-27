# Architecture Decision Record (ADR) — Template

> **Inputs:** a decision that needs making (from Architecture, Tech Selection, DB/API Design).
> **Outputs:** a recorded decision that Implementation and future ADRs rely on.
> _One ADR per significant, hard-to-reverse decision. Number them `ADR-n`. Never edit a decided
> ADR's substance — supersede it with a new one instead._

# ADR-<n>: <short decision title>

- **Status:** Proposed | Accepted | Superseded by ADR-<m> | Deprecated
- **Date:** <date>
- **Deciders:** <humans accountable for the decision>
- **Relates to:** <requirement IDs, other ADRs>

## Context

_What forces are at play? The requirement or problem, the constraints, and why a decision is
needed now. State it neutrally — no preferred answer yet._

## Options considered

| Option | Pros | Cons |
|--------|------|------|
| **A. <option>** | <…> | <…> |
| **B. <option>** | <…> | <…> |
| **C. <option>** | <…> | <…> |

## Decision

_The option chosen, stated plainly._

> We will **<decision>**.

## Rationale

_Why this option beat the others, tied to the context and requirements. This is the part the
code cannot explain to a future reader — make it count._

## Consequences

- **Positive:** <what gets easier / safer / cheaper>
- **Negative / trade-offs:** <what we accept as a cost>
- **Follow-ups:** <new tasks, ADRs, or risks this creates>

## Compliance

_How we'll know the decision is actually being followed (a lint rule, a review check, a test)._
