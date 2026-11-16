---
name: feature-flag
description: "Plans wrapping an existing or new feature from docs/feature-map.md behind a feature flag: picks the feature, detects the project's flag infrastructure (OpenFeature, LaunchDarkly, Unleash, Flagsmith, GrowthBook, PostHog, env or config module, Kconfig) or proposes a minimal one, chooses the gate boundary, defines the flag contract, and writes an ordered plan for cor-code. Writes no application code. Use when the user says feature flag, toggle, gate, kill switch, dark launch, progressive rollout, make optional, or wants to switch a feature on and off."
status: beta
stability: experimental
---

# Feature Flag

Plan a flag around one feature. Output is a plan, not code; implementation goes to `cor-code` or is executed manually.

Input: `docs/feature-map.md` written by `feature-map`. Removing a flag is `feature-unflag`.

---

## Rules

1. **One read site per feature.** The flag is evaluated in exactly one place. If the gate needs several `if`s, the boundary is wrong.
2. **Default equals today.** An existing feature gets default `on`; a dark-launched feature gets default `off`; a firmware option defaults to the current build. Merging the plan changes no behavior.
3. **Reuse before adding.** Never introduce a second flag mechanism when one exists.
4. **Highest boundary first.** Entrypoint, then dispatcher, then internal branch. Internal branches are for variants, not for on/off.
5. **Map is the inventory.** Every plan ends with a task updating `## Flags` in the feature map.
6. **No code.** This skill reads and plans. It writes only the plan file.

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
Feature Flag Progress:
- [ ] 1. Load the feature map
- [ ] 2. Pick the feature
- [ ] 3. Detect or choose the provider
- [ ] 4. Choose the gate boundary
- [ ] 5. Define the flag contract
- [ ] 6. Write the plan
- [ ] 7. Hand off
```

### 1. Load the feature map

- Read `docs/feature-map.md` (and `docs/feature-map/*.md` when split). Missing: say "Run `feature-map` first so the gate lands on a known entrypoint." and stop, unless the user names a file and symbol explicitly; then map only that feature inline and tag it `INFERRED`.
- Compare the meta `generated` sha with `git rev-parse --short HEAD`. If different, warn that the map may be stale and offer to run `feature-map` first.
- Read `.cor/config.md` for `Plan Storage` and `Checks`. Absent is allowed; see step 6.

### 2. Pick the feature

If the user named a feature, match it against the map (feature name, entrypoint path, or route). Otherwise ask with the question tool: one question listing the features of the relevant capability, or the capabilities first when the map has more than 12 features.

Confirm the entrypoint line from the map in one sentence. If the feature is `AMBIGUOUS` or its entrypoint is shared with another feature, stop and say the feature needs a clean boundary first; suggest `cor-refacto`.

For a new feature not yet in the code (dark launch), ask for the planned entrypoint kind and location; it will be added to the map by the plan's final task.

### 3. Detect or choose the provider

Follow the detection order in [references/providers.md](references/providers.md). Three outcomes:

- **Found**: state the provider and the file where it is configured. Reuse it.
- **Not found**: ask one question with the recommended default for the context (table in the providers reference) marked `(Recommended)`, the alternative, and `Other`.
- **Several found**: pick the one with the most read sites, state the others, continue.

### 4. Choose the gate boundary

Walk the preference order against the feature's entrypoint from the map:

1. **Entrypoint**: the route, screen, command, job, subscription, or task is not registered when off. Off behavior equals "feature does not exist".
2. **Dispatcher**: the entrypoint stays registered but returns the absent response (404, "coming soon" screen, no-op) at its first line.
3. **Internal branch**: two implementations selected by the flag. Only for variant testing; say so if chosen.

Pick the highest that isolates the feature without touching other features. Record file and line. The call-site table in the providers reference gives the off behavior per stack.

### 5. Define the flag contract

| Field | Rule |
| --- | --- |
| Key | `<capability-slug>.<feature-slug>`, kebab-case, matches the map names |
| Type | boolean unless the user asks for variants |
| Default | rule 2 |
| Owner | ask if unknown; a team or a person |
| Lifetime | `release` (remove after rollout), `experiment`, `permission`, `kill-switch` (permanent) |
| Review date | ask or propose 90 days for `release` and `experiment`; `none` for `permission` and `kill-switch` |
| Read site | the single file from step 4 |

Show the contract and ask for confirmation in one question before writing the plan.

### 6. Write the plan

Use [references/plan-template.md](references/plan-template.md).

Storage:

- `.cor/config.md` present: follow `Plan Storage` (`markdown`, `memory`, `session`). For `markdown`, when `plan.md` or `plan_*.md` exist, ask merge as phase, overwrite untouched, or separate file `.cor/plan_<N>_flag_<slug>.md`.
- `.cor/config.md` absent: write `docs/feature-map.plan.md` and say the plan runs manually, or after `cor-setup` then `cor-code`.

Show the task list and get confirmation before saving.

### 7. Hand off

Reply with: plan path, task count, the single read site, the default value, and "Next: run `cor-code` to implement, then `feature-map` to refresh the map."

---

## Anti-patterns

- Reading the flag in each component or handler of the feature.
- Default `off` on a feature users rely on today.
- Adding LaunchDarkly, Unleash, or any vendor when the repository has nothing and the user asked for a toggle, not a vendor.
- Gating a shared utility so other features silently change.
- Writing the gate code in this session.
- Skipping the feature-map update task.
