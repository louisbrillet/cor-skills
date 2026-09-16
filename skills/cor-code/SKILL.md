---
name: cor-code
description: "Code phase of the COR methodology. Implements tasks from the plan sequentially and autonomously, running all configured checks after each task. Pauses only when tool/command output reveals unexpected high-impact information. Maintains concise repo instructions by updating active rules and archiving historical notes after each task. Claude Code users: invoke as /cor:code [task-id]."
status: stable
stability: guaranteed
---

# COR Code — Code Phase

You are opening the Code phase of the COR (CodingOnRails) methodology. Implement tasks sequentially and autonomously — no confirmation prompts unless unexpected information emerges that materially changes the approach (see Pause Policy). One task at a time. Surgical.

---

## Environment Detection

Determine which task-tracking and question tools are available. Probe in this order:

| Priority | Signal                     | Environment   | Todo tool                  | Question tool         |
| -------- | -------------------------- | ------------- | -------------------------- | --------------------- |
| 1        | `TodoWrite` available      | Claude Code   | `TodoWrite`                | `AskUserQuestion`     |
| 2        | `todo_write` MCP available | Copilot       | `todo_write` / `todo_read` | `vscode_askQuestions` |
| 3        | neither                    | Codex / other | none — `.cor/plan.md`      | inline numbered list  |

Store as **active environment**. Use consistently across all steps.

---

## Step 0 — Resume Detection

Before reading config or loading the plan, detect whether a prior run was interrupted.

### Easy case (same session)

Scan prior conversation for the most recent task that was started. Verify:

- Step 3 checks passed for that task.
- `TodoWrite` was called marking it `"completed"` (Step 4 completed).

Both true → task finished cleanly, skip to Step 1.
Either missing → interrupted; cross-validate with checkpoint below.

### Hard case (fresh session / cold start)

**1. Check `.cor/checkpoint.md`**

If it exists, read it:

```
plan: .cor/plan_2_checkout_flow.md
task: T03
phase: implementing   # implementing | checks | marking-complete | done
started: 2026-05-12T14:30:00
```

If `phase: done` → task finished cleanly. Proceed to Step 1.

Otherwise task was interrupted at that phase. Use the `plan:` field as the active plan file. Proceed to Severity Assessment.

**2. Fallback — git state**

If no checkpoint (or `phase: done`) but `git status` reports uncommitted changes:

- Run `git diff --name-only` to list changed files.
- Cross-reference against `.cor/plan*.md` files to identify the likely interrupted task.
- Treat phase as unknown.
- Proceed to Severity Assessment.

**3. Clean state**

No checkpoint, `phase: done`, or no dirty git state → no prior interruption. Proceed to Step 1.

### Severity Assessment

Run all configured checks from `.cor/config.md`.

| Result                           | Action                                                                                   |
| -------------------------------- | ---------------------------------------------------------------------------------------- |
| All checks pass                  | Safe. Re-run the interrupted task from the beginning of Step 2.                          |
| Only linter / formatter failures | Auto-fix (`eslint --fix`, `rubocop -a`, `ruff --fix`, etc.), re-run checks, then resume. |
| Test failures or compile errors  | **Pause.** Report: interrupted task, phase, failing check output, and options below.     |
| Can't map dirty files to a task  | **Pause.** Show `git diff --stat` summary and ask how to proceed.                        |

When pausing, use the native question widget:

- _Claude Code_: `AskUserQuestion` — options: re-implement task from scratch / skip task and continue / investigate manually.
- _Copilot_: `vscode_askQuestions` with same choices.
- _Codex_: Inline numbered list, `**(Recommended)**` on the safest default, plus "Other — describe in free text."

---

## Step 1 — Read Config and Plan

Read `.cor/config.md`. Extract:

- `Checks` — commands to run after each task
- `Plan Storage` — where the plan lives (`markdown`, `memory`, or `session`)

If config does not exist: "Run the **cor-setup** skill first." and stop.

### Load the plan

**markdown**: Scan `.cor/` for `plan.md` and any `plan_*.md` files. Filter to those with at least one `- [ ]` task. Call this set **active plans**.

- **One active plan**: use it. Store its path as the **active plan file**.
- **Multiple active plans**: list each with its filename and remaining task count. Pre-select the most recently modified. Ask the user to confirm or pick another. Wait. Store the chosen path as the **active plan file**.
- **No active plans** (all tasks complete or no plan files): "No pending tasks found. All done." Stop.

Extract all tasks (checked and unchecked) from the active plan file into a working list.

