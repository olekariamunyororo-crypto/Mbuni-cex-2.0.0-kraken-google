# Mbuni Design System

Mobile-first crypto wallet & exchange UI for **Mbuni**.  
Source of truth in the app: `src/app/globals.css` (Tailwind v4 `@theme`) and shared UI under `src/components/ui/`.

**Stack:** React · TypeScript · Tailwind CSS v4 · Inter · Lucide · Framer Motion (selective)  
**Theme:** Dark only — **Tempered Glass**  
**Brand:** Lime ostrich mascot + purple CTAs (Galvorn-inspired actions)

---

## 1. Principles

1. **Lime is brand, not the button.** `#a3e635` is reserved for logo, active nav, success states, upticks, and soft washes. Primary *actions* always use purple CTA (`#7f66ff`).
2. **Tempered glass depth.** Surfaces are translucent, softly blurred, and layered. Every card, sheet, and panel should feel like frosted glass floating above a deep dark void — never flat or muddy.
3. **Progressive density.** Default to calm, simple glass surfaces for newcomers. Unlock denser pro layouts (order book, multi-pane trade, advanced tickets) via mode toggle or user activity.
4. **Numbers first.** Every price, balance, percentage, and fee uses tabular numbers (`.tnum`). Visual hierarchy remains crystal clear even through glass.
5. **Trust through restraint.** Green/lime = up / success only. Red = down / error / sell only. Glass should enhance calm confidence, not distract.
6. **Mobile phone shell.** Content sits in a centered column (`max-w-md`). Trade screen may widen on larger viewports (`md:max-w-5xl`).
7. **Dense but breathable finance UI.** 52px primary controls for touch, clear hierarchy, generous safe-area handling.
8. **No light theme** in tokens today — `color-scheme: dark` only.
9. **Motion sparingly & smoothly.** Prefer soft scale + opacity. Avoid page-exit animations that can leave the tree non-interactive.
10. **Safe by default.** Every irreversible action shows exact amount, network/fee, recipient, and clear confirmation language.
11. **AI as quiet co-pilot.** AI insight cards use the softest glass treatment and never compete with primary numbers or CTAs.
12. **Progressive disclosure.** One focused question or action per screen in onboarding and forms. Never overwhelm.
13. **Clear action hierarchy.** Primary = solid white or purple CTA. Secondary = dark glass pills. Tertiary = text links.

---

## 2. Color tokens

Defined in `src/app/globals.css` as CSS variables under `@theme`. Tailwind maps them to utilities like `bg-bg`, `text-primary`, `border-line`.

### Brand & actions

| Token | CSS variable | Value | Usage |
|-------|--------------|-------|--------|
| Primary / Accent | `--color-primary`, `--color-accent` | `#a3e635` | Logo, active tab, success, chart up, positive % |
| Primary hover | `--color-primary-hover` | `#bef264` | Lime hover states |
| Primary soft | `--color-primary-soft` | `rgba(163, 230, 53, 0.14)` | Lime washes, selected chips |
| Primary muted | `--color-primary-muted` | `rgba(163, 230, 53, 0.08)` | Very soft lime backgrounds |
| CTA | `--color-cta` | `#7f66ff` | Primary action buttons (purple) |
| CTA hover | `--color-cta-hover` | `#9580ff` | Primary button hover |
| CTA soft | `--color-cta-soft` | `rgba(127, 102, 255, 0.14)` | Purple soft backgrounds |
| Gold | `--color-gold` | `#e0a23a` | Premium / membership accents (use sparingly) |

### Surfaces & text (Tempered Glass system)

