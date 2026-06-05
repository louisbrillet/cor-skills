---
name: ux-frameworks
description: Apply, cite, and reason with the five canonical UX evaluation frameworks — Nielsen's 10 Usability Heuristics, Garrett's Five Planes of UX, Gestalt principles & PARC, Morville's UX Honeycomb, and Yablonski's Laws of UX. Use this skill whenever the user asks for a UX critique, heuristic evaluation, design review, audit of an interface, or wants to diagnose why a design "feels off". Also use it when the user mentions any of these framework names, when they ask for the right framework to apply to a specific UX problem, or when producing UX deliverables (audits, design rationales, design system documentation, design critique). Even when only one framework is named, prefer cross-referencing with the others to locate the problem at the right layer of abstraction.
status: beta
stability: experimental
---

# UX Frameworks: a layered diagnostic toolkit

## Why these five frameworks together

These frameworks are not interchangeable. They operate at different levels of abstraction and answer different diagnostic questions. The leverage comes from knowing which lens to reach for — and combining them.

- **Garrett** → _where_ the problem lives (vertical axis: strategy → surface)
- **Morville** → _which dimension of value_ is failing (useful, usable, findable, credible, accessible, desirable, valuable)
- **Nielsen** → _whether the interface is usable_ (10 heuristics for evaluation)
- **Gestalt + PARC** → _why the visual layout reads wrong_ (perceptual mechanisms)
- **Yablonski** → _why the human brain pushes back_ (psychological principles, orthogonal to all the above)

A complete UX critique uses all five layers. Default to that pattern unless the user specifies otherwise.

## When to use which framework

| The user is asking…                           | Reach for…        |
| --------------------------------------------- | ----------------- |
| "Is this interface usable?"                   | Nielsen           |
| "Where is the actual root cause?"             | Garrett           |
| "Is this product worth using?"                | Morville          |
| "Why does this layout feel cluttered/broken?" | Gestalt + PARC    |
| "Why are users not behaving as expected?"     | Yablonski         |
| "Run a full UX audit"                         | All five, layered |

Read the relevant reference file for full detail before producing an evaluation. Do not rely on partial recall.

## Reference files

Load only what's relevant to the task at hand:

- `references/nielsen.md` — The 10 heuristics, with definitions, examples, and severity-rating guidance for heuristic evaluation.
- `references/garrett.md` — The five planes (strategy, scope, structure, skeleton, surface) and how to use them to locate root causes.
- `references/gestalt-parc.md` — Gestalt principles (proximity, similarity, continuity, closure, figure/ground, common region, common fate, Prägnanz, uniform connectedness, past experience) and PARC (proximity, alignment, repetition, contrast).
- `references/morville.md` — The seven facets of the UX Honeycomb and how they extend beyond pure usability.
- `references/yablonski.md` — The 10 core Laws of UX (Jakob, Fitts, Hick, Miller, Postel, Peak-End, Aesthetic-Usability, Von Restorff, Tesler, Doherty) plus extensions and the ethics dimension.
- `references/audit-template.md` — A reusable template for producing layered UX audits using all five frameworks.

## Workflow for a UX critique

When the user asks for any kind of UX evaluation:

1. **Identify the artifact.** Is it a screen, a flow, a full product, a wireframe, a description? Note what level of fidelity you're working with — this determines which Garrett plane is in scope.

2. **Read the relevant reference files.** For a full audit, read all five. For a targeted critique, read at minimum the two or three frameworks most relevant to the question. Do not produce framework-grounded analysis from memory alone — the references contain the precise definitions and the worked examples.

3. **Locate the problem on the Garrett stack first.** Surface symptoms often have deeper roots. Before listing surface fixes, ask: is this a strategy/scope problem masquerading as a UI issue?

4. **Cite the specific principle being violated.** "This violates Nielsen's heuristic #1 (visibility of system status)" is more useful than "this feels unclear." Same for "Hick's Law applies here" or "this fails the figure/ground principle."

