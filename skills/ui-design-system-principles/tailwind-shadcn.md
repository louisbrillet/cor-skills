## 11. Tailwind CSS Integration

The skill's token system maps directly to Tailwind's architecture. Use this reference to translate principles into Tailwind utilities and config.

### Token → Tailwind Config Mapping

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      // GLOBAL TOKENS → colors object (50–900 scale is native)
      colors: {
        primary: {
          50:  '#eff6ff',  // background tints, hover fills
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',  // base — buttons, links, active states
          600: '#2563eb',  // hover on primary buttons
          700: '#1d4ed8',  // pressed/active state
          800: '#1e40af',
          900: '#1e3a8a',  // darkest — text on light primary bg
        },
        neutral: {
          50:  '#f9fafb',  // page background
          100: '#f3f4f6',  // card background, subtle fill
          200: '#e5e7eb',  // borders, dividers
          300: '#d1d5db',  // disabled borders
          400: '#9ca3af',  // placeholder text, dark-mode secondary text
          500: '#6b7280',  // secondary text (light mode)
          600: '#4b5563',  // body text
          700: '#374151',  // strong body text
          800: '#1f2937',  // headings
          900: '#111827',  // highest contrast text
        },
        // Feedback/semantic — same 50–900 structure
        success: { 50: '#f0fdf4', 500: '#22c55e', 900: '#14532d' },
        warning: { 50: '#fffbeb', 500: '#f59e0b', 900: '#78350f' },
        danger:  { 50: '#fef2f2', 500: '#ef4444', 900: '#7f1d1d' },
      },

      // SPACING TOKENS → Tailwind spacing scale (already 4px-based)
      // Tailwind's default: 1=4px, 2=8px, 3=12px, 4=16px, 6=24px, 8=32px...
      // Extend only if you need custom steps:
      spacing: {
        '4.5': '1.125rem', // 18px — if you need a half step
        '13':  '3.25rem',  // 52px
        '15':  '3.75rem',  // 60px
      },

      // TYPOGRAPHY TOKENS
      fontSize: {
        'xs':   ['0.75rem',  { lineHeight: '1rem' }],     // 12px
        'sm':   ['0.875rem', { lineHeight: '1.25rem' }],   // 14px
        'base': ['1rem',     { lineHeight: '1.5rem' }],    // 16px — body
        'lg':   ['1.125rem', { lineHeight: '1.75rem' }],   // 18px
        'xl':   ['1.25rem',  { lineHeight: '1.75rem' }],   // 20px
        '2xl':  ['1.5rem',   { lineHeight: '2rem' }],      // 24px
        '3xl':  ['2rem',     { lineHeight: '2.25rem' }],   // 32px — heading
        '4xl':  ['2.5rem',   { lineHeight: '2.75rem' }],   // 40px — hero
      },

      // BORDER RADIUS TOKENS
      borderRadius: {
        'none': '0',
        'sm':   '0.25rem',   // 4px
        'md':   '0.5rem',    // 8px — buttons, inputs
        'lg':   '0.75rem',   // 12px — cards
        'xl':   '1rem',      // 16px — large containers
        'full': '9999px',    // pills, avatars
      },

      // SHADOW/ELEVATION TOKENS
      boxShadow: {
        'sm':  '0 1px 2px rgba(0,0,0,0.05)',
        'md':  '0 4px 6px -1px rgba(0,0,0,0.1)',
        'lg':  '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)',
        'xl':  '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04)',
      },
    },
  },
}
```

### Skill Principle → Tailwind Utility Cheat Sheet

| Skill principle | Tailwind utility | Example |
|---|---|---|
| Base font 16px | `text-base` | Body text |
| Heading line-height 1.2 | `leading-tight` | `<h1 class="text-3xl leading-tight">` |
| Body line-height 1.5 | `leading-normal` | `<p class="text-base leading-normal">` |
| Spacing-md (16px) padding | `p-4` | Card inner padding |
| Spacing-lg (24px) gap | `gap-6` | Stack spacing between cards |
| Spacing-xl (32px) section gap | `py-8` | Section vertical padding |
| Neutral-200 border | `border-neutral-200` | Dividers, card borders |
| Neutral-600 body text | `text-neutral-600` | Secondary body copy |
| Neutral-900 heading | `text-neutral-900` | Page titles |
| 8px radius (buttons/inputs) | `rounded-md` | Interactive elements |
| 12px radius (cards) | `rounded-lg` | Card containers |
| Shadow-sm (resting card) | `shadow-sm` | Card default state |
| Shadow-md (hover/dropdown) | `shadow-md` | Card hover, popover |
| 150ms hover transition | `transition-colors duration-150` | Button color change |
| Focus ring | `focus-visible:ring-2 ring-primary-500 ring-offset-2` | All interactive elements |
| Disabled state | `disabled:opacity-50 disabled:cursor-not-allowed` | Buttons, inputs |

### Dark Mode Pattern

```html
<!-- Token-based dark mode: same semantic class, different raw values -->
<div class="bg-neutral-50 dark:bg-neutral-900
            text-neutral-900 dark:text-neutral-50
            border-neutral-200 dark:border-neutral-700">
  <h2 class="text-neutral-800 dark:text-neutral-100">Title</h2>
  <p class="text-neutral-600 dark:text-neutral-400">Body text</p>
  <button class="bg-primary-500 hover:bg-primary-600
                  dark:bg-primary-400 dark:hover:bg-primary-300
                  text-white dark:text-neutral-900">
    Action
  </button>
