---
name: feature-unflag
description: "Plans removal of a feature flag listed in docs/feature-map.md in one of three modes: keep-on (flag removed, feature hardcoded on), keep-off (feature disabled and its on-branch deleted), or delete (flag, feature code, tests, translations, and exclusive modules removed). Finds every reference including aliases, computes the exclusive module set, and writes an ordered plan for cor-code with an explicit deletion list. Writes and deletes nothing in application code. Use when the user says remove flag, clean up stale flag, hardcode, ship permanently, retire toggle, kill feature, delete feature, or sunset."
status: beta
stability: experimental
---

# Feature Unflag

Plan the removal of one flag, optionally with its feature. Output is a plan; `cor-code` or the user executes it.

Input: `docs/feature-map.md` with its `## Flags` table, written by `feature-map` and maintained by `feature-flag`.

---

## Rules

1. **Complete reference list before any plan.** Key, aliases, wrappers, config, infra, tests, docs. The map is the start, grep is the proof.
2. **Exclusive only.** A module is deleted only when no other feature in the map uses it and grep confirms no import from outside the feature.
3. **Kept branch is identical.** Inlining changes no behavior of the branch that stays.
4. **Confirm deletions verbatim.** The full file list is shown and confirmed before the plan is saved.
5. **No persistence changes.** Tables, columns, queues, and stored data are never deleted by this plan; a deprecation note is added instead.
6. **No code, no deletion** in this session. Only the plan file is written.

---

## Environment detection

| Signal | Environment | Question tool |
| --- | --- | --- |
| `AskUserQuestion` available | Claude Code | `AskUserQuestion` |
| `vscode_askQuestions` available | Copilot | `vscode_askQuestions` |
| neither | Codex / other | inline numbered list with `(Recommended)` |

---

## Workflow

```text
Feature Unflag Progress:
- [ ] 1. Load the map and pick the flag
- [ ] 2. Find every reference
- [ ] 3. Choose the mode
- [ ] 4. Compute the deletion set
- [ ] 5. Confirm deletions
- [ ] 6. Write the plan
- [ ] 7. Hand off
```

### 1. Load the map and pick the flag

- Read `docs/feature-map.md` (and `docs/feature-map/*.md`). Missing or without `## Flags`: say "Run `feature-map` first; it inventories flags and their read sites." and stop, unless the user gives the key and file explicitly; then proceed with `INFERRED` tags.
- Match the user's words against the Flags table (key, alias, feature name). Several matches: ask which one. None: ask with the list of flags.
- Read `.cor/config.md` for `Plan Storage` and `Checks`. Absent is allowed.

### 2. Find every reference

Follow [references/reference-finding.md](references/reference-finding.md): exact key, generated aliases, accessor symbol and its imports, config and infra files, tests, docs. Classify each hit (`declaration`, `read`, `alias`, `config`, `test`, `doc`).

Report counts per class. Zero `read` hits: the flag is dead; skip step 3, set mode to `dead`, and plan only declaration, config, doc, and provider cleanup.

### 3. Choose the mode

Ask one question:

| Mode | Result | Recommended when |
| --- | --- | --- |
| `keep-on` | condition removed, on-branch stays, off-branch and legacy path deleted | flag stage is `production` or `cleanup`; feature shipped |
| `keep-off` | condition removed, on-branch deleted, feature disabled permanently | user wants the feature gone but asked to keep the code; confirm this is not `delete` |
| `delete` | flag, feature code, tests, side inventories removed | user says kill, delete, sunset, retire the feature |

Mark the recommended mode from the flag stage and the user's wording. For `keep-off`, state plainly that disabled code rots and offer `delete` as the alternative.

### 4. Compute the deletion set

- `keep-on`: off-branch code, legacy implementation selected by the off-branch, off-tests, accessor, declaration, config lines.
- `keep-off`: on-branch code, on-tests, accessor, declaration, config lines; entrypoint stays registered with the off behavior inlined.
- `delete`: feature code set from the map widened per the reference-finding file, filtered by the exclusive module test; tests; side inventories (translations, analytics, fixtures, assets); accessor; declaration; config lines.

Tag each file `EXTRACTED` (listed in the map) or `INFERRED` (found by grep or slug). Apply the post-removal simplifications list to each former read site. Persisted data found along the way goes into the Deprecation note, not the deletion set.

### 5. Confirm deletions

Full sentences here because the action downstream is irreversible. Show the complete list of files to delete and files to modify, grouped as `EXTRACTED` and `INFERRED`, plus the "kept, shared with" list. Ask one question: confirm as is, exclude specific `INFERRED` items, or cancel. Do not save a plan without this confirmation.

### 6. Write the plan

Use [references/plan-template.md](references/plan-template.md).

Storage:

- `.cor/config.md` present: follow `Plan Storage`. For `markdown` with existing plans, ask merge as phase, overwrite untouched, or separate file `.cor/plan_<N>_unflag_<slug>.md`.
- `.cor/config.md` absent: write `docs/feature-map.plan.md`.

Show the task list and get confirmation before saving.

### 7. Hand off

Reply with: plan path, mode, counts (files deleted, files modified, tests removed), provider cleanup step, and "Next: run `cor-code` to implement, then `feature-map` to refresh the map."

---

## Anti-patterns

- Deleting a module because it is under the feature folder without checking who imports it.
- Inlining the wrong branch (check the default and the current provider value, not the key name).
- Dropping translations or analytics members silently; they are proposed, tagged, and confirmed.
- Proposing a migration to drop a table in the same plan.
- Leaving the feature map listing the removed flag.
- Opening a general refactor at former read sites beyond the listed simplifications.
