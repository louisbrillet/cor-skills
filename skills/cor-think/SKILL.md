---
name: cor-think
description: "Deep interrogation phase of the COR methodology. Ask the user focused questions across problem definition, scope, constraints, risks, and acceptance criteria before any planning or coding begins. Produces a confidence summary after each round. Claude Code users: invoke as /cor:think."
---

# COR Think — Think Phase

You are opening the Think phase of the COR (CodingOnRails) methodology. Your job is to interrogate the user deeply before any planning or coding begins. You ask questions; the user answers. You surface blind spots, unstated assumptions, and risks they haven't thought of yet.

If the user provides a topic or problem statement when invoking this skill, treat it as the starting point. Otherwise, begin by asking them to describe what they want to build or fix.

---

## Environment Detection

Determine which interactive question tool is available. Check in this order:

| Priority | Signal | Environment | Question tool |
|---|---|---|---|
| 1 | `AskUserQuestion` available | Claude Code | `AskUserQuestion` |
| 2 | `vscode_askQuestions` available | Copilot | `vscode_askQuestions` |
| 3 | neither | Codex / other | inline numbered list |

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

## Confidence Summary

After each Q&A round, produce a structured summary. Use this format exactly:

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

Every question you ask must be presented as a multiple-choice question with suggested answers. Never ask bare open-ended questions.

**Claude Code** — use the `AskUserQuestion` tool:
- One tool call per question (or per tightly related batch using separate `questions[]` entries).
- Append `(Recommended)` to the label of the best default option.
- Do NOT add an "Other" entry — the tool appends it automatically.
- Use `multiSelect: false` unless the question genuinely accepts multiple answers.

**GitHub Copilot** — use the `vscode_askQuestions` tool:
- Parameters: `prompt` (string) and `choices` (array of strings).
- Embed `(Recommended)` directly inside the choice string for the best default, e.g. `"Frontend only (Recommended)"`.
- Always append `"Other — describe your answer in free text"` as the last choice manually.
- Example:
  ```
  vscode_askQuestions:
    prompt: "Which part of the codebase is involved?"
    choices:
      - "Frontend only (Recommended)"
      - "Backend only"
      - "Full-stack (frontend + backend)"
      - "Other — describe your answer in free text"
  ```

**Codex in plan mode** — use the `request_user_input` tool:
- Codex only exposes `request_user_input` in plan mode. If you are running in agent mode, prompt the user to switch: "Switch Codex to plan mode for the Think phase — interactive questions require it."
- One tool call per question or tightly related batch using separate `questions[]` entries.
- Append `(Recommended)` to the label of the best default option.
- Always append `{ "label": "Other — describe your answer in free text", "description": "Type your own answer." }` as the last option manually.
- Example:
  ```
  request_user_input:
    questions:
      - id: codebase_scope
        header: "Scope"
        question: "Which part of the codebase is involved?"
        options:
          - label: "Frontend only (Recommended)"
            description: "Only UI/client-side code changes."
          - label: "Backend only"
            description: "Only server/API/DB changes."
          - label: "Full-stack (frontend + backend)"
            description: "Changes on both sides."
          - label: "Other — describe your answer in free text"
            description: "Type your own answer."
  ```

**Codex in agent mode, or any other extension without a native MCQ widget** — inline numbered list:
- Format each question as a numbered list in your response.
- Mark the recommended option with `**(Recommended)**` after its label.
- Always add a final option: `N. Other — describe your answer in free text`.
- Example:
  ```
  Q: Which part of the codebase is involved?
  1. Frontend only **(Recommended)**
  2. Backend only
  3. Full-stack (frontend + backend)
  4. Other — describe your answer in free text
  ```

Apply this format to every question, including the opening prompt asking for a problem description.

---

## Rules

- Ask questions, do not propose solutions. This phase is for understanding, not designing.
- Never suggest implementation approaches during Think. Save those for Plan.
- If the user goes off-topic, bring them back: "Let's stay in Think for now — we'll handle that in Plan."
- If you reach HIGH confidence in all areas after a round, note it: "I have high confidence across all areas. Ready to move to the Plan phase when you are."
