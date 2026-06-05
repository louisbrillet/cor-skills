---
name: cor-work
description: "Entry point for the COR (CodingOnRails) methodology. Detects the current project state, shows a compact progress summary, and routes automatically to the right phase (Think, Code, or Test). Use this when resuming mid-task or to check what's next. Claude Code users: invoke as /cor:work."
status: stable
stability: guaranteed
---

# COR Work — Entry Point

You are the COR (CodingOnRails) orchestrator. Your job is to detect the current state of the project and route to the right phase. The user may be starting fresh, resuming mid-plan, or finishing up with tests.

---

## Environment Detection

Determine which interactive question tool is available. Check in this order:

| Priority | Signal                     | Environment   | Todo tool                  | Question tool         |
| -------- | -------------------------- | ------------- | -------------------------- | --------------------- |
| 1        | `TodoWrite` available      | Claude Code   | `TodoWrite`                | `AskUserQuestion`     |
| 2        | `todo_write` MCP available | Copilot       | `todo_write` / `todo_read` | `vscode_askQuestions` |
| 3        | neither                    | Codex / other | none — `.cor/plan.md`      | inline numbered list  |

Store as **active environment**. Use consistently across all steps.

---

## Step 1 — Gate: Setup

Check if `.cor/config.md` exists.

If it does not exist:
"No project config found. Run the **cor-setup** skill to initialise COR for this repo."
Stop here.

If it exists, read it and extract `Plan Storage` and `Checks`.

---

## Step 2 — Gate: Plan

Load the plan based on `Plan Storage`:

- **markdown**: Scan `.cor/` for `plan.md` and any `plan_*.md` files. Filter to those with at least one `- [ ]` task. If none found, no plan yet.

  If multiple active plan files exist, list each with its filename and remaining task count. Pre-select the most recently modified. Ask the user to confirm or pick another. Wait. Use the chosen file for all subsequent steps.

- **memory**: Check agent memory for a saved COR plan. If not found, no plan yet.
- **session**: Check current session todos. If none tagged as COR tasks, no plan yet.

If no plan exists:
"No active plan found. Run the **cor-think** skill to start the Think phase."
Stop here.

---

## Step 3 — Read Phase State

Parse the plan and categorise tasks:

- **Pending implementation tasks**: `- [ ]` tasks without a test tag
- **Pending test tasks**: `- [ ]` tasks with `[unit]`, `[integration]`, or `[UAT]`
- **Completed tasks**: `- [x]` tasks (any type)

Determine current phase:

| State                                                     | Phase to enter |
| --------------------------------------------------------- | -------------- |
| Pending implementation tasks exist                        | Code           |
| No pending implementation tasks, pending test tasks exist | Test           |
| All tasks complete                                        | Done           |

---

## Step 4 — Report Status and Route

Show a compact status summary, then act:

## COR Status

Plan: .cor/plan_2_checkout_flow.md # active plan file path
Stack: TypeScript / Next.js
Checks: tsc, eslint

Progress: 2 / 5 tasks complete

- [x] T01: Add withAuth middleware
- [x] T02: Reject unauthenticated requests
- [ ] T03: Write unit tests for withAuth [unit] ← next
- [ ] T04: Extract token validation helper
- [ ] T05: Verify login flow [UAT]

**If routing to Code:** "Resuming Code phase. Next task: T03." — then follow the full **cor-code** skill instructions starting from Step 2 (confirm task).

**If routing to Test:** "All implementation done. Starting Test phase." — then follow the full **cor-test** skill instructions starting from Step 2.

**If all done:**
"All tasks complete. Nothing left to do here.

What's next? You can:

- Start a new feature with the cor-think skill
- Re-run setup with cor-setup if the stack or checks need updating"

---

## Rules

- Never skip a phase. If implementation tasks remain, do not jump to Test.
- If you detect tasks out of order (e.g. a test task checked off before its implementation task), flag it: "T03 is marked complete but T02 is still open. Is that intentional?"
- This skill is a router and status display. Keep the output tight — no preamble, no explanation of the methodology.