</div>
```

Note: in dark mode, primary colors shift lighter (400 instead of 500) and are slightly desaturated to reduce eye strain.

### Tailwind Breakpoints

| Skill breakpoint | Tailwind prefix | Design width |
|---|---|---|
| Mobile (default) | (none) | 375px |
| Tablet | `md:` (768px) | 768px |
| Desktop | `lg:` (1024px) | 1280px |
| Wide | `xl:` (1280px) | 1440px |

Mobile-first: write base styles for mobile, then layer `md:` and `lg:` overrides.

### Component Example: Button with Full Token Mapping

```html
<!-- Small -->
<button class="h-8 px-3 text-sm rounded-md font-medium
               bg-primary-500 text-white
               hover:bg-primary-600 active:bg-primary-700
               focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
               disabled:opacity-50 disabled:cursor-not-allowed
               transition-colors duration-150">
  Button
</button>

<!-- Medium (default) -->
<button class="h-10 px-4 text-base rounded-md font-medium
               bg-primary-500 text-white
               hover:bg-primary-600 active:bg-primary-700
               focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
               disabled:opacity-50 disabled:cursor-not-allowed
               transition-colors duration-150">
  Button
</button>

<!-- Large -->
<button class="h-14 px-6 text-lg rounded-md font-medium
               bg-primary-500 text-white
               hover:bg-primary-600 active:bg-primary-700
               focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
               disabled:opacity-50 disabled:cursor-not-allowed
               transition-colors duration-150">
  Button
</button>
```

### Alert Component: Feedback Color Usage

```html
<!-- Success alert: 900 text on 50 background (high contrast within hue) -->
<div class="bg-success-50 border border-success-200 text-success-900 rounded-lg p-4">
  <strong>Success:</strong> Your changes have been saved.
</div>

<!-- Danger alert -->
<div class="bg-danger-50 border border-danger-200 text-danger-900 rounded-lg p-4">
  <strong>Error:</strong> Something went wrong.
</div>

<!-- Warning alert -->
<div class="bg-warning-50 border border-warning-200 text-warning-900 rounded-lg p-4">
  <strong>Warning:</strong> This action cannot be undone.
</div>
```

---

## 12. shadcn/ui Integration

shadcn/ui uses CSS custom properties (HSL format) as its token layer, mapping perfectly to the skill's alias token tier.

### Skill Tokens → shadcn CSS Variables

```css
/* globals.css — Light theme (shadcn convention uses HSL without hsl() wrapper) */
@layer base {
  :root {
    /* ── Surface tokens ── */
    --background:      210 40% 98%;      /* neutral-50  → page bg */
    --foreground:       222 47% 11%;      /* neutral-900 → primary text */
    --card:             0 0% 100%;        /* white → card surface */
    --card-foreground:  222 47% 11%;      /* neutral-900 → card text */
    --muted:            210 40% 96%;      /* neutral-100 → subtle fills */
    --muted-foreground: 215 16% 47%;      /* neutral-500 → secondary text */

    /* ── Interactive tokens (alias layer) ── */
    --primary:            222 47% 51%;    /* primary-500 → buttons, links */
    --primary-foreground: 210 40% 98%;    /* white on primary */
    --secondary:          210 40% 96%;    /* neutral-100 → secondary buttons */
    --secondary-foreground: 222 47% 11%;  /* text on secondary */
    --accent:             210 40% 96%;    /* hover/active fills */
    --accent-foreground:  222 47% 11%;

    /* ── Feedback tokens ── */
    --destructive:            0 84% 60%;  /* danger-500 */
    --destructive-foreground: 0 0% 98%;

    /* ── Border & input ── */
    --border: 214 32% 91%;               /* neutral-200 */
    --input:  214 32% 91%;               /* same as border for inputs */
    --ring:   222 47% 51%;               /* primary-500 → focus ring */

    /* ── Radius (from skill section 9) ── */
    --radius: 0.5rem;                     /* 8px — md, for buttons & inputs */
  }

  .dark {
    --background:      222 47% 7%;       /* neutral-950 → dark bg (not pure black) */
    --foreground:      210 40% 98%;      /* neutral-50  → light text */
    --card:             222 47% 11%;      /* neutral-900 → elevated surface */
    --card-foreground:  210 40% 98%;
    --muted:            217 33% 17%;      /* neutral-800 → subtle fill */
    --muted-foreground: 215 20% 65%;      /* neutral-400 → secondary text */

    --primary:            213 94% 68%;    /* primary-400 → lighter for dark bg */
    --primary-foreground: 222 47% 11%;    /* dark text on light primary */
    --secondary:          217 33% 17%;
    --secondary-foreground: 210 40% 98%;

    --destructive:            0 63% 55%;  /* slightly desaturated in dark */
    --destructive-foreground: 0 0% 98%;

    --border: 217 33% 25%;               /* neutral-700 */
    --input:  217 33% 25%;
    --ring:   213 94% 68%;               /* primary-400 */
  }
}
```

### Mapping Guide: Skill Token → shadcn Variable

| Skill token | shadcn variable | Usage |
|---|---|---|
| `color-surface` / `neutral-50` | `--background` | Page background |
| `color-text-primary` / `neutral-900` | `--foreground` | Primary text |
| `color-primary-500` | `--primary` | Buttons, links, active indicators |
| `color-text-on-primary` | `--primary-foreground` | Text on primary buttons |
| `color-surface-subtle` / `neutral-100` | `--muted` | Subtle backgrounds, hover fills |
| `color-text-secondary` / `neutral-500` | `--muted-foreground` | Helper text, labels, placeholders |
| `color-danger-500` | `--destructive` | Delete buttons, error states |
| `color-border` / `neutral-200` | `--border` | All borders, dividers |
| `color-primary-500` (focus) | `--ring` | Focus ring color |
| `radius-md` (8px) | `--radius` | Default border radius |

### shadcn Component Variant Mapping

The skill's component checklist (sizes, states, variants) maps to shadcn's variant system:

```tsx
// Skill variants → shadcn Button variants
<Button variant="default">    // primary (filled) → bg-primary text-primary-foreground
<Button variant="secondary">  // secondary (subtle) → bg-secondary text-secondary-foreground
<Button variant="outline">    // outlined → border border-input bg-background
<Button variant="ghost">      // tertiary/ghost → hover:bg-accent
<Button variant="destructive"> // destructive → bg-destructive text-destructive-foreground
<Button variant="link">       // text-only link style

