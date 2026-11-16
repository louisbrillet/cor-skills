# Module graph extraction

Get a file-or-package import graph, then collapse it into slices and layers.

## Contents

- Extractors by stack
- Grep fallback
- Collapsing files into slices
- Layer assignment
- Metrics
- Rule checks

## Extractors by stack

Use only when already installed. Check with `npx --no-install <tool> --version`, `which <tool>`, or the toolchain presence. Never install.

| Stack | Command | Parse |
| --- | --- | --- |
| JS / TS | `npx --no-install dependency-cruiser --output-type json --no-config <src-dir>` | `modules[].source`, `modules[].dependencies[].resolved`; ignore `coreModule` and `node_modules` resolutions |
| JS / TS (high level) | `npx --no-install dependency-cruiser --output-type archi <src-dir>` | DOT of folder-level graph; useful when the JSON is too large |
| Python | `pydeps <package> --show-deps --no-output` | JSON: `{module: {imports: [...], path}}` |
| Go | `go list -json ./...` | `ImportPath`, `Imports` (filter to module prefix from `go.mod`) |
| Rust | `cargo metadata --format-version 1 --no-deps` | crate graph only; inside a crate, grep `mod` and `use crate::` |
| Dart | `dart pub deps --json` | package graph only; inside, grep `import 'package:<self>/` |
| .NET | `dotnet list <proj> reference` per project | project graph only; inside, grep `using <RootNamespace>.` |
| JVM | `./gradlew dependencies` or `mvn dependency:tree` | module graph only; inside, grep `import <basePackage>.` |
| Swift | `swift package show-dependencies --format json` | package graph only; inside, grep `import <Module>` |

Record the command used in the meta comment `extractor:` line.

## Grep fallback

One pattern per language, applied to source files only (exclude `node_modules`, `dist`, `build`, `vendor`, `target`, `.git`, generated files):

| Language | Import pattern |
| --- | --- |
| JS / TS | `^\s*import\s[^'"]*from\s+['"]([^'"]+)['"]`, `require\(['"]([^'"]+)['"]\)`, `import\(['"]([^'"]+)['"]\)` |
| Python | `^\s*from\s+([\w.]+)\s+import`, `^\s*import\s+([\w.]+)` |
| Go | lines inside `import (...)` or `import "..."` |
| Rust | `^\s*use\s+(crate|super|self)::([\w:]+)`, `^\s*mod\s+(\w+)` |
| Dart | `^\s*import\s+'package:([^/]+)/([^']+)'`, relative `import '\.\./?...'` |
| Swift | `^\s*import\s+(\w+)` (module level only) |
| Kotlin / Java | `^\s*import\s+([\w.]+)` |
| C# | `^\s*using\s+([\w.]+);` |
| C / C++ | `#include\s+"([^"]+)"` (quotes = project headers; angle brackets = external) |
| Ruby | `require_relative\s+['"]([^'"]+)`, Zeitwerk constant references are not greppable: tag `INFERRED` |
| PHP | `^\s*use\s+([\w\\]+);`, `require(_once)?\s*\(?['"]([^'"]+)` |

Resolve relative paths and path aliases (`tsconfig.json` `paths`, `jsconfig.json`, webpack/vite aliases, `pyproject` packages) before building edges. Unresolvable imports are external dependencies.

## Collapsing files into slices

| Layout | Slice key |
| --- | --- |
| Feature-Sliced Design | `<layer>/<slice>`; `app` and `shared` collapse by segment (`shared/ui`, `shared/api`, ...) |
| Layered (`controllers/`, `services/`, `repositories/`) | `<layer-folder>/<first-child>` when children are folders, else `<layer-folder>` |
| Domain-first (`orders/`, `users/`) | `<domain-folder>` |
| Go | package import path minus module prefix |
| Python | first two dotted segments under the top package |
| Monorepo | `<package>/<slice>` with the above applied per package |

An edge between two files becomes an edge between their slices; same-slice edges are dropped; duplicate edges are counted as weight.

## Layer assignment

Prefer Feature-Sliced Design names when those folders exist: `app`, `pages`, `widgets`, `features`, `entities`, `shared` (`processes` is deprecated; keep it if present). Otherwise:

| Layer | Path segments |
| --- | --- |
| `app` | `app`, `main`, `cmd`, `bootstrap`, `entry` |
| `ui` | `ui`, `components`, `views`, `screens`, `pages`, `widgets`, `presentation` |
| `api` | `api`, `routes`, `controllers`, `handlers`, `resolvers`, `endpoints`, `transport` |
| `domain` | `domain`, `model`, `models`, `entities`, `services`, `usecases`, `core`, `store`, `state` |
| `infra` | `infra`, `infrastructure`, `db`, `repositories`, `adapters`, `clients`, `drivers`, `platform`, `hal` |
| `lib` | `lib`, `utils`, `helpers`, `hooks`, `common`, `pkg` |
| `config` | `config`, `settings`, `env` |

Order from top to bottom for the downward rule: `app` > `ui` > `api` > `domain` > `infra` > `lib` > `config` (FSD: `app` > `processes` > `pages` > `widgets` > `features` > `entities` > `shared`). A slice whose path matches no segment is `unlayered`; list it in the health table and ask nothing.

Existing map: reuse the `layers:` list from its meta comment instead of recomputing.

## Metrics

Per slice, from the collapsed graph:

| Metric | Definition |
| --- | --- |
| files | source files in the slice |
| fan-in | distinct slices importing this slice |
| fan-out | distinct slices this slice imports |
| cycles | number of simple cycles through this slice (cap search at length 6) |
| upward | edges to a strictly higher layer |
| cross | edges to another slice on the same layer (FSD only; `app` and `shared` exempt) |
| external | distinct external packages imported |
| tests | `yes` when at least one test file maps to the slice, else `no` |

Counts only. No thresholds, no colors in the table.

## Rule checks

Encoded as diagram styling, not prose:

| Check | Source | Styling |
| --- | --- | --- |
| upward import | layer order above | edge `-.->` with `classDef bad` on the source node |
| same-layer cross import | FSD rule | edge `-.->` with `classDef warn` |
| cycle | metrics | nodes in the cycle get `classDef cycle` |
| public API sidestep (FSD) | import path deeper than `<layer>/<slice>` | counted in a `sidestep` column |

These mirror the rules of the FSD linter steiger (`no-higher-level-imports`, `no-cross-imports`, `no-public-api-sidestep`); when steiger is installed, run `npx --no-install steiger <src> --reporter json` and use its output instead.
