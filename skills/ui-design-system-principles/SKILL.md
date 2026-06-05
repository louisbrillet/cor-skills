---
name: ui-design-system-principles
description: "Apply professional UI design system principles to any frontend output — React components, HTML pages, dashboards, data visualizations, charts, or interactive artifacts. Use this skill whenever generating any visual interface, styled component, color palette, typography system, layout, chart, data visualization, or design token structure. Trigger on ANY frontend/UI creation task, even if the user doesn't mention 'design system' explicitly. This includes: building components, pages, apps, dashboards, forms, cards, landing pages, widgets, charts, graphs, data tables, or any visual artifact. Also trigger when the user asks to 'make it look better', 'improve the design', 'fix the styling', or 'apply good UI principles'. This skill ensures every visual output follows systematic, accessible, and scalable design foundations regardless of the specific color palette, chart type, or visual style chosen."
status: beta
stability: experimental
---

# UI Design System Principles

This skill encodes professional UI design system best practices extracted from industry-standard methodology. Apply these principles to EVERY frontend output to ensure consistency, accessibility, and visual quality.

**When this skill triggers, read and apply the relevant sections below before writing any CSS, choosing any colors, or defining any layout.**

---

## 0. Agent Execution Protocol (Required)

When this skill is active, follow this order of operations:

1. **Audit first**: identify existing tokens, component primitives, and current typography stack before proposing visual changes.
2. **Token-first decisions**: adjust semantic tokens (`--background`, `--border`, `--primary`, etc.) before patching one-off component colors.
3. **Primitive pass**: improve core primitives (`Button`, `Input`, `Dialog`, etc.) before touching page-level components.
4. **Feature pass**: update screens/components that consume those primitives.
5. **Validation pass**: run project checks and verify hover/focus/disabled states plus responsive behavior.

If a request conflicts with earlier design choices (e.g., font preference), prioritize the latest explicit user preference and update tokens/primitives accordingly.

### cor-design scoring authority

When `cor-design` is active, this skill is the primary UI scoring rubric. Use it to assess variants against:

- `Clarity`
- `Hierarchy`
- `Actionability`
- `Consistency`
- `Accessibility`
- `Responsiveness`
- `Visual Distinctiveness`

Do not replace this rubric with free-form taste judgments.

### Assessment mode (for variant evaluation)

When evaluating variants (not generating them), output per criterion:

- score (`1` to `5`)
- confidence (`High`, `Medium`, `Low`)
- one-line rationale
- uncertainty flag if evidence is weak

Evidence must be grounded in rendered UI checks, explicit rubric checks, and deterministic token/component/state checks.

---

## 1. Design Token Architecture

Design tokens are the smallest building blocks of a visual system. They replace hard-coded values with semantic, reusable names. Always structure your values as tokens, even in one-off artifacts.

### Token Hierarchy (from broad to specific)

```
Raw value    →  #FA4083           (never use directly in components)
Global       →  pink-500          (context-agnostic, "what it is")
Alias        →  color-cta         (purpose-driven, "what it does")
Component    →  color-button-bg   (scoped to one component)
```

**Rules:**

- Never apply raw hex/rgb values directly to components. Always assign them to a named token first (CSS custom property, Tailwind config, or JS constant).
- Global tokens use literal naming: `blue-50` (lightest) through `blue-900` (darkest).
- Alias/semantic tokens describe purpose: `color-primary`, `color-danger`, `color-surface`, `color-text-secondary`.
- Component tokens inherit from alias tokens: `color-button-primary-bg` references `color-primary`.
- When theming (light/dark), keep token names identical; only raw values change.
- For small projects, alias tokens are sufficient. Add component tokens only when the system has 10+ components.

### Naming Convention

Use a consistent structure: `{category}-{element}-{variant}-{property}-{state}`

Examples:

- `color-text-primary` — category: color, element: text, variant: primary
- `spacing-card-padding` — category: spacing, element: card, property: padding
- `font-size-heading-lg` — category: font-size, element: heading, variant: lg

Names must be: meaningful, logical, modular, and consistent. If another developer can guess the token name, the naming is good.

---

## 2. Color System

### Palette Structure

Every palette needs these categories:

- **Primary**: The brand/accent color. Used on interactive elements (buttons, links, inputs). Blue is the safest default if no brand exists.
- **Secondary**: A complementary accent. Optional for small projects.
- **Neutral**: Grays for text, backgrounds, borders, dividers. This is the most-used category.
- **Feedback/Semantic**: Success (green), Warning (amber/yellow), Error/Danger (red), Info (blue). Each needs its own tint scale.

