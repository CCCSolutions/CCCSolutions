# CCCSolutions Design Refresh — Supabase-inspired System & Migration Plan

> **Audience:** the agent (or human) executing the CCCSolutions UI refresh in one shot.
> **Reference codebase:** `/Users/williamyang/Documents/GitHub/supabase` — primarily `packages/ui` and `packages/config`.
> **Target stack:** Next.js 15 + Tailwind CSS v4 + Radix UI primitives.
> **Source stack:** Next.js + Tailwind v3 + Radix primitives + shadcn/ui adapters on top.

---

## 0. Read this first — what we're doing and what we're not

CCCSolutions has had a UI refresh that didn't quite land. The site uses `@radix-ui/themes` (the styled component library) on top of Tailwind, and the two systems fight each other — that's why you see `!bg-white !text-blue-700` overrides in the hero. The site also leans on a saturated indigo gradient + a `min-h-screen` hero + a `bg-clip-text` headline, all of which read as marketing-template energy rather than utility-software polish.

Supabase nails a particular look — flat surfaces, hairline borders, a neutral palette with one disciplined brand accent, mono-uppercase microtext for section labels, and a 4px focus outline with 1px offset on every interactive thing. We want **that visual language**, not their illustrations, not their content, not their brand identity.

**This is a one-shot refresh.** Do not phase it over weeks. The site is small enough to migrate end-to-end in a single working session: ship the tokens, build the primitives, swap pages over, delete `@radix-ui/themes` at the end, done.

### What we ARE doing

- Re-implementing Supabase's token system (HSL CSS variables + semantic tokens + Tailwind v4 `@theme` mapping) under our own brand color.
- Re-implementing Supabase's `Button`, `Card`, `Alert`, `Badge`, `Input` patterns as our own components in `components/ui/`.
- Adopting `next-themes` with `data-theme` attribute for dark mode.
- Migrating off `@radix-ui/themes` to plain `@radix-ui/react-*` primitives + our own Tailwind-styled wrappers, all in one pass.
- Keeping the `<FlickeringGrid>` aesthetic — but dimmed and used as ambient texture.
- Keeping CCCSolutions's existing typography. No font swap.

### What we are NOT doing

- **Not direct-copying source files.** Read patterns, write our own. (See §1 on attribution.)
- **Not copying Supabase brand identity.** No green (`#3ECF8E`), no Postgres elephant, no wordmark.
- **Not copying their custom product illustrations.** They have hand-drawn SVG/PNG art for their product feature cards (Postgres mascot, wireframe globe, isometric vector cube, cursor-and-chat-bubble, etc.). We don't need any of it because we don't sell products — we host a forum and a CCC solutions list.
- **Not migrating piecemeal over weeks.** One pass. End-to-end.

---

## 1. Attribution and licensing — the only legal section

Two things matter, the rest is noise:

1. **Literal source files** (e.g. their `Button.tsx` with their exact comments and structure) are under Apache 2.0. If you copy a file verbatim, keep a notice line at the top: `// Adapted from supabase/supabase under Apache 2.0`. That is the entire compliance burden.
2. **CSS class strings, design tokens, layout patterns, focus-ring conventions, HSL values, CVA recipes** are configuration, not authored code. They aren't copyrightable. You can use them freely with no attribution. This is exactly why shadcn/ui works the way it does — every dashboard on the internet copies from the same well of patterns.

**The only thing you must NOT copy:** brand identity. That means:

- The Supabase green (`#3ECF8E` / `153.1deg 60.2% 52.7%`).
- The Supabase wordmark and logo.
- The "Build in a weekend, scale to millions" tagline or any rephrasing close to it.
- The Postgres elephant illustration and any of their bespoke product art.

CCCSolutions picks its own brand color. **Don't pick indigo (overused), don't pick Supabase green (theirs), don't pick OpenAI blue (everyone).** Reach for something with personality — amber, teal, magenta, sage, deep coral. Pick once, apply consistently.

---

## 2. Why CCCSolutions is not a B2B SaaS site (and why that matters)

Supabase is a developer-tools company selling products. Their homepage has 8 product cards each with a custom illustration, because each card has to telegraph "this product does X" at a glance. Their visual budget includes a designer.

CCCSolutions is a **forum + a CCC solutions encyclopedia** for personal use during contest prep. The information needs are completely different:

| Supabase has                      | CCCSolutions has                            |
| --------------------------------- | ------------------------------------------- |
| Products to sell                  | Problems to list                            |
| Marketing pages                   | Solution pages                              |
| Bespoke illustrations             | Lucide icons                                |
| Sales CTAs ("Start your project") | Action CTAs ("Submit solution", "Reply")    |
| Light + dark mode toggle          | Dark mode by default, light optional        |
| 8-card product grid               | 3-card forum/solutions/open-source overview |

**Implication:** copy the _visual language_ (tokens, components, hairline borders, mono-uppercase microtext, surface scale) but skip everything that's product-marketing-specific. Our cards are icon + title + body. No illustrations needed.

