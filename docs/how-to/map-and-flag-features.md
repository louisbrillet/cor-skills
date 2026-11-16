# How to map and flag features

Inventory what a codebase does, then gate or retire a feature from that inventory. Works for web frontends, APIs, mobile apps, CLIs, jobs, and firmware.

## Map the features

1. Ask your agent to use `feature-map`.
2. It detects the stack, lists the entrypoint kinds it will look for (`http-route`, `screen`, `command`, `job`, `event`, `task`, ...), harvests them, traces modules per layer, clusters into capabilities, and detects existing flags.
3. Answer the single question round, if any; it covers only items tagged `AMBIGUOUS`.
4. Read `docs/feature-map.md`. Each feature lists its entrypoint (`file:line`), modules per layer, tests, flag, and a confidence tag. Add your own notes between `<!-- manual -->` and `<!-- /manual -->`; they survive updates.
5. Run `feature-map` again after structural changes. It updates changed feature blocks only and reports added / removed / changed counts.

## Map the architecture

1. Ask your agent to use `codebase-map`.
2. It detects the layout (Feature-Sliced Design or technical layers), extracts the import graph with an installed tool or import grep, and writes `docs/codebase-map.md`: layers x slices flowchart with upward and cross-import violations styled, context view of external systems, capability overlay from the feature map, and a per-slice health table.

## Gate a feature behind a flag

1. Ask your agent to use `feature-flag` and name the feature as it appears in the map.
2. It detects the flag provider in use, or offers a recommended default when none exists (OpenFeature with a local provider, a typed config module, or Kconfig for firmware).
3. Confirm the gate boundary (entrypoint by default) and the flag contract (key, default equal to current behavior, owner, lifetime, review date).
4. The plan is saved per `Plan Storage` in `.cor/config.md`, or to `docs/feature-map.plan.md` without COR setup. Run `cor-code` to implement, then `feature-map` to refresh the map.

## Remove a flag or a feature

1. Ask your agent to use `feature-unflag` and name the flag or feature.
2. Pick a mode: `keep-on` (hardcode the shipped path), `keep-off` (disable permanently), or `delete` (remove the feature). Flags with no read sites skip this step.
3. Review the complete reference list and the deletion set. Items found by grep but absent from the map are tagged `INFERRED` and need your confirmation.
4. Confirm the deletion list; the plan is saved. Run `cor-code` to implement. A final `[UAT]` task archives the flag in the provider dashboard.

Persisted data (tables, columns, queues) is never deleted by these plans; the plan adds a deprecation note instead.

## View in Copilot

With the artifact canvas enabled (see [How to view artifacts in Copilot](view-artifacts-in-copilot.md)), `docs/feature-map.md` and `docs/codebase-map.md` appear under Maps with rendered Mermaid diagrams, confidence split, and flags.