### Tint & Shade Scale

Generate 10 steps per color: `50, 100, 200, 300, 400, 500, 600, 700, 800, 900` where 50 is lightest and 900 is darkest. The 500 step is typically the base color.

**Limit actively used shades to 6–10 per color.** Having 50 grays creates a paradox of choice. Assign intentional roles:

- `neutral-900` → headings
- `neutral-600/500` → secondary/body text
- `neutral-300/200` → borders, dividers
- `neutral-50/00` → backgrounds
- In dark mode: `neutral-400` → secondary text, invert the surface/text mapping

**For feedback colors** (alerts, toasts, status), use darkest shade (900) for text and lightest shade (50) for background within the same hue to ensure contrast.

### Accessibility (WCAG 2)

**Non-negotiable contrast ratios:**

- Normal text (< 18px / < 14px bold): minimum **4.5:1** (AA), target **7:1** (AAA)
- Large text (≥ 18px / ≥ 14px bold): minimum **3:1** (AA), target **4.5:1** (AAA)
- UI components and graphical objects: minimum **3:1** (AA)

**Always verify** text-on-background contrast. Use relative luminance calculation or a contrast checker. When in doubt, increase contrast.

**Don't rely solely on color** to convey meaning. Use icons, text labels, patterns, or shapes alongside color cues (critical for colorblind users).

### Dark Mode

