# Stage Anatomy

> **Purpose:** Define the fixed 17-part structure that every lifecycle *stage* document must
> follow, so stages are consistent, comparable, and reproducible.
> **Owner:** Methodology maintainers.
> **Written:** Foundational — the meta-template.
> **Changes:** Only when the required structure of stages changes.
> **Inputs:** [`../principles/principles.md`](../principles/principles.md).
> **Outputs:** Every file under [`stages/`](stages/), starting with
> [`stages/requirements.md`](stages/requirements.md).
> **Dependencies:** [`lifecycle.md`](lifecycle.md).

Every stage of the ThinkFlow lifecycle is documented the same way. This uniformity is what
makes the methodology *reproducible*: a reader (human or agent) always knows where to find the
entry criteria, the checklist, or the human responsibilities, regardless of which stage they
open.

A stage document has **17 sections, in this order**. If a section genuinely doesn't apply to a
stage, keep the heading and write "Not applicable — <reason>" so the omission is a decision, not
an oversight.

## The 17 sections

| # | Section | Answers the question |
|---|---------|----------------------|
| 1 | **Purpose** | Why does this stage exist? |
| 2 | **Objectives** | What must this stage achieve? |
| 3 | **Inputs** | Which upstream documents/artifacts does it consume? |
| 4 | **Outputs** | Which documents/artifacts does it produce? |
| 5 | **Deliverables** | What concrete artifacts must exist before exit? |
| 6 | **Human Responsibilities** | What must a human do here? |
| 7 | **AI Responsibilities** | What can an agent do here? |
| 8 | **Entry Criteria** | What must be true to *start* this stage? |
| 9 | **Exit Criteria** | What must be true to *finish* this stage? |
| 10 | **Checklist** | The step-by-step "did we do it" list. |
| 11 | **Best Practices** | What consistently works well. |
| 12 | **Common Mistakes** | What consistently goes wrong. |
| 13 | **Examples** | Concrete illustrations. |
| 14 | **Templates** | Which templates in [`../templates/`](../templates/) to use. |
| 15 | **Review Questions** | Questions to interrogate the stage's output. |
| 16 | **AI Prompt Examples** | Provider-neutral prompts for delegating the work. |
| 17 | **Agent Responsibilities** | Which [agents](../agents/agent-model.md) act, and their gates. |
| 18 | **Success Metrics** | How we know the stage was done *well*. |

> The table lists 18 rows because **Deliverables** (5) is broken out from **Outputs** (4) — the
> canonical count is 17 *conceptual* parts; some teams merge Outputs and Deliverables into one.
> If you merge them, say so. When in doubt, keep them separate: *Outputs* are documents,
> *Deliverables* are the full set of artifacts (documents + diagrams + decisions) required to exit.

## Copy-paste skeleton

Start every new stage document from this skeleton (plus the standard
[document header](../../CONTRIBUTING.md#the-document-header-every-doc-starts-with-this)):

```markdown
# <Stage Name>

> Purpose / Owner / Written / Changes / Inputs / Outputs / Dependencies

## 1. Purpose
## 2. Objectives
## 3. Inputs
## 4. Outputs
## 5. Deliverables
## 6. Human Responsibilities
## 7. AI Responsibilities
## 8. Entry Criteria
## 9. Exit Criteria
## 10. Checklist
## 11. Best Practices
## 12. Common Mistakes
## 13. Examples
## 14. Templates
## 15. Review Questions
## 16. AI Prompt Examples
## 17. Agent Responsibilities
## 18. Success Metrics
```

## How to fill it well

- **Inputs/Outputs must resolve.** Every input names a real upstream document; every output a
  real downstream one. This is what wires the lifecycle together — get it right and traceability
  is automatic.
- **Entry/Exit criteria are gates, not vibes.** Write them so a different team would agree on
  whether they're met. "Requirements reviewed" is weak; "every user story has ≥1 acceptance
  criterion and a human has signed off in the requirements doc" is a gate.
- **Human vs AI responsibilities enforce Principle 2.** The decision-shaped work goes under
  Human; the generation/drafting/checking work goes under AI. If everything is under AI,
  you've broken Human-Led.
- **Success Metrics ≠ Checklist.** The checklist proves the stage was *done*; the metrics judge
  whether it was done *well* (e.g. defect escape rate, rework rate, cycle time).

The reference implementation of this anatomy is
[`stages/requirements.md`](stages/requirements.md). Read it alongside this document.