| Token | CSS variable | Value | Usage |
|-------|--------------|-------|--------|
| Background | `--color-bg` | `#07080c` | Deepest app canvas |
| Surface | `--color-surface` | `rgba(20, 22, 31, 0.72)` | Standard glass cards |
| Surface solid | `--color-surface-solid` | `#14161f` | Fallback / non-blur contexts |
| Elevated | `--color-elevated` | `rgba(26, 29, 42, 0.78)` | Raised glass panels |
| Elevated solid | `--color-elevated-solid` | `#1a1d2a` | Solid fallback |
| Elevated Pro | `--color-elevated-pro` | `rgba(30, 34, 48, 0.82)` | Denser pro-mode glass |
| Glass highlight | `--color-glass-highlight` | `rgba(255, 255, 255, 0.06)` | Top edge / inner glow |
| Glass border | `--color-glass-border` | `rgba(255, 255, 255, 0.09)` | Soft glass edge |
| Secondary | `--color-secondary` | `#9ca3af` | Labels, secondary body |
| Tertiary | `--color-tertiary` | `#6b7280` | Hints, captions |
| Muted | `--color-muted` | `#8e8e93` | Inactive tab icons |
| Line | `--color-line` | `rgba(255, 255, 255, 0.08)` | Standard borders |
| Divider | `--color-divider` | `rgba(255, 255, 255, 0.06)` | List row separators |
| Overlay | `--color-overlay` | `rgba(7, 8, 12, 0.68)` | Modal / sheet scrim |
| Disabled | `--color-disabled` | `rgba(255, 255, 255, 0.25)` | Disabled text / icons |

### Semantic

| Token | CSS variable | Value | Usage |
|-------|--------------|-------|--------|
| Success | `--color-success` | `#a3e635` | Same as brand lime |
| Success soft | `--color-success-soft` | `rgba(163, 230, 53, 0.12)` | Soft success backgrounds |
| Danger | `--color-danger` | `#ff5c5c` | Sell, errors, down % |
| Danger soft | `--color-danger-soft` | `rgba(255, 92, 92, 0.12)` | Soft danger backgrounds |
| Warning | `--color-warning` | `#ff9f0a` | Pending, alerts |
| Warning soft | `--color-warning-soft` | `rgba(255, 159, 10, 0.12)` | Soft warning backgrounds |
| Focus | `--color-focus` | `#a3e635` | Explicit focus rings |

### Asset colors

> Real coin logos (§6.11) are the primary asset identity. These colors are only the **fallback badge** background used by `CoinIcon` when a logo is not bundled or fails to load, and for chart accents.

| Asset | CSS variable | Value |
|-------|--------------|-------|
| BTC | `--color-btc` | `#f7931a` |
| ETH | `--color-eth` | `#627eea` |
| USDT | `--color-usdt` | `#26a17b` |
| SOL | `--color-sol` | `#9945ff` |
| BNB | `--color-bnb` | `#f3ba2f` |
| LINK | `--color-link` | `#2a5ada` |
| ADA | `--color-ada` | `#0033ad` |

### Meta

| Key | Value |
|-----|--------|
| `theme-color` (HTML) | `#07080c` |

---

## 3. Tempered Glass System

The core visual language of Mbuni is **dark tempered glass** — translucent, softly blurred surfaces with subtle borders and depth.

### Glass levels

| Level | Class | Background | Blur | Border | Shadow | Use case |
|-------|-------|------------|------|--------|--------|----------|
| Base | `.glass` | `bg-surface` | `backdrop-blur-xl` | `border-glass-border` | Soft outer | Standard cards |
| Raised | `.glass-raised` | `bg-elevated` | `backdrop-blur-xl` | `border-glass-border` | Medium | Floating panels, sheets |
| Pro | `.glass-pro` | `bg-elevated-pro` | `backdrop-blur-2xl` | `border-glass-border` | Stronger | Order book, dense trade panels |
| Soft | `.glass-soft` | `bg-surface/60` | `backdrop-blur-lg` | very subtle | Light | AI cards, secondary info |
| Solid fallback | `.glass-solid` | solid surface | none | standard | Soft | Performance-critical lists |

### Recommended CSS utilities

```css
/* Core glass */
.glass {
  @apply bg-surface border border-[var(--color-glass-border)]
    backdrop-blur-xl
    shadow-[0_8px_32px_rgba(0,0,0,0.45),inset_0_1px_0_var(--color-glass-highlight)];
}

.glass-raised {
  @apply bg-elevated border border-[var(--color-glass-border)]
    backdrop-blur-xl
    shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_0_var(--color-glass-highlight)];
}

.glass-pro {
  @apply bg-elevated-pro border border-[var(--color-glass-border)]
    backdrop-blur-2xl
    shadow-[0_16px_48px_rgba(0,0,0,0.55),inset_0_1px_0_var(--color-glass-highlight)];
}

.glass-soft {
  @apply bg-surface/60 border border-white/5
    backdrop-blur-lg
    shadow-[0_4px_24px_rgba(0,0,0,0.35)];
}

/* Smooth tab bar */
.tab-bar-glass {
  @apply bg-bg/80 backdrop-blur-2xl border-t border-white/5;
}
```

