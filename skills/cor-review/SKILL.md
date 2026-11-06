---
name: cor-review
description: "Measured code review that ends in a behavior-preserving refactor plan. Combines cor-refacto's simplification gates with ub-mode's deterministic metrics (CRAP per function, structural duplication, mutation testing). Use when the user asks to review or audit a codebase for refactoring, asks what is worth refactoring, mentions complexity, coverage, duplication, mutation score, CRAP, dryer, crapper, or mutator, or wants a refactor plan backed by numbers. Writes no code; hands off to cor-code. Claude Code users: invoke as /cor:review."
status: beta
stability: experimental
---

# COR Review — Measure, Judge, Plan

Review a codebase for refactoring with evidence, not taste. Three inputs feed one plan:

1. **Metrics** (ub-mode tools): CRAP per function, duplication pairs, mutation results. They find candidates.
2. **Reading**: the hot files end to end, with callers and tests. It explains the numbers.
3. **Gates** (cor-refacto): the simplification rules. They decide.

When a metric and a gate disagree, **the gate wins**. A threshold is an input, never a verdict. Every arbitration is written down so the next run does not reopen it.

Hard constraints: behavior stays identical; this skill writes no application code. Implementation goes to `cor-code`.

Sequencing, never reordered: Measure → Read → Review Findings → Think → Plan.

---

## Environment Detection

| Priority | Signal                          | Environment   | Question tool         |
| -------- | ------------------------------- | ------------- | --------------------- |
| 1        | `AskUserQuestion` available     | Claude Code   | `AskUserQuestion`     |
| 2        | `vscode_askQuestions` available | Copilot       | `vscode_askQuestions` |
| 3        | neither                         | Codex / other | inline numbered list  |

Use the matching tool for every question; multiple choice, `(Recommended)` on the default. If no answer comes (unattended run), take the `(Recommended)` option and record it under *Arbitrations* as "default, unconfirmed".

---

## Simplification Gates (blocking)

A candidate failing any gate is marked `REJECTED` with the gate name and one line of reason.

1. **KISS**: understanding cost must not go up.
2. **YAGNI**: no speculative extension point.
3. **Rule of Three**: no unification on the first or second occurrence, whatever the duplication score.
4. **Least Surprise**: name and behavior contract align.
5. **No behavior drift**: output, side effects, order, state transitions identical.
6. **No coupling hubs**: nothing extracted into `utils` / `helpers` / `common`; no base class or mixin created only to satisfy a tool.
7. **No mixed intent**: bugs found during review are listed under *Out of scope*, never fixed inside a refactor task.
8. **Pin before change**: a structural task on code under 80 % covered is preceded by a `[unit]` task that fixes current behavior. When the structural change is REJECTED but the function stays under-covered, the `[unit]` task stands alone: coverage, not structure, is what the CRAP number was pointing at.

---

## Step 0 — Measure

Read `.cor/config.md`. If missing: "Run the **cor-setup** skill first." and stop. Extract `Checks` and `Plan Storage`.

Run the project checks once to record the baseline (tests passing, failing, skipped).

Run the measurement pass. Tool install, coverage production per stack, exact commands and output format: [references/measurement-tools.md](references/measurement-tools.md).

- crapper with real coverage, worst first. Candidates: CRAP ≥ 10.
- dryer at threshold 0.8. Candidates: every pair.
- mutator on the files that will appear in the plan, not the whole tree. Candidates: survivors and uncovered sites.

If a tool cannot run, say which one and why, and continue with the others. Never replace a missing measure with a guess: a value computed by hand from the CRAP formula is reported as "derived, not measured" and never used to rank candidates.

Record raw tables outside the repo (session files); only numbers go into the findings.

---

## Step 1 — Read

Read end to end every file that holds a candidate, plus its direct callers, callees and tests. Then look for what tools miss:

- the same decision written in two places (a key list, a constant, a format), whatever its shape
- "private" names (`_x`) imported by other modules, tests or scripts
- free-form strings used as states or kinds across modules
- several boolean flags encoding one state, allowing illegal combinations
- a function that validates, mutates and persists in one body
- generated files tracked in git

Reading findings outside the user's stated scope become candidates like any other; the user narrows the scope in Think, not the reader.

---

## Step 2 — Review Findings (required artifact)

Output before any question:

## Review Findings

**Baseline:** `<check command>` → N passed, N failed (reason), N skipped. Coverage N %.

### Metrics

| Function | CC | Cov % | CRAP |
| --- | --- | --- | --- |
(worst first, CRAP ≥ 10 only)

