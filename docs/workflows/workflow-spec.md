# Workflow Specification

> **Purpose:** Define what a ThinkFlow workflow is and the fixed structure every workflow follows.
> **Owner:** Methodology maintainers.
> **Written:** Foundational.
> **Changes:** when the workflow structure changes.
> **Inputs:** [`../methodology/lifecycle.md`](../methodology/lifecycle.md), [`../agents/agent-model.md`](../agents/agent-model.md).
> **Outputs:** the individual workflows (e.g. [`new-feature.md`](new-feature.md)).
> **Dependencies:** [`../../GLOSSARY.md`](../../GLOSSARY.md).

A **workflow** is an end-to-end procedure for a recurring kind of work — building a feature,
fixing a bug, cutting a release. Where the [lifecycle](../methodology/lifecycle.md) describes
*all* stages a project can pass through, a workflow describes the *specific path* a given kind of
work takes through those stages, which documents it touches, which [agents](../agents/agent-model.md)
act, and where the **human gates** are.

Workflows are how the methodology becomes muscle memory: instead of re-deciding the steps each
time, a team follows the workflow and gets reproducible results.

## Required structure

Every workflow document contains these sections:

| Section | Contents |
|---------|----------|
| **Purpose** | When to use this workflow (and when not to). |
| **Trigger** | The event that starts it. |
| **Flow diagram** | A Mermaid diagram of the steps and gates. |
| **Steps** | Numbered steps: what happens, who/what does it. |
| **Documents** | Which documents are read (Inputs) and written (Outputs) at each step. |
| **AI involvement** | Which agents act, doing what. |
| **Human checkpoints** | The approval gates — what a human must accept before proceeding. |
| **Deliverables** | What must exist when the workflow completes. |
| **Definition of done** | The exit condition for the whole workflow. |

## Conventions

- Show gates in the diagram as decision nodes (`{Gate}`) so they're visually obvious.
- Every workflow has **at least one human gate** (Principle 2, *Human-Led*).
- Every step names the document(s) it consumes/produces, preserving traceability.
- Reference agents by their role docs in [`../agents/roles/`](../agents/roles/).

The reference workflow is [New Feature](new-feature.md).
