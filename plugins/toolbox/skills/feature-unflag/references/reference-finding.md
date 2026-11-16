# Finding every reference to a flag and a feature

Removal is safe only when the reference list is complete. Grep is the tool; the map is the starting point, not the limit.

## Contents

- Flag references
- Alias generation
- Feature code set
- Exclusive module test
- Side inventories
- Post-removal simplifications
- Provider-side cleanup

## Flag references

Start from `## Flags` in `docs/feature-map.md`: key, provider, read sites. Then search the whole repository (excluding `node_modules`, `dist`, `build`, `vendor`, `target`, `.git`) for:

1. The exact key string, quoted and unquoted.
2. Each alias from the section below.
3. The accessor or hook that wraps the key (the symbol defined at the declaration site), then every import of that symbol.
4. Config and env files: `.env*`, `config/*.{json,yml,yaml,toml}`, `sdkconfig*`, `Kconfig*`, `platformio.ini`, `Cargo.toml`.
5. Infrastructure: Helm values, Terraform, docker-compose, CI workflow env blocks.
6. Docs and tests: `docs/**`, `**/*.test.*`, `**/*_test.*`, `**/__tests__/**`, `spec/**`.

Classify each hit:

| Class | Meaning | Removal action |
| --- | --- | --- |
| `declaration` | key constant, provider default, Kconfig entry | delete |
| `read` | branch or registration conditioned on the flag | inline per mode |
| `alias` | wrapper, constant, hook | delete after reads are inlined |
| `config` | env, values, CI | delete line |
| `test` | asserts on/off behavior | keep on-tests, delete off-tests (keep-on), delete all (delete) |
| `doc` | mentions in docs | update or delete |

Zero `read` hits means the flag is dead: skip the mode question.

## Alias generation

For key `orders.checkout-v2`, search all of:

| Form | Example |
| --- | --- |
| exact | `orders.checkout-v2` |
| last segment | `checkout-v2` |
| camelCase | `checkoutV2`, `ordersCheckoutV2` |
| PascalCase | `CheckoutV2` |
| snake_case | `checkout_v2`, `orders_checkout_v2` |
| SCREAMING_SNAKE | `CHECKOUT_V2`, `ORDERS_CHECKOUT_V2`, `FEATURE_CHECKOUT_V2` |
| predicate names | `isCheckoutV2`, `isCheckoutV2Enabled`, `useCheckoutV2`, `checkoutV2Enabled`, `hasCheckoutV2` |
| Kconfig | `CONFIG_APP_FEATURE_CHECKOUT_V2`, `CONFIG_FEATURE_CHECKOUT_V2` |

Use word-boundary, case-sensitive searches for each form. Record which alias produced each hit.

## Feature code set

From the feature block in the map: entrypoints, modules per layer, tests. Then widen:

1. Import closure of the entrypoint file within the package, two levels.
2. Files whose path contains the feature slug (`rewards`, `checkout-v2`).
3. Files whose name contains the handler or component symbol.

Everything found this way but absent from the map is tagged `INFERRED` and needs user confirmation before deletion.

## Exclusive module test

A module is exclusive to the feature when both hold:

- It appears in no other feature block of the map.
- `grep` for its import path or exported symbols finds no file outside the feature code set.

Modules failing either test stay. List them under "kept, shared with <feature>" in the plan so the user sees the decision.

## Side inventories

Things the map does not track but that die with a feature. Grep the feature slug and the main symbols in:

| Inventory | Where | Action |
| --- | --- | --- |
| Translations | `locales/**`, `i18n/**`, `*.strings`, `strings.xml`, `*.arb` | remove keys prefixed by the slug |
| Analytics | event enums, tracking plans | remove members |
| Permissions, roles | ACL config, policy files | remove entries |
| Routes in docs or OpenAPI | `openapi.*`, `docs/**` | remove paths |
| Storybook, fixtures, mocks | `*.stories.*`, `__mocks__`, `fixtures/**` | delete |
| Assets | images, icons named after the slug | delete |
| Persistence | migrations, tables, columns, queues | never delete in this plan; add a separate deprecation note |
| Provider dashboard | LaunchDarkly, Unleash, Flagsmith, GrowthBook, PostHog | archive the flag; `[UAT]` task |

## Post-removal simplifications

Apply at each former read site after inlining (the stale-flag cleanup pattern used by Piranha):

| Before | After |
| --- | --- |
| `if (true) { A } else { B }` | `A` |
| `if (false) { A }` | removed |
| `true && x` / `x && true` | `x` |
| `false \|\| x` | `x` |
| `cond ? A : A` | `A` |
| unused import after inlining | removed |
| empty enum or union after member removal | remove the type and its uses |
| empty file after deletions | delete the file |
| orphaned export in an index/barrel | remove the export line |

Each simplification is a line in the same task as the read site it follows; do not open a general refactor.

## Provider-side cleanup

The code plan cannot archive a remote flag. Add one `[UAT]` task per provider with the exact steps:

- LaunchDarkly: archive the flag; confirm Code References shows extinction for the key.
- Unleash: mark the toggle as archived in its project.
- Flagsmith, GrowthBook, PostHog, ConfigCat, Split, Statsig: archive or delete the flag in the dashboard.
- Env or config module: no remote step; the declaration deletion suffices.
- Kconfig: remove the option and run a full build with a clean `sdkconfig`.
