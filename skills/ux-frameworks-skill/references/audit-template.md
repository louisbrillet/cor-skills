# Layered UX audit template

Use this template when the user requests a full UX audit, heuristic evaluation, or design critique. Adapt as needed — not every artifact needs all five layers, but consider each before deciding to skip it.

## Audit structure

```markdown
# UX Audit: [Artifact name]

## Executive summary
- 2-3 sentences on the artifact's purpose and audience.
- Top 3 findings, each tagged with severity (low / medium / high / critical).
- Single-sentence recommendation: where to invest first.

## Strategy & scope (Garrett — strategy, scope)
- Whose problem does this solve, and is the problem real?
- Are the right features in scope? Anything missing or over-included?
- *Findings at this layer cascade through all other layers — fix here first if relevant.*

## Value coverage (Morville — honeycomb)
For each facet, give a 1-sentence assessment plus a finding if relevant:
- **Useful** — does it solve a real problem?
- **Usable** — covered in detail in the Nielsen section below.
- **Findable** — discoverable inside and outside the product?
- **Credible** — trustworthy in source, data, and conduct?
- **Accessible** — usable across the range of human ability?
- **Desirable** — emotionally and aesthetically appealing?
- **Valuable** — does it deliver value to user and business?

## Information architecture & interaction (Garrett — structure)
- Is the IA logical? Can users form a coherent mental model?
- Are state transitions and error flows handled?
- Is the right level of complexity exposed at each step?

## Layout & screen-level usability (Garrett — skeleton + surface)

### Heuristic evaluation (Nielsen)
For each violation found, format as:

> **[H#] Heuristic name** — Severity: [0-4]
> **Where:** [specific location]
> **Issue:** [what's wrong]
> **Why it matters:** [user impact]
> **Recommendation:** [specific fix]

Use the standard 0-4 severity scale:
- 0 = not a problem
- 1 = cosmetic
- 2 = minor
- 3 = major
- 4 = catastrophe

### Visual perception (Gestalt + PARC)
- Are related elements grouped (proximity)?
- Are functionally similar elements visually similar (similarity)?
- Does the eye flow naturally through the screen (continuity)?
- Are foreground and background unambiguous (figure/ground)?
- Is alignment intentional throughout?
- Is contrast strong enough to drive hierarchy?
- Is repetition creating system coherence?

### Behavioral & cognitive principles (Yablonski)
- **Jakob:** does it follow conventions where it should?
- **Fitts:** are touch targets sized and positioned for easy acquisition?
- **Hick:** are there too many choices at any decision point?
- **Miller:** is anything asking users to remember more than ~4-7 items?
- **Postel:** does input handling tolerate variation?
- **Peak-End:** what is the emotional peak? What is the ending?
- **Aesthetic-Usability:** does visual quality support perceived usability?
- **Von Restorff:** is the primary action visually distinct?
- **Tesler:** is complexity being absorbed by the system or pushed to the user?
- **Doherty:** are interactions sub-400ms? Where they aren't, is perceived performance handled?

## Prioritized recommendations
Order by severity × frequency × ease of fix:

1. [Critical / cheap] Fix immediately
2. [High / moderate] Plan for next sprint
3. [Medium] Backlog with rationale
4. [Low] Document but don't block

## Open questions
- What couldn't be assessed without user research?
- What requires data we don't have?
- What strategy-level questions does this audit raise?
```

## Tone guidance for the audit

- **Direct.** UX practitioners do not need definitions of basic terms. Skip beginner explanations unless the user signals beginner level.
- **Specific.** "This violates Hick's Law because the settings page presents 23 controls in a flat list" is more useful than "the settings page is overwhelming."
- **Cite by name.** Always say *which* framework and *which* principle. "Garrett — structure" or "Yablonski — Hick's Law" — not generic appeals to "best practice."
- **Acknowledge limits.** If the audit can't access something (analytics, user research, multiple breakpoints), say so explicitly. Don't fabricate confidence.
- **No hollow validation.** If a design works, say *why* it works (which principles it executes well). If it fails, locate the failure precisely. Avoid both gratuitous praise and gratuitous criticism.

## When to skip a layer

- **Wireframe with no visual design yet:** skip surface-level Gestalt/PARC.
- **Prototype without backend:** skip Doherty / Postel; flag them as deferred.
- **Single screen review:** skip strategy/scope; note that they were not in scope.
- **Strategy review:** skip everything below structure; the audit is about whether to build, not how.

## Worked example: severity-rated finding

> **[H5] Error prevention** — Severity: 4 (catastrophe)
> **Where:** Account settings → Delete account
> **Issue:** The "Delete account" button performs the deletion immediately on click, with no confirmation step and no undo window.
> **Why it matters:** Account deletion is irreversible. A single misclick destroys data the user cannot recover. Also implicates Yablonski's Tesler's Law (complexity of recovery pushed entirely to the user) and Nielsen's heuristic 3 (user control and freedom — there is no exit from the action).
> **Recommendation:** Two-step confirmation: a modal restating what will be deleted, requiring the user to type their email or password to confirm. Add a 30-day soft-delete window so accidental deletions are recoverable. Replace the destructive primary-button styling with a destructive-action treatment that requires deliberate engagement (red, secondary position, requires text input to enable).
