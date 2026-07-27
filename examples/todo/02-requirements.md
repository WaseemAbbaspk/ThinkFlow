# Todo App — Requirements

> **Purpose:** Specify, testably, what the Todo app must do.
> **Owner:** Product Manager (example). **Written:** Requirements stage.
> **Changes:** when scope or a story/criterion changes.
> **Inputs:** [01-vision.md](01-vision.md). **Outputs:** [03-architecture.md](03-architecture.md),
> [04-tasks.md](04-tasks.md), [05-testing.md](05-testing.md).
> **Built from:** [requirements/PRD template](../../docs/templates/requirements-prd.md).

## Overview

A single-user, browser-based todo list that lets someone capture, complete, and remove tasks,
and trust that they persist. Serves the vision's goals of *trustworthy* (PROB-1) and *fast*
(PROB-2) task capture.

## Goals (from Vision)

- **GOAL-1** — Tasks persist reliably across refreshes and restarts (addresses PROB-1).
- **GOAL-2** — Capturing a task is near-instant and needs no setup (addresses PROB-2).

## User stories (functional requirements)

### US-1 — Add a task — _Priority: Must_
> As a user, I want to add a task quickly so that I capture it before I forget.

- **AC-1.1** Typing text and pressing Enter (or clicking Add) creates a task in the list.
- **AC-1.2** Submitting empty/whitespace-only text does **not** create a task.
- **AC-1.3** After adding, the input clears and is ready for the next task.

### US-2 — View my tasks — _Priority: Must_
> As a user, I want to see all my tasks so that I know what's outstanding.

- **AC-2.1** All tasks are listed, newest actions visible without scrolling for a typical list.
- **AC-2.2** When there are no tasks, an empty-state message is shown (not a blank screen).

### US-3 — Complete a task — _Priority: Must_
> As a user, I want to mark a task complete so that I can track what's done.

- **AC-3.1** Toggling a task's checkbox switches it between complete and active.
- **AC-3.2** A completed task shows a visual "done" state (e.g. strikethrough).
- **AC-3.3** The completed/active state **persists** across a page refresh. _(serves GOAL-1, PROB-1)_

### US-4 — Delete a task — _Priority: Should_
> As a user, I want to remove a task so that my list stays relevant.

- **AC-4.1** Each task has a delete control that removes it from the list.
- **AC-4.2** A deleted task does **not** reappear after a refresh.

### US-5 — Persist across sessions — _Priority: Must_
> As a user, I want my tasks to still be there when I return so that I can trust the tool.

- **AC-5.1** All tasks and their states survive a page refresh. _(serves GOAL-1, PROB-1)_
- **AC-5.2** All tasks and their states survive closing and reopening the browser on the same device.

## Non-functional requirements

| ID | Requirement | Target (measurable) |
|----|-------------|---------------------|
| NFR-1 | Responsiveness (serves GOAL-2) | Any action (add/complete/delete) reflects in the UI within **100 ms** on a mid-range 2020 laptop. |
| NFR-2 | No setup (serves GOAL-2) | App is usable on first load with **zero** signup or configuration steps. |
| NFR-3 | Accessibility | All controls operable by keyboard; meets **WCAG 2.1 AA** for contrast and labels. |

## Assumptions

- Single device, single browser is acceptable for v1 — _from Vision._

## Constraints

- No backend server in v1 (drives the storage decision in [ADR-1](03-architecture.md#adr-1-persist-state-in-browser-localstorage)).

## Non-goals

- Multi-user, sharing, accounts, cloud sync, due dates, reminders, tags — all out of v1.

## Traceability

| Story | Serves goal | Realized by task(s) | Verified by test(s) |
|-------|-------------|---------------------|---------------------|
| US-1 | GOAL-2 | [TASK-4](04-tasks.md#task-4-add-a-task) | TEST-1…3 |
| US-2 | GOAL-2 | [TASK-5](04-tasks.md#task-5-render-the-task-list) | TEST-4…5 |
| US-3 | GOAL-1 | [TASK-6](04-tasks.md#task-6-toggle-task-completion), [TASK-7](04-tasks.md#task-7-persist-task-completion) | TEST-10…12 |
| US-4 | GOAL-2 | [TASK-8](04-tasks.md#task-8-delete-a-task) | TEST-13…14 |
| US-5 | GOAL-1 | [TASK-3](04-tasks.md#task-3-load-and-save-state-in-localstorage), [TASK-7](04-tasks.md#task-7-persist-task-completion) | TEST-11, TEST-12, TEST-15 |

## Sign-off

- Approved by: **PM (example)**  Date: **2026-07-27**
