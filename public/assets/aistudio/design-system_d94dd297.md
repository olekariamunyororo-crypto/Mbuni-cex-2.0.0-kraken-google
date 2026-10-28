# Mbuni Design System

Mobile-first crypto wallet & exchange UI for **Mbuni**.  
Source of truth in the app: `src/index.css` (Tailwind v4 `@theme`) and shared UI under `src/components/ui/`.

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

---

## 2. Color tokens

Defined in `src/index.css` as CSS variables under `@theme`. Tailwind maps them to utilities like `bg-bg`, `text-primary`, `border-line`.

### Brand & actions

| Token | CSS variable | Value | Usage |
|-------|--------------|-------|--------|
| Primary / Accent | `--color-primary`, `--color-accent` | `#a3e635` | Logo, active tab, success, chart up, positive % |
| Primary hover | `--color-primary-hover` | `#bef264` | Lime hover states |
| Primary soft | `--color-primary-soft` | `rgba(163, 230, 53, 0.14)` | Lime washes, selected chips |
| Primary muted | `--color-primary-muted` | `rgba(163, 230, 53, 0.08)` | Very soft lime backgrounds |
| CTA | `--color-cta` | `#7f66ff` | Primary buttons (always) |
| CTA hover | `--color-cta-hover` | `#9580ff` | Primary button hover |
| CTA soft | `--color-cta-soft` | `rgba(127, 102, 255, 0.14)` | Purple soft backgrounds |
| Gold | `--color-gold` | `#e0a23a` | Premium / membership accents (use sparingly) |

### Surfaces & text (Tempered Glass system)

| Token | CSS variable | Value | Usage |
|-------|--------------|-------|--------|
| Background | `--color-bg` | `#07080c` | Deepest app canvas (slightly deeper for glass contrast) |
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
| Hero balance / large price | `text-[32px]–[36px] font-bold tracking-tight tnum` | High impact |
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
| Primary buttons (lg) | `rounded-[14px]` |
| Buttons (md / sm) | `rounded-xl` |
| Chips / pills | `rounded-full` |
| Icon wells | `rounded-2xl` / `rounded-full` |

### Layout shell

- Outer: centered flex, deep black letterbox (`bg-bg`).
- Inner: `max-w-md` phone column.
- Trade screen: may expand to `md:max-w-5xl` with side-by-side chart + order book.
- Tab bar: fixed bottom, high z-index, glass treatment (`.tab-bar-glass`).

---

## 6. Components

### Button (`src/components/ui/Button.tsx`)

| Variant | Style |
|---------|--------|
| `primary` (default) | `bg-cta text-white` · hover `bg-cta-hover` |
| `secondary` | `bg-white text-black` |
| `outline` | Transparent, glass border |
| `ghost` | `text-primary` · hover `bg-primary/10` |
| `danger` | `border-danger/40 bg-danger/15 text-danger` |

| Size | Spec |
|------|------|
| `lg` (default) | Full width, `h-[52px]`, `rounded-[14px]`, `text-[16px]` |
| `md` | `h-11`, `px-5`, `rounded-xl`, `text-[15px]` |
| `sm` | `h-9`, `px-4`, `rounded-xl`, `text-[13px]` |

- Disabled / loading: `opacity-40`
- Tap: soft scale `0.98` + slight opacity change for smoothness
- Loading preserves width

### TextField

- Height `h-[52px]`, `rounded-xl`
- Glass treatment: `bg-surface/80 backdrop-blur-md border-glass-border`
- Focus: brighter border + soft primary glow
- Error / success / warning variants with soft semantic backgrounds

### Cards & lists

- Prefer `.glass` or `.glass-raised` for all major content cards.
- Use `.glass-pro` only inside Trade / advanced views.
- Asset rows sit cleanly on glass with `active:bg-white/5` for smooth press feedback.

### Order Ticket

- Built on `.glass-raised` or `.glass-pro`.
- Large Buy / Sell segmented control with soft semantic fills.
- Amount + % chips + clear fee preview.
- Primary CTA remains solid purple for maximum affordance.

### AI Insight Card

- Uses `.glass-soft`.
- Subtle left accent (lime or purple).
- Dismissible, low visual weight.

### Tab bar

- Always use `.tab-bar-glass` (deep blur + subtle top border).
- Active tab: lime icon + soft lime well.
- Inactive: muted.

### Focus & touch

```css
:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}
input:focus-visible { outline: none; }
button, a, input, [role="button"], [role="tab"] {
  touch-action: manipulation;
}
```

---

## 7. Iconography & brand mark

- **Icons:** Lucide React; 12–22px; stroke ~1.8 inactive, ~2.4 active.
- **Logo:** Ostrich silhouette in `text-primary`.
- **Favicon:** `/ostrich-favicon.svg`.
- Keep the mascot sparse — glass should be the star, not the illustration.

