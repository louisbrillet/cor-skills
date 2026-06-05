# Yablonski's Laws of UX

## Origin

Jon Yablonski. The website lawsofux.com launched in 2018; the book *Laws of UX: Using Psychology to Design Better Products & Services* was published by O'Reilly in 2020 (second edition 2024).

Yablonski's stated intent: make complex psychology research accessible to designers without behavioral science backgrounds. He didn't invent these laws — they're drawn from cognitive psychology, behavioral economics, HCI research, and information theory. His contribution is curation, plain-language explanation, and practical UX examples.

## How to use the laws

These are predictive heuristics, not laws of physics. They have known limits and exceptions. Use them to:
- **Predict** how users will respond to a design choice before testing.
- **Diagnose** why an existing design isn't performing.
- **Justify** design decisions to stakeholders who want grounded reasoning, not opinions.

Cite the specific law by name when applying it. "This violates Hick's Law because we're presenting 14 top-level navigation items" is more useful than "this menu has too many things."

## The 10 core laws (book chapters 1-10)

### 1. Jakob's Law
**Statement:** Users spend most of their time on *other* products. Therefore they expect *your* product to work like the ones they already know.
**Origin:** Named for Jakob Nielsen.
**Implication:** Convention is a usability accelerant. Novelty has a cognitive tax. Don't reinvent the navigation bar, the checkout flow, the password reset, the search interface. Reserve novelty for the dimensions where it actually creates user value.
**Caveat:** "Sameness" can homogenize a product into invisibility. Match conventions for *infrastructural* patterns; differentiate on the dimensions that constitute your value proposition.

