# Morville's UX Honeycomb

## Origin

Peter Morville, 2004. Morville is an information architect (co-author with Louis Rosenfeld of *Information Architecture for the World Wide Web*, sometimes called the "polar bear book"). The honeycomb was created to push UX thinking beyond pure usability — to articulate that a usable product can still fail because it isn't *worth* using.

The seven facets are arranged as hexagonal cells around a central facet (often "valuable") to suggest interconnection rather than hierarchy.

## Why it complements Nielsen

Nielsen's heuristics are inward-facing: *is the interface usable?*
Morville's honeycomb is outward-facing: *does this earn its place in the user's life?*

A product can pass every Nielsen heuristic and still fail Morville's "useful" or "valuable" tests. Conversely, a product can be useful, desirable, and credible while flunking specific Nielsen heuristics.

## The seven facets

### 1. Useful
**Question:** Does it solve a real problem? Does it meet a genuine need?
**Without this, nothing else matters.** A product that is the most usable, accessible, beautiful thing on the planet but addresses no real need will fail. This facet forces teams to constantly re-ask: *does this feature help users accomplish a goal they actually have?*
**Diagnostic signals of failure:** low adoption despite good usability scores, users describe the product as "nice but I don't see why I'd use it," features built but never used.

### 2. Usable
**Question:** Is it efficient and easy to operate?
This is where Nielsen's heuristics live within Morville's framing. Easy to learn, efficient for repeat tasks, low error rate, satisfying to use.
**Diagnostic signals of failure:** high task completion time, frequent errors, abandoned flows, support tickets about basic operation.

### 3. Findable
**Question:** Can users locate what they need — both *within* the product (navigation, search, IA) and *to reach* the product (discoverability in the wider information environment, SEO, app store presence)?
**Diagnostic signals of failure:** users can't find features they know exist, search returns irrelevant results, the product itself is hard to discover in its market.

### 4. Credible
**Question:** Do users trust the source? Trust the data? Trust their information will be handled responsibly?
Built through visible authorship, social proof, secure design cues, honest copy, transparent practices, and consistent reliability over time.
**Diagnostic signals of failure:** users hesitate at checkout / signup, brand has reputation problems, product feels "spammy" even when it isn't.

### 5. Accessible
**Question:** Is it usable by people across the full range of abilities and assistive technologies?
Morville treated accessibility as a first-class facet years before it became standard in mainstream UX vocabulary. Covers WCAG conformance, screen-reader support, keyboard navigation, motor and cognitive accommodations, multilingual support.
**Diagnostic signals of failure:** failed WCAG audits, exclusion of users with disabilities, regulatory risk (e.g., ADA litigation, European Accessibility Act).

### 6. Desirable
**Question:** Is it emotionally and aesthetically appealing? Does it generate positive affect?
Brand, voice, visual design, identity, delight. Not surface decoration — desirability is what makes users *prefer* this product over alternatives that are equally useful and usable.
**Diagnostic signals of failure:** low NPS despite good functional metrics, users describe the product as "fine" but never "love"; high churn to competitors with weaker functionality but stronger brand.

### 7. Valuable
**Question:** Does it deliver value to *both* the user and the business sponsoring the experience?
The synthesis facet. The other six are means; this is the end. A product that is useful, usable, findable, credible, accessible, and desirable but doesn't deliver business value will not be sustained — and a product that delivers business value at the user's expense will eventually erode the other six facets.
**Diagnostic signals of failure:** users are happy but the business loses money on every transaction, or the business is profitable through dark patterns that erode user trust.

## How to use the honeycomb

### As an audit checklist
For each facet, ask: *what evidence do we have that the product succeeds on this dimension?* If you can't produce evidence for a facet, it's a candidate for investigation.

### As a prioritization tool
When user research surfaces a complaint, locate it on the honeycomb:
- "I don't get why I'd use this" → useful problem
- "I can't figure out how to do X" → usable problem
- "I can't find it" → findable problem
- "I don't trust this site" → credible problem
- "I can't use this with my screen reader" → accessible problem
- "It feels generic" → desirable problem
- "It's costing us money" → valuable problem

Different facets demand different fixes. A useful problem requires product strategy work, not UI tweaks. A desirable problem requires brand/visual investment, not feature work.

### As a scoping argument
The honeycomb is useful for arguing against scope creep that strengthens one facet at another's cost. Adding features to be more *useful* can erode *usable* (complexity), *findable* (information overload), and *desirable* (visual clutter). The honeycomb forces explicit tradeoffs.

## How Morville fits the other frameworks

- **Nielsen:** The 10 heuristics flesh out the "usable" facet of the honeycomb. They don't substantially address the other six.
- **Garrett:** The honeycomb facets cut horizontally across all five Garrett planes. *Useful* is primarily a strategy concern. *Findable* lives at structure (IA). *Desirable* lives at surface (visual design). *Credible* lives across all five (strategic positioning, content, IA, visual treatment).
- **Gestalt/PARC:** Underpin "desirable" through visual cohesion; contribute to "usable" through clarity.
- **Yablonski:** The aesthetic-usability effect explains why "desirable" boosts perceived "usable." Jakob's Law explains why familiar patterns feel more "usable" and "credible."

## Limits

- **Vague boundaries.** Some real problems sit on the border between facets — a slow page is partly *usable*, partly *credible* (slow = unprofessional), partly *valuable* (poor conversion).
- **No prioritization built in.** The honeycomb doesn't tell you which facet to invest in first. Use it as a coverage check, not a roadmap.
- **"Valuable" is sometimes treated as the seventh peer facet, sometimes as the central synthesis cell.** Morville's original visualization placed valuable in the center, with the other six around it. Many later renditions arrange all seven as a flat hex grid. Either reading is defensible — be aware of which one a given diagram is using.
