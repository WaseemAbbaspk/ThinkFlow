# Todo App — Vision

> **Purpose:** Create a friction-free way to capture and track personal tasks that you can trust.
> **Owner:** Product Manager (example).
> **Written:** Vision stage. **Changes:** only on a strategic pivot.
> **Inputs:** problem observation. **Outputs:** [02-requirements.md](02-requirements.md).

## Problem

People capture tasks in scattered places — sticky notes, chat messages to themselves, memory —
and lose them. The two failures that hurt most:

- **PROB-1** — a captured task disappears (e.g. on a page refresh or device restart), so the
  tool can't be trusted.
- **PROB-2** — capturing a task is slow enough that people don't bother, so tasks never make it
  in at all.

## Vision statement

> Anyone can capture a task in a couple of seconds and trust it will still be there later —
> with no account, no setup, and no clutter.

## Who benefits

| Audience | What changes for them |
|----------|-----------------------|
| An individual managing their own day | Stops losing tasks; stops relying on memory. |
| A first-time user | Starts using it instantly — no signup, no learning curve. |

## Why now

Browsers ship reliable local storage; a genuinely useful single-user tool needs no backend,
which makes "no account, instant, trustworthy" achievable in a weekend.

## What success looks like

A person opens the app, types a task, closes the tab, comes back tomorrow, and every task —
done and not-done — is exactly as they left it. Turned into measurable goals and requirements
in [02-requirements.md](02-requirements.md).

## Non-goals

- No multi-user, sharing, or collaboration.
- No accounts, login, or cloud sync (single device, single browser).
- No due dates, reminders, tags, or projects in v1.

## Assumptions & risks

- **Assumption:** one device / one browser is acceptable for v1 — _validated by the single-user framing._
- **Risk:** browser storage can be cleared by the user or the browser — _mitigated by keeping scope
  to "survives refresh/restart", not "survives storage wipe", and stating it plainly._
