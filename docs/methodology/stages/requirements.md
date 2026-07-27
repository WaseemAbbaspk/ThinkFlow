# Stage 7 — Requirements

> **Purpose:** Specify precisely what the software must do, as testable user stories and
> acceptance criteria, so that everything built downstream traces to a stated need.
> **Owner:** Product Manager (accountable); Business Analyst Agent drafts.
> **Written:** After Scope is agreed; before Architecture begins.
> **Changes:** When scope changes, a story is added/removed, or a criterion is refined.
> **Inputs:** [Scope], [Goals] (from the Define stages of [`../lifecycle.md`](../lifecycle.md)).
> **Outputs:** Requirements document (with IDs) → consumed by Architecture, Task Breakdown, Testing.
> **Dependencies:** [`../stage-anatomy.md`](../stage-anatomy.md), [`../../templates/requirements-prd.md`](../../templates/requirements-prd.md).

This is the **reference implementation** of the [stage anatomy](../stage-anatomy.md). Every
other stage document is cloned from this one. It is intentionally thorough.

---

## 1. Purpose

Turn an agreed scope into an unambiguous, testable statement of *what* the system must do —
without prescribing *how*. Requirements are the hinge of the whole methodology: they are the
first document that downstream code and tests must satisfy, and the anchor every traceability
chain terminates at.

## 2. Objectives

- Express each need as a **user story** with a stable ID.
- Attach **acceptance criteria** to every story, each independently testable and ID'd.
- Separate **functional** requirements (what it does) from **non-functional** ones (how well:
  performance, security, availability, accessibility).
- Record **assumptions**, **constraints**, and **explicit non-goals**.
- Leave *how* to build it to the Architecture and design stages.

## 3. Inputs

| Input | From stage | Why it's needed |
|-------|-----------|-----------------|
| Scope statement, non-goals | Scope (6) | Bounds what may become a requirement. |
| Business goals, success metrics | Goals (5) | Requirements must serve a goal; metrics inform NFRs. |
| Research findings, constraints | Research (3) | Feasibility and known limits shape criteria. |
| Stakeholder map | Discovery (2) | Identifies whose needs the stories represent. |

## 4. Outputs

- A **Requirements document** (see Deliverables) written from
  [`../../templates/requirements-prd.md`](../../templates/requirements-prd.md).
- A stable set of **IDs** (`US-n`, `AC-n.m`, `NFR-n`) that downstream documents reference.

## 5. Deliverables

- [ ] Requirements document committed to the repo.
- [ ] Every functional requirement expressed as a user story with ≥1 acceptance criterion.
- [ ] Non-functional requirements listed with measurable targets.
- [ ] Assumptions, constraints, and non-goals sections filled in (or marked "none, because …").
- [ ] Human sign-off recorded in the document.

## 6. Human Responsibilities

- **Decide** which needs are in scope and which are non-goals.
- **Prioritize** stories (e.g. Must / Should / Could).
- **Resolve** ambiguity and conflicting stakeholder needs.
- **Sign off** — the requirements are not "done" until the accountable human accepts them.

## 7. AI Responsibilities

- Draft user stories and acceptance criteria from scope/goals notes.
- Surface **missing** cases: error paths, empty/edge states, permissions, concurrency.
- Flag ambiguous or untestable criteria and propose sharper wording.
- Check internal consistency (no story contradicts another; every story serves a goal).
- Keep IDs unique and stable across edits.

## 8. Entry Criteria

- Scope statement exists and is agreed.
- Business goals and success metrics are documented.
- Major open research questions affecting feasibility are resolved or explicitly deferred.

## 9. Exit Criteria

- Every in-scope need is represented by at least one user story.
- Every user story has at least one acceptance criterion, and each criterion is testable.
- Non-functional requirements have measurable targets.
- No known contradictions among requirements.
- The accountable human has signed off in the document.

## 10. Checklist

- [ ] Scope and goals re-read; requirements stay inside scope.
- [ ] Each story follows a consistent form ("As a … I want … so that …").
- [ ] Each story has a unique `US-n` ID.
- [ ] Each acceptance criterion has an `AC-n.m` ID and is objectively verifiable.
- [ ] Error, empty, and permission states are covered, not just the happy path.
- [ ] Non-functional requirements (`NFR-n`) captured with numbers, not adjectives.
- [ ] Assumptions and constraints documented.
- [ ] Non-goals stated explicitly.
- [ ] Priorities assigned.
- [ ] Human sign-off recorded.

