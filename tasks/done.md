# Done

_Completed features will be logged here._

---

## F09 — UpvoteButton component
- Props: `voteCount`, `hasVoted`, `onVote`, `size: sm | lg`
- Voted state: amber border + tinted background
- `aria-pressed` reflects voted state
- Size variants: `sm` (text-xs) for cards, `lg` (text-base) for detail page
- Tests: 6/6 ✓

---

## F08 — ProductCard component
- Props: `product` (id, slug, name, tagline, logo_url, vote_count, has_voted, maker), `onVote`
- Upvote button: left-side chevron + count, `aria-pressed` voted state, calls `onVote(id)`
- Logo placeholder when `logo_url` is null
- Product name links to `/p/[slug]`
- Maker name displayed as "by [name]"
- Tests: 6/6 ✓

---

## F07 — Avatar component
- Props: `name`, `email`, `avatarUrl?`, `size: sm | md`
- Renders initials (two-word name → two initials, single name → one, null name → email initial)
- Renders `<img>` when `avatarUrl` provided
- Size variants: `sm` (w-7) and `md` (w-9, default)
- Tests: 6/6 ✓

---

## F06 — Header component
- Props: `user: { name, email } | null`
- Logged out: logo + Submit link + Sign in link
- Logged in: logo + Submit link + avatar with initials (name initials or email initial fallback)
- Tests: 6/6 ✓

---

## F05 — MSW mock handlers
- Installed `msw`, initialised service worker in `public/`
- `src/mocks/handlers.ts`: all 9 MVP endpoints with realistic Gambian product mock data
- `src/mocks/browser.ts`: browser worker (activated in dev only via `main.tsx`)
- `src/mocks/server.ts`: node server wired into Vitest setup
- `src/test/setup.ts`: MSW server lifecycle (beforeAll/afterEach/afterAll)
- Fixed Vitest picking up e2e/ files — added `include: src/**` + `exclude: e2e/**`
- Tests: 4/4 ✓

---

## F04 — Playwright
- Installed `@playwright/test`, Chromium browser
- `playwright.config.ts`: baseURL `localhost:3000`, Chromium only, webServer auto-start
- `e2e/smoke.spec.ts`: home page loads → 1/1 ✓

---

## F03 — Vitest + Testing Library
- Installed: `@testing-library/user-event`, `@testing-library/jest-dom`
- Configured vitest in `vite.config.ts`: jsdom environment, setupFiles, globals
- Created `src/test/setup.ts` with jest-dom import
- Smoke test passes: 1/1 ✓

---

## F02 — Tailwind semantic CSS variable system and brand tokens
- Tailwind v4 `@theme` directive in `src/styles.css`
- Tokens: primary (green), accent (amber), surface, border, foreground, destructive, success
- Font: Plus Jakarta Sans via Google Fonts in `index.html`
- Body defaults set: font-family, background, colour, antialiasing
- Build confirmed clean: 1.67s, no errors

---

## F01 — Scaffold TanStack Start project with pnpm
- Scaffolded with: React, Vite, TypeScript, Tailwind, Biome
- Structure: `src/routes/`, `src/main.tsx`, `src/router.tsx`, `src/styles.css`
- Dev server confirmed: 200 on `localhost`
- `.gitignore` restored with `musaajallo/`, `coverage/`, `playwright-report/`, `test-results/`
