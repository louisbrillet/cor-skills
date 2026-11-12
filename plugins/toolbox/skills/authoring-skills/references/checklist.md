# Skill review checklist

## Contents

- Discovery (name and description)
- Token economy
- Structure and progressive disclosure
- Content quality
- Workflows and feedback loops
- Scripts and executable code
- Testing
- Severity ranking

## Discovery (name and description)

- [ ] `name` is lowercase letters, numbers, hyphens only; max 64 chars.
- [ ] `name` contains no reserved word (`anthropic`, `claude`) and no XML tags.
- [ ] `name` matches the containing directory name exactly.
- [ ] `name` follows one convention across the whole collection (gerund, noun phrase, or action — pick one, do not mix).
- [ ] `name` is specific, not `helper` / `utils` / `tools` / `data`.
- [ ] `description` is non-empty and under 1024 chars.
- [ ] `description` is third person. No "I can", no "you can use this".
- [ ] `description` states what the skill does.
- [ ] `description` states when to use it, with concrete triggers: file types, user phrasings, domain nouns.
- [ ] `description` is distinguishable from every other skill's description in the collection.

## Token economy

- [ ] SKILL.md body is under 500 lines.
- [ ] No paragraph explains a concept the model already knows.
- [ ] No block is duplicated verbatim in another skill of the same collection.
- [ ] Bulk reference material lives in bundled files, not in SKILL.md.
- [ ] Every bundled file is reachable from SKILL.md (unreferenced files are dead weight).

## Structure and progressive disclosure

- [ ] All references are one level deep from SKILL.md.
- [ ] Reference files over 100 lines open with a table of contents.
- [ ] Reference filenames describe content (`form_validation_rules.md`, not `doc2.md`).
- [ ] Directories are organized by domain or feature, not `docs/file1.md`.
- [ ] All paths use forward slashes.
- [ ] No duplicate copies of the same file at two paths in one skill.

## Content quality

- [ ] One term per concept, used consistently.
- [ ] No time-sensitive statements in active sections; deprecated material sits in a collapsed `## Old patterns` block.
- [ ] Examples are concrete, with real inputs and outputs.
- [ ] Exactly one default approach is given per decision, with at most one escape hatch.
- [ ] MCP tools are named `ServerName:tool_name`.
- [ ] Required packages are named with their install command.

## Workflows and feedback loops

- [ ] Multi-step operations are numbered steps, not prose.
- [ ] Complex workflows open with a copyable progress checklist.
- [ ] Critical operations have a validate step with an explicit "do not proceed while failing" instruction.
- [ ] Decision points are explicit branches ("Creating new content? → …  Editing existing? → …").
- [ ] Degrees of freedom match task fragility (high for open judgment, low for fragile sequences).

## Scripts and executable code

- [ ] Scripts handle their own error conditions instead of deferring to the agent.
- [ ] All constants are justified in a comment; no magic numbers.
- [ ] SKILL.md states whether each script is to be executed or read as reference.
- [ ] Scripts have usage documentation at the top.
- [ ] Batch or destructive operations use plan → validate → execute with a verifiable intermediate file.

## Testing

- [ ] At least three evaluations exist.
- [ ] A no-skill baseline was measured before the skill was written.
- [ ] Tested across the model tiers it will run on.
- [ ] Tested on real tasks, not only crafted scenarios.

## Severity ranking

Rank every finding by what it costs, highest first.

| Rank | Class                | Symptom                                                  |
| ---- | -------------------- | -------------------------------------------------------- |
| 1    | Blocks discovery     | Invalid `name`, vague `description`, name/dir mismatch    |
| 2    | Recurring token cost | Body over budget, cross-skill duplication, dead files     |
| 3    | Degrades output      | No workflow steps, no validation loop, mixed terminology  |
| 4    | Cosmetic             | Heading style, ordering, phrasing                         |