## 11. Best Practices

- **Write criteria you could hand to a tester with no context.** If two people could disagree
  on whether it's met, it's not a criterion yet.
- **Number everything early.** IDs are cheap to assign and expensive to retrofit once tasks and
  tests start referencing stories.
- **Quantify non-functionals.** "Fast" is not a requirement; "p95 page load < 500 ms on a 3G
  connection" is.
- **State non-goals loudly.** The cheapest requirement is the one you agreed not to build.
- **Keep the *how* out.** "Store tasks so they survive a refresh" is a requirement; "use
  PostgreSQL" is an Architecture decision.

## 12. Common Mistakes

- **Solutioning in requirements.** Naming technologies or UI specifics locks in decisions that
  belong to later stages and breaks tool-agnosticism.
- **Untestable criteria.** "The app should be user-friendly" can never pass or fail.
- **Only the happy path.** Missing error/empty/permission cases is the #1 source of downstream rework.
- **Silent scope creep.** Adding stories without checking them against Scope.
- **Unstable IDs.** Renumbering stories after tasks/tests reference them severs traceability.

## 13. Examples

A functional requirement, done well:

> **US-3 — Complete a task.** As a user, I want to mark a task complete so that I can track
> what's done.
> - **AC-3.1** Clicking a task's checkbox toggles it between complete and active.
> - **AC-3.2** A completed task shows a visual "done" state (e.g. strikethrough).
> - **AC-3.3** The completed state persists across a page refresh.

A non-functional requirement, done well:

> **NFR-2 — Responsiveness.** Any task action (add/complete/delete) reflects in the UI within
> **100 ms** on a mid-range 2020 laptop.

See the full instantiation in the [Todo example requirements](../../../examples/todo/02-requirements.md).

## 14. Templates

- [`../../templates/requirements-prd.md`](../../templates/requirements-prd.md) — the requirements / PRD template.
- [`../../checklists/requirements-checklist.md`](../../checklists/requirements-checklist.md) — the gate checklist.

## 15. Review Questions

Ask these of the finished requirements document:

- Does **every** story trace to a business goal? If one doesn't, why is it here?
- Could a tester verify **every** acceptance criterion without asking a question?
- What happens on the **unhappy** paths — errors, empty states, unauthorized users?
- Are any requirements actually **architecture decisions** in disguise?
- If we built **exactly** this and nothing more, would the goals be met?
- Are the **non-goals** explicit enough to prevent scope creep?

## 16. AI Prompt Examples

Provider-neutral prompts for delegating parts of this stage to your agent:

> "Read `scope.md` and `goals.md`. Draft user stories in the form 'As a … I want … so that …',
> one per distinct need in scope. Assign each a `US-n` ID. Do not propose any technology or UI
> implementation."

> "For user story `US-3`, write acceptance criteria as `AC-3.m` bullets. Cover the happy path,
> at least one error path, and the empty state. Each criterion must be objectively testable."

> "Review `requirements.md` for testability. List every acceptance criterion that two people
> could reasonably disagree on, and propose sharper wording."

## 17. Agent Responsibilities

| Agent | Does | Human gate |
|-------|------|-----------|
| [Business Analyst Agent](../../agents/roles/business-analyst.md) | Drafts stories & criteria, finds missing cases, checks consistency. | PM approves scope inclusion and priorities. |
| [Architect Agent](../../agents/roles/architect.md) | Reviews NFRs for feasibility; flags requirements that imply hard constraints. | PM/Tech Lead accept or renegotiate. |

AI drafts; the Product Manager decides and signs off (Principle 2, **Human-Led**).

## 18. Success Metrics

The checklist proves the stage was *done*; these judge whether it was done *well*:

- **Requirement stability** — % of stories unchanged from sign-off to release (higher is better;
  churn signals weak upstream discovery).
- **Traceability coverage** — % of tasks and tests that link to a requirement ID (target 100%).
- **Defect escape rate** — production defects traceable to a *missing or ambiguous* requirement
  (lower is better).
- **Rework rate** — implementation tasks reopened due to requirement misunderstanding.
