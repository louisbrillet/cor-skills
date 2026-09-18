---
name: authoring-skills
description: "Authors, audits, and refactors Agent Skills against Anthropic's skill authoring best practices — frontmatter validity, description discoverability, token budgets, progressive disclosure, workflows, and evaluations. Use when creating a new SKILL.md, reviewing or improving an existing skill, auditing a skill collection for compliance, or when the user mentions skill authoring, SKILL.md, skill descriptions, or skill token budgets."
status: stable
stability: guaranteed
---

# Authoring Skills

Write and review skills so agents discover them reliably and load them cheaply.

Two modes: **author** a new skill, or **audit** existing ones. Both end with `scripts/validate_skill.py` passing.

---

## Non-negotiables

1. `name`: lowercase letters, numbers, hyphens; max 64 chars; no `anthropic`/`claude`; must equal the directory name.
2. `description`: third person, max 1024 chars, states **what** the skill does **and when to use it** with concrete trigger terms.
3. SKILL.md body under 500 lines. Over budget → split into reference files.
4. File references one level deep from SKILL.md. Never reference-from-a-reference.
5. Forward slashes in every path.
6. No time-sensitive statements in active sections. Deprecated material goes in a collapsed `## Old patterns` block.
7. One term per concept throughout the skill.

---

## Authoring workflow

```
Authoring Progress:
- [ ] Step 1: Establish the baseline gap
- [ ] Step 2: Write three evaluations
- [ ] Step 3: Draft frontmatter
- [ ] Step 4: Write the minimum body
- [ ] Step 5: Apply progressive disclosure
- [ ] Step 6: Validate
- [ ] Step 7: Test against the evaluations
```

**Step 1 — Establish the baseline gap.** Run the target task with no skill loaded. Record the specific failures. If there are none, do not write the skill.

**Step 2 — Write three evaluations.** One JSON file each, under the skill's `evaluations/` directory. Format and rubric guidance: [references/evaluations.md](references/evaluations.md). Evaluations come before prose, not after. `evaluations/` is exempt from the SKILL.md reachability rule — it is an author-side fixture directory, never linked from the body.

**Step 3 — Draft frontmatter.** Apply the non-negotiables above. Description pattern:

```yaml
description: "<Third-person verb phrase for what it does>. Use when <concrete triggers, file types, and user phrasings>."
```

**Step 4 — Write the minimum body.** Only content the agent lacks. Delete any sentence explaining a concept the model already knows. Pick the degree of freedom that matches the task's fragility — see [references/patterns.md](references/patterns.md).

**Step 5 — Apply progressive disclosure.** Keep the decision content in SKILL.md; push bulk reference material, templates, and scripts into bundled files linked from SKILL.md. Patterns and directory layouts: [references/patterns.md](references/patterns.md).

**Step 6 — Validate.**

```bash
python skills/authoring-skills/scripts/validate_skill.py skills/<skill-name>
```

Fix every `ERROR`. Triage each `WARN` explicitly — fix it or state why it is intentional. Re-run until clean.

**Step 7 — Test against the evaluations.** Load the skill in a fresh agent session and run all three evaluations. Any failure → return to Step 4 with the specific observed behavior, not a guess.

---

## Audit workflow

```
Audit Progress:
- [ ] Step 1: Run the validator across the collection
- [ ] Step 2: Score each skill against the checklist
- [ ] Step 3: Detect cross-skill duplication
- [ ] Step 4: Rank findings by cost
- [ ] Step 5: Propose fixes with concrete diffs
```

**Step 1 — Run the validator.**

```bash
python skills/authoring-skills/scripts/validate_skill.py skills/*/
```

**Step 2 — Score each skill.** Use [references/checklist.md](references/checklist.md). The validator catches mechanics; the checklist catches judgment (conciseness, trigger quality, workflow clarity, consistent terminology).

**Step 3 — Detect cross-skill duplication.** Identical blocks repeated across skills are paid for on every load. Find them:

```bash
grep -rln "<repeated heading>" skills/*/SKILL.md
```

Three or more copies of the same block → extract to one shared reference file and link to it from each skill.

**Step 4 — Rank findings by cost.** Order: blocks discovery (bad `name`/`description`) > wastes tokens on every load (oversized body, duplication) > degrades output quality (vague workflow, missing validation loop) > cosmetic.

**Step 5 — Propose fixes with concrete diffs.** For each finding give the file, the current text, the replacement, and the token or behavior gain. No abstract advice.

---

## Degrees of freedom

Match specificity to fragility.

| Task shape                                        | Freedom | Form                                |
| ------------------------------------------------- | ------- | ----------------------------------- |
| Many valid approaches, context decides            | High    | Prose heuristics                    |
| Preferred pattern exists, variation acceptable    | Medium  | Parameterized template or pseudocode |
| Fragile, order-dependent, consistency is critical | Low     | Exact command, "do not modify"      |

---

## Feedback loops

Any skill producing a verifiable artifact needs a loop: produce → validate → fix → re-validate → only then proceed. The validator can be a script or a reference document the agent reads and compares against. State explicitly that the agent must not proceed while validation fails.

---

## Anti-patterns

- Explaining what the model already knows.
- Offering four libraries with no default. Give one default plus one escape hatch.
- Windows-style paths.
- Nested references (SKILL.md → a.md → b.md). Claude previews `b.md` partially and misses content.
- Bundled files never referenced from SKILL.md — they are invisible and consume repo space for nothing.
- Unqualified MCP tool names. Use `ServerName:tool_name`.
- Vague descriptions (`Helps with documents`). They lose skill selection against 100+ competitors.
- Assuming packages are installed. State the install command.

---

## Bundled resources

- [references/checklist.md](references/checklist.md) — full pre-ship review checklist, grouped by core quality, code, and testing.
- [references/patterns.md](references/patterns.md) — progressive disclosure layouts, workflow/checklist, template, examples, and conditional-branch patterns.
- [references/evaluations.md](references/evaluations.md) — evaluation-driven development loop and evaluation file format.
- `scripts/validate_skill.py` — run it (do not read it) to check frontmatter, token budget, reference depth, path style, and bundled-file reachability.