---

## 3. The mental model

The whole design system rests on three layers:

```
┌─ Layer 1: raw palette (gray-dark-100..1200, gray-light-100..1200) ──┐
│   defined as HSL component values: e.g. "0deg 0% 8.6%"              │
│   theme-agnostic, lives in :root                                    │
└─────────────────────────────────────────────────────────────────────┘
                       │ aliased to
                       ▼
┌─ Layer 2: semantic tokens (--background-default, --foreground-light)┐
│   per-theme override on [data-theme='dark'] / [data-theme='light']  │
│   semantic names → different palette entries per theme              │
└─────────────────────────────────────────────────────────────────────┘
                       │ exposed as
                       ▼
┌─ Layer 3: Tailwind utilities (bg-background, text-foreground-light) ┐
│   v4 `@theme` block maps `--color-foreground-light` to              │
│   `hsl(var(--foreground-light))` so utilities Just Work             │
└─────────────────────────────────────────────────────────────────────┘
```

**Why HSL components instead of hex?** Tailwind expands `hsl(var(--brand-500))` at runtime and you get translucency for free with `bg-brand/50`. Hex strings can't do that.

**Why both `[data-theme='dark']` and `.dark`?** Both selectors point at the same variable set, so dark mode survives whether it's set via attribute (preferred — `next-themes` writes the attribute) or via class.

### 3a. The "depth without shadow" surface hierarchy

The secret to Supabase's flat-but-not-flat look:

| Token                      | Dark L% | Light L% | Use for                      |
| -------------------------- | ------- | -------- | ---------------------------- |
| `--background-default`     | 7.1%    | 98.8%    | The page itself              |
| `--background-surface-75`  | 9%      | 100%     | Slightly raised              |
| `--background-surface-100` | 12.2%   | 98.8%    | Cards                        |
| `--background-surface-200` | 12.9%   | 95.3%    | Card sections / nested       |
| `--background-surface-300` | 16.1%   | 92.9%    | Hover, selection backgrounds |
| `--background-surface-400` | 16.1%   | 89.8%    | Highest elevation surfaces   |

Each step is ~2% lighter (dark) or darker (light) than the previous. The eye reads this as elevation. **No shadows are needed.** Adopting this is the single biggest "feels professional" lever after the brand color.

---

## 4. Token system — paste these into the global stylesheet

Drop the following into CCCSolutions's `app/globals.css` (or wherever the Tailwind v4 entry is). The only thing you change is the `--brand-*` values — pick a brand color and apply the same 200→600 shape.

### 4a. Raw palette (theme-agnostic, in `:root`)

```css
:root {
  --colors-black: 0deg 0% 0%;
  --colors-white: 0deg 0% 100%;

  /* Neutral scale, dark variants */
  --colors-gray-dark-100: 0deg 0% 8.6%;
  --colors-gray-dark-200: 0deg 0% 11%;
  --colors-gray-dark-300: 0deg 0% 13.7%;
  --colors-gray-dark-400: 0deg 0% 15.7%;
  --colors-gray-dark-500: 0deg 0% 18%;
  --colors-gray-dark-600: 0deg 0% 20.4%;
  --colors-gray-dark-700: 0deg 0% 24.3%;
  --colors-gray-dark-800: 0deg 0% 31.4%;
  --colors-gray-dark-900: 0deg 0% 43.9%;
  --colors-gray-dark-1000: 0deg 0% 49.4%;
  --colors-gray-dark-1100: 0deg 0% 62.7%;
  --colors-gray-dark-1200: 0deg 0% 92.9%;

  /* Neutral scale, light variants */
  --colors-gray-light-100: 0deg 0% 98.8%;
  --colors-gray-light-200: 0deg 0% 97.3%;
  --colors-gray-light-300: 0deg 0% 95.3%;
  --colors-gray-light-400: 0deg 0% 92.9%;
  --colors-gray-light-500: 0deg 0% 91%;
  --colors-gray-light-600: 0deg 0% 88.6%;
  --colors-gray-light-700: 0deg 0% 85.9%;
  --colors-gray-light-800: 0deg 0% 78%;
  --colors-gray-light-900: 0deg 0% 56.1%;
  --colors-gray-light-1000: 0deg 0% 52.2%;
  --colors-gray-light-1100: 0deg 0% 43.5%;
  --colors-gray-light-1200: 0deg 0% 9%;

  /* Spacing (2px scale) */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 32px;
  --spacing-xl: 64px;

  /* Border radius (tight) */
  --borderradius-xs: 2px;
  --borderradius-sm: 4px;
  --borderradius-lg: 8px;
  --borderradius-xl: 16px;

  /* Layout */
  --content-width-screen-xl: 1128px;
  --padding-x-sm: 1rem;
  --padding-x-md: 1.5rem;
  --card-padding-x: var(--padding-x-sm);
}
```

### 4b. Dark theme — semantic tokens

