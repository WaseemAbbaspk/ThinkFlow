# Todo App — Tasks

> **Purpose:** Break the Todo app into small, traceable, shippable tasks.
> **Owner:** Tech Lead / PM (example). **Written:** Task Breakdown stage.
> **Changes:** as tasks are completed or new ones are discovered.
> **Inputs:** [02-requirements.md](02-requirements.md), [03-architecture.md](03-architecture.md).
> **Outputs:** implementation + [05-testing.md](05-testing.md).
> **Built from:** [task template](../../docs/templates/task.md).

Every task traces to a requirement. Together they cover US-1…US-5 and the persistence decision
([ADR-1](03-architecture.md#adr-1-persist-state-in-browser-localstorage)).

| Task | Title | Traces to | Depends on |
|------|-------|-----------|------------|
| TASK-1 | Scaffold the single-page app | (enabling) | — |
| TASK-2 | Define the task data model | US-1…US-5 | TASK-1 |
| TASK-3 | Load and save state in localStorage | US-5, ADR-1 | TASK-2 |
| TASK-4 | Add a task | US-1 | TASK-2, TASK-3 |
| TASK-5 | Render the task list (+ empty state) | US-2 | TASK-2 |
| TASK-6 | Toggle task completion | US-3 (AC-3.1/3.2) | TASK-5 |
| TASK-7 | Persist task completion | US-3 (AC-3.3), US-5 | TASK-6, TASK-3 |
| TASK-8 | Delete a task | US-4 | TASK-5, TASK-3 |
| TASK-9 | Keyboard & accessibility pass | NFR-3 | TASK-4…8 |

---

## TASK-4: Add a task
- **Traces to:** US-1 (AC-1.1, AC-1.2, AC-1.3)
- **Depends on:** TASK-2, TASK-3
- **Goal:** A user can type text and create a task; empty input is rejected; the field clears after add.
- **Context for the agent:** Use the data model from TASK-2 and the save function from TASK-3.
  Adding a task appends to in-memory state, then persists. Trim input; reject empty/whitespace.
- **Acceptance criteria (done when):**
  - [ ] AC-1.1 Enter or Add creates a task.
  - [ ] AC-1.2 Empty/whitespace input creates nothing.
  - [ ] AC-1.3 Input clears after a successful add.
  - [ ] Tests TEST-1…3 pass; docs updated if behavior changed.
- **Out of scope:** editing an existing task's text (not a v1 requirement).

## TASK-6: Toggle task completion
- **Traces to:** US-3 (AC-3.1, AC-3.2)
- **Depends on:** TASK-5
- **Goal:** Toggling a task's checkbox flips its done state and shows the done style.
- **Context for the agent:** Flip the `done` flag in state and re-render; visual done state per AC-3.2.
- **Acceptance criteria (done when):**
  - [ ] AC-3.1 Toggle switches complete/active.
  - [ ] AC-3.2 Completed task shows a visual done state.
  - [ ] Tests TEST-10 pass.
- **Out of scope:** persistence — that's TASK-7.

## TASK-7: Persist task completion
- **Traces to:** US-3 (AC-3.3), US-5 (AC-5.1), [ADR-1](03-architecture.md#adr-1-persist-state-in-browser-localstorage)
- **Depends on:** TASK-6, TASK-3
- **Goal:** A task's completed/active state survives a page refresh and browser restart.
- **Context for the agent:** After any toggle (TASK-6), call the save function (TASK-3) so the
  `done` flag is written to `localStorage`. On load, restore it. This is the task that closes the
  PROB-1 → US-3 → AC-3.3 → ADR-1 chain.
- **Acceptance criteria (done when):**
  - [ ] AC-3.3 Completed state persists across a refresh.
  - [ ] AC-5.1 State survives a refresh.
  - [ ] Tests TEST-11, TEST-12, TEST-15 pass.
- **Out of scope:** cross-device sync (explicit non-goal).

## TASK-8: Delete a task
- **Traces to:** US-4 (AC-4.1, AC-4.2)
- **Depends on:** TASK-5, TASK-3
- **Goal:** A user can remove a task, and it does not return after a refresh.
- **Acceptance criteria (done when):**
  - [ ] AC-4.1 Delete control removes the task.
  - [ ] AC-4.2 Deleted task does not reappear after refresh (state persisted).
  - [ ] Tests TEST-13, TEST-14 pass.

_(TASK-1, 2, 3, 5, 9 follow the same shape; abbreviated here to keep the example focused on the
traceability spine.)_
