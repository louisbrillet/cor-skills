# Unflag plan template

Plan shape for `cor-code`. Saved per `Plan Storage` in `.cor/config.md`; when absent, saved to `docs/feature-map.plan.md`.

Separate file name when plans already exist: `.cor/plan_<N>_unflag_<slug>.md`.

````markdown
# COR Plan — Unflag <Feature> (<mode>)

## Context

- Flag: `<key>` (provider <provider>, default <value>, stage <stage>) from docs/feature-map.md.
- Feature: **<Feature>** (<Capability>, kind <kind>), entry `<file:line>`.
- Mode: **<keep-on | keep-off | delete>** — <one line on what remains>.
- Reference count: <N> reads, <N> declarations, <N> aliases, <N> config, <N> tests, <N> docs.
- Out of scope: other flags; persistence changes (see Deprecation note).

## References

| Class | Location | Alias | Action |
| --- | --- | --- | --- |
| read | `<file:line>` | `<alias>` | inline on-branch |
| declaration | `<file:line>` | exact | delete |
| ... | | | |

## Deletion set (delete mode only)

Files removed entirely:

- `<path>` (EXTRACTED, exclusive)
- `<path>` (INFERRED, confirmed by user)

Kept, shared with another feature:

- `<path>` (used by <Feature>)

## Deprecation note (when persisted data exists)

<table/queue/column> stays; schedule a separate migration plan after <date or release>.

## Tasks

- [ ] T01: Inline `<key>` at `<file:line>`: keep <on|off> branch, apply simplifications
- [ ] T02: Remove accessor `<alias>` and key declaration in `<file>`
- [ ] T03: Delete <module group> (<N> files) (delete mode)
- [ ] T04: Remove <translations / analytics / fixtures> entries (delete mode)
- [ ] T05: Tests: delete <off|all> cases, keep <on> cases [unit]
- [ ] T06: Update docs/feature-map.md: <Flag column to - | remove feature block>; remove Flags row
- [ ] T07: Archive `<key>` in <provider>; verify no code references remain [UAT]

## Handoff to cor-code

- Execution order: T01 → T07
- Risk watchlist: shared modules listed above; behavior of the kept branch must be identical; barrel exports.
- Validation strategy: checks from `.cor/config.md`; build passes after each deletion task.
````

Rules:

- The user confirms the Deletion set explicitly before the plan is saved. Quote the list back verbatim in the confirmation question.
- Deletion tasks are grouped by module and kept under roughly 250 changed lines each.
- T06 is mandatory; the map must not list a removed flag or feature.
