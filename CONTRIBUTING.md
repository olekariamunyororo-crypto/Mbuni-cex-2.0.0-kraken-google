# Contributing to Mbuni CEX

Thanks for taking the time to contribute! 🦬 (Yes, that's an ostrich emoji — close enough.)

This document covers everything you need to know to set up the project, make changes, and get them merged.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Project Setup](#project-setup)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Commit Conventions](#commit-conventions)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Storybook](#storybook)
- [Changelog](#changelog)
- [Database Changes](#database-changes)
- [Working on Specific Areas](#working-on-specific-areas)
  - [Matching Engine](#matching-engine)
  - [Auth & Sessions](#auth--sessions)
  - [UI Components](#ui-components)
  - [Infra / Helm / Docker](#infra--helm--docker)
- [Releasing](#releasing)
- [Getting Help](#getting-help)

---

## Code of Conduct

Be kind. Be patient. Assume good intent. Disagreements happen — focus on the work, not the person. Personal attacks, harassment, or discrimination of any kind will not be tolerated.

By participating, you agree to abide by the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

---

## Project Setup

You'll need:

| Tool | Version | Why |
|---|---|---|
| Node.js | 20+ | Next.js 16 runtime |
| Bun | 1.1+ | Recommended package manager + script runner |
| Git | any | Version control |

### First-time setup

```bash
# 1. Fork + clone the repo (replace YOUR_USERNAME)
git clone https://github.com/YOUR_USERNAME/mbuni-cex.git
cd mbuni-cex
git remote add upstream https://github.com/your-org/mbuni-cex.git

# 2. Install dependencies
bun install
# ↑ This also installs the husky pre-commit hook automatically (via the
#   "prepare" script in package.json). The hook runs lint-staged + unit
#   tests + a secret scan before every commit.

# 3. Configure env
cp .env.example .env
# Edit .env — set NEXTAUTH_SECRET (any 32+ char string for dev is fine)

# 4. Set up the database
bun run db:push

# 5. (Optional) Seed demo users
bun run db:seed

# 6. Start the dev server
bun run dev
```

Open <http://localhost:3000> — you should see the splash screen, then the welcome carousel.

### Useful dev scripts

```bash
bun run dev          # Hot-reloading dev server on :3000
bun run lint         # ESLint check
bun run db:push      # Apply schema changes to local DB
bun run db:generate  # Regenerate Prisma Client after editing schema.prisma
bunx tsx scripts/check-db.ts    # Inspect users + onboarding state
```

---

## Development Workflow

We use a **fork + feature-branch** workflow:

```bash
# Sync your fork with upstream
git fetch upstream
git checkout main
git merge upstream/main
git push origin main

# Create a feature branch
git checkout -b feat/my-new-thing

# Make changes, commit, push
git add .
git commit -m "feat(trading): add stop-limit order type"
git push -u origin feat/my-new-thing

# Open a PR on GitHub: your-fork:feat/my-new-thing → upstream:main
```

### Branch naming

Use a prefix that matches the type of change:

| Prefix | Use for |
|---|---|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `refactor/` | Code reorganization, no behavior change |
| `docs/` | Documentation only |
| `chore/` | Build, deps, CI, tooling |
| `perf/` | Performance improvements |
| `test/` | Test additions or fixes |
| `infra/` | Docker, Helm, k8s, deployment |

Examples: `feat/stop-limit-orders`, `fix/splash-loop-on-reload`, `docs/deployment-guide`.

---

## Code Style

### Enforced by ESLint

Run `bun run lint` before pushing. The config lives in `eslint.config.mjs` and uses `eslint-config-next` + `@typescript-eslint`.

Key rules:

- **TypeScript strict mode** — no implicit `any`, no unchecked index access.
- **`react-hooks/exhaustive-deps`** — every dependency of `useEffect` / `useMemo` / `useCallback` must be in the dep array.
- **`react-hooks/set-state-in-effect`** — don't call `setState` directly inside `useEffect`. Compute state during render instead, or move the side-effect to an event handler.
- **No `@ts-ignore`** — use `@ts-expect-error` with a comment if you absolutely must suppress a TS error, and only as a last resort.

### Formatting

The project doesn't use Prettier — ESLint handles formatting. General conventions:

- **2-space indentation**
- **Double quotes** for strings (matches the existing codebase)
- **Semicolons** — always
- **Trailing commas** in multi-line objects/arrays
- **`const` over `let`** unless you actually reassign
- **Named exports** for components (`export function MyComponent()`), default exports only for Next.js pages
- **One component per file** — extract sub-components into named functions in the same file if they're tightly coupled

### File naming

- **Components**: `kebab-case.tsx` (e.g. `order-book.tsx`, `mobile-nav.tsx`)
- **Lib modules**: `kebab-case.ts` (e.g. `format.ts`, `engine.ts`)
- **Pages**: Next.js App Router convention (`page.tsx`, `layout.tsx`, `route.ts`)
- **Tests** (future): `*.test.ts` or `*.spec.ts` colocated with the source

### TypeScript

- **Don't use `any`** — use `unknown` + narrow, or define a proper type.
- **Prefer `interface` for object shapes**, `type` for unions/intersections/mapped types.
- **Always type function parameters and return types** for exported functions.
- **Use `as` only for type assertions you've verified** — prefer type guards.
- **Don't re-export types from `index.ts`** — import them from their source file directly.

### React

- **Function components only** — no class components.
- **`"use client"` directive at the top of any file using hooks**.
- **Server Components by default** — only opt into `"use client"` when you need state, effects, or browser APIs.
- **One default export per page** — Next.js requires this.
- **Always pass `key` to list items** — use a stable ID, not the array index.
- **Don't read state in render that you set in an effect** — this creates infinite loops. Compute it during render.

### Zustand store

- **Selectors must return stable references** — don't do `useStore((s) => s.items.filter(...))` because that creates a new array every render. Either return the raw array and filter with `useMemo` in the component, or use `useShallow` from `zustand/react/shallow`.
- **Actions go in the store, not in components** — components call actions, they don't implement them.
- **Use `useOpenCEX.getState()` for one-off reads outside React** (e.g. inside event handlers).

### Tailwind CSS

- **Use the shadcn/ui components** in `src/components/ui/` — don't reinvent buttons, inputs, cards.
- **Responsive: mobile-first** — write `px-3 md:px-4`, not `px-4 md:px-3`.
- **Use semantic color tokens** (`bg-card`, `text-muted-foreground`, `border-border`) — never raw hex codes or oklch values inline.
- **No `@apply` in components** — only in `globals.css` for base styles.
- **`hidden md:flex` pattern** for responsive show/hide — don't render two separate component trees.

### Accessibility

- **Semantic HTML** — `<button>` for clicks, `<a>` for navigation, `<nav>` for navigation lists, `<main>` for the main content area.
- **Always label icon-only buttons** — `aria-label` or `<span className="sr-only">`.
- **Keyboard navigation** — every interactive element must be reachable + operable with Tab + Enter/Space.
- **Color contrast** — don't use `text-muted-foreground/40` for important content; use ≥ 4.5:1 contrast.
- **Don't disable focus outlines** — if you must, provide an alternative `:focus-visible` style.

---

## Commit Conventions

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body?>

<footer?>
```

### Types

| Type | Use for |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Code style (whitespace, formatting) — no logic change |
| `refactor` | Code reorganization — no behavior change |
| `perf` | Performance improvement |
| `test` | Adding or fixing tests |
| `build` | Build system, dependencies |
| `ci` | CI/CD changes |
| `chore` | Misc housekeeping |
| `revert` | Reverting a previous commit |

### Scopes (optional but encouraged)

`auth`, `trading`, `markets`, `swap`, `wallet`, `admin`, `architecture`, `engine`, `db`, `ui`, `infra`, `deps`.

### Examples

```
feat(trading): add stop-limit order type
fix(auth): prevent splash loop when session resolves late
docs(readme): add Docker deployment instructions
perf(engine): avoid re-snapshotting book on every MM tick
build(deps): bump next from 16.1.1 to 16.1.3
ci: add staging deploy job on push to main
```

### Subject rules

- **Imperative mood** — "add", not "added" or "adds"
- **Lowercase** — don't capitalize the first letter
- **No trailing period**
- **≤ 72 chars** — keep it scannable

### Breaking changes

```
feat(auth)!: switch from JWT to database sessions

BREAKING CHANGE: existing JWTs are invalidated. All users will need to
log in again after this deploys.
```

The `!` after the scope marks the commit as breaking.

---

## Pull Request Process

### Before opening a PR

1. **Sync with upstream** — `git fetch upstream && git merge upstream/main`. Rebase if your branch has merge commits.
2. **Run lint** — `bun run lint` must pass.
3. **Run build** — `bun run build` must pass (this catches type errors lint might miss).
4. **Test in the browser** — desktop AND mobile viewport (390×844 covers iPhone 12).
5. **Update the README** if you changed anything user-facing.
6. **Don't commit secrets** — `.env`, API keys, tokens. The `.gitignore` excludes `.env*` but be careful with screenshots and log dumps.

### PR template

The PR template at `.github/PULL_REQUEST_TEMPLATE.md` will auto-populate. Fill in:

- **Summary** — one paragraph, what + why
- **Type of change** — check the boxes
- **Related issues** — `Closes #123` auto-closes the issue on merge
- **Checklist** — every box should be checked before requesting review
- **Screenshots** — for any UI change
- **Notes for reviewers** — anything risky, tricky, or worth a second look

### Review criteria

Reviewers will check:

- [ ] Lint + build pass
- [ ] No console errors in the browser
- [ ] Mobile layout works (390px viewport)
- [ ] No secrets committed
- [ ] DB changes are backward-compatible OR include a migration
- [ ] Breaking changes are flagged in the PR title with `!` and described in the body
- [ ] Tests added for new logic (when we have a test setup)
- [ ] Docs updated

### After merge

- Squash-merge is the default — your commit history on the branch doesn't matter, but your PR title does (it becomes the squash commit message).
- Delete your branch after merge (GitHub does this automatically if you check the box).
- If you merged into `main`, the CI/CD pipeline will deploy to staging automatically. Watch the Actions tab.

---

## Testing

We have **Vitest** for unit tests and **Playwright** for e2e tests.

### Running tests

```bash
# Unit tests (fast — pure logic, no browser)
bun run test:unit              # one-shot
bun run test:unit:watch        # watch mode
just test-unit                 # via justfile
make test-unit                 # via Makefile

# E2e tests (slow — drives a real browser)
bunx playwright install        # one-time: download browser binaries (~150MB)
bun run test:e2e               # run all e2e tests
bun run test:e2e:ui            # interactive UI mode (great for debugging)
just test-e2e                  # via justfile
make test-e2e                  # via Makefile

# Everything
bun run test                   # unit + e2e
just test                      # via justfile
make test                      # via Makefile

# CI equivalence check (what GitHub Actions runs on PRs)
make ci-check                  # lint + unit tests + build
```

### Unit tests (Vitest)

- **Config**: `vitest.config.ts`
- **Location**: `src/**/*.test.ts` (colocated with the source file)
- **Run in Node** — no jsdom, no browser. Pure logic only.
- **Coverage**: `bun run test:unit -- --coverage` (uses v8 provider)

Existing test files:

| File | What it covers |
|---|---|
| `src/lib/opencex/engine.test.ts` | All 5 order types, price-time priority, FOK pre-flight check, POST_ONLY rejection, cancel, events, snapshot math |
| `src/lib/opencex/engine.property.test.ts` | **Property-based tests** (fast-check, 500 runs each) — quantity conservation, FOK all-or-nothing, POST_ONLY maker-only, no-crossed-book invariant, IOC never rests, well-formed trades, cancel preserves book integrity |
| `src/lib/opencex/format.test.ts` | `fmtPrice`, `fmtQty`, `fmtUSD`, `fmtCompact`, `fmtPct`, `fmtTime`, `shortAddr`, `shortHash` — including null/undefined/NaN edge cases |

**When adding unit tests:**

- Name the file `<source>.test.ts` (e.g. `engine.test.ts` next to `engine.ts`).
- Use `describe`/`it`/`expect` from `vitest` (explicit imports — no globals).
- Test the **contract**, not the implementation. If the contract says "FOK fills entirely or not at all", test both branches.
- Use `toBeCloseTo` for float comparisons, never `toBe` — JavaScript floats are not exact.
- Test edge cases: null, undefined, 0, negative, very large, very small.
- Don't test shadcn/ui components or anything in `src/components/ui/` — those are vendored.

**When adding property-based tests:**

Property tests use [fast-check](https://fast-check.dev/) to generate thousands of random inputs and verify invariants hold. They're ideal for the matching engine where edge cases are subtle.

- Name the file `<source>.property.test.ts`.
- Use `fc.assert(fc.property(arb, predicate), { numRuns: 500 })` — 500 runs is a good default.
- Test **invariants**, not specific examples. "For any order, filledQty + remainingQty ≤ qty" is a property; "placing order X produces result Y" is an example test (use the regular .test.ts file).
- When a property fails, fast-check shrinks to the minimal counterexample — read it carefully, it usually reveals a real bug.
- Use `Math.fround()` on float min/max in `fc.float()` constraints — fast-check requires 32-bit floats.
- For prices/quantities, generate reasonable ranges (e.g. `fc.integer({ min: 100, max: 100000 })` for price) to avoid pathological inputs that aren't meaningful.
- Use tolerance (`1e-6`) when comparing engine output to fast-check inputs — the engine rounds to `baseDecimals`.

### E2e tests (Playwright)

- **Config**: `playwright.config.ts`
- **Location**: `tests/e2e/*.spec.ts`
- **Two projects**: `desktop-chrome` (1280×720) and `mobile-iphone` (iPhone 14 viewport — 390×844)
- **Auto-starts the dev server** if not already running (via `webServer` config)
- **Serial execution** (`workers: 1`) — tests share a DB and create users

Existing test files:

| File | What it covers |
|---|---|
| `tests/e2e/auth-flow.spec.ts` | splash → welcome → signup → onboarding → app → logout; login with existing user; wrong password rejection |
| `tests/e2e/trading.spec.ts` | Place LIMIT BUY that crosses → fills; switch trading pair; cancel resting order |
| `tests/e2e/visual.spec.ts` | **Visual regression** — captures screenshots of splash, all 3 welcome slides, auth (login + signup), trading terminal, markets, wallet, admin, architecture. Diffs against baselines on every run. |

**When adding e2e tests:**

- Name the file `<feature>.spec.ts`.
- Use `page.goto("/")` to start — the config auto-handles the dev server.
- Use `getByRole` / `getByPlaceholder` / `getByLabel` for locators — not CSS selectors. They survive refactors.
- Use unique emails per test run: `e2e-${Date.now()}@mbuni.cex` — tests share a DB.
- For `beforeAll` setup, use the API directly when possible (faster than driving the UI).
- Don't `await page.waitForTimeout(...)` — wait for visible state with `expect(...).toBeVisible({ timeout: ... })`.
- Run `just test-e2e-ui` to debug a flaky test interactively.

**When adding visual regression tests:**

- Add to `tests/e2e/visual.spec.ts` (or a new `tests/e2e/<feature>.visual.spec.ts`).
- Use `await expect(page).toHaveScreenshot("name.png", { ... })`.
- **Mask dynamic content** with the `mask` option — prices, timestamps, balances, chart areas, anything that ticks. Otherwise the test will flake on every run.
- Use `maxDiffPixelRatio: 0.01` (1%) for static screens, `0.02` (2%) for screens with live data.
- Set `animations: "disabled"` to avoid catching mid-animation frames.
- **Baselines are committed to git** in `tests/e2e/__screenshots__/` — so visual regressions are caught in PRs.
- After an intentional UI change, update baselines: `just test-e2e-update` (or `bun run test:e2e:update`), then commit the new PNGs.
- CI uploads the diffed screenshots as an artifact on failure — download and inspect before updating baselines.

### Pre-commit hook (husky + lint-staged)

Every `git commit` triggers `.husky/pre-commit`, which runs:

1. **lint-staged** — runs `eslint --fix` on staged TS/TSX files only (fast, scoped to your changes)
2. **Unit tests** — full Vitest run (~500ms) to catch regressions before they land
3. **Secret scan** — blocks commits that match common secret patterns (NEXTAUTH_SECRET, API keys, AWS tokens, etc.)

**Bypass** (emergency only — CI will still catch issues):

```bash
git commit --no-verify
```

Don't make this a habit. If a test is flaky, fix the test, don't bypass the hook.

**Modifying the hook**: edit `.husky/pre-commit` (it's a plain shell script). The lint-staged config is in `.lintstagedrc.json`.

### Manual testing checklist

Automated tests cover the happy path. For edge cases + visual regressions, manually verify:

**Matching engine** (covered by unit tests, but verify in-browser too):

- [ ] Place a LIMIT order that crosses the spread → fills immediately, status `FILLED`
- [ ] Place a LIMIT order that doesn't cross → rests on book, status `NEW`
- [ ] Place a MARKET order → fills against the book, status `FILLED` (or `CANCELLED` if no liquidity)
- [ ] Place an IOC order that partially fills → fills what it can, cancels the rest, status `PARTIALLY_FILLED`
- [ ] Place a FOK order that can't fully fill → entire order cancelled, status `CANCELLED`, book untouched
- [ ] Place a POST_ONLY order that would cross → rejected, status `REJECTED`
- [ ] Cancel a resting order → status `CANCELLED`, balance unlocked

**Auth** (covered by e2e tests):

- [ ] Signup with valid email + 8+ char password → account created, signed in, routed to onboarding
- [ ] Signup with existing email → 409 error, stays on auth screen
- [ ] Login with correct creds → routed to app (or onboarding if not complete)
- [ ] Login with wrong password → toast error, stays on auth screen
- [ ] Reload after login → routed straight to app (session persists)
- [ ] Logout → routed to welcome screen

**UI / responsive** (manual — no automated visual regression yet):

- [ ] Desktop (1440px) — layout intact
- [ ] Tablet (768px) — transitions work
- [ ] Mobile (390px) — bottom nav, no horizontal overflow, touch targets ≥ 44px

---

## Storybook

Component-driven development playground. Browse + develop UI components in isolation at <http://localhost:6006>.

```bash
bun run storybook               # or: just storybook / make storybook
```

### Existing stories

| File | What it covers |
|---|---|
| `src/components/opencex/ostrich-logo.stories.tsx` | The ostrich logo at various sizes, on different backgrounds (gradient, dark, emerald, red) |
| `src/lib/opencex/format.stories.tsx` | All formatting functions with edge cases — useful for visual QA |
| `src/components/opencex/order-book.stories.tsx` | Live order book for BTC/ETH/SOL/DOGE pairs |
| `src/components/opencex/trade-tape.stories.tsx` | Live trade tape for various pairs |
| `src/components/opencex/order-entry.stories.tsx` | Order entry panel with pre-set BUY/SELL modes |

### When adding stories

- Name the file `<component>.stories.tsx` next to the component.
- Use Component Story Format (CSF) — see existing stories for examples.
- Export a `meta` object (with `title`, `component`, `tags: ["autodocs"]`, `args`) and named story exports.
- For components that depend on the Zustand store, use a decorator that calls `useOpenCEX((s) => s.init)` in a `useEffect`:
  ```tsx
  decorators: [
    (Story) => {
      const init = useOpenCEX((s) => s.init);
      useEffect(() => { init(); }, [init]);
      return <Story />;
    },
  ],
  ```
- Provide multiple stories that cover the meaningful states (different pairs, sizes, colors, edge cases).
- Don't add stories for shadcn/ui primitives in `src/components/ui/` — those are vendored.
- The Storybook config is at `.storybook/main.ts` (stories glob, addons, framework) and `.storybook/preview.ts` (global parameters, theme, backgrounds).

---

## Changelog

All notable changes are documented in [CHANGELOG.md](CHANGELOG.md), following [Keep a Changelog](https://keepachangelog.com/) format.

### When to add a changelog entry

Every PR that changes user-visible behavior should add an entry under `[Unreleased]` at the top of `CHANGELOG.md` under the appropriate section:

- `### Added` — new features
- `### Changed` — changes in existing functionality
- `### Deprecated` — soon-to-be removed features
- `### Removed` — now removed features
- `### Fixed` — bug fixes
- `### Security` — vulnerability fixes

### Format

```markdown
## [Unreleased]

### Added
- Stop-limit order type (`feat(trading): add stop-limit orders`)
```

Keep entries concise — one line per change, with the PR number or commit reference in backticks. Reviewers will check that the changelog is updated as part of the PR review.

### At release time

When cutting a release (`v1.1.0` tag):

1. Rename `[Unreleased]` to `[1.1.0] — YYYY-MM-DD`
2. Add a fresh `[Unreleased]` section above it
3. Update the link references at the bottom of the file
4. The CI/CD pipeline auto-creates the GitHub Release with `softprops/action-gh-release` when the tag is pushed

---

## Database Changes

### Editing the schema

1. Edit `prisma/schema.prisma`.
2. Run `bun run db:push` to apply the change locally.
3. The Prisma Client auto-regenerates.
4. If you added a new model, the lint will complain about unused imports until you use it.

### Adding a migration (for production safety)

`db:push` is fine for dev. For prod, we need versioned migrations:

```bash
# After editing schema.prisma
bun run db:migrate --name descriptive_name_of_change
```

This creates a new folder under `prisma/migrations/<timestamp>_descriptive_name_of_change/` containing a `migration.sql` file. **Commit this to git.**

### Backward compatibility

When changing the schema, ask:

- **Adding a column?** — make it nullable or give it a default. Old app versions will still work.
- **Renaming a column?** — don't. Add a new column, backfill data, then remove the old one in a follow-up migration.
- **Removing a column?** — do it in two PRs: first PR stops using the column, second PR removes it (after confirming nothing else references it).
- **Changing a column type?** — same as renaming. Add new, backfill, remove old.

### Seeding

There's no formal seed script — `src/lib/opencex/seed.ts` is used by the client store for demo data. If you add a real seed script (e.g. `prisma/seed.ts`), add it to `package.json`:

```json
"prisma": {
  "seed": "bunx tsx prisma/seed.ts"
}
```

---

## Working on Specific Areas

### Matching Engine

The engine lives at `src/lib/opencex/engine.ts`. It's a TypeScript reference implementation of the production Rust contract from the OpenCEX 2026 spec.

**When changing the engine:**

1. **Read the spec** — `upload/OpenCEX-2026-Spec.md` section 5 has the contract. Don't break it.
2. **Test all 5 order types** — LIMIT, MARKET, IOC, FOK, POST_ONLY. Each has subtle semantics.
3. **Verify the event stream** — every state change should publish a NATS-style event (see `EventSubject` in `types.ts`).
4. **Don't introduce floating-point bugs** — use the `round()` helper from the engine. Never compare floats directly.
5. **Profile before optimizing** — the engine ticks every 1.2s. Don't make it slower, but don't over-engineer either.

### Auth & Sessions

The auth flow lives at:
- `src/lib/auth/config.ts` — NextAuth options
- `src/app/api/auth/[...nextauth]/route.ts` — NextAuth handler
- `src/app/api/signup/route.ts` — signup endpoint
- `src/app/api/onboarding/route.ts` — onboarding save
- `src/app/api/session/route.ts` — session check
- `src/components/opencex/auth/*.tsx` — splash, welcome, auth, onboarding screens

**When changing auth:**

1. **Never log secrets** — `NEXTAUTH_SECRET`, password hashes, JWT contents.
2. **Don't change `NEXTAUTH_SECRET` casually** — changing it invalidates all sessions.
3. **Test the full flow** — splash → welcome → auth → onboarding → app → logout → re-login.
4. **Don't break the routing logic** in `page.tsx` — the stage machine is subtle. If you change it, draw the state diagram first.
5. **bcrypt rounds = 10** — don't increase without measuring signup latency.
6. **JWT expiry = 30 days** — don't make it shorter without a refresh token implementation.

### UI Components

UI components live in `src/components/opencex/` and use shadcn/ui primitives from `src/components/ui/`.

**When changing UI:**

1. **Mobile-first** — write the mobile layout, then add `md:` / `lg:` overrides for desktop.
2. **Test on real devices** — emulator dev tools aren't enough. Use your phone if you can.
3. **Don't add new dependencies** for things shadcn/ui already does. Check `src/components/ui/` first.
4. **Animations via Framer Motion** — already in the project. Don't add GSAP, anime.js, etc.
5. **Icons from Lucide** — already in the project. Don't add heroicons, react-icons, etc.
6. **Tabular numbers** — always use `tabular` class (defined in `globals.css`) for prices, quantities, balances.
7. **Color semantics** — `text-emerald-400` for up/buy, `text-red-400` for down/sell. Don't introduce new colors.

### Infra / Helm / Docker

Infra lives at:
- `Dockerfile` + `.dockerignore` + `docker-compose.yml` — local + self-hosted
- `infra/caddy/Caddyfile` — reverse proxy with auto-TLS
- `infra/k8s/` — Helm chart for Kubernetes
- `.github/workflows/ci-cd.yml` — CI/CD pipeline
- `.github/dependabot.yml` — automated dep updates

**When changing infra:**

1. **Test the Docker build locally** — `docker build -t mbuni-cex:test .` — before pushing.
2. **Test docker-compose** — `docker compose up -d --build` — make sure Postgres + app + Caddy all come up.
3. **Helm chart: lint with `helm lint infra/k8s/`** — catches YAML errors.
4. **Helm chart: template with `helm template infra/k8s/`** — verify the rendered YAML.
5. **Don't bake secrets into images** — use env vars + Kubernetes Secrets / ExternalSecrets.
6. **Don't break the CI pipeline** — every push to main triggers a staging deploy. Test on a branch first.
7. **Bump `appVersion` in `Chart.yaml`** when you cut a new release.

---

## Releasing

We use git tags to trigger releases. The flow:

```bash
# 1. Make sure main is green (CI passing)
git checkout main
git pull upstream main

# 2. Bump version (we use semver)
# Edit package.json → "version": "1.1.0"
# Edit infra/k8s/Chart.yaml → appVersion: "1.1.0", version: "1.1.0"
git commit -am "chore: bump version to 1.1.0"

# 3. Tag
git tag -a v1.1.0 -m "Release v1.1.0 — short description"
git push upstream main --tags

# 4. Watch CI
# - ci-cd.yml runs the deploy-production job on tag refs
# - The job creates a GitHub Release with auto-generated notes
# - The job deploys to production via Helm

# 5. Verify
# - Check the GitHub Release page
# - Check `kubectl get pods -n mbuni-cex` on the prod cluster
# - Hit the prod URL and make sure it boots
```

### Pre-release versions

```bash
git tag -a v1.1.0-rc.1 -m "Release candidate"
git push upstream v1.1.0-rc.1
```

The CI will mark the GitHub Release as a prerelease (because the tag contains `-`).

### Hotfixes

```bash
# Branch from the tag
git checkout -b hotfix/urgent-thing v1.0.0

# Fix, commit, push
git commit -m "fix(auth): prevent session leak on logout"
git push origin hotfix/urgent-thing

# Open PR against main (NOT against a release branch — we don't use those)
# After merge, tag a patch release
git checkout main
git pull
git tag -a v1.0.1 -m "Hotfix: session leak"
git push upstream main --tags
```

---

## Getting Help

- **Bugs** → open a [bug report](https://github.com/your-org/mbuni-cex/issues/new?template=bug_report.md)
- **Feature ideas** → open a [feature request](https://github.com/your-org/mbuni-cex/issues/new?template=feature_request.md) or start a [Discussion](https://github.com/your-org/mbuni-cex/discussions) in the **Ideas** category
- **Questions ("How do I...?")** → start a [Discussion](https://github.com/your-org/mbuni-cex/discussions) in the **Q&A** category (not an issue — issues are for tracked work)
- **Showing off your work** → start a [Discussion](https://github.com/your-org/mbuni-cex/discussions) in the **Show & Tell** category
- **Security vulnerabilities** → **do NOT open a public issue**. See [`SECURITY.md`](SECURITY.md) for the responsible disclosure policy. Report privately via [GitHub Security Advisories](https://github.com/your-org/mbuni-cex/security/advisories/new) or email `security@mbuni.cex` (PGP-encrypted). 48h acknowledgment SLA.

### Code owners

[`CODEOWNERS`](.github/CODEOWNERS) defines which teams are auto-requested as reviewers when a PR touches specific paths. If you're not sure who to ask for help with a particular area, check the table there:

| Path | Owner(s) |
|---|---|
| `src/lib/opencex/engine.ts` + tests | `@your-org/engine-team` |
| `src/lib/auth/`, `src/app/api/auth/` | `@your-org/security-team` |
| `prisma/` | `@your-org/db-team` |
| `src/components/opencex/` | `@your-org/frontend-team` |
| `Dockerfile`, `infra/`, `.github/workflows/` | `@your-org/infra-team` |
| `CHANGELOG.md` | `@your-org/release-team` |
| Default (everything else) | `@your-org/core-maintainers` |

Replace `@your-org/<team>` with individual usernames until the teams are created in your GitHub org.

### Maintainers

| Area | Maintainer |
|---|---|
| Matching engine | TBD |
| Auth + onboarding | TBD |
| UI / UX | TBD |
| Infra / Helm / CI | TBD |

(Maintainer list will be filled in as the project grows.)

---

## Recognition

All contributors are recognized in the GitHub contributors list. Significant contributions may be called out in the changelog / release notes.

Thanks for building Mbuni CEX with us. 🦬