**memory**: Read plan from agent memory. Build working list.

**session**: Load into the active environment's todo tool:

**Claude Code (`TodoWrite`)**

Read `.cor/plan.md` (or memory). Call `TodoWrite` **once, right now, with every task in the plan** — all of them, not just the first. This is mandatory before any implementation begins. Map statuses: `- [x]` → `"completed"`, in-progress marker → `"in_progress"`, `- [ ]` → `"pending"`. `TodoWrite` replaces the entire list, so every task must be present in every call:

```json
{
  "todos": [
    { "content": "T01 — description [tag]", "status": "completed" },
    { "content": "T02 — description [tag]", "status": "pending" },
    { "content": "T03 — description [tag]", "status": "pending" },
    { "content": "T04 — description [tag]", "status": "pending" },
    { "content": "T05 — description [tag]", "status": "pending" }
  ]
}
```

If the session already has the full plan loaded (all tasks present), skip this call and use the existing list. If any tasks are missing, reload the full list.

**Copilot (`todo_write` / `todo_read`)**

1. Call `todo_read` (no parameters). Examine the result:
   - Result contains todos matching this plan → use them directly; skip step 2.
   - Result is empty or null → proceed to step 2.
2. Read `.cor/plan.md` (or memory). Call `todo_write` with all tasks:

```json
{
  "title": "COR Plan",
  "todos": [
    {
      "id": "T01",
      "content": "T01 — description [tag]",
      "status": "pending",
      "priority": "medium"
    },
    {
      "id": "T02",
      "content": "T02 — description [tag]",
      "status": "completed",
      "priority": "medium"
    }
  ]
}
```

- Map `.cor/plan.md` checkboxes: `- [x]` → `"completed"`, `- [ ]` → `"pending"`.
- `id` must match the task ID (e.g. `"T01"`).
- Always pass the full task list — `todo_write` replaces the entire list.

**Codex / fallback**: Read `.cor/plan.md`. Track state in memory only — no tool to populate.

### Select next task

Take the first `pending` task from the loaded list. If the user invoked with a task ID (e.g. `/cor:code T03`), jump to that task instead.

---

## Step 2 — Implement

### Cross-plan checkpoint guard

Before writing the checkpoint, check if `.cor/checkpoint.md` already exists with `phase != done`.

If it does, compare its `plan:` field to the current active plan file:

- **Same plan** → prior run on this plan was interrupted; proceed normally (Step 0 already handled recovery).
- **Different plan** → a previous plan was interrupted. Pause using the native question widget:

  > "Plan `[checkpoint plan]` was interrupted at `[task]` (phase: `[phase]`). You are now starting `[current plan]`. What do you want to do?"
  >
  > - A: Discard the old checkpoint and continue with the current plan
  > - B: Stop here — switch back to `[checkpoint plan]` first (use cor-work)

  Wait for the user to choose. If A: overwrite and continue. If B: stop.

### Write checkpoint

Write `.cor/checkpoint.md`:

```
plan: .cor/plan_2_checkout_flow.md
task: T03
phase: implementing
started: 2026-05-12T14:30:00
```

Always include the `plan:` field — even when only one plan file exists. Use the actual task ID, active plan file path, and current timestamp. This file is the crash-recovery signal — write it first, before any code change.

No confirmation prompt. Begin immediately.

Implement the task surgically:

- Only touch files and lines required by this task.
- Do not refactor unrelated code.
- Do not add abstractions beyond what the task requires.
- Do not add comments unless the why is genuinely non-obvious.
- If you encounter something clearly broken in files you are already modifying, fix it — but do not go looking for things to clean up.
- Apply consistent formatting to every modified file: run the auto-fix commands from the Checks config (e.g. `eslint --fix`, `rubocop -a`, `ruff --fix`). Non-optional.

---

## Step 3 — Run Checks

Update `.cor/checkpoint.md` — change `phase` to `checks` (preserve all other fields):

```
plan: .cor/plan_2_checkout_flow.md
task: T03
phase: checks
started: 2026-05-12T14:30:00
```

Run every command listed in the `Checks` section of `.cor/config.md`, in order.

If a check fails:

- Read the error output carefully.
- Fix the root cause. Do not skip or suppress errors.
- Re-run the failing check (and dependents) until it passes.
- Do not proceed while any check is failing.

If a failure is caused by pre-existing code unrelated to this task → flag it in notes (Step 5), offer to log as a separate task, and continue.

---

## Step 4 — Mark Complete

When all checks pass, update `.cor/checkpoint.md` — change `phase` to `marking-complete` (preserve all other fields):

