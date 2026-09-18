# Question format by environment

Every question asked in the Think phase must be multiple-choice with suggested answers and one recommended default. Never ask a bare open-ended question.

## Contents

- Claude Code (`AskUserQuestion`)
- GitHub Copilot (`vscode_askQuestions`)
- Codex in plan mode (`request_user_input`)
- Codex in agent mode / no native widget (inline numbered list)

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

Apply this format to every question, including the opening prompt asking for a problem description.
