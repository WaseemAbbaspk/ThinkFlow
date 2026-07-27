# Todo App — Testing

> **Purpose:** Prove every acceptance criterion of the Todo app and keep it proven.
> **Owner:** QA Lead (example). **Written:** Testing stage (matrix drafted alongside Requirements).
> **Changes:** when requirements change or new failure modes are found.
> **Inputs:** [02-requirements.md](02-requirements.md) (`AC` IDs), [03-architecture.md](03-architecture.md).
> **Outputs:** test suite + this report → sign-off for Deployment.
> **Built from:** [testing-strategy template](../../docs/templates/testing-strategy.md).

## Scope of testing

All v1 functional stories (US-1…US-5) and the non-functional requirements. Persistence is tested
against real `localStorage` behavior (refresh + restart), since that's the crux of GOAL-1.

## Test levels

| Level | What it covers | Example |
|-------|----------------|---------|
| Unit | State logic: add/toggle/delete, empty-input guard | TEST-2, TEST-10 |
| Integration | Logic + persistence (save/load round-trip) | TEST-11, TEST-15 |
| End-to-end | Full user flows in a browser, incl. refresh | TEST-1, TEST-12 |
| Non-functional | Responsiveness, keyboard/a11y | TEST-16, TEST-17 |

## Traceability matrix

The heart of this document — **every acceptance criterion maps to at least one test**:

| Acceptance criterion | Test ID | Level | Status |
|----------------------|---------|-------|--------|
| AC-1.1 add on Enter/click | TEST-1 | E2E | ✅ pass |
| AC-1.2 reject empty input | TEST-2 | Unit | ✅ pass |
| AC-1.3 input clears after add | TEST-3 | E2E | ✅ pass |
| AC-2.1 all tasks listed | TEST-4 | E2E | ✅ pass |
| AC-2.2 empty-state message | TEST-5 | E2E | ✅ pass |
| AC-3.1 toggle complete/active | TEST-10 | Unit | ✅ pass |
| AC-3.2 visual done state | TEST-10 | E2E | ✅ pass |
| **AC-3.3 completion persists across refresh** | **TEST-12** | **E2E** | ✅ pass |
| AC-4.1 delete removes task | TEST-13 | E2E | ✅ pass |
| AC-4.2 deleted stays gone after refresh | TEST-14 | E2E | ✅ pass |
| AC-5.1 state survives refresh | TEST-11 | Integration | ✅ pass |
| AC-5.2 state survives browser restart | TEST-15 | Integration | ✅ pass |
| NFR-1 action < 100 ms | TEST-16 | Non-functional | ✅ pass |
| NFR-3 keyboard operable / WCAG AA | TEST-17 | Non-functional | ✅ pass |

Every row has a test, and every test traces to a criterion — the Testing exit criterion is met.

## The chain, proven

**TEST-12** is the far end of the example's traceability chain:

> PROB-1 → US-3 → **AC-3.3** → ADR-1 (localStorage) → TASK-7 → **TEST-12**

TEST-12: add a task, mark it complete, reload the page, assert the task is still present **and**
still shows the completed state. Passing this test is the concrete proof that the original
problem — "tasks disappear and can't be trusted" — is actually solved.

## Test data & environments

- Fresh `localStorage` per test (cleared in setup) to avoid cross-test leakage.
- E2E runs in a headless browser; unit/integration in the JS test runner.

## Entry / exit criteria

- **Entry:** TASK-4…8 complete; acceptance criteria stable.
- **Exit:** every `AC` has a passing test (matrix above); no open Sev-1/Sev-2 defects.

## Reporting & sign-off

- Result: **all acceptance criteria pass; no blocking defects.**
- Signed off by: **QA Lead (example)**  Date: **2026-07-27** → cleared for Deployment.