### Glass rules for smoothness

- Always pair translucent backgrounds with `backdrop-blur-xl` or higher.
- Use a very subtle **inset top highlight** (`inset 0 1px 0 rgba(255,255,255,0.06)`) for the tempered edge.
- Prefer `border-[var(--color-glass-border)]` over hard white borders.
- Keep opacity in the 0.65–0.85 range — too transparent becomes noisy, too opaque loses the glass feel.
- On long lists or performance-sensitive screens, fall back to solid surfaces (`.glass-solid`).
- Avoid stacking more than 2–3 heavy blur layers.

---

## 4. Typography

| Property | Value |
|----------|--------|
| Family | Inter (weights 400, 500, 600, 700, 800) |
| CSS | `--font-sans: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` |
| Body default | White, antialiased on `bg-bg` |
| Numeric | Class `.tnum` → `font-variant-numeric: tabular-nums` |
| Tight numeric | Class `.tnum-tight` → tabular-nums + slight negative tracking |

### Type scale

| Role | Typical classes | Notes |
|------|-----------------|-------|
| Screen title | `text-[28px] font-bold tracking-tight` | |
| Hero balance / large price | `text-[32px]–[40px] font-bold tracking-tight tnum` | High impact |
| Section title | `text-[17px] font-bold tracking-tight` | |
| Row / card title | `text-[14px]`–`text-[15px] font-semibold` | |
| Asset row price | `text-[15px] font-semibold tnum` | Consistent column alignment |
| Asset row % | `text-[13px] font-medium tnum` | |
| Label | `text-[13px]`–`text-[14px] font-medium text-secondary` | |
| Caption / meta / fees | `text-[11px]`–`text-[12px] text-tertiary` | |
| Form input | `text-[16px]` | Avoids iOS zoom |
| Button (lg) | `text-[16px] font-semibold` | |
| Button (md) | `text-[15px] font-semibold` | |
| Button (sm) | `text-[13px] font-semibold` | Dense toolbars |
| Tab label | `text-[10px] font-medium` | |

---

## 5. Spacing, radius, layout

### Spacing

| Pattern | Value |
|---------|--------|
| Page horizontal padding | `px-5` (~20px) |
| Section vertical gaps | `mt-6` / `mt-7` |
| List row vertical | `py-3` / `py-3.5` |
| Card internal padding | `p-4` (dense) / `p-5` (hero) |
| Bottom clearance above tab bar | `pb-[calc(5.5rem+env(safe-area-inset-bottom))]` |

### Radius

| Element | Value |
|---------|--------|
| Cards / glass panels | `rounded-3xl` (24px) |
| Inputs | `rounded-xl` |
| Primary buttons (lg) | `rounded-[14px]` / `rounded-full` for CTAs |
| Buttons (md / sm) | `rounded-xl` / `rounded-full` |
| Chips / pills | `rounded-full` |
| Icon wells | `rounded-2xl` / `rounded-full` |
| Bottom sheets | `rounded-t-3xl` |

### Layout shell

- Outer: centered flex, deep black letterbox (`bg-bg`).
- Inner: `max-w-md` phone column.
- Trade screen: may expand to `md:max-w-5xl` with side-by-side chart + order book.
- Tab bar: fixed bottom, high z-index, glass treatment (`.tab-bar-glass`).

---

## 6. Components

### 6.1 Buttons

| Variant | Style | Usage |
|---------|-------|-------|
| **Primary** | Solid white or purple (`bg-cta`), full-width, `rounded-full` or `rounded-[14px]`, 52px height | Main actions (Buy, Continue, Create account) |
| **Secondary** | Dark glass pill (`bg-surface` + border), white text | Add money, Buy assets, secondary actions |
| **Tertiary** | Text only / underline | “Continue with email”, “Manage watchlist” |
| **Destructive** | Red text or soft red background | Sell, Withdraw, Delete |
| **Icon** | Circular glass well | Close, back, more |

