# Garrett's Five Planes of UX

## Origin

Jesse James Garrett, *The Elements of User Experience: User-Centered Design for the Web and Beyond* (2002, second edition 2010). Originally framed for web design, but the model generalizes to any digital product because it describes the *structure of design decisions*, not the medium.

## The core idea

A digital product is built across five layered planes, from abstract to concrete. Each plane depends on the one below it: surface depends on skeleton, which depends on structure, which depends on scope, which depends on strategy. When choices at one plane don't align with the planes below and above, projects derail.

The diagnostic power: when a problem surfaces at the visible layer, the root cause may live three or four planes deeper. A Nielsen violation at the surface might actually be a structure (IA) problem, a scope (missing feature) problem, or a strategy (misaligned goals) problem.

## The 5×2 matrix

Garrett also splits each plane along a second axis: **product as functionality** (software, task-oriented) vs. **product as information** (content-oriented). This produces a richer model:

| Plane | Functionality side | Information side |
|---|---|---|
| Surface | Visual design | Visual design |
| Skeleton | Interface design | Information design + navigation design |
| Structure | Interaction design | Information architecture |
| Scope | Functional specifications | Content requirements |
| Strategy | User needs + business objectives | User needs + business objectives |

Modern products are almost always hybrids — a SaaS app has both functionality and content sides, and the model accommodates both.

## The 5 planes (bottom-up)

### 1. Strategy (most abstract)
**Question answered:** Why does this product exist?
**Inputs:** user research, market analysis, business goals.
**Outputs:** strategic intent, KPIs, prioritized user needs, product vision.
**Failure mode:** Building a product nobody wants, or that the business can't sustain. Symptoms cascade through all upper layers but cannot be fixed at the upper layers.

### 2. Scope
**Question answered:** What gets built?
**Inputs:** strategy.
**Outputs (functionality):** functional specifications — features, behaviors, system rules.
**Outputs (information):** content requirements — what information must be present, in what format.
**Failure mode:** Feature creep (scope unbounded by strategy), or critical features missing because scope wasn't deliberately defined.

### 3. Structure
**Question answered:** How does it fit together conceptually?
**Inputs:** scope.
**Outputs (functionality):** interaction design — how users behave with the system, system responses, error handling, state transitions.
**Outputs (information):** information architecture — how content is organized, classified, related, navigable.
**Failure mode:** Users get lost, can't form a mental model of the system, or perform actions in unexpected sequences. Symptoms read as "confusing flow" but cannot be fixed by skeleton-level UI tweaks.

### 4. Skeleton
**Question answered:** How is it laid out?
**Inputs:** structure.
**Outputs:** wireframes and prototypes combining three sub-disciplines:
- **Interface design** — arrangement of UI elements that enable interaction with functionality
- **Navigation design** — screen elements that allow users to move through information
- **Information design** — presentation of information for comprehension
**Failure mode:** Users can't find the right control on a given screen, even though the screen contains it.

### 5. Surface (most concrete)
**Question answered:** What does it look and feel like?
**Outputs:** visual design — typography, color, imagery, layout polish, motion.
**Failure mode:** Visual hierarchy fails, brand feels off, accessibility contrast issues, sensory overload.

## How to use Garrett diagnostically

When a UX problem is reported, ask the diagnostic questions in order from surface down:

1. **Surface check:** Is this a visual hierarchy / contrast / typography issue? If yes, fix at surface.
2. **Skeleton check:** Is the right control present but in the wrong place, wrong size, or grouped wrong? If yes, fix at skeleton.
3. **Structure check:** Is the user unable to form a coherent mental model — getting lost in the IA, encountering unexpected state transitions? If yes, the fix is at structure (IA, interaction model). Skeleton tweaks won't help.
4. **Scope check:** Is the user trying to do something the product doesn't support, or finding content that should be there but isn't? If yes, fix at scope.
5. **Strategy check:** Is the user fundamentally not the user this product was designed for, or pursuing a goal that conflicts with the product's reason to exist? If yes, the fix is at strategy — and is by far the most expensive.

The expense of fixing a problem grows roughly exponentially the deeper its root cause. A misaligned strategy that is only diagnosed at launch can require rebuilding most of the product. This is why Garrett's planes are presented bottom-up: they argue for sequencing decisions in order of dependency.

## Key disclaimers

- **Not a waterfall.** Garrett notes the planes are dependent, not strictly sequential. Modern iterative practice cycles through all five in parallel, with feedback running both ways. The model is a *frame for diagnosis*, not a project plan.
- **Planes blur in practice.** The boundary between skeleton and surface is fuzzy. Information design lives partly in skeleton, partly in structure. Don't be precious about classification — use the model to surface the right diagnostic question.
- **Predates mobile.** Originally written about websites; the planes themselves generalize, but specific examples in the book reference web conventions of 2002.

## How Garrett fits the other frameworks

- **Nielsen:** Heuristics operate at skeleton + surface. A Nielsen violation can have its root cause anywhere from strategy upward.
- **Morville:** The honeycomb facets cut horizontally across all five planes — "useful" is a strategy concern, "findable" is a structure concern, "desirable" is a surface concern, "credible" lives across all five.
- **Gestalt/PARC:** Operate at the surface plane (and upper skeleton).
- **Yablonski:** Cuts across all planes. Hick's Law applies at scope (how many features?), structure (how many nav items?), skeleton (how many CTAs?), and surface (how many visual focal points?).
