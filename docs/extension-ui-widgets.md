# Extension UI Widgets — Reference

Interactive tools available to skills/agents per VSCode AI extension.

---

## Claude Code

### `AskUserQuestion` — MCQ widget

```json
{
  "questions": [{
    "question": "Full question text?",
    "header": "Short tag",
    "options": [
      { "label": "Option A (Recommended)", "description": "Shown below label", "preview": "..." }
    ],
    "multiSelect": false
  }]
}
```

- 1–4 questions per call, 2–4 options each
- `header`: max 12 chars, rendered as chip
- Recommended: append `(Recommended)` to label
- "Other" free-text: auto-appended — do not add manually
- `preview` (TypeScript SDK only, opt-in via `toolConfig.askUserQuestion.previewFormat`):
  - `"markdown"` → ASCII art / code blocks, side-by-side layout
  - `"html"` → sanitized `<div>` fragment (`<script>`, `<style>`, `<!DOCTYPE>` stripped)
- NOT available inside subagents

### `TodoWrite` — task list

```json
{ "todos": [
  { "content": "Task description", "status": "pending" },
  { "content": "Another task",     "status": "in_progress" },
  { "content": "Done task",        "status": "completed" }
]}
```

- Statuses: `pending` → `in_progress` → `completed`
- Replaces entire list on each call — always pass the full array
- Rendered as a live checklist panel in the UI
- Built-in, always available (except in subagents)

> Internal note: Claude Code's terminal UI is a custom React reconciler + Yoga layout (~60fps). Not exposed to skills — skill authors cannot render arbitrary React.

---

## GitHub Copilot

### `ask_user` — MCQ widget

```yaml
ask_user:
  prompt: "Your question here?"
  choices:
    - "Option A (Recommended)"
    - "Option B"
    - "Other — describe in free text"
```

- Flat string array — no `description`, `header`, `multiSelect`, or `preview`
- Recommended: embed `(Recommended)` in the choice string
- "Other": add manually as last entry
- One question per call

### `todo_write` / `todo_read` — task list (vscode-agent-todos MCP)

Third-party extension: [digitarald/vscode-agent-todos](https://github.com/digitarald/vscode-agent-todos). Must be installed by user.

```json
// todo_write
{ "title": "COR Plan", "todos": [
  { "id": "T01", "content": "Task description", "status": "pending",   "priority": "medium" },
  { "id": "T02", "content": "Another task",     "status": "in_progress", "priority": "high" },
  { "id": "T03", "content": "Done task",        "status": "completed", "priority": "low"  }
]}

// todo_read — no parameters
```

- Statuses: `pending` → `in_progress` → `completed`
- Priorities: `low` / `medium` / `high`
- `id`: stable identifier (use task ID e.g. `"T01"`)
- `adr`: optional free-text note/decision
- `todo_write` replaces entire list — always pass the full array
- `todo_read` may be hidden when auto-inject is enabled (todos already in context)

---

## Codex (OpenAI)

No native MCQ widget. No native todo tool. Conversational only.

Fall back to inline formatted text for questions and `.cor/plan.md` for task tracking.

---

## Comparison

| Feature | Claude Code | Copilot | Codex |
|---|---|---|---|
| **MCQ widget** | `AskUserQuestion` | `ask_user` | none |
| Option descriptions | yes | no | no |
| Recommended option | label suffix | label string | text |
| Auto "Other" | yes | no (manual) | no |
| Multi-select | yes | no | no |
| Markdown preview per option | yes | no | no |
| HTML preview per option | yes (sanitized) | no | no |
| Max options | 4 | unlimited | — |
| Max questions per call | 4 | 1 | — |
| **Task list widget** | `TodoWrite` (built-in) | `todo_write` (MCP ext.) | none |
| Task statuses | 3 | 3 | — |
| Task priorities | no | yes (low/med/high) | — |
| Task IDs | no | yes | — |
| Persistent across sessions | no (context window) | yes (ext. storage) | — |

---

## Sources

- [Claude Code — user input docs](https://code.claude.com/docs/en/agent-sdk/user-input)
- [Claude Code — todo tracking docs](https://code.claude.com/docs/en/agent-sdk/todo-tracking)
- [vscode-agent-todos (Copilot todo MCP)](https://github.com/digitarald/vscode-agent-todos)
- [awesome-copilot skills docs](https://github.com/github/awesome-copilot/blob/main/docs/README.skills.md)
- [Claude Code terminal UI internals](https://kotrotsos.medium.com/claude-code-internals-part-11-terminal-ui-542fe17db016)