**Rules**
- Primary buttons are always high-contrast (white or purple).
- Disabled state: 40% opacity + no pointer events.
- Press state: subtle scale (0.97–0.98).

### 6.2 Bottom Sheets & Action Menus

Strong pattern from real apps:

- Dark glass raised panel (`glass-raised`)
- Soft top handle bar
- Clear list of actions with icon + title + short description
- Full-width items with generous touch targets (`py-4`)

Example structure:
```
Create an order
├── Recurring Buy
└── Custom Order
```

or

```
Buy / Recurring buy / Sell / Convert / Perps
```

### 6.3 Asset Rows

Standard pattern used across Home, Watchlist, Explore, Categories:

```
[Icon]  Asset Name          $Price
        Ticker              ↑ / ↓ %
```

- Icon: `<CoinIcon asset="BTC" size={32–40} />` (real logo, round; see §6.11) — never a hand-built letter badge
- Name: `font-semibold text-[15px]`
- Ticker: `text-tertiary text-[13px]`
- Price + %: right-aligned, tabular numbers
- % color: lime (up) / red (down)

### 6.4 Section Headers

```
Section Title                    →  (optional “See all” / arrow)
Subtitle or short description
```

- Title: `text-[17px] font-bold`
- Optional trailing action on the right

### 6.5 Horizontal Category / Promo Cards

Used heavily in Explore:

- Rounded glass cards (`rounded-3xl`)
- Strong visual (3D illustration or icon stack)
- Short title + one-line description
- Primary CTA button at bottom (“Get started”, “Trade now”)

### 6.6 Progress / Onboarding Steps

Vertical timeline style:

```
✓  Create your account          Completed
02 Verify your identity         Current
03 Make your first trade
```

- Completed = lime check + green text
- Current = bold white
- Upcoming = muted

### 6.7 Form Fields

- Dark glass input (`bg-surface` + soft border)
- Large touch target (min 52px)
- Label above or floating
- Clear error state with red border + helper text
- Country / state selectors as full-width tappable rows

### 6.8 Tabs

**Top-level content tabs** (Watchlist / Crypto / xStocks / Perps):
- Pill or underline style
- Active: lime accent or white text + underline
- Inactive: muted

**Bottom navigation**:
- 5 items max
- Center action button (`+`) is elevated and prominent
- Active icon + label in lime or white
- Glass background with top border

### 6.9 Balance Hero

```
Welcome, {Name}
$0.00                    ← large, bold, tabular
[Add money]  [Buy assets]
```

- Extremely high visual hierarchy on the balance number
- Two secondary action pills directly below

### 6.10 Feature / Discover List

Clean list used in More / Discover more:

```
[Icon]  Title
        Short description
```

- Icon on the left (colored or monochrome)
- Chevron on the right for navigation
- Soft dividers between rows

---

### 6.11 Coin Logos (`CoinIcon`)

Every place an asset is named in the UI shows its real logo via one shared component:

```tsx
import { CoinIcon } from "@/components/opencex/coin-icon";
<CoinIcon asset="BTC" size={24} />
```

**Assets & sources**

| Logos | Source | License |
|-------|--------|---------|
| BTC, ETH, USDT, SOL, BNB, XRP, DOGE, MATIC, AVAX, LINK, ADA | `cryptocurrency-icons` | CC0-1.0 |
| ARB, OP, TON | `@web3icons/core` (background variants) | MIT |

Files live in `public/crypto/<symbol>.svg` (lowercase). Attribution: `public/crypto/LICENSES.md`. The logos remain trademarks of their respective owners.

**Behavior**
- Round, `shrink-0`, subtle `bg-white/5` so transparent marks stay visible on dark glass.
- Unknown asset or load error → colored letter badge (2 letters, color from `ASSET_METADATA`, see "Asset colors"). The UI never shows a broken image.
- `loading="lazy"`, `decoding="async"`, not draggable; alt text `"<SYMBOL> logo"`.
- Plain `<img>` is used on purpose (tiny local SVGs; no image optimizer needed).

**Size scale**

| Size | Use |
|------|-----|
| 12px | Table/column headers (order book, trade tape), form labels, inline balance lines |
| 14–16px | Section titles, Buy/Sell buttons, "Available" lines, sheet titles |
| 20–24px | Pair selector, swap asset button, dense list rows |
| 28–36px | Wallet rows, markets rows, onboarding picker, welcome floating coins |
| 40px | Hero / detail headers |

