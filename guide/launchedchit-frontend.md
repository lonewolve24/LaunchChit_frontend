# LaunchedChit Frontend — Developer Guide

A complete reference for understanding, running, and extending the LaunchedChit frontend.

---

## What This Is

LaunchedChit is a Product Hunt-style daily launch feed for Gambian builders. The frontend is a React SPA built with TanStack Router, Tailwind CSS v4, and Vite. It runs entirely against MSW mock handlers — no live backend is required for development or testing.

---

## Team

| Person | Role |
|--------|------|
| Musa A Jallow | Frontend (this repo) |
| Momodou | Backend (FastAPI + PostgreSQL) |
| Abdul | Auth (SMS/email OTP via isms by Integify) |

Backend spec: `musaajallo/BACKEND_SPEC.md`

---

## Quick Start

```bash
pnpm install          # install deps
pnpm dev              # dev server at http://localhost:3000 (MSW active)
pnpm test             # Vitest unit tests (78 tests)
pnpm exec playwright test   # Playwright E2E (6 tests, auto-starts dev server)
```

---

## Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | TanStack Router + Vite | File-based routing, type-safe, Vinxi-compatible |
| Language | TypeScript | — |
| Styling | Tailwind CSS v4 (`@theme` directive) | CSS-first, no config file needed |
| Linting/Formatting | Biome | Single tool replaces ESLint + Prettier |
| Package manager | pnpm | Required for TanStack/Vinxi compatibility |
| Unit tests | Vitest + Testing Library | Fast, jsdom environment |
| E2E tests | Playwright (Chromium only) | Reliable browser automation |
| API mocking | MSW v2 | Browser service worker + Node server for Vitest |

---

## File Structure

```
src/
  components/       # Shared UI components
  routes/           # One file per route (TanStack file-based routing)
  mocks/
    handlers.ts     # All 9 MVP MSW handlers (module-level session state)
    browser.ts      # setupWorker — activated in dev via main.tsx
    server.ts       # setupServer — used by Vitest
  test/
    setup.ts        # jest-dom + MSW server lifecycle
    smoke.test.tsx  # Render smoke test
    msw.test.ts     # MSW handler smoke tests
  main.tsx          # Bootstrap: starts MSW in DEV, then renders app
  router.tsx        # TanStack Router config
  styles.css        # Tailwind @theme tokens + global styles
e2e/                # Playwright E2E specs
tasks/              # Plan-and-build tracking (all-features.md, done.md)
guide/              # This file
musaajallo/         # Personal reference docs (gitignored, never delete)
```

---

## Routes

| File | Path | Auth-gated |
|------|------|------------|
| `routes/index.tsx` | `/` | No |
| `routes/login.tsx` | `/login` | No |
| `routes/auth.callback.tsx` | `/auth/callback` | No |
| `routes/submit.tsx` | `/submit` | Yes — redirects to `/login?next=/submit` on 401 |
| `routes/p.$slug.tsx` | `/p/[slug]` | No |

All route components are **named exports** (e.g. `export function FeedPage()`) so Vitest can import them directly without a router context.

---

## Design System

All design tokens live in `src/styles.css` under `@theme`. To change the brand colours, edit the CSS variables there — everything in the app picks them up automatically.

```css
@theme {
  --color-primary: #1B4332;        /* deep green */
  --color-accent:  #F59E0B;        /* amber */
  --color-surface: #FFFFFF;
  --color-surface-subtle: #F8FAF9;
  --color-foreground: #111827;
  --color-destructive: #EF4444;
  --font-sans: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif;
  --radius-card: 0.75rem;
  --radius-button: 0.5rem;
  --radius-input: 0.5rem;
}
```

---

## MSW Mock Handlers

`src/mocks/handlers.ts` holds all 9 MVP endpoints. The module uses three pieces of shared state:

```ts
let products = [...mockProducts]   // 3 Gambian products (FarmLink GM, PayGam, ClassMate GM)
let votes    = new Set<string>()   // tracks "userId:productId" pairs
let sessionActive = false          // true after GET /auth/callback fires
```

**To activate a session in E2E tests**, navigate to `/auth/callback?token=valid-token` — the MSW handler sets `sessionActive = true` and redirects to `/`.

**To override a handler in a unit test:**
```ts
server.use(http.post('http://localhost:8000/products', () =>
  HttpResponse.json({ slug: 'my-slug' }, { status: 201 })
))
// server.resetHandlers() runs after each test via setup.ts
```

---

## Auth Flow

1. User enters email on `/login` → `POST /auth/magic-link` (returns 204)
2. Email contains a link to `/auth/callback?token=...`
3. `AuthCallbackPage` fetches `GET http://localhost:8000/auth/callback?token=...`
4. Backend sets an HTTP-only session cookie and redirects to `/`
5. All subsequent API calls include `credentials: 'include'`
6. 401 responses → redirect to `/login`

The frontend never stores a token. Auth state is the session cookie.

---

## Adding a New Route

1. Create `src/routes/my-route.tsx`
2. Export `const Route = createFileRoute('/my-route')({ component: MyPage })`
3. Export the page component as a named export for testability
4. Create `src/routes/my-route.test.tsx`
5. Mock `@tanstack/react-router` if the component uses `useNavigate`, `useParams`, or `useSearch`

---

## Adding a New MSW Handler

1. Add the handler to the `handlers` array in `src/mocks/handlers.ts`
2. The handler is automatically available in both browser dev and Vitest

---

## Connecting to the Real Backend

When the backend is running (default `http://localhost:8000`):
1. Set `VITE_API_URL=http://localhost:8000` in `.env.local`
2. Disable MSW: comment out the `if (import.meta.env.DEV)` block in `main.tsx`

For production, set `VITE_API_URL` in the Vercel environment variables dashboard.

---

## Test Patterns

### Unit test with MSW override
```ts
it('handles 401', async () => {
  server.use(http.post('http://localhost:8000/products', () =>
    new HttpResponse(null, { status: 401 })
  ))
  // ...
})
```

### Fake timers (Toast auto-dismiss)
Scope `vi.useFakeTimers()` **inside the test**, not in `beforeEach` — `userEvent` uses real timers internally and will hang if timers are faked globally.

### E2E auth setup
```ts
await page.goto('/auth/callback?token=valid-token')
await page.waitForURL('/')
// sessionActive is now true in the MSW service worker
```

---

## Known Limitations

- **SSR**: The dev server is a Vite SPA shell — no pre-rendered HTML. True SSR requires a production build with a Node/Edge server target. TanStack Start supports this; it just hasn't been wired up yet.
- **Auth state in Header**: All pages pass `user={null}` to `<Header>` because there is no global auth context yet. Once the backend is live, add a `useMe()` hook backed by `GET /me` and thread the user through.
- **MSW state resets between Playwright tests**: Each test gets a fresh browser context with a fresh service worker, so `sessionActive` and `votes` reset per test. This is the desired behaviour.
