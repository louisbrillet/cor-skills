# How to explore UI directions

Settle a visual direction before planning UI work.

1. Run `cor-design` (`/cor:design`).
2. Answer the required inputs: design context (`greenfield` or `brownfield`), target scope (`shell`, `core screen`, or both), constraints, and iteration mode (`manual` by default).
3. Lock the brief. Variants are not generated before that.
4. Open the generated variants in `.cor/design-lab/` (`index.html` with a switcher, or `style-a.html`, `style-b.html`, `style-c.html`).
5. Review the scorecard, then confirm or override the narrowing decision.
6. Pass the hand-off package to `cor-plan`.

`cor-design` uses the `ui-design-system-principles` and `ux-frameworks` skills for scoring and finalist cross-check.
