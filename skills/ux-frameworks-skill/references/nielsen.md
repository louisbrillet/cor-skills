# Nielsen's 10 Usability Heuristics

## Origin and method

Jakob Nielsen and Rolf Molich published the first version in 1990. Nielsen refined the final list in 1994, derived from a factor analysis of 249 usability problems — selecting the heuristics with the greatest explanatory power across that database. They have remained unchanged since 1994 because they target fundamental human-machine mismatches rather than specific UI technologies. The wording was lightly refined in 2020 by NN/g.

## How to run a heuristic evaluation

1. Recruit 3-5 evaluators (more produces diminishing returns; fewer misses too much).
2. Each evaluator walks through the interface independently, flagging violations against the 10 heuristics.
3. Each finding is rated on Nielsen's severity scale:
   - **0** — not a usability problem
   - **1** — cosmetic only (fix if time permits)
   - **2** — minor (low priority)
   - **3** — major (high priority, fix before release)
   - **4** — catastrophe (must fix before release)
4. Evaluators consolidate findings, deduplicate, and prioritize by severity × frequency.

Three evaluators typically catch around 60% of the issues a full study would find — at a fraction of the cost.

## The 10 heuristics

### 1. Visibility of system status
The system should always keep users informed about what is going on, through appropriate feedback within reasonable time.
**Examples:** loading spinners, progress bars, "saving…" indicators, hover states, breadcrumbs showing position in a flow.
**Common violations:** silent operations, button click with no feedback, file uploads with no progress indication.

### 2. Match between system and the real world
Speak the user's language — words, phrases, concepts familiar to the user, not system-oriented terms. Follow real-world conventions; information appears in natural and logical order.
**Examples:** the trash can icon for deletion, "envelope" for messaging, calendar metaphors for date pickers.
**Common violations:** technical jargon ("invalid token"), unfamiliar metaphors, non-standard sort orders.

### 3. User control and freedom
Users often perform actions by mistake — they need a clearly marked emergency exit. Support undo and redo.
**Examples:** undo, redo, cancel, "back" buttons that actually go back, escape from modals.
**Common violations:** irreversible destructive actions without confirmation, modals with no close button, forms that lose data on accidental navigation.

### 4. Consistency and standards
Users should not have to wonder whether different words, situations, or actions mean the same thing. Follow platform and industry conventions.
**Examples:** "Cancel" and "OK" in conventional positions, consistent iconography, same actions producing same results across the product.
**Common violations:** inconsistent terminology ("Save" vs. "Submit" vs. "Send" for the same action), buttons that move position between similar pages.

### 5. Error prevention
Eliminate error-prone conditions or check for them and present users with a confirmation option before they commit to the action. Better than good error messages.
**Examples:** confirmation dialogs for destructive actions, smart defaults, constrained inputs (date pickers vs. free-text dates), inline validation as the user types.
**Common violations:** "Delete account" with no confirmation, forms that only validate on submit, dropdowns that allow free text where the field requires a constrained value.

### 6. Recognition rather than recall
Minimize the user's memory load by making elements, actions, and options visible. Users should not have to remember information from one part of the interface to another.
**Examples:** visible menus, autocomplete, recently used items, breadcrumbs, persistent navigation.
**Common violations:** command-line-like interfaces requiring memorized syntax, hidden navigation that forces users to recall paths, IDs the user must transcribe between screens.

### 7. Flexibility and efficiency of use
Accelerators — unseen by the novice user — may speed up interaction for the expert. Allow users to tailor frequent actions.
**Examples:** keyboard shortcuts, command palettes, customizable dashboards, macros, gesture shortcuts on mobile.
**Common violations:** no keyboard shortcuts in productivity apps, no way to save filters or views, no customization for power users.

### 8. Aesthetic and minimalist design
Interfaces should not contain irrelevant or rarely needed information. Every extra unit of information competes with the relevant units of information.
**Note:** This is not a mandate for flat or sparse design — it's about eliminating noise that doesn't serve the user's task.
**Examples:** clean dashboards that surface only relevant KPIs, search-first interfaces that hide options until needed.
**Common violations:** every-feature-on-screen at once, decorative elements that compete with content, marketing copy mixed into functional UI.

### 9. Help users recognize, diagnose, and recover from errors
Error messages in plain language (no codes), precisely indicating the problem, and constructively suggesting a solution. Use visual treatments (bold, red text) to help users notice them.
**Examples:** "We couldn't reach the server. Check your connection and try again." with a retry button. Field-level validation pointing to the exact problem.
**Common violations:** "Error 0x80004005" with no plain-language explanation, errors that flash and disappear, errors that don't indicate which field is wrong.

### 10. Help and documentation
Even if ideally unnecessary, help should be searchable, focused on the user's task, list concrete steps, and stay concise.
**Examples:** contextual tooltips, in-product walkthroughs, searchable help center, inline links to relevant docs from error messages.
**Common violations:** PDF user manuals, help that's just a marketing site, no in-product guidance for non-obvious features.

## Limits — what Nielsen doesn't cover

The 10 heuristics underweight:
- **Accessibility** — covered by WCAG and Morville's "accessible" facet.
- **Credibility / trust** — covered by Morville's "credible" facet.
- **Findability beyond the interface** — covered by Morville's "findable" facet (SEO, discoverability).
- **Emotional / desirability dimensions** — covered by Morville's "desirable" facet.

When running a Nielsen evaluation, explicitly note these gaps if relevant — and pair with Morville's honeycomb for fuller coverage.

## How Nielsen's heuristics fit the other frameworks

- **Garrett:** Nielsen operates primarily at the *skeleton* and *surface* planes. A Nielsen violation can have its root cause at *structure* (information architecture), *scope* (missing features), or even *strategy* (misaligned goals).
- **Morville:** Nielsen's heuristics roughly fill out the "usable" facet of the honeycomb.
- **Gestalt/PARC:** Nielsen's heuristic #4 (consistency) and #8 (minimalism) are partially expressions of Gestalt similarity, proximity, and figure/ground.
- **Yablonski:** Nielsen #6 (recognition over recall) is essentially Miller's Law in heuristic form. Nielsen #4 (consistency) is Jakob's Law. Nielsen #2 (match real world) is Past Experience (Gestalt) plus Jakob's Law.
