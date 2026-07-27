# Lifecycle Stages — Index

> **Purpose:** Track which lifecycle stage documents exist, and provide the pattern for adding
> the rest.
> **Owner:** Methodology maintainers.
> **Written:** Foundational.
> **Changes:** Whenever a stage document is added or its status changes.
> **Inputs:** [`../lifecycle.md`](../lifecycle.md), [`../stage-anatomy.md`](../stage-anatomy.md).
> **Outputs:** The individual stage documents in this directory.
> **Dependencies:** [`../../../CONTRIBUTING.md`](../../../CONTRIBUTING.md).

Every stage document follows the [17-part stage anatomy](../stage-anatomy.md). The
[Requirements stage](requirements.md) is the fully built **reference implementation** — clone
its structure when writing any other stage.

**Status legend:** ✅ built · 🚧 planned (Milestone 2+).

| # | Stage | Status | Document |
|---|-------|:------:|----------|
| 1 | Idea | 🚧 | `idea.md` |
| 2 | Discovery | 🚧 | `discovery.md` |
| 3 | Research | 🚧 | `research.md` |
| 4 | Vision | 🚧 | `vision.md` |
| 5 | Goals | 🚧 | `goals.md` |
| 6 | Scope | 🚧 | `scope.md` |
| 7 | **Requirements** | ✅ | [`requirements.md`](requirements.md) |
| 8 | Architecture | 🚧 | `architecture.md` |
| 9 | Technology Selection | 🚧 | `technology-selection.md` |
| 10 | Database Design | 🚧 | `database-design.md` |
| 11 | API Design | 🚧 | `api-design.md` |
| 12 | Task Breakdown | 🚧 | `task-breakdown.md` |
| 13 | Implementation | 🚧 | `implementation.md` |
| 14 | Testing | 🚧 | `testing.md` |
| 15 | Security Review | 🚧 | `security-review.md` |
| 16 | Performance Review | 🚧 | `performance-review.md` |
| 17 | Documentation Review | 🚧 | `documentation-review.md` |
| 18 | Deployment | 🚧 | `deployment.md` |
| 19 | Monitoring | 🚧 | `monitoring.md` |
| 20 | Maintenance | 🚧 | `maintenance.md` |
| 21 | Retrospective | 🚧 | `retrospective.md` |

## Adding a stage

1. Copy the skeleton from [`../stage-anatomy.md`](../stage-anatomy.md#copy-paste-skeleton).
2. Fill in **all 17 sections**, using [`requirements.md`](requirements.md) as the quality bar.
3. Make sure this stage's **Inputs/Outputs** line up with its neighbours in
   [`../lifecycle.md`](../lifecycle.md).
4. Flip the status to ✅ in the table above.
