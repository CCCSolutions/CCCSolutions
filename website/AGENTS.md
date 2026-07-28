# cccsolutions-website — agent instructions

Next.js 15 (App Router) + React 18 + Tailwind v4. Package manager: **bun** (`bun install`, `bun run dev`). Deployed to Cloudflare Workers via OpenNext — SSR/SSG/ISR, not a static export. Dark mode via `next-themes` (`ThemeToggle` in the navbar).

## Environment variables

Every frontend var is `NEXT_PUBLIC_*`, which Next.js **bakes into the bundle at build time** — nothing is read at Worker runtime. So in the cloud they go in the **build** environment: Cloudflare **Workers Builds → Build → Variables** _and_ **Netlify** env (the site double-deploys during the hosting migration). Putting them in the Worker's _Secrets_ tab does nothing — the build has already finished. Locally they live in `.env.local` (gitignored; copy `.env.local.example`). `NEXT_PUBLIC_API_URL` takes **no trailing slash**.

## Layout map

- `app/layout.tsx` — root layout: `<body>` → `Providers` (theme) → `Navbar` / `<main>{children}</main>` / `Footer`. No global max-width wrapper here — width constraints live per-section (see below).
- `app/page.tsx` — homepage.
- `app/about/page.tsx` — timeline, teacher thanks, contributor grid, school origin.
- `app/resources/page.tsx` — online judges / books / contribute links.
- `app/solutions/*` — problem archive, renders `ProblemTable`.
- `app/contest/[contestYear]/[problemCode]/page.tsx` — individual problem/solution page.
- `app/forum/*`, `app/create-post`, `app/login` — forum + auth-adjacent pages (uses `pocketbase` client, `react-quill-new` editor).
- `constants.ts` — static data: `problems[]` (CCC archive metadata), `contributors[]` (name/initials/school/contributions), `stats`.

## Components

- `components/ui/section-container.tsx` — `SectionContainer` renders the `<section>` itself with `size` → max-width (`small` 3xl / `medium`+`default` 5xl / `large` 7xl / `full` 100%) plus `mx-auto px-8`. **It is not full-bleed** — any `className` you pass (e.g. `border-t`) lives on this constrained box, so a border only spans the content width, not the viewport.
- `components/ui/card.tsx` — `Card`, `CardContent`, `CardTitle` (`text-2xl font-semibold tracking-tight`), `CardDescription`.
- `components/ui/button.tsx` — `Button` with `type` (`primary`/`default`) and `size` (`tiny`/`small`/`medium`/`large`); `tiny` is a fixed `h-[26px]`.
- `components/layout/` — `Navbar`, `Footer`, `ThemeToggle`, `Providers`, `Login`.
- `components/solutions/ProblemTable.tsx` — the archive table (`table-fixed`, columns: Solution 8% / Problem Name 40% / Difficulty 22% / Tags 30%); difficulty badge colors keyed off `getDifficultyClass(difficulty)` (easy/normal/hard/insane/wicked → tailwind pastel pairs, e.g. `bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300`). The same badge-color switch is duplicated in `app/contest/[contestYear]/[problemCode]/page.tsx` (`getDifficultyColor`) with a different (rounded-full) badge shape — keep both in sync if you touch difficulty colors.
- `components/solutions/SolutionPreview.tsx` — the animated code-preview mockup used in the homepage hero.
- `components/effects/` — `FlickeringGrid`, `GraphPattern`, `NoiseTexture`, `LightRays` — decorative canvas/SVG backgrounds used in hero bands.

## Design conventions (Supabase-inspired)

- Color tokens are CSS vars in `app/globals.css` (`--brand-*`, `--colors-gray-*`), consumed via Tailwind utility classes like `bg-background`, `text-foreground`, `text-foreground-light`, `text-foreground-lighter`, `bg-surface-100/200/300`, `border-border-default`/`border-border-muted`, `text-brand`. Prefer these over raw Tailwind grays so light/dark both stay correct.
- Section heading convention: `font-semibold tracking-tight`, sized `text-3xl md:text-4xl` for a page's main section headings (bump to `md:text-5xl` only for a hero-style centered headline). Don't use `font-bold` for headings — the codebase standardized on `font-semibold` everywhere; mixing weights was a bug fixed once already.
- **Full-width section dividers** (Supabase-style thin line spanning the entire viewport, not just the content column): wrap the `SectionContainer` in an outer `<div className="border-t border-border-default">...</div>` — do **not** put the border class on the `SectionContainer` itself, since that box is `max-w`-constrained and centered and the line will fall short of the viewport edge on wide screens.
- Hero/dark bands (About, Resources headers) force `data-theme="dark"` and hand-roll their own bg color + radial-gradient "light from above" + `NoiseTexture` grain; their own `border-b` already acts as a full-bleed separator since that outer div has no max-width.
- Difficulty/tag pill pattern: `inline-flex items-center px-3 py-1 text-xs font-medium rounded-xs` + a pastel bg/text pair (light + dark variant). Don't add glow/animation effects to badges — one was removed from "Wicked" for being inconsistent with the others.
- When vertically centering a text label next to a differently-sized element (e.g. a title next to a badge, or a tag next to a button) in a flex row, `items-center` alone can look mismatched because element line-boxes (not glyph bounds) get centered. Add `leading-none` to both to tighten line-height to the actual glyph bounds before relying on `items-center`.

## Gotchas learned the hard way

- `SectionContainer`'s width prop only affects that one element's box — full-bleed effects (dividers, colored bands) need their own unconstrained wrapper.
- `table-fixed` + percentage column widths is the reliable way to stop a truncating `<td>` (e.g. long problem names) from visually bleeding into the next column; plain `whitespace-nowrap` truncation without a bounded column width does not reliably clip at all zoom levels.
- Inside a `table-fixed` layout, only give **percentage** widths to columns whose content is genuinely variable/flexible (problem names, tag lists). Columns with fixed, known content (an icon-only column, a badge column) should get a **solid** `rem`/`px` width instead — a small percentage (e.g. `8%`) is fine on a wide desktop viewport but shrinks below the content's real minimum size at the table's mobile `min-width` floor, causing header/cell text to visually overlap into the next column. This bit us once on `ProblemTable.tsx` (Solution/Difficulty columns were `%`-based and collapsed on mobile even though desktop looked perfect) — fixed by making those two columns solid widths (`w-28`/`w-32`) and leaving only Problem Name/Tags as `%`/auto.
- CSS `:hover`-only popovers (`group-hover:block`) don't work on touch devices — there's no persistent hover state, so tapping (even repeatedly) never toggles them. Any tooltip/info-popover needs a click/tap handler (toggle state + a document click-outside listener to close it) in addition to — or instead of — the hover variant.
- The navbar logo previously linked to a broken `/website/public` path (an accidental leftover) — if you see internal links that don't correspond to an actual route under `app/`, double check they're not similarly stale.
