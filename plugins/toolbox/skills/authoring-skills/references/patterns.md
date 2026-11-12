# Skill structure patterns

## Contents

- Pattern 1: High-level guide with references
- Pattern 2: Domain-specific organization
- Pattern 3: Conditional details
- Pattern 4: Shared-block extraction
- Workflow checklist pattern
- Template pattern
- Examples pattern
- Conditional workflow pattern
- Old patterns block

## Pattern 1: High-level guide with references

SKILL.md holds the quick start and a link list. Everything else is bundled and loaded on demand.

```markdown
# PDF Processing

## Quick start

Extract text with pdfplumber:

​```python
import pdfplumber
with pdfplumber.open("file.pdf") as pdf:
    text = pdf.pages[0].extract_text()
​```

## Advanced features

**Form filling**: See [forms.md](forms.md)
**API reference**: See [reference.md](reference.md)
**Examples**: See [examples.md](examples.md)
```

Use when the skill has one primary path plus optional deep dives.

## Pattern 2: Domain-specific organization

Split reference material by domain so an unrelated domain never enters context.

```
bigquery-skill/
  SKILL.md              overview and navigation
  reference/
    finance.md          revenue, billing metrics
    sales.md            opportunities, pipeline
    product.md          API usage, features
    marketing.md        campaigns, attribution
```

SKILL.md lists each domain with a one-line scope description and its link. Add grep hints when the reference files are large:

```bash
grep -i "revenue" reference/finance.md
```

Use when the skill covers several independent subject areas.

## Pattern 3: Conditional details

Inline the common case; link the rare, heavy case.

```markdown
## Editing documents

For simple edits, modify the XML directly.

**For tracked changes**: See [redlining.md](redlining.md)
**For OOXML details**: See [ooxml.md](ooxml.md)
```

Use when 80% of invocations need only the basic path.

## Pattern 4: Shared-block extraction

When three or more skills in a collection repeat the same block verbatim, the collection pays for it on every load and the copies drift apart.

1. Move the canonical block to one shared file, for example `skills/<collection>-shared/environment-detection.md`.
2. Replace each copy with a one-line pointer naming the file and when to read it.
3. Keep the pointer specific: "Read `skills/cor-shared/question-format.md` before asking the user anything."

Never `@import` the shared file from a root instruction file — imports load eagerly and unconditionally, which defeats the point of extracting.

## Workflow checklist pattern

Open a multi-step workflow with a copyable checklist, then expand each step.

```markdown
## Research synthesis workflow

Copy this checklist and track your progress:

​```
Research Progress:
- [ ] Step 1: Read all source documents
- [ ] Step 2: Identify key themes
- [ ] Step 3: Cross-reference claims
- [ ] Step 4: Create structured summary
- [ ] Step 5: Verify citations
​```

**Step 1: Read all source documents**
...
```

Use when steps must not be skipped or reordered.

## Template pattern

Strict when the shape is contractual:

```markdown
ALWAYS use this exact template structure:
```

Flexible when adaptation helps:

```markdown
Here is a sensible default format, but use your best judgment:
```

Pick one and say which. An unlabeled template gets treated as optional.

## Examples pattern

When output quality depends on style, show input/output pairs rather than describing the style.

```markdown
**Example 1:**
Input: Added user authentication with JWT tokens
Output:
​```
feat(auth): implement JWT-based authentication

Add login endpoint and token validation middleware
​```
```

Two to three pairs are usually enough. More than five is padding.

## Conditional workflow pattern

Make branches explicit at the decision point.

```markdown
1. Determine the modification type:

   **Creating new content?** → Follow "Creation workflow"
   **Editing existing content?** → Follow "Editing workflow"
```

If a branch grows past roughly 40 lines, move it to its own file and branch to the file.

## Old patterns block

Never write "before August 2025, do X". Write the current method in the body and collapse the history:

```markdown
## Current method

Use the v2 API endpoint: `api.example.com/v2/messages`

## Old patterns

<details>
<summary>Legacy v1 API (deprecated)</summary>

The v1 API used `api.example.com/v1/messages`. No longer supported.
</details>
```