```css
[data-theme='dark'],
.dark {
  /* BRAND — REPLACE with your chosen brand color HSL.
     Keep the same 200→600 shape: 200 is darkest/most muted, 600 is brightest. */
  --brand-default: 153.1deg 60.2% 52.7%;
  --brand-link: 155deg 100% 38.6%;
  --brand-600: 154.9deg 59.5% 70%;
  --brand-500: 154.9deg 100% 19.2%;
  --brand-400: 155.5deg 100% 9.6%;
  --brand-300: 155.1deg 100% 8%;
  --brand-200: 162deg 100% 2%;

  /* Status colors — keep these, they're well-tuned */
  --warning-default: 38.9deg 100% 42.9%;
  --warning-600: 38.9deg 100% 42.9%;
  --warning-500: 34.8deg 90.9% 21.6%;
  --warning-400: 33.2deg 100% 14.5%;
  --warning-300: 32.3deg 100% 10.2%;
  --warning-200: 36.6deg 100% 8%;

  --destructive-default: 10.2deg 77.9% 53.9%;
  --destructive-600: 9.7deg 85.2% 62.9%;
  --destructive-500: 7.9deg 71.6% 29%;
  --destructive-400: 6.7deg 60% 20.6%;
  --destructive-300: 7.5deg 51.3% 15.3%;
  --destructive-200: 10.9deg 23.4% 9.2%;

  /* Borders (four-tier hierarchy) */
  --border-default: 0deg 0% 18%;
  --border-muted: 0deg 0% 14.1%;
  --border-strong: 0deg 0% 21.2%;
  --border-stronger: 0deg 0% 27.1%;
  --border-overlay: 0deg 0% 20%;
  --border-control: 0deg 0% 22.4%;
  --border-secondary: 0deg 0% 14.1%;
  --border-alternative: 0deg 0% 26.7%;

  /* Backgrounds (surface scale + specials) */
  --background-default: 0deg 0% 7.1%;
  --background-200: 0deg 0% 9%;
  --background-surface-75: 0deg 0% 9%;
  --background-surface-100: 0deg 0% 12.2%;
  --background-surface-200: 0deg 0% 12.9%;
  --background-surface-300: 0deg 0% 16.1%;
  --background-surface-400: 0deg 0% 16.1%;
  --background-muted: 0deg 0% 14.1%;
  --background-control: 0deg 0% 14.1%;
  --background-overlay-default: 0deg 0% 14.1%;
  --background-overlay-hover: 0deg 0% 18%;
  --background-selection: 0deg 0% 19.2%;
  --background-alternative-default: 0deg 0% 5.9%;
  --background-dialog-default: 0deg 0% 7.1%;

  /* Foregrounds (four tiers of emphasis) */
  --foreground-default: 0deg 0% 98%;
  --foreground-light: 0deg 0% 70.6%;
  --foreground-lighter: 0deg 0% 53.7%;
  --foreground-muted: 0deg 0% 30.2%;
  --foreground-contrast: 0deg 0% 8.6%;
}
```

### 4c. Light theme — semantic tokens

```css
[data-theme='light'],
.light {
  /* BRAND — light variant of your chosen color */
  --brand-default: 152.9deg 60% 52.9%;
  --brand-link: 153.4deg 100% 36.7%;
  --brand-600: 156.5deg 86.5% 26.1%;
  --brand-500: 155.3deg 78.4% 40%;
  --brand-400: 151.3deg 66.9% 66.9%;
  --brand-300: 147.5deg 72% 80.4%;
  --brand-200: 147.6deg 72.5% 90%;

  --warning-default: 30.3deg 80.3% 47.8%;
  --warning-600: 30.3deg 80.3% 47.8%;
  --warning-500: 36.3deg 85.7% 67.1%;
  --warning-400: 41.9deg 100% 81.8%;
  --warning-300: 44.3deg 100% 91.8%;
  --warning-200: 40deg 81.8% 97.8%;

  --destructive-default: 10.2deg 77.9% 53.9%;
  --destructive-600: 9.9deg 82% 43.5%;
  --destructive-500: 10.4deg 77.1% 79.4%;
  --destructive-400: 7.1deg 91.3% 91%;
  --destructive-300: 7.1deg 100% 96.7%;
  --destructive-200: 0deg 100% 99.4%;

  --border-default: 0deg 0% 87.5%;
  --border-strong: 0deg 0% 83.1%;
  --border-stronger: 0deg 0% 56.1%;
  --border-muted: var(--colors-gray-light-400);
  --border-overlay: var(--colors-gray-light-500);
  --border-control: var(--colors-gray-light-800);
  --border-secondary: var(--colors-gray-light-400);
  --border-alternative: var(--colors-gray-light-500);

  --background-default: var(--colors-gray-light-100);
  --background-200: var(--colors-gray-light-200);
  --background-muted: 0deg 0% 96.9%;
  --background-surface-75: 0deg 0% 100%;
  --background-surface-100: 0deg 0% 98.8%;
  --background-surface-200: 0deg 0% 95.3%;
  --background-surface-300: 0deg 0% 92.9%;
  --background-surface-400: 0deg 0% 89.8%;
  --background-control: var(--colors-gray-light-300);
  --background-overlay-default: var(--colors-gray-light-100);
  --background-overlay-hover: var(--colors-gray-light-300);
  --background-selection: var(--colors-gray-light-400);
  --background-alternative-default: 0deg 0% 99.2%;
  --background-dialog-default: 0deg 0% 100%;

  --foreground-default: var(--colors-gray-light-1200);
  --foreground-light: 0deg 0% 32.2%;
  --foreground-lighter: 0deg 0% 43.9%;
  --foreground-muted: 0deg 0% 69.8%;
  --foreground-contrast: 0deg 0% 98.4%;
}
```