**Where logos appear**: wallet (desktop + mobile), markets lists, pair selector (header + dropdown), onboarding picker, welcome screen, order book (title, column headers, bid/ask totals), trade tape (count + Size/Price headers), order entry (Buy/Sell buttons, Available, Price/Amount labels), mobile order sheet, swap (asset picker, From/To balances).

**Swap asset picker** replaces the native `<select>` (which cannot render images) with a Popover: trigger = logo + symbol + chevron (`bg-elevated/60`, `border-border`, `rounded-lg`); list = `glass-raised`, width `w-44` (11rem), max height `max-h-72`, rows with logo (22px), symbol and full name; current item highlighted `bg-white/5`.

**Adding a coin**: drop `public/crypto/<symbol>.svg` (square or circular, ≤ 4 KB preferred) and add the symbol to `LOGOS` in `coin-icon.tsx`. Add its entry to `ASSET_METADATA` for the fallback color and name.

**Rules**
- Always use `CoinIcon`; do not hard-code `<img src="/crypto/…">` or colored initials.
- Do not recolor, crop non-circularly, or add effects to a logo. Keep the circular mask.
- Pair rows may show base logo only; show both (base over quote) only when the quote is not USDT.
- Keep logo + text vertically centered (`inline-flex items-center gap-1…2`).

---

## 7. Key Patterns Extracted from 2026 Crypto Apps

These patterns are now first-class in the Mbuni system:

| Pattern | Implementation Guidance |
|---------|--------------------------|
| **Progressive onboarding** | One question / step per screen. Clear progress indicator. |
| **Zero-balance state** | Large balance + strong “Add money” / “Buy assets” CTAs + verification nudge. |
| **Dual-speed UI** | Simple mode (cards, promos) vs Pro mode (dense lists, order book). |
| **Category discovery** | Horizontal scroll of themed cards (AI, DeFi, Memecoins, Layer 2, RWA…). |
| **Hot / Trending modules** | Side-by-side cards for Trending vs Most Bought / Most Sold. |
| **Action sheet hierarchy** | Buy → Recurring → Sell → Convert → Advanced (Perps). |
| **High-contrast primary CTA** | White or purple solid buttons against pure black. |
| **Soft glass lists** | Dark cards with subtle borders and generous spacing. |
| **Asset row consistency** | Icon + Name/Ticker left, Price + % right, always tabular. |
| **Feature discovery** | “Discover more” list with icons + short descriptions. |

---

## 8. Do / Don’t

**Do**
- Keep primary numbers large and tabular.
- Use tempered glass for cards and sheets.
- Make the center `+` action highly visible.
- Prefer progressive disclosure in forms and onboarding.
- Use lime strictly for positive / brand moments.
- Keep secondary actions as dark glass pills.
- Show the real coin logo (`CoinIcon`) wherever an asset is named.

**Don’t**
- Use lime as the primary button color.
- Overcrowd screens with too many competing CTAs.
- Skip confirmation steps for irreversible actions.
- Mix too many different card styles on one screen.
- Use pure white borders or heavy shadows that break the glass feel.
- Animate in ways that block interaction.
- Recreate coin icons with colored initials, or recolor/distort official logos.
- Use native `<select>` for asset choice — it cannot show logos; use the Popover picker.

---

## 9. File Reference

- Tokens & base styles → `src/app/globals.css` (`@theme`)
- Shared components → `src/components/ui/`
- Coin logos → `public/crypto/*.svg` (+ `LICENSES.md`), component `src/components/opencex/coin-icon.tsx`
- Glass utilities (`.glass`, `.glass-raised`, `.glass-pro`, `.glass-soft`, `.glass-solid`, `.tab-bar-glass`, `.tnum-tight`) → `src/app/globals.css`
- This document → living source of truth for design decisions

---

*Changelog (Oct 2026): added §6.11 Coin Logos / `CoinIcon`; asset colors are now fallback-only; Asset Rows use real logos; swap asset picker is a Popover with logos.*

*Last updated: October 2026 — patterns refined from real 2026 Kraken mobile app analysis + original NovaTrade / Mbuni case study principles.*
