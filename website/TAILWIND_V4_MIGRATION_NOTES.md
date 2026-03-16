# Tailwind v4 + Next.js Migration — Troubleshooting Notes

> **Updated 2026-03-16.** Multiple debugging sessions across two days. The Tailwind v4 upgrade causes infinite compile hangs. This document captures everything we've tried and ruled out so the next attempt doesn't repeat these mistakes.

---

## Current State of Branch `radix-ui-migration`

The code changes for Tailwind v4 are DONE (see "Completed Code Changes" below). The ONLY blocker is that `@tailwindcss/postcss` hangs infinitely. Once the hang is resolved, everything should just work.

### Completed Code Changes (already on branch)
- Next.js upgraded to 15.5.12, React 18.3.x
- `styled-components` removed from `app/page.tsx` (replaced with Tailwind + inline styles)
- `@material-tailwind/react` removed from `components/Footer.tsx` (replaced with plain HTML)
- `@material-tailwind/react` type augmentations removed from `types.d.ts`
- `@ant-design/icons` switched to deep imports (not barrel): `import TeamOutlined from '@ant-design/icons/TeamOutlined'`
- `tailwind.config.js` deleted — theme moved to `@theme` block in `globals.css`
- `postcss.config.mjs` created with `@tailwindcss/postcss` (official Tailwind v4 config)
- `globals.css` converted: `@import "tailwindcss"` + `@theme` block + custom CSS
- Google Fonts `@import url(...)` removed from CSS, moved to `<link>` tags in `layout.tsx`
- `autoprefixer` and `@tailwindcss/typography` removed (built into v4)
- `styledComponents: true` removed from `next.config.mjs`
- Tailwind v4 class renames applied across ALL files:
  - `bg-gradient-to-r` → `bg-linear-to-r`, `bg-gradient-to-br` → `bg-linear-to-br`
  - `shadow-sm` → `shadow-xs`
  - `shadow` (bare) → `shadow-sm`
  - `rounded-sm` → `rounded-xs`

---

## The Hang Problem — Exhaustive Testing

### What hangs
- `@tailwindcss/postcss` v4.2.1 via PostCSS API — hangs on `@import "tailwindcss"` alone
- `@tailwindcss/cli` v4.2.1 — hangs on any input
- Both hang even in a **completely empty temp directory** with a one-line CSS file

### What does NOT hang
- `require('@tailwindcss/oxide')` — loads fine, returns `{ Scanner }`
- `new Scanner({ sources: [] }).scan()` — returns immediately with empty result
- Next.js Turbopack WITHOUT PostCSS config — compiles pages fine (200 response), but no CSS styling at all

### Tested environments (ALL hang)
| Runtime | Version | Result |
|---------|---------|--------|
| Node.js | v25.1.0 | HANGS |
| Node.js | v22.22.1 (LTS via brew) | HANGS |
| Bun | v1.2.17 | HANGS |

### System info
- macOS 26.2 (Tahoe), Darwin 25.2.0
- Apple Silicon ARM64 (M-series)
- Homebrew: `/opt/homebrew` (correct ARM path)
- All binaries confirmed arm64 (node, bun, oxide .node file, lightningcss .node file)
- No Rosetta/x64 mismatch

### Ruled out causes
| Theory | How we ruled it out |
|--------|-------------------|
| Node v25 instability | Also hangs on Node v22.22.1 LTS |
| Barrel imports (`@ant-design/icons`) | Hangs even in empty directory with no imports |
| Google Fonts `@import url(...)` in CSS | Removed; still hangs |
| Wrong architecture binary (x64 on ARM) | `file` confirms all `.node` binaries are arm64 |
| PostCSS config format (.js vs .mjs) | Tried both; still hangs |
| `@source` directives | Removed; still hangs |
| Oxide scanner itself | `Scanner.scan()` works fine when called directly |
| WASM fallback (`NAPI_RS_FORCE_WASI=1`) | Installed `@tailwindcss/oxide-wasm32-wasi`, still hangs |
| macOS Gatekeeper/provenance | Removed `com.apple.provenance` xattr; still hangs |