- Don't simply invert colors. Map semantic tokens to different global token values.
- Use slightly desaturated primary colors to reduce eye strain.
- Surface hierarchy: use lighter grays for elevated surfaces (cards on background), not darker ones.
- Avoid pure black (#000000) backgrounds; use very dark gray (e.g., `neutral-900` ≈ #0f1115 to #1a1a2e) for softer contrast.

---

## 3. Typography System

### Typeface Selection

- **Prefer UI-oriented fonts** with large x-heights, consistent letterforms, and multiple weights. Sans-serif is the safe default for interfaces.
- Consider: personality, legibility at small sizes, available weights, language support, and web performance (loading time).
- A single well-chosen typeface with 3–4 weights covers most UI needs. Add a secondary display font only for headings if branding requires it.
- If no brand direction is provided, use a neutral UI-safe default (e.g., Inter).
- Keep mono fonts explicitly separate for code/paths/logs (`font-family-mono` token).

### Type Scale

- **Base size**: 16px (the universal default for body text — legible on screen).
- Aim for **~7 sizes** total. Fewer is better. Example scale: 12, 14, 16, 18, 20, 24, 32 (or extend to 40, 48 for hero/display).
- Sizes should feel distinct. If two sizes look almost the same, remove one.
- Define sizes in rem for accessibility (respects user browser settings). 1rem = 16px default.

### Line Height

- **Body copy**: multiply font size × **1.5** (e.g., 16px → 24px line height). Range: 1.4–2.0 depending on line length.
- **Headings**: tighter — multiply font size × **1.1–1.3** (e.g., 32px → 38px). Large text needs less relative spacing.
- **Rule of thumb**: the longer the line, the more line height you need. Short labels and buttons can use 1.0–1.2.

### Typography Tokens

Define a complete set:

```
font-family-base, font-family-heading (if different)
font-size-xs, font-size-sm, font-size-md, font-size-lg, font-size-xl, font-size-2xl, font-size-3xl
font-weight-regular (400), font-weight-medium (500), font-weight-semibold (600), font-weight-bold (700)
line-height-tight (1.2), line-height-normal (1.5), line-height-relaxed (1.75)
```

---

## 4. Spacing System

### Base Unit

Choose an even base unit: **4px** or **8px**. Avoid odd numbers (3, 5) because they make centering and alignment difficult (pixel-splitting).

- **4px base** → scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80 …
- **8px base** → scale: 8, 16, 24, 32, 40, 48, 64, 80, 96 …

The 4px base is more flexible (allows fine-grained control); 8px is simpler and sufficient for most interfaces.

### Spacing Tokens

Use T-shirt sizes for small systems, numerical multiples for larger ones:

| T-shirt | Numeric | 4px base |
| ------- | ------- | -------- |
| xxs     | 01      | 4px      |
| xs      | 02      | 8px      |
| sm      | 03      | 12px     |
| md      | 04      | 16px     |
| lg      | 06      | 24px     |
| xl      | 08      | 32px     |
| 2xl     | 12      | 48px     |
| 3xl     | 16      | 64px     |

### Usage Categories

- **Inner spacing** (padding within components): use smaller values (4–16px).
- **Stack spacing** (vertical gaps between elements): medium values (8–24px).
- **Layout spacing** (sections, page margins): larger values (32–80px+).
- **Inline spacing** (horizontal gaps, e.g., icon-to-text): smallest values (4–8px).

Be consistent: if a card uses 16px padding, all cards use 16px padding. If section gaps are 48px, all section gaps are 48px.

---

## 5. Layout & Grid

### Breakpoints

Standard responsive breakpoints:

- **Mobile**: < 478px (design at 375px or 360px)
- **Tablet**: 478px–1023px (design at 768px or 834px)
- **Desktop**: ≥ 1024px (design at 1280px or 1024px first, then adapt up)

**Design at smaller breakpoints first** (1280 or 1024 for desktop, not 1920). It's easier to expand than to compress.

### Grid Construction

1. **Start with the breakpoint width** (e.g., 1280px).
2. **Set margins**: Desktop web: 80–160px. Dashboard: 24–32px. Tablet: 32–40px. Mobile: 16–20px.
3. **Choose column count**: Desktop: 12 columns. Tablet: 8 columns. Mobile: 4 columns.
4. **Set gutter** (gap between columns): 16–32px is standard. Keep gutters consistent across breakpoints or scale down slightly on mobile.
5. **Content width**: for long-form text, cap at ~720px (65–75 characters per line is optimal for readability).

### Layout Principles

- Use **CSS Grid** or **Flexbox** — never floats for layout.
- Establish a clear **visual hierarchy**: size, weight, color, and position all signal importance.
- **Proximity principle**: related items should be closer together; unrelated items should have more space between them. The space between groups should be noticeably larger than the space within groups.
- **Alignment**: every element should align to at least one other element. Misalignment creates visual noise.

---

## 6. Component Design

### Hierarchy

Components follow a building-block hierarchy:

- **Core components** (atoms): the smallest indivisible units — icons, avatars, badges, labels, toggles, status dots, tooltips.
- **Compound components** (molecules): core components combined — buttons (icon + text), input fields (label + input + helper), cards (image + text + action).
- **Patterns** (organisms/sections): compound components assembled into functional groups — nav bars, forms, comment threads, data tables, hero sections.
- **Templates/Pages**: full page layouts composed of patterns.

### Component Checklist

Before building any component, define:

- **Sizes**: typically 3 (small ~32px, medium ~40–48px, large ~56px height for interactive elements).
- **States**: default, hover, focused, pressed/active, disabled. Each state should be visually distinct.
- **Variants**: primary (filled), secondary (outlined), tertiary/ghost (text-only). Possibly destructive (red).
- **Content flexibility**: does it handle long text? Missing optional elements (no icon)? Truncation?
- **Spacing**: use spacing tokens for internal padding and external margins.
- **Responsiveness**: how does it adapt across breakpoints?

### Button & Interactive Control Rules (Enforced)

- Clickable controls must use `cursor: pointer`; disabled controls must use `cursor: not-allowed`.
- Hover states must change at least **two signals** (e.g., color + shadow, or color + transform) to be clearly perceivable.
- Destructive actions must have a distinct red-tinted hover/active state, not a generic neutral hover.
- Use `gap` for icon/label spacing in buttons; avoid ad-hoc icon margin hacks (`mr-*`, `ml-*`) unless absolutely required.
- Keep icon-only controls visually balanced with dedicated size tokens (not text-button padding).
- Focus styles must remain visible regardless of hover state.

### Button Sizing Reference

| Size   | Height  | Padding (H) | Font size | Icon size |
| ------ | ------- | ----------- | --------- | --------- |
| Small  | 32px    | 12px        | 14px      | 16px      |
| Medium | 40-48px | 16-20px     | 16px      | 20px      |
| Large  | 56px    | 24px        | 18px      | 24px      |

---

## 7. Data Visualization & Charts

Apply the same token architecture to data visualizations:

### Color in Charts

- Use the primary palette for the main data series; secondary/accent for comparisons.
- **Never use more than 5–7 distinct colors** in a single chart. Beyond that, use pattern fills or grouping.
- Ensure each color in the chart passes **3:1 contrast** against its background.
- Avoid red/green only combinations (colorblind-unfriendly). Use blue/orange, or add patterns/shapes.
- For sequential data (low→high), use a single-hue gradient (light→dark).
- For categorical data, use distinct hues from the palette.

### Chart Typography

- Axis labels: use `font-size-xs` or `font-size-sm` (12–14px), `neutral-500/600`.
- Chart title: `font-size-lg` (18–20px), `font-weight-semibold`, `neutral-900`.
- Data labels: `font-size-xs` (12px), positioned to avoid overlap.
- Legends: `font-size-sm` (14px), positioned outside the chart area.

### Chart Spacing

- Padding around the chart area: 16–24px.
- Space between legend and chart: 12–16px.
- Bar spacing in bar charts: bar width ≥ gap width (avoid sparse-looking charts).

---

## 8. Shadows & Elevation

Use shadows to create depth hierarchy. Define 3–5 elevation levels:

```
shadow-sm:  0 1px 2px rgba(0,0,0,0.05)                          → subtle lift (cards at rest)
shadow-md:  0 4px 6px -1px rgba(0,0,0,0.1)                      → moderate lift (dropdowns, popovers)
shadow-lg:  0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)  → high lift (modals, dialogs)
shadow-xl:  0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04) → floating elements
```

- Higher elevation = larger blur, larger offset, slightly more opacity.
- In dark mode, reduce shadow opacity significantly or use lighter outlines/borders instead.

---

## 9. Border & Radius

- **Border radius tokens**: `radius-none (0)`, `radius-sm (4px)`, `radius-md (8px)`, `radius-lg (12px)`, `radius-xl (16px)`, `radius-full (9999px)`.
- Use **consistent radius** across similar components. If buttons use 8px, inputs should also use 8px.
- Cards and containers typically use 8–16px radius.
- Badges and pills use `radius-full`.
- **Border width**: 1px for subtle dividers, 2px for focused/active states.
- **Border color**: use `neutral-200` (light mode) / `neutral-700` (dark mode) for default borders.

### Surface Separation Tuning

- If a container border looks too weak, darken the semantic border token (or use a stronger alias token) before introducing arbitrary local colors.
- If the page feels too heavy/dark, lighten the semantic background token first (`background` alias), then re-check card contrast.
- Prefer subtle global token calibration over repeated per-component overrides.

---

## 10. Interaction & Motion

- Transitions should use **150–300ms** duration. Under 150ms feels instant; over 300ms feels sluggish.
- Use **ease-out** for elements entering, **ease-in** for elements leaving, **ease-in-out** for state changes.
- Hover transitions: 150ms for color changes, 200ms for transforms.
- Don't animate layout properties (width, height, top, left) if possible — use `transform` and `opacity` for performance.
- Respect `prefers-reduced-motion`: disable non-essential animations.

---

## 11. Tailwind CSS & shadcn/ui Integration

When the output uses **Tailwind CSS** or **shadcn/ui**, read `references/tailwind-shadcn.md` before writing code. It contains:

- Complete `tailwind.config.js` mapping (colors, spacing, fontSize, borderRadius, boxShadow)
- Skill principle → Tailwind utility cheat sheet (every token to its `class` equivalent)
- Dark mode class patterns with correct shade shifts (500→400 for primary)
- Breakpoint mapping (skill breakpoints → Tailwind `md:` / `lg:` / `xl:` prefixes)
- Button component examples at all 3 sizes with full state coverage
- Alert components using the feedback color pattern (900 text on 50 bg)
- shadcn CSS variable mapping (`--primary`, `--muted`, `--destructive`, etc.) in HSL format
- shadcn dark theme variables with correct desaturation
- How to extend shadcn with success/warning/info feedback colors
- shadcn variant → skill variant mapping (default, secondary, outline, ghost, destructive)
- shadcn size → skill size mapping (sm=32px, default=40px, lg=44px)
- Chart color variables following the 5-color-max rule with colorblind-safe hues
- Card layout example with correct spacing token application

---

## Application Checklist

Before delivering any visual output, verify:

- [ ] Colors use semantic tokens (not raw hex in component styles)
- [ ] Text contrast passes WCAG AA (4.5:1 normal text, 3:1 large text)
- [ ] Typography uses a defined scale (not arbitrary pixel values)
- [ ] Spacing follows the base unit grid (multiples of 4 or 8)
- [ ] Interactive elements have visible hover/focus/active states
- [ ] Interactive controls use correct cursor semantics (`pointer` / `not-allowed`)
- [ ] Buttons use `gap`-based icon spacing (no scattered manual icon margins)
- [ ] Destructive controls use explicit red-tinted hover/active feedback
- [ ] Layout uses responsive patterns (flexbox/grid, not fixed widths)
- [ ] Component sizes are consistent (buttons, inputs, cards follow the same height system)
- [ ] Shadows/elevation are used consistently and sparingly
- [ ] Dark mode considerations are addressed if relevant
- [ ] Chart colors are distinguishable and accessible