---

## 5. Wiring it into Tailwind v4

CCCSolutions is on Tailwind v4 (CSS-first, no `tailwind.config.js`). Add this to the same global stylesheet:

```css
/* app/globals.css */
@import 'tailwindcss';

/* Make `dark:` variant activate on data-theme too */
@custom-variant dark (&:where([data-theme='dark'], [data-theme='dark'] *));

@theme {
  --color-background: hsl(var(--background-default));
  --color-foreground: hsl(var(--foreground-default));
  --color-foreground-light: hsl(var(--foreground-light));
  --color-foreground-lighter: hsl(var(--foreground-lighter));
  --color-foreground-muted: hsl(var(--foreground-muted));

  --color-surface-75: hsl(var(--background-surface-75));
  --color-surface-100: hsl(var(--background-surface-100));
  --color-surface-200: hsl(var(--background-surface-200));
  --color-surface-300: hsl(var(--background-surface-300));
  --color-surface-400: hsl(var(--background-surface-400));

  --color-border-default: hsl(var(--border-default));
  --color-border-muted: hsl(var(--border-muted));
  --color-border-strong: hsl(var(--border-strong));
  --color-border-stronger: hsl(var(--border-stronger));

  --color-brand: hsl(var(--brand-default));
  --color-brand-200: hsl(var(--brand-200));
  --color-brand-300: hsl(var(--brand-300));
  --color-brand-400: hsl(var(--brand-400));
  --color-brand-500: hsl(var(--brand-500));
  --color-brand-600: hsl(var(--brand-600));

  --color-destructive: hsl(var(--destructive-default));
  --color-destructive-200: hsl(var(--destructive-200));
  --color-destructive-300: hsl(var(--destructive-300));
  --color-destructive-400: hsl(var(--destructive-400));
  --color-destructive-500: hsl(var(--destructive-500));
  --color-destructive-600: hsl(var(--destructive-600));

  --color-warning: hsl(var(--warning-default));
  --color-warning-200: hsl(var(--warning-200));
  --color-warning-300: hsl(var(--warning-300));
  --color-warning-400: hsl(var(--warning-400));
  --color-warning-500: hsl(var(--warning-500));
  --color-warning-600: hsl(var(--warning-600));

  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
}
```

After this, `bg-surface-100`, `text-foreground-light`, `border-strong`, `bg-brand-500/50` all work.

---

## 6. Dark mode — `next-themes` + `data-theme`

Install `next-themes` if not present. Wrap the app at the root:

```tsx
// app/layout.tsx (or providers.tsx)
'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function ThemeProvider({ children, ...props }) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      themes={['light', 'dark']}
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
```

Two non-obvious flags worth keeping:

- **`disableTransitionOnChange`** — kills CSS transitions during theme flip so you don't get a 200ms color smear on every element. Tiny detail, big quality bump.
- **`enableSystem`** — follows OS preference automatically. Don't ship a 3-state toggle (system/light/dark); ship a single light↔dark switch and let "system" happen invisibly.

Set `suppressHydrationWarning` on `<html>` in the root layout to prevent next-themes hydration warnings. Gate the toggle UI on a `mounted` flag (`useEffect(() => setMounted(true), [])`) to avoid SSR/CSR mismatch.

---

## 7. The Button — re-implement, don't fork

