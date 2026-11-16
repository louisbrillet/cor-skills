# Feature flag plan template

Plan shape for `cor-code`. Saved per `Plan Storage` in `.cor/config.md`; when `.cor/config.md` is absent, saved to `docs/feature-map.plan.md`.

Separate file name when plans already exist: `.cor/plan_<N>_flag_<slug>.md`.

````markdown
# COR Plan — Flag <Feature>

## Context

- Goal: gate **<Feature>** (<Capability>, kind <kind>) behind flag `<key>`.
- Entry: `<file:line>` (`<symbol>`) from docs/feature-map.md (confidence <tag>).
- Provider: <existing | OpenFeature + <provider> | config module | kconfig> because <one line>.
- Gate boundary: <entrypoint | dispatcher | branch> at `<file:line>` because <one line>.
- Off behavior: <404 | screen absent from nav | command absent | task not created | ...>.
- Out of scope: other flags, refactors of the feature, provider migration.

## Flag contract

| Field | Value |
| --- | --- |
| Key | `<capability>.<feature-slug>` |
| Type | boolean |
| Default | <true: feature exists today / false: dark launch / y: current build> |
| Owner | <user-provided> |
| Lifetime | <release / experiment / permission / kill-switch> |
| Review date | <YYYY-MM-DD> |
| Read site | `<file>` (single) |

## Tasks

- [ ] T01: <Create flag infrastructure in shared/config/flags.<ext>> (omit when provider exists)
- [ ] T02: Declare `<key>` with default <value> in <provider config>
- [ ] T03: Gate <Feature> at `<file:line>`: <off behavior>
- [ ] T04: Tests: <Feature> reachable when on, <off behavior> when off [unit]
- [ ] T05: Update `## Flags` and the Flag column of <Feature> in docs/feature-map.md
- [ ] T06: Verify off state manually: <steps> [UAT]

## Handoff to cor-code

- Execution order: T01 → T06
- Risk watchlist: shared entrypoint with <other feature>; default must equal current behavior; one read site only.
- Validation strategy: checks from `.cor/config.md`; T04 passes with the flag forced on and off.
````

Rules:

- Exactly one task touches application code for the gate (T03). If the gate needs more than one file, the boundary is wrong; go back to the boundary step.
- T05 is mandatory. The map is the inventory that `feature-unflag` reads later.
- Keep each task under roughly 250 changed lines.
