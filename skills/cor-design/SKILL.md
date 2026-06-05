---
name: cor-design
description: "Exploratory UI design phase for COR. Captures visual goals and constraints, generates lightweight web variants for comparison, and produces a decision-ready direction before planning implementation."
status: beta
stability: experimental
---

# COR Design — Exploratory UI Phase

You are opening the Design phase of COR (CodingOnRails). Your goal is to explore visual directions quickly with runnable lightweight web artifacts, then converge on a decision-ready UI direction before implementation planning.

This phase is UI-focused:

- Keep workflows and business logic stable unless explicitly requested.
- Optimize visual hierarchy, clarity, and usability through presentation, states, and density.
- Produce concrete variants the user can compare in-browser.

---

## Unified Contract

### Required inputs

- Design context (`greenfield` or `brownfield`)
- Target scope (`shell`, `core screen`, or both)
- Constraints (accessibility, timeline, non-goals)
- Iteration mode (`manual` by default, `auto` only if user opts in)

If any input is missing, ask a multiple-choice question and record the assumption used.

### Required outputs

- Three materially different UI variants
- A scored comparison artifact with rationale and confidence
- A narrowing decision log (winner, runner-up, unresolved risks)
- A deterministic hand-off package for `cor-plan`

### Mandatory phase gates

- Do not generate variants before the brief is locked.
- Do not narrow to a winner before scoring is complete.
- Do not produce a `cor-plan` hand-off before a finalist cross-check is complete.

### Workflow order (fixed)

Run phases in this exact order:
`Audit -> Brief -> Variant Generation -> Scoring -> Narrowing -> Hand-off`

### User override policy

- The user can override recommendations at any step.
- When override occurs, keep it and continue; do not auto-revert to the model's preference.
- If `auto` mode is enabled, still request explicit approval before irreversible narrowing decisions.

### Anti-slop policy

- Reject shallow style-only outputs (for example: palette swaps with identical visual hierarchy).
- Every variant must differ in at least two structural design dimensions (layout rhythm, type scale, density, interaction emphasis, or component language).
- Always tie design recommendations to explicit criteria, not taste-only language.

---

## Environment Detection

Determine which interactive question tool is available. Check in this order:

| Priority | Signal                          | Environment   | Question tool         |
| -------- | ------------------------------- | ------------- | --------------------- |
| 1        | `AskUserQuestion` available     | Claude Code   | `AskUserQuestion`     |
| 2        | `vscode_askQuestions` available | Copilot       | `vscode_askQuestions` |
| 3        | neither                         | Codex / other | inline numbered list  |

Store as **active environment**. Use the matching question format whenever user input is required.

---

## Phase 1 — Audit

Run a short non-destructive audit of the current UI implementation:

- inspect theme/tokens (colors, typography, radius, shadows, spacing)
- inspect shell surfaces (top nav, sidebar, page containers)
- inspect a core task surface (cards/forms/tables/diff/review panels)
- inspect interactive states (`hover`, `focus-visible`, `disabled`, loading)

Output a compact diagnosis:

- What works (keep)
- What feels flat/faded (change)
- Top 3 leverage points for improvement

Do not propose implementation details yet.

---

## Phase 2 — Brief

Ask targeted questions and lock these decisions:

- design context mode:
  - `greenfield` (recommended when no stable app UI exists yet)
  - `brownfield` (recommended when UI must be evaluated in real app context)
- audience and context of use
- visual direction (2–4 options, recommend one)
- scope (`shell only`, `core screen only`, `shell + core screen`)
- motion level (`none`, `subtle`, `expressive`)
- accessibility target (`AA strict` by default)
- deliverable format for exploration:
  - `one HTML switchable` (recommended)
  - `one HTML per style`
  - `component-only playground`

If the user does not decide, proceed with recommended defaults and record assumptions explicitly.

### Mode orchestration policy

Use this recommendation matrix before variant generation:

- If project is early/discovery with no stable production shell -> recommend `greenfield` standalone lab.
- If project already has real content/actions/components in production -> recommend `brownfield` in-app lab.

Then ask the user to confirm final mode selection. User choice always wins.

---

## Phase 3 — Variant Generation

Create runnable web exploration artifacts with the chosen format.

Rules:

- Start from the default scaffold template at `templates/ui-style-lab.html` unless the user explicitly requests a different base.
- Use lightweight stack first (vanilla HTML/CSS/JS) unless user asks otherwise.
- Keep identical content/structure across variants so visual comparison is fair.
- Make variants materially different (not tiny palette tweaks).
- Include realistic states for key components (default/hover/focus/disabled/status).
- Keep code portable and easy to open locally.

Brownfield safety model (mandatory when mode is `brownfield`):

- Render style experiments inside a scoped theme wrapper (`.design-lab-theme-*`) instead of global CSS resets.
- Expose experiments through an opt-in route or feature flag only.
- Keep a visible floating style selector inside the scoped area; never force a global style switch for all users.
- Do not modify business logic, navigation semantics, or data contracts during style-lab runs.

Minimum output:

- 3 visual variants
- responsive desktop + mobile behavior
- keyboard-visible focus styles
- no backend dependency

Variant distinctiveness and parity checks (required):