dryer (≥ 0.8): `<file:lines>` ↔ `<file:lines>` score …, or "no pair".
mutator (`<files>`): N killed / N survived / N uncovered, survivors listed as `file:line mutation`.

### Candidates

| # | Finding (file:line evidence) | Source | Gate verdict |
| --- | --- | --- | --- |
| A | … | crapper / dryer / mutator / reading | ACCEPT or REJECTED — gate: reason |

### Arbitrations (metric vs gate)

| Candidate | Tool says | Gate says | Decision |
| --- | --- | --- | --- |

### Out of scope

Bugs, behavior changes, and areas without a test harness (list each with why).

### Unknowns for Think

Questions only the user can answer.

Planning is blocked until this artifact exists.

---

## Step 3 — Think

Rounds of 2 to 4 questions, drawn from *Unknowns* and *Arbitrations*. Typical decisions:

- scope (which layers; exclude untested front-ends unless a harness is planned)
- how to settle each metric-vs-gate conflict (default: gate wins; the user may override and the plan records it)
- what to do with out-of-scope bugs (default: list separately, do not fold into the plan)
- plan shape (one plan; separate plans only on request)

After each round:

## Understanding so far

**Target:** [1–2 sentences]

**Confidence:** problem · scope · constraints · risks · acceptance, each 🟢 / 🟠 / 🔴 with one reason.

**Still unclear:** […] or "Nothing blocking".

→ Another round, or Plan?

Proceed when all five are 🟢.

---

## Step 4 — Plan

Build ordered atomic tasks. Rules:

- One concern per task, dependency order, soft cap 250 changed lines.
- Every task traces to a Candidate letter.
- Test tasks `[unit]` / `[integration]` / `[UAT]` are separate from implementation tasks, and the pinning task comes first (gate 8).
- Pinning tasks are written against the target function's observable behavior with fakes for heavy dependencies (models, network); they also cover mutator's uncovered sites on that function.
- Each implementation task carries a **Net Simplification Check**: complexity, duplication, coupling each DOWN / SAME / UP; hidden cost YES / NO; verdict `ACCEPT` only if hidden cost is NO and no axis is UP.
- Prefer the smallest explicit model that removes an illegal state over a full state machine.
- A first task declares the measurement pass in `.cor/config.md` as optional gates (format in the reference) so `cor-code` can run them after refactor tasks. If an equivalent section already exists, the task updates it to the reference format instead of adding a second one.

Show the list and ask for confirmation.

### Save

**markdown**: scan `.cor/` for `plan.md` and `plan_*.md` with open tasks. If any exist, ask: create a separate file `(Recommended)`, or merge as a new phase. Separate file name: `.cor/plan_<N>_review_<slug>.md`. Structure:

# COR Plan — Review: <slug>

## Context
[what is reviewed, baseline, who wins on conflict]

## Review Findings
[the Step 2 artifact, including Arbitrations and Out of scope]

## Tasks
- [ ] T01: … — <Candidate letter>
  - Net Simplification Check: … → ACCEPT

## Refactor Acceptance Rules
- Behavior must remain identical.
- Reject speculative abstractions.
- Reject abstractions that increase cognitive load.
- Reject shared "utils/helpers/common" extractions.
- On metric-vs-gate conflict the gate prevails; record the arbitration.

## Handoff to cor-code
- Execution order: [task IDs]
- Risk watchlist: [ordering, side effects, state transitions, serialized values read by other components]
- Validation strategy: project checks after each task; measurement pass on touched functions (CRAP < 10 unless arbitrated, no new dryer pair, 0 mutator survivors)

**memory**: same structure in the agent plan store. **session**: one todo per task.

Confirm: "Plan saved. N tasks ready. Next: run **cor-code**."

---

## Heuristics the metrics often point at

Apply only when the gate check passes now:

- derive a duplicated list or set from its source instead of copying it
- extract a route's or handler's side effects into one method on the owning object; the handler validates and delegates
- split validate / apply / persist; keep the public entry point and signature
- replace an enum-like set of string literals by a `StrEnum` or equivalent that serializes to the same text
- replace two or three booleans that encode one state by one small enum, keeping the old attributes as read-only views for callers
- extract a cohesive buffer or queue into a private class in the same module, with three or four methods
- make a `_private` name public when other modules already import it

## Anti-patterns

- Treating CRAP < 10 or score ≥ 0.8 as a goal: both are inputs to the gates.
- Factoring a duplication with two occurrences, or across modules that change for different reasons.
- Splitting a flat, fully covered dispatch to lower a number.
- Writing a test that would still pass if every function returned nothing.
- Fixing a bug inside a refactor task.
- Refactoring code with no test harness (typical: front-end without a runner).
