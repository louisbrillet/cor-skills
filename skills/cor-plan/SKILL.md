---
name: cor-plan
description: "Plan phase of the COR methodology. Takes the understanding built in the Think phase and turns it into a structured, ordered task list saved to .cor/plan.md (or agent memory / session tasks). No coding happens here — only decomposition and sequencing. Claude Code users: invoke as /cor:plan."
status: stable
stability: guaranteed
---

# COR Plan — Plan Phase

You are opening the Plan phase of the COR (CodingOnRails) methodology. You take the understanding built in the Think phase and turn it into a structured, ordered task list. No coding happens here — only decomposition and sequencing.

---

## Environment Detection

Determine which interactive question tool is available. Check in this order:

| Priority | Signal | Environment | Question tool |
|---|---|---|---|
| 1 | `AskUserQuestion` available | Claude Code | `AskUserQuestion` |
| 2 | `vscode_askQuestions` available | Copilot | `vscode_askQuestions` |
| 3 | neither | Codex / other | inline numbered list |

Store as **active environment**. Use the matching question tool whenever user input is required in this skill. For Codex, use inline numbered lists with `**(Recommended)**` on the best default and a final "Other — describe in free text" option.

---

## Step 1 — Read Config

Read `.cor/config.md`. Extract the `Plan Storage` value. If the file does not exist, tell the user: "Run the **cor-setup** skill first to configure this project." and stop. If the `Plan Storage` value is invalid or unsupported, inform the user: "The Plan Storage value in .cor/config.md is invalid. Supported values are: markdown, memory, session." and stop.

---

## Step 2 — Read Thinking Context

Summarise the key outputs from the Think phase in this conversation. If there is no prior Think phase in this session (the user jumped straight to Plan), ask: "What are we building? Give me a quick summary of the problem and constraints." Wait for the answer.

---

## Step 3 — Decompose into Tasks

Break the work into an ordered list of concrete, implementable tasks. Follow these rules:

- Each task must be independently actionable — a single, focused unit of work.
- Sequence tasks so that dependencies are respected (if T2 depends on T1, T1 comes first).
- Separate implementation tasks from testing tasks. If testing was discussed (unit, integration, or UAT), include it as its own task with an explicit type tag.
- Do not bundle multiple concerns into one task.
- Do not add tasks that were not discussed — stay within the scope established in Think.

Task type tags (append to the task description when applicable):
  [unit]        — unit tests to write or update
  [integration] — integration tests to write or update
  [UAT]         — user acceptance test to walk through manually

Example task list:

  T01: Add `withAuth` middleware to the `/api/orders` route
  T02: Reject unauthenticated requests with a 401 response
  T03: Write unit tests for `withAuth` [unit]
  T04: Verify the login → orders flow works end-to-end [UAT]

Present the list to the user. Ask: "Does this task breakdown look right? Add, remove, reorder, or reword anything before I save it."

Wait for confirmation.

---

## Step 4 — Save the Plan

Based on the `Plan Storage` value from config:

**markdown**

Before writing, check for existing plan files. Scan `.cor/` for `plan.md` and any `plan_*.md` files.

**Storage type mismatch** — If config says `markdown` but a prior plan exists in memory or session (or vice versa), detect the orphan and tell the user: "A plan exists in [old storage] but config now points to [new storage]. Fix the config or acknowledge the orphan before continuing." Stop until resolved.

**No existing plans found** — proceed directly. Save to `.cor/plan.md` using the structure below.

**Existing plans found** — for each file, check whether any tasks are marked `- [x]`. Classify:
- **In-progress**: at least one `- [x]` task
- **Untouched**: all tasks are `- [ ]`

If any in-progress plans exist, present two options using the native question widget:
- A: Merge new tasks as a new phase in an existing plan
- B: Create a separate plan file

If only untouched plans exist, present three options:
- A: Merge new tasks as a new phase in an existing plan
- B: Overwrite (treat existing plan as stale)
- C: Create a separate plan file

If multiple plans exist and the user chooses A or B, ask which plan to target.

Wait for the user to choose, then execute:

**Option A — Merge as phase**

Find the last `- [ ]` task in the target file. Determine the next task ID by reading the highest existing task number and incrementing (e.g. existing ends at T04 → new starts at T05). Insert after the last task:

```
## Phase 2 — [1-line summary of new work]

- [ ] T05: [description]
- [ ] T06: [description]
```

Write back to the same file. Do not touch existing tasks or checkboxes.

**Option B — Overwrite**

Replace the file entirely with the structure below. Save to `.cor/plan.md`.

**Option C — Separate plan**

Determine N = count of existing plan files + 1. Generate a 2–3 word slug from the context summary (e.g. `checkout_flow`, `add_auth`). Save to `.cor/plan_[N]_[slug].md`.

After saving, tell the user: "Saved as `plan_[N]_[slug].md`. cor-code and cor-work will list all plans with pending tasks and ask which one to work on."

---

**Plan file structure** (used for new files and overwrites):

  # COR Plan

  ## Context
  [1–2 sentence summary of what we're building and why]

  ## Tasks
  - [ ] T01: [description]
  - [ ] T02: [description]
  - [ ] T03: [description] [unit]
  - [ ] T04: [description] [UAT]

**memory** — Save the plan to the agent's memory system using the same structure as above. For Claude Code, this is `~/.claude/projects/[project-path]/memory/cor_plan.md`.

**session** — Create tasks in the agent's task panel (if supported). Use the task descriptions directly. Include the type tag in the content field for test tasks.

---

## Step 5 — Confirm

Tell the user: "Plan saved. [N] tasks ready. Use the **cor-code** skill to start implementing, or **cor-work** to let the harness pick up where you are."
