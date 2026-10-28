---
name: cor-docs
description: "Updates a project's Markdown documentation from a git diff between two branches plus the existing codebase, following the Diataxis framework (tutorials, how-to guides, reference, explanation). Edits only the quadrants the change actually affects, asks the user when intent is missing, and keeps output compatible with MkDocs and Zensical. Initializes the docs directory (default docs/) when absent. Use when the user asks to document a branch, update docs from a diff or PR, sync documentation with code changes, set up Diataxis docs, or mentions Diataxis, MkDocs, or Zensical. Claude Code users: invoke as /cor:docs."
status: beta
stability: experimental
---

# COR Docs — diff-driven Diataxis documentation

Turn a branch diff into precise documentation updates. Write only what the change requires, only in the quadrants it affects, only from verifiable facts.

Scope: writes inside the docs directory, the site config file (`mkdocs.yml` or `zensical.toml`), and `.cor/docs.md`. Never edits source code.

---

## Parameters

| Parameter | Required | Resolution order |
| --- | --- | --- |
| `base` | yes | user argument -> ask (suggest `Default Base Branch` from `.cor/docs.md`, else `main`) |
| `head` | no | user argument -> current branch (`git rev-parse --abbrev-ref HEAD`) |
| `docs-dir` | no | user argument -> `Docs Directory` in `.cor/docs.md` -> `docs` |

Never guess `base`. If the user gave none and `.cor/docs.md` has none, ask.

Verify both refs exist before anything else:

```bash
git rev-parse --verify <base> && git rev-parse --verify <head>
```

If one fails, try `origin/<ref>`. If still missing, stop and ask the user for the correct ref.

---

## Asking the user

Every question is multiple choice with one `(Recommended)` option plus a free-text option. Use the native question tool when available (`AskUserQuestion` in Claude Code, `vscode_askQuestions` in GitHub Copilot, `request_user_input` in Codex plan mode); otherwise an inline numbered list. Batch related questions in one round; at most four per round.

---

## Workflow

```
Docs Progress:
- [ ] Step 1: Resolve parameters
- [ ] Step 2: Check docs setup
- [ ] Step 3: Collect the diff
- [ ] Step 4: Read code and existing docs
- [ ] Step 5: Build the impact map
- [ ] Step 6: Resolve gaps and confirm
- [ ] Step 7: Write pages
- [ ] Step 8: Validate
- [ ] Step 9: Report
```

**Step 1 — Resolve parameters.** Apply the table above. Read `.cor/docs.md` if present.

**Step 2 — Check docs setup.** Run:

```bash
python <skill-dir>/scripts/check_docs.py --root . --docs-dir <docs-dir>
```

- Docs directory missing, or layout errors (`missing root index.md`, `missing quadrant directory`, `missing quadrant index.md`) -> follow [references/setup.md](references/setup.md), then rerun the check.
- Existing Markdown not in Diataxis layout -> follow the "Adopting existing docs" section of [references/setup.md](references/setup.md). Load [references/diataxis.md](references/diataxis.md) first; adoption needs the classification.
- Pre-existing `broken link` or `nav` errors -> note them; fix only those on pages this run touches, list the rest in the report.

**Step 3 — Collect the diff.** Always diff from the merge base (three dots), so changes merged into `base` after branching are excluded:

```bash
git diff --name-status <base>...<head>
git diff --stat <base>...<head>
git log --no-merges --format='%h %s%n%b' <base>..<head>
```

Then read the patch per file or per directory, not all at once on large diffs:

```bash
git diff <base>...<head> -- <path>
```

Skip lockfiles, generated files, snapshots, and formatting-only hunks. Changes in tests are evidence of intended behavior, not doc targets.

**Step 4 — Read code and existing docs.**

- Read each relevant changed file at `head` in full (`git show <head>:<path>` when `head` is not checked out). Diff hunks alone miss signatures, defaults, and callers.
- Find user-facing entry points that expose the change (CLI definitions, routes, config schemas, public exports).
- Search the docs directory for every changed public name to find pages that already mention it:

```bash
grep -rn "<symbol-or-flag>" <docs-dir>
```

**Step 5 — Build the impact map.** Load [references/diataxis.md](references/diataxis.md). Classify every user-visible change. Produce this table:

