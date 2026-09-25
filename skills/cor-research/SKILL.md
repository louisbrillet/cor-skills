---
name: cor-research
description: "Researches current libraries, version-specific APIs, architecture practices, and implementation options after COR Think and before COR Plan. Use when implementation depends on maintained third-party packages, recent platform capabilities, external standards, security guidance, or an evidence-based architecture choice."
---

# COR Research

Run an optional evidence-gathering phase between Think and Plan. Produce implementation inputs, not code or a task breakdown.

## Workflow

Track and complete these steps in order:

```text
Research Progress:
- [ ] 1. Load Think context
- [ ] 2. Inspect project evidence
- [ ] 3. Define research questions
- [ ] 4. Research current primary sources
- [ ] 5. Compare options against project constraints
- [ ] 6. Verify claims and uncertainty
- [ ] 7. Save COR Research Handoff
```

### 1. Load Think context

Extract goal, constraints, scope boundaries, risks, and acceptance criteria from current conversation. If no completed Think context exists, stop and direct user to `cor-think`; do not substitute technical research for functional discovery.

### 2. Inspect project evidence

Before web research:

- Read relevant manifests and lockfiles to identify runtime and resolved dependency versions.
- Search existing code, tests, config, and architecture docs for current primitives and conventions.
- Inspect installed package typings, source, or bundled docs when available.
- Record platform, deployment, license, security, and compatibility constraints.

Do not propose a new dependency before checking whether platform, standard library, or an existing dependency fully covers need.

### 3. Define research questions

Turn unresolved implementation choices into bounded questions. Research only questions capable of changing plan. Typical scopes:

- maintained library selection;
- version-specific API availability or migration path;
- current architecture guidance for known constraints;
- standards, interoperability, performance, or security requirements.

### 4. Research current primary sources

Use live web or documentation tools. Prioritize sources in this order:

1. standards and official vendor/framework documentation;
2. package source, releases, changelog, support policy, and security advisories;
3. maintainer-authored design material;
4. peer-reviewed research or reproducible benchmarks;
5. reputable secondary analysis only for gaps or competing interpretations.

For libraries, verify latest stable release, release recency, supported runtimes, API status, maintenance signals, license, known advisories, and migration cost. Treat stars, downloads, and benchmark claims as signals, not proof.

### 5. Compare against project constraints

Evaluate only viable options. Prefer, in order:

1. existing platform or language primitive;
2. maintained API from an installed dependency;
3. maintained new dependency with clear project fit;
4. custom implementation only when prior options do not fully cover need.

Give one default recommendation and at most one escape hatch. Explain rejection of plausible alternatives. Do not produce an unranked catalogue.

### 6. Verify claims

- Cite source URL for every external claim that affects recommendation.
- Include exact applicable version or date when behavior is version-sensitive.
- Cross-check consequential claims with another independent primary source when available.
- Separate sourced facts, project inference, and recommendation.
- Mark unresolved or conflicting evidence explicitly. Never fill gaps from model memory.

### 7. Save handoff

Create `.cor/research_<slug>.md`, using a concise 2–3 word slug. If same path exists, ask before overwriting. Use this exact structure:

```markdown
# COR Research — [topic]

## Decision summary
- Recommended approach: ...
- Why it fits this project: ...
- Confidence: HIGH | MEDIUM | LOW

## Project evidence
- Goal inherited from Think: ...
- Scope boundaries: ...
- Acceptance criteria: ...
- Resolved versions: ...
- Existing usages and primitives: `path/to/file:line`
- Constraints inherited from Think: ...

## Findings
| Claim | Evidence | Applicability |
| --- | --- | --- |
| ... | [Primary source](URL) | ... |

## Options considered
| Option | Fit | Maintenance / risk | Decision |
| --- | --- | --- | --- |
| ... | ... | ... | ADOPT / FALLBACK / REJECT |

## Plan inputs
- Components or files likely affected: ...
- Version-specific APIs or migration steps: ...
- New dependency and version policy, if any: ...
- Risks and mitigations: ...
- Validation and test implications: ...
- Decisions cor-plan must preserve: ...

## Unresolved questions
- None | ...

## Sources
- [Title](URL), accessed YYYY-MM-DD
```

Report saved path. Tell user to run `cor-plan`. Do not edit production code, install dependencies, or create implementation tasks.

## Quality gates

Do not complete handoff unless:

- every recommendation maps to Think constraint or acceptance criterion;
- resolved versions and existing project primitives were checked;
- decisive claims have current citations;
- recommendation states trade-offs and rejected alternatives;
- plan inputs are concrete enough to avoid repeating research.
