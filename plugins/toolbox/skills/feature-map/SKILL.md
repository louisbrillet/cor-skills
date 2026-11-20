---
name: feature-map
description: "Builds and maintains a two-level feature map of any codebase (capabilities, then features with entrypoints, modules per layer, dependencies, tests, and feature flags) as Markdown plus Mermaid in docs/feature-map.md. Works for web frontends, APIs, mobile apps, CLIs, background jobs, and embedded firmware. Use when the user asks to map, inventory, or cartograph features, list what an app does, enumerate endpoints, screens, commands, or jobs, refresh an existing feature map, or before adding or removing a feature flag."
status: beta
stability: experimental
---

# Feature Map

Produce a map of what the codebase does, feature by feature, grounded in entrypoints found in the code. The output is a reference document: facts, locations, and relations. No advice.

Two levels:

- **Capability**: what the product lets a user or consumer do, in domain words (Auth, Orders, OTA update).
- **Feature**: one consumable unit reachable from an entrypoint: HTTP route, GraphQL operation, screen, CLI command, job, event consumer, RTOS task, ISR.

Output file: `docs/feature-map.md`. Structure is fixed by [references/map-template.md](references/map-template.md).

---

## Rules

1. **Map, not review.** Never write recommendations, smells, or quality judgments in the map. Raw counts are fine.
2. **Entrypoints first.** A feature exists only if an entrypoint was found in the code. Do not list features from README prose or ticket names.
3. **Every claim tagged.** Each feature carries `EXTRACTED`, `INFERRED`, or `AMBIGUOUS`. Definitions in the template.
4. **Idempotent.** If `docs/feature-map.md` exists, update blocks; never regenerate from scratch. Manual blocks are preserved byte for byte.
5. **One question round at most**, limited to `AMBIGUOUS` items. Ask nothing if there are none.
6. **No installs.** Use a deterministic extractor only if already installed; otherwise grep.
7. **Names exist.** Every feature, module, and file name in the map and diagrams is present in the repository.

---

## Environment detection

Determine the question tool once:

| Signal | Environment | Question tool |
| --- | --- | --- |
| `AskUserQuestion` available | Claude Code | `AskUserQuestion` |
| `vscode_askQuestions` available | Copilot | `vscode_askQuestions` |
| neither | Codex / other | inline numbered list with `(Recommended)` |

---

## Workflow

Copy and track:

```text
Feature Map Progress:
- [ ] 1. Read existing map and detect stack
- [ ] 2. Harvest entrypoints
- [ ] 3. Trace modules per entrypoint
- [ ] 4. Cluster into capabilities
- [ ] 5. Detect flags
- [ ] 6. Resolve AMBIGUOUS items with the user
- [ ] 7. Write or update docs/feature-map.md
- [ ] 8. Report
```

### 1. Read existing map and detect stack

- If `docs/feature-map.md` exists: parse its meta comment. Compare `generated` with `git rev-parse --short HEAD`. If equal and the user did not ask for a rebuild, say the map is current and stop. Otherwise reuse `layers` and `entrypoint-kinds` from the meta and run in update mode.
- Detect stacks from manifests using the detection table in [references/entrypoint-patterns.md](references/entrypoint-patterns.md). In a monorepo, list every package and its stack.
- Decide the entrypoint kinds to look for per package. State them to the user in one line before harvesting, for example: `apps/api: http-route, job. apps/web: screen.`

### 2. Harvest entrypoints

For each package and kind, apply the grep signals from the patterns reference. Produce a raw list: `kind | name | file:line | package`.

Exclusions: generated folders (`dist`, `build`, `node_modules`, `.next`, `coverage`, `vendor`, `target`), test files, storybook stories, fixtures.

Sanity check before moving on: if a backend package yields zero routes, or a frontend yields zero screens, re-check the framework row; do not proceed with an empty kind silently.

### 3. Trace modules per entrypoint

Goal: the set of files each feature touches, grouped by layer.

- If a deterministic extractor is installed (table in the patterns reference), run it once and read the dependency graph from its output.
- Otherwise follow imports from the entrypoint file: two levels deep, same package only, skipping the `lib`/`shared` layer after the first hop so utilities do not swallow every feature.
- Assign each file a layer: Feature-Sliced Design names when those folders exist, else the heuristic table in the patterns reference.
- Find tests: files whose name or path contains the feature's entrypoint file stem, handler symbol, or route path.
- Confidence: `EXTRACTED` when the trace followed explicit imports or registrations; `INFERRED` when it relied on naming, folder position, or include chains.

### 4. Cluster into capabilities

Capability key, in order of preference:

1. Feature-Sliced Design `pages/<slice>` or `features/<slice>` owner.
2. First path segment of the route (`/orders/*` -> Orders) or navigator group.
3. Dominant `domain` layer module shared by the feature's files.
4. Package name, when a package is small and single-purpose.

Target 4 to 12 capabilities. Above 12, group under a parent and note it. A feature whose key matches two capabilities, or matches none, is `AMBIGUOUS` and goes to step 6; an entrypoint with no owner goes to `## Unattributed`.

Capability names are domain nouns, singular or plural as the codebase uses them. Do not invent product names absent from the code.

### 5. Detect flags

Follow [references/flag-detection.md](references/flag-detection.md): grep manifests for providers, then read sites, then aliases. Fill the Flag column of each feature whose module set contains a read site, and build the `## Flags` table. When nothing is found, write `No feature flag mechanism detected.` and do not suggest one.

### 6. Resolve AMBIGUOUS items with the user

Only when `AMBIGUOUS` items exist. One round, grouped in a single call of the question tool, max 4 questions; batch the rest as a numbered list in the same message. Each question offers the candidate capabilities plus `Exclude from map`. Mark the recommended choice.

Do not ask about `INFERRED` items. Mention their count in the report instead.

### 7. Write or update docs/feature-map.md

Fresh run: write the template from [references/map-template.md](references/map-template.md) in full.

Update run: apply the update algorithm from the template reference. Rewrite only changed feature blocks, preserve manual blocks and block order, rewrite Overview, Flags, and Unattributed entirely, refresh meta and counts.

Mermaid limits: overview is a `flowchart LR` tree (product, capabilities, features) under 40 nodes, otherwise capabilities only in the overview plus a `flowchart` per capability. Never `mindmap`. File over 500 lines: split per capability as described in the template reference.

Create `docs/` if missing. Do not write anywhere else.

### 8. Report

Reply with:

- Counts: capabilities, features by kind, flags, confidence split.
- Update mode: added / removed / changed / unchanged features.
- `INFERRED` items as a short list of feature names so the user can spot-check.
- Path of the written file(s).
- One line: "Run `feature-map` again after structural changes; run `feature-flag` or `feature-unflag` to gate or clean a feature from this map."

---

## Anti-patterns

- Listing features from documentation or commit messages instead of entrypoints.
- Treating every component, hook, or helper as a feature. Features have entrypoints; the rest are modules.
- Swallowing the whole codebase into one feature through a shared utility import.
- Regenerating the file on update and losing manual blocks.
- Asking the user to classify dozens of items. Above 4 questions, make a best guess, tag `INFERRED`, and report.
- Adding `architecture-beta`, `C4*`, or `treemap-beta` diagrams: syntax unstable across renderers.
- Drawing the overview as a `mindmap`: unreadable radial layout. Use the `flowchart LR` tree from the template.
