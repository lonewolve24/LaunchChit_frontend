# Done

_Completed features will be logged here._

---

## F20 — E2E: Submit flow
- Playwright test: visit `/` → click Submit (header) → auth check redirects to `/login?next=/submit` → enter email → confirmation state
- Added mount-time `GET /me` auth check to `/submit` route; 401 → redirect to `/login?next=/submit`
- Updated unit tests to override `/me` handler and wait for form to appear after auth check
- Test: 1/1 ✓

---

## F19 — Product detail route (`/p/[slug]`)
- Fetches `GET /products/:slug`, skeleton while loading
- Renders: logo, name (h1), tagline, description, maker name, vote count, UpvoteButton (lg), Visit website link
- 404 → `PageError` with custom message
- Upvote toggle: 401 → redirect to `/login`, error → Toast
- Tests: 8/8 ✓

---

## F18 — Submit route (`/submit`)
- 5 fields: name (80), tagline (120), description (2000), website_url, logo_url (optional)
- Char counters on length-limited fields
- Validation on submit: required fields + URL format; InlineError per field
- 401 → redirect to `/login?next=/submit`; success → `navigate` to `/p/$slug`
- Error toast on non-401 server failure
- Tests: 5/5 ✓

---

## F17 — Auth callback route (`/auth/callback`)
- Reads `?token=` from URL via `useSearch`
- Calls `GET /auth/callback?token=` — backend sets cookie and redirects
- On success (ok or redirected): navigate to `/`
- On failure or missing token: navigate to `/login?error=invalid_token`
- Renders spinner (`role="status"`) + "Signing you in…" text while in flight
- Tests: 2/2 ✓

---

## F16 — Login route (`/login`)
- Two steps: email input → confirmation state
- Client-side validation: empty + invalid format → InlineError
- POST `/auth/magic-link` on submit → transitions to "check your email" state
- Confirmation state: Resend button, "Use a different email" resets to step 1
- Tests: 7/7 ✓

---

## F15 — Feed route (`/`)
- `FeedPage` exported for testing, connected to route via `createFileRoute`
- Fetches `GET /products/today`, shows `SkeletonCard` while loading
- Renders `ProductCard` list ordered by vote count (from API)
- `EmptyState` shown when list is empty
- `handleVote` toggles upvote, redirects to `/login` on 401, shows Toast on error
- Desktop sidebar: "What is LaunchedChit?" blurb + Submit CTA
- Tests: 5/5 ✓

---

## F14 — PageError component
- Props: `status: 404 | 500`, `message?`
- Built-in copy for 404 ("Page Not Found") and 500 ("Something Went Wrong")
- Custom `message` overrides default body text
- "Back to feed" link always present, pointing to `/`
- Tests: 4/4 ✓

---

## F13 — InlineError component
- Props: `message: string | null`, `id?`
- Returns null when message is null — renders nothing
- `role="alert"` for screen reader announcements
- `id` prop enables `aria-describedby` association from form fields
- Tests: 4/4 ✓

---

## F12 — Skeleton component
- `Skeleton`: single pulse block, accepts `className` for sizing
- `SkeletonCard`: repeatable card placeholder matching `ProductCard` layout, `count` prop (default 3)
- Uses `role="presentation"` for test targeting without leaking implementation detail
- Tests: 4/4 ✓

---

## F11 — Toast component
- Props: `message`, `variant: success | error | info`, `onDismiss`
- Auto-dismisses after 4s via `useEffect` + `setTimeout`
- Dismiss button clears timer and calls `onDismiss`
- Fake timers scoped per-test (not globally) to avoid `userEvent` timeout conflict
- Tests: 6/6 ✓

---

## F10 — EmptyState component
- Props: `heading`, `body?`, `cta?: { label, onClick }`
- CTA button only rendered when `cta` is provided
- Tests: 5/5 ✓

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
