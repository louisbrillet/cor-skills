# Diataxis classification and page shapes

Source framework: https://diataxis.fr/. This file is an operational summary for classifying code changes and writing pages.

## Contents

- The two axes
- Classifying a change
- Change-to-quadrant signals
- Page shapes
- Mixing rules
- Writing rules

## The two axes

| | Acquisition (study) | Application (work) |
| --- | --- | --- |
| **Action** (doing) | Tutorial | How-to guide |
| **Cognition** (knowing) | Explanation | Reference |

Ask two questions of every piece of content:

1. Does it tell the reader what to **do**, or what to **know**?
2. Is the reader **learning** the product, or **working** with it on a real task?

The answers place it in exactly one quadrant.

## Classifying a change

For each change in the diff, record what a reader now needs that they did not need before. Then map:

- New fact a user must look up (option, flag, endpoint, field, type, error code, default value, CLI command, env variable) -> **reference**.
- New goal a competent user can now reach, or an existing procedure whose steps changed -> **how-to**.
- New design decision, trade-off, constraint, or concept that affects how users reason about the system -> **explanation**.
- Change to the first-run path a newcomer follows (install, init, hello-world, core workflow) -> **tutorial**.

One change often produces several entries. A new config option is always reference; it becomes how-to only if it enables a task worth a recipe; it becomes explanation only if its existence implies a decision worth justifying.

## Change-to-quadrant signals

| Diff signal | Likely quadrant(s) |
| --- | --- |
| Public function, class, endpoint, schema, CLI flag added/changed/removed | reference |
| Default value, limit, error message, status code changed | reference |
| New integration, command, or feature flag users toggle | reference + how-to |
| Install, bootstrap, quickstart, or scaffolding changed | tutorial (+ how-to if upgrade path needed) |
| Breaking change or deprecation | reference + how-to (migration) |
| New architecture layer, caching, concurrency model, security model | explanation |
| Internal refactor, test-only, CI-only, formatting | usually none |
| Removed feature | delete or mark removed in reference; remove dead how-to steps; fix links |

Internal-only changes produce no user docs unless the docs audience includes contributors. Read the root `index.md` audience statement to decide.

## Page shapes

### Tutorial (`tutorials/`)

- Title: outcome the learner reaches, e.g. "Build your first export".
- Opens with what the learner will have at the end.
- Numbered steps, each with a visible result ("You should see ...").
- One path only. No alternatives, no options, no deep explanation; link to explanation instead.
- Must work end to end on a clean setup.

### How-to guide (`how-to/`)

- Title: "How to <goal>", e.g. "How to configure rate limits".
- States the goal and prerequisites in two to four lines.
- Numbered actions; branches only where real-world conditions differ.
- Assumes competence; skips teaching.
- Ends when the goal is reached. Links to reference for full option lists.

### Reference (`reference/`)

- Title: the thing described, e.g. "Configuration", "CLI", "HTTP API".
- Structure mirrors the code structure (one section per module, command, or endpoint).
- Neutral, complete, consistent: name, type, default, allowed values, example.
- Tables for options; one short usage example per item where useful.
- No instructions beyond usage, no opinions, no history.

### Explanation (`explanation/`)

- Title: topic or question, e.g. "About retry and backoff".
- Discusses why, context, trade-offs, alternatives considered, consequences.
- May contain opinion and history.
- No step-by-step instructions; link to how-to for those.

## Mixing rules

- A page belongs to one quadrant. When content of another kind is needed, link to it instead of inlining.
- Signs of mixing to fix: steps inside reference, long rationale inside how-to, option tables inside tutorials, instructions inside explanation.
- Inside a page, a short "See also" list pointing to the other quadrants is encouraged.

## Writing rules

- Every fact comes from the code at the head branch, a commit message, or a user answer. Never from inference about intent.
- Use names exactly as they appear in code (flags, env variables, types).
- Code examples must match the current signatures in the head branch.
- Prefer editing an existing page over creating a near-duplicate.
- Keep each page's first paragraph a one-sentence summary of the page.