### 2. Fitts's Law
**Statement:** The time to acquire a target is a function of the distance to and size of the target. Bigger and closer targets are faster to hit.
**Origin:** Paul Fitts, 1954, motor-skill research.
**UX implications:**
- Touch targets should be adequately sized (Apple recommends 44×44 pt; some sources cite 60×60 pt for primary actions).
- Spacing between targets prevents accidental selections (~8dp minimum on Android, similar on iOS).
- Position matters: edges and corners are infinite-target zones (the cursor can't overshoot), which is why macOS puts the menu bar at the screen edge and Windows puts the Start button in a corner.
- Pie menus and radial menus exploit equidistance from the cursor.

### 3. Hick's Law
**Statement:** Decision time grows logarithmically with the number of choices.
**Origin:** William Edmund Hick and Ray Hyman, 1952.
**UX implications:**
- More options → slower decisions → higher abandonment.
- Use progressive disclosure to hide complexity until needed.
- Provide sensible defaults so users don't have to choose unless they want to.
- Curate rather than exhaust: a curated short list of options usually outperforms a comprehensive but overwhelming one.
**Caveat:** Hick's Law predicts decision time for *unfamiliar*, *equally weighted* choices. Chunking, categorization, and clear visual hierarchy can flatten the apparent cost of more options. A power-user palette with 200 commands is fine if the user knows what they're looking for and can search.

### 4. Miller's Law
**Statement:** The average person can hold roughly 7 (±2) items in working memory.
**Origin:** George Miller, 1956 paper "The Magical Number Seven, Plus or Minus Two."
**UX implications:**
- Don't ask users to remember information from one screen to the next; show it instead (also Nielsen #6).
- Use **chunking** — Miller's actual contribution. Group information into meaningful units (phone numbers as 3-3-4, credit cards as 4-4-4-4).
**Caveat:** Subsequent research (Cowan, 2001) suggests the actual limit is closer to four (±1) for items not actively rehearsed. Miller's "magical seven" is a rule of thumb, not a hard ceiling. Navigation menus can have more than 7 items if structured well.

### 5. Postel's Law (Law of Robustness)
**Statement:** Be conservative in what you send, liberal in what you accept.
**Origin:** Jon Postel, RFC 760 (1980), originally a networking principle for TCP.
**UX implications:**
- Tolerate diverse, messy, inconsistent user input.
- Produce predictable, reliable output.
- Drives forgiving form validation (accept "(555) 123-4567", "555-123-4567", "5551234567" as the same phone number).
- Smart parsers for dates, times, addresses.
- Empathetic error recovery — assume the user meant something reasonable, not that they're wrong.

### 6. Peak-End Rule
**Statement:** People judge an experience by its emotional peak and its end, not by the average or the sum.
**Origin:** Daniel Kahneman, behavioral economics.
**UX implications:**
- The last screen of an onboarding, the moment of error recovery, and the highest moment of delight matter disproportionately to overall recalled satisfaction.
- A frustrating flow with a brilliant resolution is remembered more positively than a mediocre flow with a mediocre ending.
- Invest in the ending: confirmation screens, success states, post-purchase experience, offboarding.
**Caveat:** Cannot rescue a fundamentally broken experience — a good ending after extreme friction will not save retention. The rule applies to memory and satisfaction ratings, not to whether users complete the task in the first place.

### 7. Aesthetic-Usability Effect
**Statement:** Users perceive aesthetically pleasing designs as more usable than less attractive ones — even when actual usability is equivalent.
**Origin:** Masaaki Kurosu and Kaori Kashimura, 1995, Hitachi Design Center research on ATMs.
**UX implications:**
- Beauty buys cognitive forgiveness during the early-friction phase. Users are more patient with attractive designs.
- Visual quality affects perceived trust and credibility (overlaps with Morville's *credible* facet).
**Caveat:** This effect can mask real usability problems in user testing — people may report a beautiful but broken interface as "fine." Pair aesthetic design with rigorous usability metrics, not just satisfaction surveys.

### 8. Von Restorff Effect (Isolation Effect)
**Statement:** When multiple similar items are present, the one that differs is best remembered.
**Origin:** Hedwig von Restorff, 1933, memory research.
**UX implications:**
- Primary CTA emphasis: one prominent button, others muted.
- Brand-color accents on otherwise neutral palettes.
- "Most popular" or "recommended" tier in pricing tables.
- Highlighting selected state in lists or filters.
**Caveat:** Overuse defeats the effect. If three things are highlighted equally, none of them is the standout. Reserve emphasis for genuinely primary actions.

### 9. Tesler's Law (Law of Conservation of Complexity)
**Statement:** Every system has an irreducible amount of complexity. The only question is *who absorbs it* — the designer/engineer or the user.
**Origin:** Larry Tesler, while at Xerox PARC.
**UX implications:**
- The discipline of pushing complexity to the system side wherever possible.
- Hidden defaults, smart parsing, intelligent error correction: the engineering team absorbs the complexity so the user doesn't have to.
- Don't pretend complexity doesn't exist (oversimplified UI hiding power) — surface the right amount of it at the right time.
**Caveat:** Some complexity *should* be exposed to expert users (power tools, professional software). The principle is about ensuring complexity isn't accidentally pushed onto users; not that it can never be there.

### 10. Doherty Threshold
**Statement:** Productivity soars when computer response time drops below 400ms — user and system enter a kind of cognitive lockstep.
**Origin:** Walter Doherty and Arvind Thadani, IBM, 1982.
**UX implications:**
- Perceived performance optimization (skeleton screens, optimistic UI, animation to mask latency).
- Sub-100ms feedback for direct manipulation feels instantaneous.
- 400ms is the practical ceiling for "responsive-feeling" interactions; beyond this, productivity degrades sharply.
**Caveat:** Modern users have higher expectations than 1982 — for many interactions (search-as-you-type, typing latency), the threshold is now closer to 100ms.

## Additional principles often cited from lawsofux.com

These aren't book chapters, but appear on the website and in design discourse:

- **Pareto Principle (80/20)** — roughly 80% of effects come from 20% of causes. Use as a prioritization heuristic for which features to invest in.
- **Parkinson's Law** — work expands to fill the time available. Implication: shorter declared completion times shape user behavior; show shorter task estimates.
- **Serial Position Effect** — first and last items in a series are best remembered. Drives nav-item placement, CTA positioning at top and bottom of long pages.
- **Selective Attention** — users focus only on goal-relevant stimuli. Why banner blindness is real, why animated ads still get ignored, why content the user isn't looking for is invisible to them.
- **Chunking** — closely tied to Miller's Law. Group information into meaningful units to multiply effective memory capacity.
- **Occam's Razor** — among competing solutions, prefer the one with fewest assumptions. A design heuristic, not a law of nature.
- **Goal-Gradient Effect** — motivation increases as users get closer to a goal. Drives progress bars, "you're almost done" cues, completion celebrations.

## The ethics dimension

The book closes with a chapter explicitly dedicated to ethics. Yablonski's stance: the same psychological principles that make products intuitive also make them coercive. Knowing the laws creates an obligation to choose how you use them.

Patterns the book flags as ethically loaded:
- **Intermittent variable rewards** (slot-machine mechanics in social feeds)
- **Infinite loops** (autoplay, infinite scroll designed for engagement maximization)
- **Social affirmation** (likes, streaks, social pressure)
- **Defaults** (opt-out vs. opt-in for privacy-eroding settings)
- **Friction asymmetry** (frictionless signup, agonizing cancellation)
- **Reciprocity** (manufactured "free gifts" that create obligation)

The principle: when applying a Yablonski law, ask whose interest it serves. If the answer is "engagement metrics at the user's expense," the application is a dark pattern, regardless of its psychological grounding.

## How Yablonski fits the other frameworks

- **Nielsen:** Recognition over recall (#6) ↔ Miller's Law. Consistency (#4) ↔ Jakob's Law. Match real world (#2) ↔ Past Experience (Gestalt) + Jakob's Law. Visibility of system status (#1) ↔ Doherty Threshold.
- **Garrett:** Yablonski's laws operate at every Garrett plane. Hick's Law applies at scope (how many features?), structure (how many nav items?), skeleton (how many CTAs on a screen?), and surface (how many visual focal points?).
- **Morville:** Aesthetic-Usability Effect explains why *desirable* boosts perceived *usable*. Jakob's Law explains why familiar patterns feel more *credible*.
- **Gestalt/PARC:** Past Experience (Gestalt) is essentially Jakob's Law restated. Prägnanz aligns with the Aesthetic-Usability Effect (simpler forms feel both more beautiful and more usable). Figure/ground supports the Von Restorff effect.
