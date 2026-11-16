---
name: codebase-map
description: "Builds and maintains an architectural map of a codebase in docs/codebase-map.md: layers x slices import graph (Feature-Sliced Design or detected layers) with upward and cross-import violations styled in Mermaid, a context view of external systems, a capability overlay from docs/feature-map.md, and a per-slice health table (fan-in, fan-out, cycles). Uses installed extractors (dependency-cruiser, pydeps, go list) or import grep. Use when the user asks for an architecture map or diagram, layer or module structure, dependency graph, import violations, where things live, onboarding overview, or FSD compliance."
status: beta
stability: experimental
---

# Codebase Map

Produce an architectural view of the code as it is: which slices exist, which layer each belongs to, who imports whom, and what the system talks to outside. Facts and counts; no advice.

Output: `docs/codebase-map.md`, structure fixed by [references/map-template.md](references/map-template.md). Complements `feature-map` (what the product does); this skill shows how the code is organized.

---

## Rules

1. **Map, not review.** No recommendations, no smells, no verdicts. Violations are drawn, not judged.
2. **Graph from evidence.** Edges come from an extractor or from parsed import statements. Never from folder names alone.
3. **Stable vocabulary.** Feature-Sliced Design layer names when those folders exist; otherwise the detected layer set, recorded in the meta and reused on update.
4. **Idempotent.** Existing file: update derived sections, keep the manual block byte for byte.
5. **No installs.** Extractors are used only when already present.
6. **Diagrams under 40 nodes.** Split rather than cram.
7. **Names exist.** Every slice, package, and external name appears in the repository or its manifests.

---

## Environment detection

| Signal | Environment | Question tool |
| --- | --- | --- |
| `AskUserQuestion` available | Claude Code | `AskUserQuestion` |
| `vscode_askQuestions` available | Copilot | `vscode_askQuestions` |
| neither | Codex / other | inline numbered list with `(Recommended)` |

Questions are rare in this skill: only when the layout is ambiguous (step 2) or a package should be excluded.

---

## Workflow

```text
Codebase Map Progress:
- [ ] 1. Read existing map, manifests, feature map
- [ ] 2. Detect layout and layers
- [ ] 3. Extract the import graph
- [ ] 4. Collapse to slices and compute metrics
- [ ] 5. Identify externals
- [ ] 6. Write or update docs/codebase-map.md
- [ ] 7. Report
```

### 1. Read existing map, manifests, feature map

- `docs/codebase-map.md` present: parse the meta. Same sha as `git rev-parse --short HEAD` and no rebuild requested: say it is current and stop. Otherwise run in update mode with the meta's `layers:` and `layout:`.
- Detect packages and stacks from manifests (`package.json` workspaces, `go.mod`, `pyproject.toml`, `Cargo.toml`, `pubspec.yaml`, `*.csproj`, `Package.swift`, `build.gradle`).
- `docs/feature-map.md` present: load feature blocks for View C. Absent: continue, record `feature-map: none`.

### 2. Detect layout and layers

Per package, in order:

1. Folders `app`, `pages`, `widgets`, `features`, `entities`, `shared` (at least three of them) -> `fsd`.
2. Folders named after technical roles (`controllers`, `services`, `repositories`, `handlers`, `models`) -> `layered`.
3. Folders named after domains with technical subfolders inside -> `domain-first`.
4. Go: `go-packages`. Python: `python-packages`.
5. Anything else -> `mixed`; ask one question offering the closest two layouts and `Keep mixed`.

Assign the layer list using the table in [references/graph-extraction.md](references/graph-extraction.md). State layout and layers to the user in one line before extracting.

### 3. Extract the import graph

Follow the extractors table in the extraction reference. Installed tool: run it once, parse the output. Otherwise: grep import statements per language, resolve relative paths and aliases, drop unresolvable imports into the externals list.

Exclude generated and vendored folders, test files (kept only for the `tests` column), stories, fixtures.

Sanity check: a package with source files and zero edges means the import pattern or alias resolution failed. Fix before continuing; do not output an empty graph.

### 4. Collapse to slices and compute metrics

Collapse files into slices with the layout rule from the extraction reference. Compute per slice: files, fan-in, fan-out, cycles, upward imports, same-layer cross imports (FSD only), externals, tests. Mark slices matching no layer as `unlayered`.

When steiger is installed on an FSD project, run it with the JSON reporter and take violation counts from its output.

### 5. Identify externals

Unresolved imports and well-known client packages become external nodes: databases (drivers, ORMs), queues and brokers, HTTP SDKs, cloud SDKs, auth providers. Shape per kind as described in the template. Keep the package name that proved each external for the table.

### 6. Write or update docs/codebase-map.md

Fresh run: write the full template from [references/map-template.md](references/map-template.md): meta, counts line, Layers table, View A (layers x slices), View B (context), View C (capability overlay, only with a feature map), Health, Unlayered, manual block.

Update run: rewrite derived sections entirely, keep the manual block and the Layers roles, refresh meta and counts.

Diagram budget: View A above 40 nodes splits into one diagram per layer pair or per package. `flowchart` only.

Create `docs/` if missing. Write nowhere else.

### 7. Report

Reply with: packages, slices, edges, externals, upward and cross import counts, cycles; update mode adds added / removed / moved slices. Path of the file. One line: "Run `codebase-map` again after moving modules; `feature-map` links these slices to product capabilities."

---

## Anti-patterns

- Drawing a layer diagram from folder names without reading a single import.
- One 200-node flowchart.
- Prose like "consider extracting" or "this coupling is problematic" anywhere in the file.
- Inventing layer names the codebase does not use when FSD folders exist.
- Installing dependency-cruiser, madge, pydeps, or steiger to build the map.
- `architecture-beta`, `C4Context`, `treemap-beta` blocks: syntax unstable across renderers.
