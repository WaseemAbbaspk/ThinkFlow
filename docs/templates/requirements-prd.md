# Requirements / PRD — Template

> **Inputs:** Scope, Goals. **Outputs:** feeds Architecture, Task Breakdown, Testing.
> _Copy this file, delete the italic guidance, and fill in. Assign IDs and keep them stable._

> **Purpose:** Specify what the system must do, testably.
> **Owner:** Product Manager. **Written:** Requirements stage.
> **Changes:** when scope changes or a story/criterion is refined.
> **Inputs:** Scope, Goals. **Outputs:** Architecture, Tasks, Tests.

## Overview

_One paragraph: what this product/feature is and the goal it serves. Link the goal._

## User stories (functional requirements)

_Each story: a unique `US-n` ID, the "As a / I want / so that" form, a priority, and testable
acceptance criteria with `AC-n.m` IDs. Cover happy path + errors + empty/edge states._

### US-1 — <short title> — _Priority: Must/Should/Could_

> As a **<user>**, I want **<capability>** so that **<benefit>**.

- **AC-1.1** <objectively testable condition>
- **AC-1.2** <error or edge case condition>

### US-2 — <short title> — _Priority: …_

> As a **<user>**, I want **<capability>** so that **<benefit>**.

- **AC-2.1** …

## Non-functional requirements

_Measurable targets, not adjectives. Give each an `NFR-n` ID._

| ID | Requirement | Target (measurable) |
|----|-------------|---------------------|
| NFR-1 | <e.g. Performance> | <e.g. p95 action < 100 ms> |
| NFR-2 | <e.g. Availability> | <e.g. 99.9% monthly> |
| NFR-3 | <e.g. Accessibility> | <e.g. WCAG 2.1 AA> |

## Assumptions

- <assumption> — _validated by …_

## Constraints

- <constraint — budget, deadline, platform, regulation>

## Non-goals

- <explicitly out of scope, and why>

## Traceability

_Each story links to the goal it serves; downstream, tasks and tests will link back to these IDs._

| Story | Serves goal | Realized by task(s) | Verified by test(s) |
|-------|-------------|---------------------|---------------------|
| US-1 | <GOAL-x> | <filled at Task Breakdown> | <filled at Testing> |

## Sign-off

- Approved by: **<name / role>**  Date: **<date>**
