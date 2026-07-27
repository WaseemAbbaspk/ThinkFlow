# ThinkFlow Glossary

Shared vocabulary for the methodology. When a term is used with a specific ThinkFlow meaning,
it is defined here. Terms are alphabetized.

| Term | Definition |
|------|------------|
| **Acceptance criteria** | The concrete, testable conditions that make a user story "done". Each criterion gets an ID (e.g. `AC-3.2`) so tests can trace to it. |
| **Agent** | A specialized AI role with a defined purpose, inputs, outputs, and human approval gates (e.g. Architect Agent, QA Agent). Agents *execute*; they don't decide. See [`docs/agents/agent-model.md`](docs/agents/agent-model.md). |
| **Agentic software engineering** | Building software with AI agents as first-class collaborators across the whole lifecycle, coordinated through documentation. |
| **Anatomy** | The fixed 17-part structure every lifecycle *stage* document follows. See [`docs/methodology/stage-anatomy.md`](docs/methodology/stage-anatomy.md). |
| **Artifact** | Any tracked output of a stage — a document, a diagram, a decision record, code, or tests. |
| **Deliverable** | A required artifact a stage must produce before it can exit. |
| **Documentation-first** | The core principle that every action — especially AI action — originates from a document, not an ad-hoc prompt. |
| **Entry criteria** | What must be true before a stage can begin. |
| **Exit criteria** | What must be true before a stage is considered complete. |
| **Gate (human approval gate)** | A point where a human must review and approve before work continues. Gates are how "Human-Led" is enforced in practice. |
| **Input (of a document)** | The upstream document(s) a document consumes. Part of traceability. |
| **Lifecycle** | The full ordered set of stages from *Idea* to *Retrospective*. See [`docs/methodology/lifecycle.md`](docs/methodology/lifecycle.md). |
| **Output (of a document)** | The downstream document(s) a document feeds. Part of traceability. |
| **Playbook** | A reusable, opinionated procedure for a recurring situation (a workflow is a kind of playbook). |
| **Prompt example** | A provider-neutral example prompt a stage or agent can give to an AI tool. Never tool-specific. |
| **Requirement** | A stated need the software must satisfy, expressed as user stories + acceptance criteria, each with an ID. |
| **Reproducibility** | The property that two teams following ThinkFlow on the same problem produce comparable results. |
| **Retrospective** | The final lifecycle stage: what worked, what didn't, and what to change — fed back into the methodology and the next project. |
| **Source of truth** | The authoritative record of intent. In ThinkFlow, documentation is the source of truth; code is a *derivation* of it. |
| **Stage** | One phase of the lifecycle (e.g. Requirements, Architecture, Deployment). Every stage has a document following the anatomy. |
| **Template** | A fill-in-the-blank document that instantiates a stage's or artifact's expected structure. See [`docs/templates/`](docs/templates/). |
| **Traceability** | The ability to follow any artifact backward to the problem it serves and forward to what it produces: `Problem → Feature → Architecture → Task → Code → Tests → Deployment`. |
| **Tool-agnostic** | Designed to work with any AI coding agent, present or future; never coupled to one tool. |
| **Workflow** | An end-to-end procedure for a recurring kind of work (New Feature, Bug Fix, Release, …), combining stages, documents, AI involvement, and human checkpoints. See [`docs/workflows/`](docs/workflows/). |