Build `components/ui/button.tsx` modeled on Supabase's. Use `cva` + Tailwind + `@radix-ui/react-slot` for `asChild`. Don't import `radix-ui` (that's their shim) — use `@radix-ui/react-slot` directly.

### 7a. Base styles (every variant)

```ts
const buttonBase = `
  relative
  inline-flex items-center justify-center
  cursor-pointer
  space-x-2
  text-center
  font-regular
  ease-out
  duration-200
  rounded-md
  transition-all
  outline-0
  focus-visible:outline-4
  focus-visible:outline-offset-1
  border
`
```

The four details that make Supabase's button feel like Supabase's button:

1. **`focus-visible:outline-4` + `focus-visible:outline-offset-1`** — 4px outline 1px outside the button. Brand-tinted per variant. Keyboard focus only, never mouse.
2. **`duration-200 ease-out transition-all`** — every state change interpolates over 200ms with `ease-out`. Hover, active, focus, all of it.
3. **`border` is on every variant**, even ones that look borderless (`text`, `link`). Border is just transparent, which keeps geometry stable when a colored border _does_ appear on hover.
4. **Sizes are exact pixel heights**, not relative. Buttons in toolbars never drift when one has an icon and another doesn't.

### 7b. Variants — we only need a subset

Supabase ships 9 variants. CCCSolutions needs 4: `primary`, `default`, `outline`, `danger`. Add `text` and `link` later if needed.

```ts
const buttonVariants = cva(buttonBase, {
  variants: {
    type: {
      primary: `
        bg-brand-400 dark:bg-brand-500
        hover:bg-brand/80 dark:hover:bg-brand/50
        text-foreground
        border-brand-500/75 dark:border-brand/30
        hover:border-brand-600 dark:hover:border-brand
        focus-visible:outline-brand-600
      `,
      default: `
        text-foreground
        bg-surface-100 dark:bg-surface-200
        hover:bg-surface-200 dark:hover:bg-surface-300
        border-strong hover:border-stronger
        focus-visible:outline-brand-600
      `,
      outline: `
        text-foreground
        bg-transparent
        border-strong hover:border-foreground-muted
        focus-visible:outline-border-strong
      `,
      danger: `
        text-foreground
        bg-destructive-300 dark:bg-destructive-400
        hover:bg-destructive-400 dark:hover:bg-destructive/50
        border-destructive-500 hover:border-destructive
      `,
    },
    size: {
      tiny: 'text-xs px-2.5 py-1 h-[26px]',
      small: 'text-sm px-3 py-2 h-[34px]',
      medium: 'text-sm px-4 py-2 h-[38px]',
      large: 'text-base px-4 py-2 h-[42px]',
    },
    block: { true: 'w-full' },
  },
  defaultVariants: { type: 'default', size: 'small' },
})
```

Default is `type: 'default'`, `size: 'small'`. Most buttons in a UI shouldn't shout — primary is for the _one_ CTA per section, everything else is `default` or `outline`.

### 7c. Component shape

```tsx
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { forwardRef } from 'react'

import { cn } from '@/lib/utils'

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      type,
      size,
      block,
      asChild,
      loading,
      iconLeft,
      iconRight,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref}
        disabled={disabled || loading}
        className={cn(buttonVariants({ type, size, block }), className)}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-[18px] w-[18px] animate-spin" />
        ) : (
          iconLeft && <span className="inline-flex shrink-0">{iconLeft}</span>
        )}
        {children && <span className="truncate">{children}</span>}
        {iconRight && !loading && <span className="inline-flex shrink-0">{iconRight}</span>}
      </Comp>
    )
  }
)
Button.displayName = 'Button'
```

---

## 8. Card — icon + mono-uppercase title + light body

This is what our feature cards become. No bespoke illustrations.

```tsx
// components/ui/card.tsx
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('overflow-hidden rounded-lg border border-default bg-surface-100', className)}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 py-4 px-4 border-b border-default', className)}
      {...props}
    />
  )
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-xs font-mono uppercase tracking-wider', className)} {...props} />
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-foreground-lighter', className)} {...props} />
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('py-4 px-4 border-b border-default last:border-none', className)}
      {...props}
    />
  )
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center py-4 px-4', className)} {...props} />
}
```

**The `text-xs font-mono uppercase` title is the single most distinctive thing in this whole document.** Every section header, every card label, every panel title gets this treatment. It costs nothing and makes the whole site feel intentional.

For feature cards on the homepage:

```tsx
<Card>
  <CardContent className="flex flex-col gap-3">
    <Users className="h-5 w-5 text-brand" />
    <CardTitle>Interactive Forum</CardTitle>
    <CardDescription>
      Discuss with peers to tackle challenging CCC problems and improve your skills.
    </CardDescription>
  </CardContent>
</Card>
```

That's the whole pattern. lucide-react icon top-left, mono uppercase title, light-colored description below.

---

## 9. Alert — icon-tinted-square trick

```tsx
// components/ui/alert.tsx
const alertVariants = cva(
  cn(
    'relative w-full text-sm rounded-lg border p-4',
    '[&>svg~*]:pl-10 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4',
    '[&>svg]:text-foreground [&>svg]:w-[23px] [&>svg]:h-[23px]',
    '[&>svg]:p-1 [&>svg]:flex [&>svg]:rounded-sm'
  ),
  {
    variants: {
      variant: {
        default:
          'bg-surface-200/25 border-default text-foreground [&>svg]:text-background [&>svg]:bg-foreground',
        destructive:
          'bg-destructive-200 border-destructive-400 text-foreground [&>svg]:text-destructive-200 [&>svg]:bg-destructive-600',
        warning:
          'bg-warning-200 border-warning-400 text-foreground [&>svg]:text-warning-200 [&>svg]:bg-warning-600',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)
```

The icon sits on a tinted 23×23 rounded square (`bg-destructive-600`, `bg-warning-600`, or `bg-foreground`) with the icon itself colored in the _background tint_ of the alert. Reads as a small badge, much sharper than a free-floating icon.

---

## 10. Badge — micro-pill typography

```ts
const badgeVariants = cva(
  'inline-flex items-center gap-1 justify-center rounded-full whitespace-nowrap tracking-[0.07em] uppercase font-medium text-[9px] leading-none px-[5.5px] py-[3px]',
  {
    variants: {
      variant: {
        default: 'bg-surface-75 text-foreground-light border border-strong',
        warning: 'bg-warning/10 text-warning border border-warning-500',
        success: 'bg-brand/10 text-brand-600 border border-brand-500',
        destructive: 'bg-destructive/10 text-destructive-600 border border-destructive-500',
      },
    },
  }
)
```

`text-[9px]` + `tracking-[0.07em]` + `uppercase`. Don't try to make them larger — at 12px+ they look terrible. Use for difficulty tags, status pills, "NEW" markers, algo tags.

---

## 11. Input — barely-tinted bg + ring-offset focus

```tsx
const inputVariants = cva(
  cn(
    'flex h-10 w-full rounded-md border border-control read-only:border-button',
    'bg-foreground/[.026] px-3 py-2 text-sm',
    'placeholder:text-foreground-muted read-only:text-foreground-light',
    'focus:ring-background-control focus:border-control',
    'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-background-control',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-foreground-muted',
    'disabled:cursor-not-allowed disabled:text-foreground-muted',
    'aria-[invalid=true]:bg-destructive-200 aria-[invalid=true]:border-destructive-400',
    'aria-[invalid=true]:focus:border-destructive'
  )
)
```

Three details:

- **`bg-foreground/[.026]`** — input bg is 2.6% of foreground, just barely tinted off the page. Inputs look "set into" the page rather than floating on top.
- **`ring-2 ring-offset-2 ring-offset-foreground-muted`** — focused inputs get a 2px ring with a 2px gap, where the gap is colored with muted foreground. Inverse of the button outline.
- **`aria-[invalid=true]:` prefix** — error states are driven by ARIA, not by an `error` prop. Set `aria-invalid={true}` from your form library and the input restyles automatically.

---

## 12. Layout primitives

Two patterns to adopt:

```tsx
// components/ui/section-container.tsx
export function SectionContainer({
  size = 'default',
  className,
  ...props
}: {
  size?: 'small' | 'medium' | 'large' | 'default' | 'full'
} & React.HTMLAttributes<HTMLElement>) {
  const widths = {
    small: 'max-w-3xl',
    medium: 'max-w-5xl',
    large: 'max-w-7xl',
    default: 'max-w-5xl',
    full: 'w-full',
  }
  return <section className={cn(widths[size], 'mx-auto px-8', className)} {...props} />
}
```

Default content width is `max-w-5xl` (~1024px). Use `large` for marketing/hero, `small` for narrow article content.

**Reach for `border-default` between sections before `space-y-*`.** Hairline borders scale better visually than blank gaps.

---

## 13. Hero rewrite — full spec

The current hero does too much: full-viewport height, deep-blue gradient bg, FlickeringGrid at full opacity, gradient-clipped headline, indigo announcement banner, Radix Themes buttons with `!important` overrides. Here's the rewrite:

### 13a. What to keep

- **The FlickeringGrid stays.** It's a signature element. Just dim it: `maxOpacity={0.15}` (was `0.3`), `flickerChance={0.03}` (was `0.05`). It should read as ambient texture, not as a feature.
- **The grid color = your chosen brand color.** Not indigo. Match the brand HSL.
- **The announcement banner concept stays**, but desaturate it. `bg-surface-200 border-b border-default text-foreground-light text-xs` instead of `bg-indigo-600 text-white font-semibold`.

### 13b. What to drop

- `min-h-screen` → `pt-16 pb-12 md:pt-24 md:pb-16` (~600px tall, not 1080).
- `bg-gradient-to-b from-blue-900 to-indigo-950` → `bg-background` (your near-black). Grid sits on flat dark, reads as texture.
- `bg-clip-text` gradient on the headline → flat, with one of two lines colored `text-brand`.
- Both Radix Themes buttons → your new `<Button>`. Kill the `!bg-white !text-blue-700` overrides.

### 13c. Target structure

```tsx
'use client'

import Link from 'next/link'

import { FlickeringGrid } from '@/components/FlickeringGrid'
import { Button } from '@/components/ui/button'
import { SectionContainer } from '@/components/ui/section-container'

export default function Home() {
  return (
    <div>
      {/* Announcement strip — desaturated */}
      <div className="bg-surface-200 border-b border-default">
        <Link
          href="/forum"
          className="block py-2 px-4 text-center text-xs text-foreground-light hover:text-foreground transition-colors"
        >
          Help us expand our repository — submit your 2026 solutions{' '}
          <span className="underline underline-offset-2">here</span>.
        </Link>
      </div>

      {/* Hero */}
      <div className="relative bg-background overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <FlickeringGrid
            className="size-full"
            squareSize={4}
            gridGap={6}
            color="hsl(var(--brand-default))"
            maxOpacity={0.15}
            flickerChance={0.03}
          />
        </div>

        <SectionContainer
          size="medium"
          className="relative z-10 pt-16 pb-12 md:pt-24 md:pb-16 text-center"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-7xl tracking-tight">
            <span className="block text-foreground">The most comprehensive</span>
            <span className="block text-brand">CCC solution repository</span>
          </h1>
          <p className="mt-6 text-base lg:text-lg text-foreground-light max-w-2xl mx-auto">
            Detailed solutions to the Canadian Computing Competition, all in one place.
          </p>
          <div className="mt-8 flex justify-center gap-2">
            <Button asChild type="primary" size="medium">
              <Link href="/solutions">Explore solutions</Link>
            </Button>
            <Button asChild type="default" size="medium">
              <Link href="/forum">Visit forum</Link>
            </Button>
          </div>
        </SectionContainer>
      </div>

      {/* Feature cards section follows — see §14 */}
    </div>
  )
}
```

### 13d. Feature cards beneath the hero

Three cards, lucide icons, mono-uppercase titles, light-foreground bodies. No illustrations.

```tsx
<SectionContainer size="medium" className="py-16">
  <div className="grid md:grid-cols-3 gap-4">
    {[
      {
        icon: <Users className="h-5 w-5 text-brand" />,
        title: 'Interactive Forum',
        body: 'Discuss with peers to tackle challenging CCC problems and improve your skills.',
      },
      {
        icon: <FileText className="h-5 w-5 text-brand" />,
        title: 'Comprehensive Solutions',
        body: 'Explanations, test files, and multiple approaches to problems back to 1996.',
      },
      {
        icon: <Github className="h-5 w-5 text-brand" />,
        title: 'Open Source',
        body: 'Check the repository. Contribute, suggest improvements, or learn from the codebase.',
      },
    ].map(({ icon, title, body }) => (
      <Card key={title}>
        <CardContent className="flex flex-col gap-3">
          {icon}
          <CardTitle>{title}</CardTitle>
          <CardDescription>{body}</CardDescription>
        </CardContent>
      </Card>
    ))}
  </div>
</SectionContainer>
```

### 13e. Stats card

Same pattern, three columns:

```tsx
<SectionContainer size="medium" className="pb-16">
  <Card>
    <CardContent className="grid md:grid-cols-3 gap-8 text-center">
      <div>
        <p className="text-4xl font-medium text-foreground">{stats.activeUsers}</p>
        <p className="mt-1 text-xs font-mono uppercase tracking-wider text-foreground-lighter">
          Active users
        </p>
      </div>
      <div>
        <p className="text-4xl font-medium text-foreground">{stats.numSolutions}</p>
        <p className="mt-1 text-xs font-mono uppercase tracking-wider text-foreground-lighter">
          CCC solutions
        </p>
      </div>
      <div>
        <p className="text-4xl font-medium text-foreground">{stats.history}</p>
        <p className="mt-1 text-xs font-mono uppercase tracking-wider text-foreground-lighter">
          Providing answers
        </p>
      </div>
    </CardContent>
  </Card>
</SectionContainer>
```

---

## 14. Radix Themes → Radix primitives — one-shot migration

`@radix-ui/themes` is a styled component library. The site is small enough to migrate off in one pass:

1. **Build the primitives** in `components/ui/`: `button`, `card`, `alert`, `badge`, `input`, `section-container`. Maybe `dialog`, `dropdown-menu`, `select`, `toast` if used.
2. **Search-and-replace imports** from `@radix-ui/themes` to local equivalents. Most pages will need 5–15 minutes of tweaking each.
3. **Delete the `<Theme>` provider** at the root once nothing imports from `themes` anymore.
4. **Uninstall:** `pnpm remove @radix-ui/themes`.
5. **Strip the import** of `@radix-ui/themes/styles.css` from the global CSS.

For any unstyled primitive needs (Dialog, DropdownMenu, Select, Tooltip, Toast, etc.), install individual packages — `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, etc. — and style them yourself with Tailwind. These keep the accessibility behavior (keyboard nav, ARIA, focus traps) without imposing a visual opinion.

---

## 15. The one-line summary

> **Hairline borders, flat surfaces stacked by a 2% lightness step, neutral palette punctuated by one brand color used sparingly, mono-uppercase microtext for section labels, and a 4px focus outline with 1px offset on every interactive thing.**

If the agent only remembers that sentence, they'll get 80% of the look.

---

## 16. Things to NOT do

- **Don't import `packages/ui` directly** from the Supabase repo.
- **Don't copy Supabase brand identity** — green, wordmark, elephant, "Build in a weekend" tagline.
- **Don't copy their bespoke illustrations** — Postgres mascot, wireframe globe, isometric vector cube, cursor-and-chat-bubble, etc. We don't sell products, we don't need product art.
- **Don't pick indigo as the brand color.** Generic. Boring. Pick something with personality.
- **Don't add box-shadows for elevation.** The surface scale is the elevation system.
- **Don't keep `@radix-ui/themes`.** It will fight every component you build.
- **Don't migrate over weeks.** One shot.
- **Don't change CCCSolutions's font.** Typography stays.
- **Don't add `min-h-screen` to the hero.** Use real pixel padding instead.
- **Don't use `!important` to override component library styles.** That's a sign the library doesn't fit and should be removed.

---

## 17. Where to look in the source repo

When something here is unclear, the canonical examples in the Supabase repo:

| Want                                      | Path                                                                                                                         |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Token files (source of truth)             | `packages/ui/build/css/source/global.css`, `packages/ui/build/css/themes/dark.css`, `packages/ui/build/css/themes/light.css` |
| Their full Button (every variant)         | `packages/ui/src/components/Button/Button.tsx`                                                                               |
| Their shadcn-style Card/Alert/Badge/Input | `packages/ui/src/components/shadcn/ui/{card,alert,badge,input}.tsx`                                                          |
| Tailwind v3 config (tokens → classes)     | `packages/config/tailwind.config.js`                                                                                         |
| Hero used on supabase.com                 | `apps/www/components/Hero/Hero.tsx`                                                                                          |
| Theme provider wiring                     | `packages/common/Providers.tsx`                                                                                              |
| Size constants                            | `packages/ui/src/lib/constants.ts`                                                                                           |

---

## 18. Agent prompt — copy-paste this to one-shot the refresh

> You are refreshing the CCCSolutions homepage and underlying design primitives in one pass. The site is at `/Users/williamyang/Documents/GitHub/CCCSolutions`, which is Next.js 15 + Tailwind v4 + Radix UI primitives. Read `docs/SUPABASE_DESIGN_REFERENCE.md` first — it contains the full design system spec, tokens, and component recipes.
>
> **Your job, end-to-end:**
>
> 1. **Add the token system to `app/globals.css`.** Drop in §4a (raw palette) at `:root`, §4b/§4c (dark/light themes), and §5 (Tailwind v4 `@theme` block + `@custom-variant dark`). Replace the `--brand-*` HSL values with a single chosen brand color — NOT indigo, NOT Supabase green. Pick something with personality (amber, teal, magenta, sage, deep coral). Apply the same 200→600 shape across both themes.
> 2. **Wire `next-themes`** per §6. Add `data-theme="dark"` as the default. Set `suppressHydrationWarning` on `<html>`.
> 3. **Build `components/ui/` primitives:** `button.tsx` (§7, four variants: primary, default, outline, danger; sizes tiny/small/medium/large), `card.tsx` (§8), `alert.tsx` (§9), `badge.tsx` (§10), `input.tsx` (§11), `section-container.tsx` (§12). Use `class-variance-authority`, `@radix-ui/react-slot`, `lucide-react`. Do NOT import from `@radix-ui/themes`. Write your own files; don't copy Supabase's source verbatim.
> 4. **Rewrite `app/page.tsx` per §13.** Keep `<FlickeringGrid>` but dim it (`maxOpacity={0.15}`, `flickerChance={0.03}`, color set to `hsl(var(--brand-default))`). Drop the gradient background, drop `min-h-screen`, drop `bg-clip-text`, drop the indigo announcement bar (replace with a desaturated strip per §13c). Use the new Button + SectionContainer + Card. Replace the three Radix Themes feature cards with the icon-title-body pattern from §13d. Replace the stats card per §13e.
> 5. **Migrate other pages off `@radix-ui/themes`** per §14. For any page using `<Button>`, `<Card>`, `<Heading>`, `<Text>` from `@radix-ui/themes`, swap to the new local primitives. For Dialog / DropdownMenu / Select / Tooltip / Toast needs, install individual `@radix-ui/react-*` packages and style with Tailwind.
> 6. **Once nothing imports from `@radix-ui/themes`,** delete the `<Theme>` provider, remove the `@radix-ui/themes/styles.css` import from globals, and `pnpm remove @radix-ui/themes`.
> 7. **Run the dev server, verify** in dark mode and light mode. Check the hero, three pages with forms, and at least one solution detail page. Look for: hardcoded colors that didn't migrate (`bg-zinc-*`, `bg-blue-*`, `text-white`, `text-black`), focus rings that don't match brand, sections that need a `border-b border-default`.
>
> **Hard constraints:**
>
> - Do NOT change CCCSolutions's font.
> - Do NOT copy Supabase's source files verbatim. Re-implement from the patterns in the doc.
> - Do NOT copy Supabase's brand identity (green, elephant, wordmark, tagline).
> - Do NOT add box-shadows for elevation; the surface scale is the elevation system.
> - Do NOT use `!important` overrides.
> - Do NOT migrate piecemeal — finish in one pass.
>
> The visual target in one sentence: hairline borders, flat surfaces stacked by a 2% lightness step, neutral palette punctuated by one brand color used sparingly, mono-uppercase microtext for section labels, and a 4px focus outline with 1px offset on every interactive thing.
