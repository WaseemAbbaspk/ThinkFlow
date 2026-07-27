# Checklist — Template

> **Purpose:** Provide a consistent shape for ThinkFlow checklists (stage gates and reviews).
> **Owner:** Methodology maintainers. **Written:** Foundational.
> **Changes:** when the checklist format changes.
> **Inputs:** the stage/gate being checked. **Outputs:** a pass/fail gate decision.
> _Copy this file, delete the italic guidance, and fill in._

# <Name> Checklist

**Use when:** <the moment this checklist is run, e.g. "before exiting the Requirements stage">
**Owner:** <human role who runs and signs off the gate>
**Related:** <link the stage/workflow doc this gate belongs to>

## Gate items

_Each item is objectively checkable — a reviewer either can or can't tick it. Group if long._

- [ ] <item — phrased so it's unambiguous whether it's satisfied>
- [ ] <item>
- [ ] <item>

## Evidence

_Where the proof lives (a link to the doc, the CI run, the test report). A ticked box with no
evidence isn't a pass._

## Sign-off

- Gate result: **Pass / Fail**
- Signed off by: **<name / role>**  Date: **<date>**
- If Fail: **<what must change before re-running>**