5. **Cross-reference where it strengthens the analysis.** A single problem often violates principles across multiple frameworks (e.g., a cluttered settings page can be both a Hick's Law issue _and_ a Nielsen #8 minimalism issue _and_ a Gestalt proximity failure). Naming all relevant principles makes the critique harder to dismiss.

6. **Propose fixes at the right layer.** A skeleton-layer fix won't solve a structure-layer problem. Match the depth of the fix to the depth of the diagnosis.

## cor-design finalist cross-check mode

When called by `cor-design` during narrowing, run a finalist-focused check (not a full exploratory audit):

- Evaluate only shortlisted variants (winner candidates + runner-up candidates).
- Minimum framework set: Nielsen + Garrett + one of (Gestalt/PARC, Laws of UX).
- Mark each issue with severity: `low`, `medium`, `high`.
- Return a direct verdict for each finalist: `supports`, `mixed`, or `blocks`.

Use this structured output:

```md
## UX Finalist Cross-check

### Variant: [id]

- Verdict: [supports|mixed|blocks]
- Framework signals:
  - [framework + principle]: [finding] (severity: [low|medium|high])
- Strengths: [bullets]
- Risks: [bullets]

### Arbitration hint

- If scorecard winner differs from UX verdict, recommend: [scorecard | framework | extra round]
```

## Output style

UX evaluations are professional deliverables. Default to:

- **Direct, technical tone.** UX practitioners do not need definitions of basic terms ("affordance", "information architecture", "cognitive load"). Skip them unless the user signals they are a beginner.
- **Cite framework + specific principle.** "Garrett — structure plane" or "Yablonski — Hick's Law" — not generic appeals to "best practice."
- **No hollow validation.** If a design works, say it works and explain the mechanism. If it fails, say it fails and locate the failure precisely.
- **Severity-rated findings when doing a heuristic evaluation.** Use Nielsen's standard 0-4 severity scale (0 = not a problem, 4 = catastrophe).
- **Acknowledge framework limits.** Nielsen's heuristics underweight accessibility and credibility — Morville's honeycomb covers that gap. Garrett's planes can blur in modern iterative practice. Don't oversell the frameworks.

## Known pitfalls to avoid

- **Don't conflate Nielsen's "usable" with Morville's "usable" facet.** They overlap but Morville's framing is broader (efficient + appealing + comprehensible).
- **Don't treat Yablonski's laws as absolute rules.** Hick's Law has well-known limits (chunking can flatten the cost of more options); Miller's "magical seven" is now generally accepted as closer to four. Cite them as predictive heuristics, not laws of physics.
- **Don't apply Garrett's planes too rigidly.** In modern iterative practice, planes overlap and feedback runs both directions. Use the model as a diagnostic frame, not a project-management waterfall.
- **Don't recommend dark patterns.** Yablonski's book closes with an ethics chapter for a reason — many psychological principles can be weaponized against users. If a request asks for engagement-maximizing manipulation (intermittent variable rewards, manufactured urgency, friction in cancellation flows), surface the ethical issue rather than executing silently.

## Quick reference card

This is a cheatsheet, not a substitute for the reference files. Read the references for actual evaluations.

**Nielsen's 10:** (1) visibility of system status, (2) match between system and real world, (3) user control and freedom, (4) consistency and standards, (5) error prevention, (6) recognition over recall, (7) flexibility and efficiency, (8) aesthetic and minimalist design, (9) help users recognize/diagnose/recover from errors, (10) help and documentation.

**Garrett's 5 planes:** strategy → scope → structure → skeleton → surface. Each depends on the one below.

**Gestalt core:** proximity, similarity, continuity, closure, figure/ground, common region, common fate, Prägnanz, uniform connectedness, past experience.

**PARC:** proximity, alignment, repetition, contrast.

**Morville's honeycomb:** useful, usable, findable, credible, accessible, desirable, valuable.

**Yablonski's 10 core laws:** Jakob, Fitts, Hick, Miller, Postel, Peak-End, Aesthetic-Usability, Von Restorff, Tesler, Doherty.
