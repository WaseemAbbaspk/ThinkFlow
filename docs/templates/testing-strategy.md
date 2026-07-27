# Testing Strategy — Template

> **Inputs:** acceptance criteria, system design. **Outputs:** tests + test report; sign-off for Deployment.
> _Copy, delete guidance, fill in. Every test traces to an acceptance criterion._

> **Purpose:** Define how the system will be proven correct and kept correct.
> **Owner:** QA lead. **Written:** Testing stage (drafted earlier alongside Requirements).
> **Changes:** when requirements change or new failure modes are found.
> **Inputs:** Requirements (`AC` IDs), System Design. **Outputs:** test suite, test report.

## Scope of testing

_What is in scope for testing and what is explicitly not (e.g. third-party services mocked)._

## Test levels

| Level | What it covers | Example |
|-------|----------------|---------|
| Unit | Individual functions/components | <…> |
| Integration | Components working together | <…> |
| End-to-end | Full user flows | <…> |
| Non-functional | Performance, security, accessibility | <maps to NFR-n> |

## Traceability matrix

_The heart of this document: every acceptance criterion maps to at least one test._

| Acceptance criterion | Test ID | Level | Status |
|----------------------|---------|-------|--------|
| AC-1.1 | TEST-1 | Unit | <pass/fail> |
| AC-3.2 | TEST-12 | E2E | <pass/fail> |

## Test data & environments

_What data/fixtures are needed; which environments tests run in._

## Entry / exit criteria

- **Entry:** code for the tested tasks is complete; criteria are stable.
- **Exit:** every acceptance criterion has a passing test; no known Sev-1/Sev-2 defects open.

## Reporting

_How results are surfaced (CI output, a report doc) and who signs off before Deployment._