---

## 8. Motion guidelines (Smooth)

| Pattern | Guidance |
|---------|----------|
| Buttons | Soft scale `0.97–0.98` + 120–160ms ease-out |
| Cards / rows | Instant `active:bg-white/5` or very light scale |
| Sheets / modals | Opacity + 8–12px Y translate, 200–250ms spring or ease |
| Page transitions | Prefer static or ultra-light cross-fade |
| Reduced motion | Fully respect `prefers-reduced-motion` |
| Blur performance | Avoid animating `backdrop-filter` directly |

Aim for buttery, quiet motion. Nothing should feel bouncy or delayed.

---

## 9. Do / Don’t

**Do**

- Use the glass utility classes (`.glass`, `.glass-raised`, `.glass-pro`, `.glass-soft`).
- Always include the subtle inset top highlight for tempered edge.
- Keep purple for every primary action.
- Apply `.tnum` on all financial numbers.
- Fall back to solid surfaces on very long lists if performance drops.
- Test glass readability on real devices (especially older Android).

**Don’t**

- Use pure solid dark cards when glass is appropriate.
- Stack more than 2–3 heavy backdrop-blur layers.
- Make glass so transparent that text becomes hard to read.
- Use lime as a filled primary button.
- Animate `backdrop-filter` values (expensive).
- Skip the soft border + highlight — that’s what makes it feel tempered.

---

## 10. Raw `@theme` tokens (copy-paste)

```css
@theme {
  /* Brand */
  --color-primary: #a3e635;
  --color-accent: #a3e635;
  --color-primary-hover: #bef264;
  --color-primary-soft: rgba(163, 230, 53, 0.14);
  --color-primary-muted: rgba(163, 230, 53, 0.08);
  --color-cta: #7f66ff;
  --color-cta-hover: #9580ff;
  --color-cta-soft: rgba(127, 102, 255, 0.14);
  --color-gold: #e0a23a;

  /* Tempered Glass surfaces */
  --color-bg: #07080c;
  --color-surface: rgba(20, 22, 31, 0.72);
  --color-surface-solid: #14161f;
  --color-elevated: rgba(26, 29, 42, 0.78);
  --color-elevated-solid: #1a1d2a;
  --color-elevated-pro: rgba(30, 34, 48, 0.82);
  --color-glass-highlight: rgba(255, 255, 255, 0.06);
  --color-glass-border: rgba(255, 255, 255, 0.09);

  /* Text & lines */
  --color-secondary: #9ca3af;
  --color-tertiary: #6b7280;
  --color-muted: #8e8e93;
  --color-line: rgba(255, 255, 255, 0.08);
  --color-divider: rgba(255, 255, 255, 0.06);
  --color-overlay: rgba(7, 8, 12, 0.68);
  --color-disabled: rgba(255, 255, 255, 0.25);

  /* Semantic */
  --color-success: #a3e635;
  --color-success-soft: rgba(163, 230, 53, 0.12);
  --color-danger: #ff5c5c;
  --color-danger-soft: rgba(255, 92, 92, 0.12);
  --color-warning: #ff9f0a;
  --color-warning-soft: rgba(255, 159, 10, 0.12);
  --color-focus: #a3e635;

  /* Assets */
  --color-btc: #f7931a;
  --color-eth: #627eea;
  --color-usdt: #26a17b;
  --color-sol: #9945ff;
  --color-bnb: #f3ba2f;
  --color-link: #2a5ada;
  --color-ada: #0033ad;

  --font-sans: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
```

---

## 11. File map

| Path | Role |
|------|------|
| `src/index.css` | Tokens + glass utilities (`.glass`, `.glass-raised`, etc.) |
| `index.html` | Inter font, theme-color `#07080c` |
| `src/components/ui/Button.tsx` | Button variants + sizes |
| `src/components/ui/TextField.tsx` | Glass-styled form fields |
| `src/components/ui/controls.tsx` | Tabs, chips, segmented controls |
| `src/components/ui/AssetRow.tsx` | Standard asset list row |
| `src/components/ui/OrderTicket.tsx` | Trading order entry (glass-pro) |
| `src/components/ui/AIInsightCard.tsx` | Soft glass AI card |
| `src/components/ui/StatusBadge.tsx` | Semantic status pills |
| `src/components/layout/TabBar.tsx` | Glass tab bar |
| `src/components/layout/Page.tsx` | Screen shell |
| `src/components/Ostrich.tsx` | Brand mark |

---

*Refined for a smooth dark tempered glass aesthetic (2026).  
Update this document whenever glass tokens or core utilities change.*
