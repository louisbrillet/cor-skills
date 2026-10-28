# Docs setup

Used once per repository, when the docs directory is missing or not Diataxis-shaped.

## Contents

- Target layout
- Generator choice
- Config templates
- Root and quadrant index pages
- Project config file
- Adopting existing docs

## Target layout

`<docs-dir>` defaults to `docs`. Paths below are relative to the repository root.

```
<config file>                 mkdocs.yml or zensical.toml, repo root (omit for "none")
<docs-dir>/
  index.md                    landing page: product summary, audience, map of the four sections
  tutorials/
    index.md
  how-to/
    index.md
  reference/
    index.md
  explanation/
    index.md
.cor/docs.md                  cor-docs project config
```

Rules:

- Directory names are fixed: `tutorials`, `how-to`, `reference`, `explanation`. The check script relies on them.
- Page file names are kebab-case, e.g. `how-to/configure-rate-limits.md`.
- Images and other assets live in `<docs-dir>/assets/`.
- `<docs-dir>` must not be `.`; Zensical does not support it.

## Generator choice

Ask the user, with this default:

1. **mkdocs.yml (Recommended)** — read by both MkDocs and Zensical, so the user can switch tool without migrating.
2. **zensical.toml** — Zensical native config.
3. **None** — plain Markdown only; no site config written.

Do not install the generator. State the install command for the chosen tool in the final report and let the user run it.

## Config templates

Replace `<...>` placeholders. Keep `nav` order: Home, Tutorials, How-to guides, Reference, Explanation. Every page must be listed in `nav`; `scripts/check_docs.py` enforces it.

### mkdocs.yml

```yaml
site_name: <Project name>
docs_dir: <docs-dir>
nav:
  - Home: index.md
  - Tutorials:
      - tutorials/index.md
  - How-to guides:
      - how-to/index.md
  - Reference:
      - reference/index.md
  - Explanation:
      - explanation/index.md
```

### zensical.toml

```toml
[project]
site_name = "<Project name>"
docs_dir = "<docs-dir>"
nav = [
  { "Home" = "index.md" },
  { "Tutorials" = ["tutorials/index.md"] },
  { "How-to guides" = ["how-to/index.md"] },
  { "Reference" = ["reference/index.md"] },
  { "Explanation" = ["explanation/index.md"] },
]
```

When a page is added, append its path to the matching section list in the same position it appears in the section `index.md`.

## Root and quadrant index pages

`<docs-dir>/index.md`:

```markdown
# <Project name>

<One-sentence product summary.>

Audience: <who reads these docs, e.g. "developers integrating the HTTP API">.

- [Tutorials](tutorials/index.md) - learn by building something end to end.
- [How-to guides](how-to/index.md) - recipes for specific goals.
- [Reference](reference/index.md) - technical description of every option, command, and API.
- [Explanation](explanation/index.md) - background, design decisions, and trade-offs.
```

Each quadrant `index.md`:

```markdown
# <Tutorials | How-to guides | Reference | Explanation>

<One sentence describing the quadrant purpose for this project.>

<!-- cor-docs: page list, keep in nav order -->
```

Below the marker, keep one bullet per page: `- [Title](file.md) - one-line summary.` An empty list is valid.

## Project config file

Write `.cor/docs.md` with exactly this structure:

```markdown
# COR Docs Config

## Docs Directory

<docs-dir>

## Generator

<mkdocs | zensical | none>
Config: <mkdocs.yml | zensical.toml | none>

## Audience

<audience statement copied from index.md>

## Default Base Branch

<branch name, e.g. main>
```

## Adopting existing docs

When `<docs-dir>` exists with Markdown files but no Diataxis layout:

1. List every existing page with a proposed quadrant, using the Diataxis classification (already loaded per SKILL.md Step 2).
2. Flag pages that mix quadrants and propose a split.
3. Ask the user to confirm the mapping before moving anything.
4. Move files with `git mv` so history is preserved, then fix relative links.
5. Run `scripts/check_docs.py` until it reports no ERROR.

Never delete existing content during adoption. Content with no clear quadrant goes to `explanation/` and is listed in the report for review.
