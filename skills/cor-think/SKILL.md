---
name: cor-think
description: "Deep interrogation phase of the COR methodology. Ask the user focused questions across problem definition, scope, constraints, risks, and acceptance criteria before any planning or coding begins. Produces a confidence summary after each round. Claude Code users: invoke as /cor:think."
status: stable
stability: guaranteed
---

# COR Think — Think Phase

You are opening the Think phase of the COR (CodingOnRails) methodology. Your job is to interrogate the user deeply before any planning or coding begins. You ask questions; the user answers. You surface blind spots, unstated assumptions, and risks they haven't thought of yet.

If the user provides a topic or problem statement when invoking this skill, treat it as the starting point. Otherwise, begin by asking them to describe what they want to build or fix.

---

## Environment Detection

Determine which interactive question tool is available. Check in this order:

| Priority | Signal                          | Environment   | Question tool         |
| -------- | ------------------------------- | ------------- | --------------------- |
| 1        | `AskUserQuestion` available     | Claude Code   | `AskUserQuestion`     |
| 2        | `vscode_askQuestions` available | Copilot       | `vscode_askQuestions` |
| 3        | neither                         | Codex / other | inline numbered list  |

Store as **active environment**. Use the matching format from the Question Format section for every question in this skill.

---

## Interrogation Structure

Run the Q&A in rounds. Each round targets a specific area. Ask 2–4 focused questions per round — not a wall of questions at once.

Cover these areas across rounds (order as the conversation demands):

**Problem definition**

- What exactly needs to change? What is broken, missing, or suboptimal?
- What is the current behavior vs. the expected behavior?
- Is this a bug fix, a new feature, a refactor, or a performance issue?

**Context and scope**

- Which parts of the codebase are involved? Which files, modules, or APIs?
- Who or what triggers this code path? (user action, cron job, API call, etc.)
- Are there other features or systems that depend on what you're about to change?

**Constraints**

- Are there performance, compatibility, or API contract requirements?
- Is there a deadline or scope limit on this task?
- Are there things that must NOT change?

**Unknowns and risks**

- What could go wrong? What are you least confident about?
- Are there edge cases you haven't fully thought through?
- Are there parts of the codebase you're unfamiliar with that this touches?

**Acceptance criteria**

- How will you know the task is done?
- Is there a manual test you'd walk through? An automated test that should pass?
- Who else (if anyone) needs to validate the result?

---

## Answer Interpretation Before Recap

After each user answer batch, do **not** jump directly to confidence scoring.

First, interpret the answers:

- Distinguish between:
  - explicit facts ("it is in `api/orders`")
  - uncertainty ("I don't know")
  - delegated discovery ("you should check/explore the codebase")
- Treat delegated discovery as an instruction to investigate immediately.

If the user says they don't know and asks you to check, run a short exploration pass before the confidence recap:

- Inspect relevant files/modules/routes/tests/configs in the repo.
- Confirm or correct assumptions using evidence from the codebase.
- Convert discovered facts into updated understanding for the current round.

If exploration reveals new ambiguities, missing constraints, or conflicts, ask targeted follow-up questions before scoring confidence:

- Ask only the minimum 1–3 questions needed to unblock understanding.
- Focus on high-impact unknowns discovered in code, not generic re-questioning.
- After follow-up answers, interpret them again before recap.

Only after this interpretation + exploration (+ optional follow-up questions) pass, produce the confidence summary.

---

## Confidence Summary

After each Q&A round, produce a structured summary. If discovery was delegated, this summary must reflect what you learned from your exploration (not only user-provided info). Use this format exactly:

## Understanding so far

**What we're building:** [1–2 sentences]

**Confidence by area:**

- Problem definition: [🟢 HIGH | 🟠 MEDIUM | 🔴 LOW] — [one-line reason]
- Scope and context: [🟢 HIGH | 🟠 MEDIUM | 🔴 LOW] — [one-line reason]
- Constraints: [🟢 HIGH | 🟠 MEDIUM | 🔴 LOW] — [one-line reason]
- Risks and unknowns: [🟢 HIGH | 🟠 MEDIUM | 🔴 LOW] — [one-line reason]
- Acceptance criteria: [🟢 HIGH | 🟠 MEDIUM | 🔴 LOW] — [one-line reason]

**Still unclear:**

- [bullet list of open questions, or "Nothing blocking" if all HIGH]

→ Run another Q&A round, or proceed to the Plan phase?

Wait for the user's answer before doing anything else. If they want another round, continue with questions targeting the lowest-confidence areas. If they say proceed, stop the interrogation — do not add more questions.

---

## Question Format (always active)

Every question — including the opening prompt asking for a problem description — must be multiple-choice with suggested answers and `(Recommended)` on the best default. Never ask a bare open-ended question.

Read [references/question-format.md](references/question-format.md) for the exact tool call shape in the active environment (`AskUserQuestion`, `vscode_askQuestions`, `request_user_input`, or an inline numbered list). Use the matching one; getting the widget wrong drops the question silently.

---

## Rules

- Ask questions, do not propose solutions. This phase is for understanding, not designing.
- Never suggest implementation approaches during Think. Save those for Plan.
- If the user goes off-topic, bring them back: "Let's stay in Think for now — we'll handle that in Plan."
- If you reach HIGH confidence in all areas after a round, note it: "I have high confidence across all areas. Ready to move to the Plan phase when you are."
- Mandatory sequence each round: `ask -> interpret answers -> (explore if delegated) -> (ask focused follow-up questions if exploration creates new unknowns) -> confidence recap -> ask whether to continue`.
