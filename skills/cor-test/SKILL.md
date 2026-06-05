---
name: cor-test
description: "Test phase of the COR methodology. Runs only the tests that were explicitly planned — unit, integration, and UAT. No unplanned testing scope creep. Claude Code users: invoke as /cor:test."
status: stable
stability: guaranteed
---

# COR Test — Test Phase

You are opening the Test phase of the COR (CodingOnRails) methodology. You run only the tests that were explicitly planned. No unplanned testing scope creep.

---

## Environment Detection

Determine which interactive question tool is available. Check in this order:

| Priority | Signal | Environment | Question tool |
|---|---|---|---|
| 1 | `AskUserQuestion` available | Claude Code | `AskUserQuestion` |
| 2 | `vscode_askQuestions` available | Copilot | `vscode_askQuestions` |
| 3 | neither | Codex / other | inline numbered list |

Store as **active environment**. Use the matching question tool for the UAT prompts in Step 3.

---

## Step 1 — Read Config and Plan

Read `.cor/config.md` for `Plan Storage`. If config does not exist: "Run the **cor-setup** skill first." and stop.

Load the plan based on storage type:
- **markdown**: Read `.cor/plan.md`
- **memory**: Read from agent memory
- **session**: Read current todos from the session task panel

---

## Step 2 — Audit for Test Tasks

Scan the plan for tasks tagged with `[unit]`, `[integration]`, or `[UAT]`.

If no test tasks are found (or all are already checked off):
  "No testing was planned for this work. All done."
  Stop here.

If test tasks exist, group them by type and present a summary:

  Planned tests:
  - [unit]        T03: Write unit tests for withAuth
  - [UAT]         T04: Verify the login → orders flow

  Proceeding through each in order.

---

## Step 3 — Execute Test Tasks

Work through each test task in plan order:

**[unit] tasks**
Run the unit test command from `.cor/config.md` (the line containing `vitest`, `jest`, `rspec`, `pytest`, etc.). If there is no test command in config, ask the user: "What command should I run for unit tests?" and wait.

Show the output. If tests fail:
- If the failure is in code you just wrote, fix it and re-run.
- If the failure is pre-existing, flag it: "This failure predates this task. Fix it now or log it as a separate task?"
- Do not mark the task complete while tests are failing.

**[integration] tasks**
Run the integration test command from config. Same failure protocol as unit tests.

**[UAT] tasks**
Do not run code. Instead, present the acceptance criteria for this task (drawn from the task description and the Think phase context). Then ask the user:

  UAT: T04 — Verify the login → orders flow works end-to-end

  Walk through this manually:
  1. Log in as a valid user
  2. Navigate to /orders
  3. Confirm the orders list loads without a 401 error
  4. Log out and confirm /orders redirects to /login

  Did it pass? (yes / no / partially)

If the user says no or partially, ask what failed and create a follow-up task in the plan before continuing.

---

## Step 4 — Mark Complete and Close

Mark each passing test task as complete in the plan (same method as the cor-code skill, Step 5).

When all planned test tasks are complete:

  All planned tests passed. This task is done.

  Plan summary:
  - [x] T01: ...
  - [x] T02: ...
  - [x] T03: ... [unit]
  - [x] T04: ... [UAT]

If any tasks remain open (skipped, failed, or follow-ups added), list them clearly and suggest: "Use the **cor-work** skill to see what's left."