- Each variant must differ on at least two structural axes:
  - layout rhythm/grid behavior
  - typography scale/voice
  - density and spacing strategy
  - component surface/elevation language
  - interaction emphasis
- Shared scenario data and UI content must be identical across variants.
- All variants must expose the same state set: `default`, `hover`, `focus-visible`, `disabled`, `error/success`, `loading`.
- If a variant fails parity, regenerate before scoring.

Recommended output paths:

- `.cor/design-lab/index.html` (switchable), or
- `.cor/design-lab/style-a.html`, `style-b.html`, `style-c.html`

### Default Scaffold (Reusable)

The reusable baseline lives here:

- `templates/ui-style-lab.html`
- `templates/scorecard-template.md`
- `templates/decision-log-template.md`
- `templates/handoff-template.md`

Expected usage:

1. Copy scaffold to exploration output path.
2. Keep the style switch mechanism (`data-style`, `aria-pressed`) intact.
3. Replace `.placeholder` with shared UI surfaces for fair comparison.
4. Expand only as needed by scope, preserving lightweight portability.

---

## Phase 4 — Scoring

Evaluate each variant with a mandatory 1-5 scorecard using these locked criteria:

- `Clarity`
- `Hierarchy`
- `Actionability`
- `Consistency`
- `Accessibility`
- `Responsiveness`
- `Visual Distinctiveness`

For every criterion, report:

- score (`1` to `5`)
- confidence (`High`, `Medium`, `Low`)
- one-line rationale
- optional uncertainty flag when evidence is weak or ambiguous

Allowed evidence sources:

- rendered artifact inspection
- explicit rubric checks
- deterministic token/component/state checks

Do not score from taste-only language or ungrounded intuition.

Output format:

- score table per variant and criterion
- confidence and uncertainty annotations
- key tradeoffs per variant
- provisional winner + runner-up with rationale

Default artifact template: `templates/scorecard-template.md`

---

## Phase 5 — Narrowing

Narrow variants into a decision candidate set:

- choose winner + runner-up
- record unresolved risks
- record whether choice was user-driven, model-driven, or hybrid
- run mandatory finalist cross-check using `ux-frameworks` before final selection
- if scorecard and framework outcomes disagree, pause and request user arbitration

Do not silently auto-resolve cross-framework conflicts.

Finalist cross-check minimum:

- assess finalists against at least Nielsen + Garrett + one perceptual/behavioral lens (Gestalt/PARC or Laws of UX)
- list framework-confirmed strengths and violations
- mark each violation severity (`low`, `medium`, `high`)

Conflict arbitration policy:

- Default action is to block auto-selection.
- Present disagreement explicitly and ask the user to pick:
  - follow scorecard winner
  - follow framework-led winner
  - request one extra constrained iteration round
- Record arbitration outcome in the decision log.

Default artifact template: `templates/decision-log-template.md`

Convergence governance:

- Default mode is `manual`; ask user decisions at each narrowing step.
- Enable `auto` only when the user explicitly opts in.
- Apply a default maximum of 3 narrowing rounds.
- At cap reached, force a decision package with:
  - final winner
  - runner-up
  - unresolved risks
  - explicit recommendation for next phase (`cor-plan` now vs one more manual exploration)

---

## Phase 6 — Hand-off

Produce a deterministic implementation hand-off for `cor-plan` using this schema:

```md
## cor-design hand-off

### Decision

- Winner: [variant-id]
- Runner-up: [variant-id]
- Decision mode: [manual|auto|hybrid]
- Rationale: [short paragraph]
- Unresolved risks: [list]

### Semantic token map

- color: [alias -> value intent]
- typography: [scale/family/weight decisions]
- radius/elevation/density: [token decisions]

### Component impact matrix

- [component/surface]: [change type] | [priority: high/med/low] | [risk]
- ...

### Non-goals

- [explicitly out of scope]

### Acceptance criteria

- [visual criteria]
- [usability criteria]
- [accessibility criteria]
```

This package is mandatory before invoking `cor-plan`.

Default artifact template: `templates/handoff-template.md`

If requested, immediately convert this hand-off into a task list through `cor-plan`.

---

## Gold-standard quality gate

Run this gate before any `cor-plan` hand-off:

- Canonical UX frameworks check (Nielsen, Garrett, plus perceptual/behavioral lens)
- UI system quality check via `ui-design-system-principles`
- Stack feasibility check for the target app context

If gate passes: continue normally.

If gate fails:

- show failed criteria and risk impact
- recommend corrective iteration
- allow bypass only when user explicitly acknowledges the tradeoff

After implementation starts, run a lightweight re-check on the selected direction to confirm no major regression from the approved gate baseline.

---

## Question Format

Every question must be multiple-choice with one recommended default.

**Claude Code**: use `AskUserQuestion`; no manual "Other" option needed.

**Copilot**: use `vscode_askQuestions`; include an explicit final option:
`Other — describe your answer in free text`.

**Codex / other**: use inline numbered options and include:
`Other — describe your answer in free text`.

---

## Quality Bar

- Avoid generic UI outputs and shallow style changes.
- Do not change IA/workflows unless explicitly asked.
- Ensure visual changes improve usability, not only aesthetics.
- Keep artifacts lightweight and runnable.
- Prefer decisive recommendations over vague "it depends."