```
plan: .cor/plan_2_checkout_flow.md
task: T03
phase: marking-complete
started: 2026-05-12T14:30:00
```

Mark the task complete in the plan and todo tool (see below), then overwrite `.cor/checkpoint.md`:

```
plan: .cor/plan_2_checkout_flow.md
task: T03
phase: done
started: 2026-05-12T14:30:00
```

No `rm` needed — `phase: done` is the clean-finish signal.

**markdown**: Edit the active plan file — change `- [ ] T0X` to `- [x] T0X`.

**memory**: Update plan in agent memory.

**session**:

_Claude Code_: Call `TodoWrite` with **every task in the plan** — never a subset. Set the just-finished task to `"in_progress"` first, then `"completed"` in a second call. Every other task keeps its current status:

```json
{
  "todos": [
    { "content": "T01 — description [tag]", "status": "completed" },
    { "content": "T02 — description [tag]", "status": "in_progress" },
    { "content": "T03 — description [tag]", "status": "pending" },
    { "content": "T04 — description [tag]", "status": "pending" },
    { "content": "T05 — description [tag]", "status": "pending" }
  ]
}
```

_Copilot_: Call `todo_write` with the full list, setting the completed task's `status` to `"completed"`. Never omit tasks — `todo_write` replaces the entire list.

_Codex_: Edit the active plan file — change `- [ ] T0X` to `- [x] T0X`.

---

## Step 5 — Write Notes

After marking a task complete, assess what was discovered. Write a note if any of the following apply:

- **Gotcha / non-obvious constraint**: hidden invariant, surprising API behavior, footgun encountered.
- **Check failure + root cause**: what broke and why — prevents re-triggering the same issue.
- **Architectural decision**: why a certain approach was chosen over alternatives.
- **Skipped / deferred item**: what was skipped and the reason, so future agents don't re-do the work.
- **Good practice**: something worth repeating on this project.
- **Error not to reproduce**: a specific mistake or pattern to avoid.
- **Setup / config info**: new env var required, config file that must be created, service that must be running, or any step a developer needs to perform to get the project working.

If nothing noteworthy → skip this step entirely.

### Note destination and scoping

First, classify the note by audience:

| Audience                                   | Destination                     |
| ------------------------------------------ | ------------------------------- |
| Human developers (setup, config, env vars) | `README.md`                     |
| AI agents — project-wide rules             | agent instruction file (global) |
| AI agents — scoped to a module / directory | agent instruction file (scoped) |

**README.md** — use for any setup/config info: env vars to add, config files to create, services to start, migrations to run. This is the canonical place a new developer looks. Find the most relevant existing section (`## Configuration`, `## Environment Variables`, `## Setup`, `## Getting Started`) and append there. If no suitable section exists, create a minimal `## Configuration` section. Write in plain prose or a bullet list — no COR Notes comment block, no tags. Keep it concise and human-friendly.

For all other note types, use the appropriate agent file per agent. Two independent scoping mechanisms exist for narrowing a rule below "loads for the whole project" — they are not interchangeable, and mixing them wrong is what silently defeats scoping (see the hard rule below).

**Path-scoped `.claude/rules/` — Claude Code + VS Code Copilot, not Codex**

Verified against both vendors' current docs: VS Code Copilot reads `.claude/rules/*.md` natively (default `chat.instructionsFilesLocations`), using the **same** `paths` frontmatter key as Claude Code — not `applyTo` (VS Code docs: "For `.claude/rules` instructions files, VS Code uses a `paths` property instead of `applyTo`"). One file, no duplication, for any project that targets Claude Code and/or Copilot.

- Scope with a `paths` YAML frontmatter array (glob patterns relative to workspace root):
  ```markdown
  ---
  paths:
    - "src/lib/anchor-*.ts"
    - "src/lib/block-overlap*.ts"
  ---
  ```
- A file with **no** `paths` key loads unconditionally at every session start — same as a global `CLAUDE.md`. A file **with** `paths` loads only when the agent reads a file matching one of the globs; it is otherwise invisible. A file is one or the other, never both.
- One file per topic, descriptive name (e.g. `k8s.md`, `docx-conversion.md`, `src-git.md`).
- **Codex does not read this directory at all.** If the project also targets Codex, this content needs the nested-`AGENTS.md` treatment below too — Codex simply never sees anything scoped only through `.claude/rules/`.
- Best for a rule that doesn't map to one real subdirectory — a flat `src/lib/` full of prefix-named files, or a concern that legitimately spans several unrelated folders (e.g. two workers in different files that must stay symmetric).