// Skill sizes → shadcn Button sizes
<Button size="sm">      // h-8 px-3 text-sm   → skill: Small (32px)
<Button size="default"> // h-10 px-4 text-sm  → skill: Medium (40px)
<Button size="lg">      // h-11 px-8 text-base → skill: Large (44px)
```

### Extending shadcn with Skill Principles

**Adding feedback colors** that shadcn doesn't include by default:

```css
:root {
  /* Extend shadcn with the skill's feedback palette */
  --success:            142 71% 45%;     /* success-500 */
  --success-foreground: 0 0% 98%;
  --warning:            38 92% 50%;      /* warning-500 */
  --warning-foreground: 0 0% 9%;         /* dark text on yellow */
  --info:               199 89% 48%;     /* info-500 */
  --info-foreground:    0 0% 98%;
}
```

**Alert component using skill's feedback color pattern** (900 text on 50 bg):

```tsx
// In your shadcn Alert variants, add:
const alertVariants = cva("...", {
  variants: {
    variant: {
      success: "bg-success/10 text-[hsl(var(--success))] border-success/20",
      warning: "bg-warning/10 text-[hsl(var(--warning))] border-warning/20",
      // destructive already exists in shadcn
    },
  },
})
```

### Chart Colors with shadcn + Recharts

shadcn includes chart color variables. Map them to the skill's data viz principles:

```css
:root {
  /* 5 chart colors max (skill rule: never >7 distinct colors) */
  --chart-1: 222 47% 51%;   /* primary — main data series */
  --chart-2: 160 60% 45%;   /* teal — secondary series */
  --chart-3: 30 80% 55%;    /* orange — tertiary (not red, for colorblind safety) */
  --chart-4: 280 65% 60%;   /* purple — quaternary */
  --chart-5: 200 18% 46%;   /* muted blue-gray — fifth series */
}
```

### shadcn Spacing & Layout Alignment

shadcn components use Tailwind spacing internally, so the skill's spacing system applies directly:

```tsx
// Card following skill spacing principles:
// - Card padding: spacing-lg (24px) → p-6
// - Internal stack gap: spacing-md (16px) → space-y-4
// - Card radius: radius-lg (12px) → rounded-lg from --radius
<Card className="p-6 rounded-lg shadow-sm">
  <CardHeader className="space-y-1.5 p-0">
    <CardTitle className="text-lg font-semibold text-foreground">Title</CardTitle>
    <CardDescription className="text-sm text-muted-foreground">Description</CardDescription>
  </CardHeader>
  <CardContent className="p-0 pt-4 space-y-4">
    {/* content */}
  </CardContent>
  <CardFooter className="p-0 pt-6 flex gap-3">
    <Button>Confirm</Button>
    <Button variant="outline">Cancel</Button>
  </CardFooter>
</Card>
```

---

