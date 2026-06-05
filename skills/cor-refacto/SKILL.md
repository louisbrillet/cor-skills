---
name: cor-refacto
description: "Think+Plan skill for behavior-preserving refactoring. Use when the user wants to improve readability, simplicity, maintainability, duplication, or coupling without functional changes. Produces a concrete refactor plan and a strict handoff for cor-code; blocks theoretical refactors that do not reduce net complexity."
status: beta
stability: experimental
---

# COR Refacto — Think + Plan

Open a refactoring session focused on **real simplification**.

Hard constraint: every proposed step must preserve behavior strictly.

This skill performs:

- Think (interrogate scope, risks, constraints, acceptance)
- Plan (produce ordered, atomic tasks and save plan)

This skill does **not** implement code. Implementation is delegated to `cor-code`.

Mandatory sequencing:

1. Deep code analysis and exploration
2. Think Q&A
3. Plan

Never start planning before analysis artifacts are produced.

---

## Environment Detection

Detect question tooling in this order:

| Priority | Signal                          | Environment   | Question tool         |
| -------- | ------------------------------- | ------------- | --------------------- |
| 1        | `AskUserQuestion` available     | Claude Code   | `AskUserQuestion`     |
| 2        | `vscode_askQuestions` available | Copilot       | `vscode_askQuestions` |
| 3        | neither                         | Codex / other | inline numbered list  |

Use multiple-choice format for every question.

---

## Refactor Gate (Blocking Rules)

Reject any task or extraction that violates one of these:

1. **KISS**: if understanding cost increases, reject.
2. **YAGNI**: no speculative extension points.
3. **Rule of Three**: do not unify on first/second occurrence.
4. **Least Surprise**: naming and behavior contracts must align.
5. **No behavior drift**: output, side effects, order, and state transitions remain identical.
6. **No coupling hubs**: do not extract into `utils/helpers/common` buckets.
7. **No mixed intent**: do not mix feature work with refactoring work.

If a candidate refactor fails any gate, explicitly mark it `REJECTED` with reason.

---

## Step 0 — Deep Code Analysis (Mandatory Before Think/Plan)

Perform a code exploration pass before proposing any task breakdown.

Minimum required exploration:

- Read the primary files in scope end-to-end.
- Read directly connected modules (callers/callees, shared helpers, routes, actions, tests).
- Identify duplication candidates with concrete file/line evidence.
- Identify coupling hotspots with concrete dependency evidence.
- Identify behavior-critical paths (ordering, side effects, state transitions).

Required output artifact before Think can continue:

## Exploration Findings

- Scope map: [modules/files explored]
- Duplication map: [candidate, where repeated, same reason? yes/no]
- Coupling map: [A <-> B relation, why coupled, risk level]
- Complexity hotspots: [function/component + reason]
- Safety constraints discovered: [what must not change]
- Unknowns to validate in Q&A: [open questions]

Planning is blocked unless this artifact is present.

---

## Think Phase

Run focused Q&A in rounds (2–4 questions per round) until confidence is high.

Think must use Step 0 findings as input. If findings are weak or incomplete, go back to exploration.

Cover:

- Problem definition (what is hard to change/read today)
- Scope and hotspots (duplication, coupling, complexity density)
- Constraints (no behavior change, PR size target, deadline)
- Risks (subtle regressions, order/state/event semantics)
- Acceptance criteria (how to prove net simplification)

After each round, output:

## Understanding so far

**What we're building:** [1–2 sentences]

**Confidence by area:**

- Problem definition: [🟢 HIGH | 🟠 MEDIUM | 🔴 LOW] — [one-line reason]
- Scope and context: [🟢 HIGH | 🟠 MEDIUM | 🔴 LOW] — [one-line reason]
- Constraints: [🟢 HIGH | 🟠 MEDIUM | 🔴 LOW] — [one-line reason]
- Risks and unknowns: [🟢 HIGH | 🟠 MEDIUM | 🔴 LOW] — [one-line reason]
- Acceptance criteria: [🟢 HIGH | 🟠 MEDIUM | 🔴 LOW] — [one-line reason]

**Still unclear:**

- [open points, or "Nothing blocking"]

→ Run another Q&A round, or proceed to Plan phase?

When all areas are HIGH, proceed to Plan.

---

## Plan Phase

### Step 1 — Read Config

Read `.cor/config.md`.

- If missing: "Run the **cor-setup** skill first to configure this project." and stop.
- Extract `Plan Storage` and `Checks`.
- Supported plan storage: `markdown`, `memory`, `session`.

### Step 2 — Build Atomic Task List

Create ordered tasks with these constraints:

- One concern per task.
- Dependency-respecting order.
- Separate implementation from tests.
- No scope creep beyond Think outputs.
- Prefer small, reviewable increments (soft target: <= 250 modified lines per task/PR).
- Every task must trace back to at least one finding from "Exploration Findings".

For each implementation task, add a **Net Simplification Check**:

- Complexity perceived: DOWN / SAME / UP
- Duplication pressure: DOWN / SAME / UP
- Coupling pressure: DOWN / SAME / UP
- Hidden cost introduced: YES / NO
- Verdict: `ACCEPT` only if hidden cost is `NO` and no axis worsens.

Task tags when relevant:

- `[unit]`
- `[integration]`
- `[UAT]`

Show task list and ask for confirmation before saving.

### Step 3 — Save Plan

Use `Plan Storage` from config.

#### markdown

Scan `.cor/` for `plan.md` and `plan_*.md`.

- If in-progress plans exist: ask user to choose
  - A: merge as new phase
  - B: create separate file
- If only untouched plans exist: ask user to choose
  - A: merge as new phase
  - B: overwrite target
  - C: create separate file

When creating a separate file, use:

- `.cor/plan_<N>_refacto_<slug>.md`

Use structure:

# COR Plan

## Context

[1–2 sentence summary]

## Tasks

- [ ] T01: ...
- [ ] T02: ...

## Refactor Acceptance Rules

- Behavior must remain identical.
- Reject speculative abstractions.
- Reject abstractions that increase cognitive load.
- Reject shared "utils/helpers/common" extractions.

## Handoff to cor-code

- Execution order: [task IDs in order]
- Risk watchlist: [subtle behavior points to monitor]
- Validation strategy: [tests/checks to run for this plan]

#### memory

Save same structure to memory plan store.

#### session

Create task panel entries from task list.

### Step 4 — Confirm

Respond:

- "Plan saved. [N] tasks ready."
- "Next: run **cor-code** to implement the plan."

---

## Refactoring Heuristics (Use, Don’t Worship)

Apply only when they simplify **now**:

- Strategy for algorithm variants across callers.
- Template Method/Pipeline for stable process skeleton with variable steps.
- Polymorphism when type-conditionals are duplicated across places.
- Value object/param struct when parameter count exceeds 3 and arguments are cohesive.
- Guard clauses to flatten nested conditionals.
- Command/Query separation when an operation mixes state change and return value.
- Split responsibilities when one unit depends on too many collaborators.
- Strangler Fig for large migrations requiring reversible phases.

Do not force a pattern if a simpler local rewrite solves the problem.

---

## Anti-Patterns (Reject)

- Refactor without adequate tests or validation path.
- Feature work mixed into refactor commits/tasks.
- Partial renames leaving inconsistent intent.
- "Line count down" used as sole success metric.
- Unifying code that evolves for different reasons.
- "Manager/Helper/Utils" naming in place of domain concepts.