**Nested `AGENTS.md` + a one-line `CLAUDE.md` stub — Claude Code always, Codex/Copilot only in a session scoped to that directory**

Codex builds its instruction chain **once per session** — at launch, or at whatever directory it was started/`--cd`'d into — by concatenating `AGENTS.md`/`AGENTS.override.md` from the project root down to that working directory. It does **not** re-resolve this as it edits different files during a running session, and its official docs show no `@import`/file-reference syntax — treat any claim that Codex supports importing another file from `AGENTS.md` as unverified until you've confirmed it against current docs, and never assume it silently. Concretely: a Codex session started at the repo root will **never** pick up `<subdir>/AGENTS.md` on its own, no matter how many files under `<subdir>/` it touches later in that session; only a session actually started inside (or `--cd`'d into) `<subdir>/` sees it. VS Code Copilot reads nested `AGENTS.md` files dynamically like Claude Code, but only if `chat.useNestedAgentsMdFiles` is enabled — experimental, off by default.

Still worth doing when the rule is genuinely about one real directory (`k8s/`, a route folder, a component folder) and the team sometimes runs Codex sessions scoped to exactly that directory (`codex --cd k8s`):

1. Put the rule body in `<subdir>/AGENTS.md` (plain `## COR Notes`, no frontmatter).
2. Add a sibling `<subdir>/CLAUDE.md` with exactly one line, `@AGENTS.md`. Claude Code discovers nested `CLAUDE.md` files lazily — only when it reads a file inside `<subdir>/`, never at launch, and unlike Codex it *does* re-resolve this per file throughout the session — and at that point follows the import into the sibling `AGENTS.md`.

For content spanning several unrelated files or folders, forcing it into one subdirectory's `AGENTS.md` would hide it from every other file it actually applies to — use path-scoped `.claude/rules/` instead, and accept that Codex won't get it automatically (see the fallback below).

**Fallback for Codex when nothing above fits — an index in root `AGENTS.md`, read on demand**

Root `AGENTS.md` is the one file every repo-root Codex session is guaranteed to load, in full, unconditionally, every time — there is no way around that cost, so keep it small rather than pasting rule bodies into it. Instead, list each `.claude/rules/<topic>.md` file with the paths it covers, and instruct Codex to read the matching one itself before editing a file in that area. This trades automatic injection for agent-directed reading: Codex has its own file-read tools, so an explicit "read `.claude/rules/src-git.md` before touching `docs-git.ts`" line works even though Codex never auto-loads that file. This is what this project's root `AGENTS.md` does — use it as the reference shape.

**Hard rule: never `@import` a scoped file into a project's root `AGENTS.md`/`CLAUDE.md`.** An `@path` import always loads eagerly and unconditionally at every session start, regardless of any `paths` frontmatter the imported file carries — the import does not "activate" the scoping, it silently defeats it, and the file becomes indistinguishable in effect from an unscoped global rule. (Measured on this project: a root `AGENTS.md` importing four `.claude/rules/*.md` files that already carried correct `paths` frontmatter forced roughly 150 KB into every single turn of every session, for months, purely because the `@import` bypassed the frontmatter. Removing the four import lines — nothing else — was most of the fix.) A scoped file must be found by the agent's own native discovery (sitting in `.claude/rules/`, or in a subdirectory's own `AGENTS.md`/`CLAUDE.md`) — never referenced by `@import` from a broader file.

**Claude Code — global only**

- Project-wide → root `CLAUDE.md` (or `.claude/CLAUDE.md`). Keep this to genuinely universal content; anything narrower belongs in `.claude/rules/` or a nested `AGENTS.md`+`CLAUDE.md` pair, per above.

**Copilot — additional scoped option**

- `.github/instructions/<topic>.instructions.md` with `applyTo` frontmatter (comma-separated glob string in one string, not a YAML array):
  ```markdown
  ---
  applyTo: "app/controllers/api/**/*.rb"
  ---
  ```
  Use this only when the project does **not** also target Claude Code — otherwise `.claude/rules/` covers both with one file and one frontmatter key.

**Codex — root file is an index, not a content dump**

- Root `AGENTS.md` is read in full, unconditionally, every session — keep genuinely universal rules there directly, but for everything scoped, list it as "topic → file to read" (see the fallback pattern above) rather than pasting it in or `@`-importing it.
- Create the file with a minimal header if it doesn't exist.

### Note format and maintenance policy

Find or create a `## COR Notes` section in the target file. Write entries in english. Keep each entry compact (one line), with a tag and a stable ID:

```markdown
## COR Notes

### Active Rules

- [rule][API-AUTH-001] Always use explicit HTTP status codes with `render json:`
- [gotcha][API-AUTH-002] API-only controllers may skip `before_action` unless explicitly included
```

Tags: `[gotcha]` `[rule]` `[decision]` `[skip]` `[error]` `[practice]` `[setup]`

When updating instruction files, enforce these rules:

1. Keep one canonical rule body in one file (`.claude/rules/<topic>.md`). Do not duplicate the same rule text across `AGENTS.md`, `CLAUDE.md`, and `.github/copilot-instructions.md`.
2. Keep scoped rule files in this section order: `## COR Notes`, `### Active Rules`, `### Active Decisions`, `### Gotchas` (optional), `### Runbook`, `### Archive`.
3. Keep only reusable/current constraints in active sections. Move historical or plan-specific context to `.cor/instruction-archive/<topic>.cor-notes.archive.md`, then leave a pointer in `### Archive`.
4. Deduplicate before appending: if an equivalent rule exists, update it in place instead of adding a near-duplicate line.
5. Avoid volatile wording like `current version is X` unless the same change updates the code source of truth; prefer references to source files (for example `src/lib/db.ts`).
6. Keep active rule files concise (target <= 120 lines or <= 40 bullets). If a file exceeds this, there are two separate levers — apply whichever fits, and don't reach for the wrong one:
   - **Archive** genuinely historical or plan-specific entries (superseded decisions, one-off migration notes) to `.cor/instruction-archive/<topic>.cor-notes.archive.md`, with a pointer left in `### Archive`. This is for content that is no longer live, regardless of size.
   - **Split** if the file is still over budget because it legitimately covers several distinct, still-live subsystems bundled together (this is what happened to a 221-line `src.md` covering git integration, the AI loop, DOCX rendering, and more, all at once). Move each subsystem's rules into its own new sibling file (e.g. `src.md` → `src-git.md`, `src-loop-batch.md`, `src-docs-ops.md`, ...), each with its own narrower `paths` frontmatter scoped to that subsystem's actual files. Keep rule IDs unchanged when moving — only the file changes. Leave in the original file only what is genuinely cross-cutting: a rule that can matter from a file that has nothing else to do with the subsystem it describes (e.g. a client/server bundling boundary, a date-formatting convention, a concurrency lock spanning many routes). When in doubt whether a rule is cross-cutting enough to stay, prefer moving it — an over-cautious split costs a few extra tokens on the rare turn that needed it; leaving too much in the base file costs those tokens on every turn.
7. Do not add per-task HTML timeline headers (`<!-- T.. -->`) in active files. Keep timeline detail in archive files.

For Copilot scoped files, place the `## COR Notes` section below frontmatter — never inside frontmatter.

---

## Continue or Stop

After Step 5, output:

```
T02 complete. Checks passed.

Next: T03 — Write unit tests for withAuth [unit]
```

Then immediately begin Step 2 for the next pending task — no confirmation.

If no pending tasks remain: "All tasks complete. Use **cor-test** for planned tests, or **cor-work** for a full status."

---

## Pause Policy

Pause and surface to the user ONLY when a tool or command output reveals new information that would materially change the implementation approach. Not for routine failures. Not for pre-existing issues. Not as a courtesy.

**Pause for:**

- A migration reveals the table already exists with a conflicting schema.
- A dependency install shows a version conflict requiring a choice between incompatible approaches.
- A test run reveals the feature already exists elsewhere (duplicate implementation risk).
- A file read reveals the target function is used in unexpected places the task didn't account for.

**Do not pause for:**

- A linter fails → fix and continue.
- A test fails → fix the root cause and continue.
- A pre-existing unrelated failure → note it, offer to log as a separate task, continue.
- A choice between two equivalent implementation approaches → pick the better one, note the decision, continue.

When pausing, state clearly: the unexpected finding, why it matters, and the paths forward. Ask for direction using the native question widget:

- _Claude Code_: `AskUserQuestion` with the relevant options.
- _Copilot_: `vscode_askQuestions` with the relevant options.
- _Codex_: Inline numbered list with `**(Recommended)**` on the best default and a final "Other — describe in free text" option.

---

## Rules

- One task at a time. Never implement multiple tasks in a single run.
- Never mark a task complete while a check is failing.
- Check commands are non-negotiable. They exist because the user configured them.
- Surgical: if you didn't need to open a file to do the task, don't open it.
- Notes are written per-task. If nothing notable happened, write nothing.