### Where the hang actually is
The oxide Scanner works in isolation. The hang is somewhere in the **JavaScript wrapper layer** — either in `@tailwindcss/postcss`, `@tailwindcss/node`, or `lightningcss` (which also has a native Rust binary). The PostCSS plugin calls into these layers to resolve `@import "tailwindcss"`, compile CSS, and generate output. Something in that chain deadlocks.

### Known related GitHub issues
- **#17451** — "Any command hanging forever on macOS with chip M1" — most users had x64/Rosetta mismatch (not our case), but some had hangs even with correct arm64 binary
- **#17379** — Native scanner freezing, deadlocking on certain file types
- **#19731** — CLI tools getting permanently stuck with zero output
- **#31649** — Post-install deadlocks compiling oxide native bindings

---

## Recommended Next Steps

### Option A: Try older Tailwind v4 versions
- One user in #17451 fixed their hang by downgrading to **v4.0.9**
- Try: `npm install tailwindcss@4.0.9 @tailwindcss/postcss@4.0.9`
- If that works, binary bisect to find which version introduced the regression

### Option B: Debug the JavaScript layer
- The oxide Scanner works directly. Something in `@tailwindcss/node` or `lightningcss` is the actual hang point
- Try importing and calling `lightningcss` directly to see if IT hangs
- If lightningcss is fine, the hang is in `@tailwindcss/node`'s module resolution (`enhanced-resolve`)
- Add console.log statements to `node_modules/@tailwindcss/postcss/dist/index.mjs` to find the exact line

### Option C: Minimal reproduction in fresh project
- `npx create-next-app@latest --tailwind` on this machine
- If the fresh project ALSO hangs → it's a macOS 26.2 system-level issue
- If the fresh project works → diff the configs to find what's different

### Option D: File a GitHub issue
- With all the data above, file on `tailwindlabs/tailwindcss`
- Include: macOS 26.2, arm64, Node 22 LTS, oxide Scanner works but PostCSS hangs
- This is likely a `lightningcss` or `@tailwindcss/node` bug on macOS Tahoe

### Option E: Stay on Tailwind v3, proceed with Radix migration
- All the code changes above (class renames, etc.) would need to be reverted
- But Radix Themes works with Tailwind v3
- Safest path if the hang can't be resolved

---

## Files That Need Changing During Migration

### Already done (on branch):
- `app/page.tsx` — styled-components removed, deep ant-design imports
- `components/Footer.tsx` — @material-tailwind removed
- `types.d.ts` — @material-tailwind augmentation removed
- `app/resources/page.tsx` — deep ant-design imports, v4 class renames
- `globals.css` — Tailwind v4 syntax
- `postcss.config.mjs` — v4 config
- `tailwind.config.js` — deleted
- `next.config.mjs` — styledComponents removed
- `layout.tsx` — Google Font link tags added
- All `.tsx` files — Tailwind v4 class renames applied

### Still TODO (after hang is fixed):
- Replace `react-quill` with `react-quill-new` (if upgrading to React 19)
- Install Radix UI Themes + wrap layout with `<Theme>`
- Component migration (cards, buttons → Radix)

---

## Design Decisions (confirmed with user)

- **Radix Themes** (not Primitives) — for out-of-box styling
- **Accent color**: `indigo` | **Gray**: `slate`
- **Keep** `@ant-design/icons` as-is (switched to deep imports)
- **Keep** Milliken Mills pastel colors as custom theme colors
- **Remove** MMHS logo from Navbar only (keep in Footer)
- **Magic UI**: AuroraText on hero "most comprehensive" text, FlickeringGrid for homepage background
- **Forum pages**: light touch — only swap Card/Button styling, do NOT touch react-quill editors
- **Incremental migration** — stop for user verification between each step
- Don't make it look "too startup/B2B SaaS" — keep it friendly for a school CCC site