| Change | Quadrant | Action | Target page | Evidence |
| --- | --- | --- | --- | --- |
| `RATE_LIMIT_PER_MINUTE` env added | reference | update | `docs/reference/configuration.md` | `src/config.ts:42` |
| Configure rate limits | how-to | create | `docs/how-to/configure-rate-limits.md` | `src/config.ts:42`, commit `a1b2c3d` |

Action is one of `create`, `update`, `remove`, `none`. Add one line per quadrant that gets no change, with the reason (e.g. "tutorials: none, first-run path unchanged"). A quadrant with no change is a valid outcome; never pad a quadrant to look complete.

Mark a row `GAP` in the Evidence column when the code shows **what** changed but nothing (code comment, test name, commit message, linked issue) shows **why** or **for whom**. Explanation rows depend on intent; reference rows rarely do. A how-to whose steps follow from the code (set this variable, call this command, handle this response) is not a GAP; only recommendations inside it (which value to pick, when to use it) need evidence.

**Step 6 — Resolve gaps and confirm.** Show the impact map. In the same round, ask one question per `GAP` row (purpose, target user, recommended usage, known limits). Wait for answers.

- User answers -> record the answer as evidence ("user, <date>") and keep the row.
- User declines or does not know -> omit only the unsupported content (rationale, recommendations); keep reference facts and code-derived how-to steps; list the gap in the report.
- User edits the map -> apply edits before writing.

Never write rationale, intent, or recommendations that no evidence supports.

**Step 7 — Write pages.** Follow the page shapes and mixing rules in [references/diataxis.md](references/diataxis.md). For each page written:

1. Prefer updating an existing page over creating a new one.
2. Use names, signatures, and defaults exactly as at `head`.
3. Cross-link quadrants with relative links instead of duplicating content.
4. For created pages: add a bullet under the marker in the quadrant `index.md` and add the path to `nav` in the site config, same order.
5. For removed features: remove or update the reference entry, delete obsolete how-to steps, fix every inbound link (`grep -rn "<page>.md" <docs-dir>`).

Standard CommonMark plus fenced code blocks with a language tag. No generator-specific syntax (admonitions, tabs, macros) unless the docs directory already uses it.

**Step 8 — Validate.** Rerun:

```bash
python <skill-dir>/scripts/check_docs.py --root . --docs-dir <docs-dir>
```

Fix every `ERROR` on pages touched in this run, then rerun. Do not proceed to Step 9 while those errors remain. Triage each `WARN` on touched pages: fix it or state why it is intentional.

If the user has the generator installed, also run a strict build (`mkdocs build --strict` or `zensical build`) and fix reported issues on touched pages. Do not install the generator.

**Step 9 — Report.** Output:

- Range documented: `<base>...<head>` with merge-base short SHA.
- Pages created, updated, removed, grouped by quadrant.
- Quadrants left unchanged, with reason.
- Open gaps the user declined or could not answer.
- Pre-existing check errors not fixed.
- Preview command for the configured generator (`mkdocs serve` or `zensical serve`).

---

## Anti-patterns

- Diffing with two dots (`base..head`) in `git diff`; it includes unrelated changes merged into `base`.
- Documenting from diff hunks without reading the full file at `head`.
- Touching all four quadrants on every run.
- Copying the option table into a how-to guide instead of linking to reference.
- Inventing a "why" for an unexplained flag or constant.
- Writing a tutorial for a feature that is not on the newcomer path.
- Creating a page without adding it to the quadrant `index.md` and `nav`.

---

## Bundled resources

- [references/diataxis.md](references/diataxis.md) — quadrant axes, change-to-quadrant signals, page shapes, mixing and writing rules.
- [references/setup.md](references/setup.md) — target layout, generator choice, `mkdocs.yml`/`zensical.toml` templates, index page templates, `.cor/docs.md` format, adopting existing docs.
- `scripts/check_docs.py` — run it (do not read it). Checks quadrant layout, index pages, relative links and images, quadrant index coverage, nav coverage in `mkdocs.yml`/`zensical.toml`, and numbered steps in tutorials and how-to pages. Python 3 standard library only.
