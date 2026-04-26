# Done

_Completed features will be logged here._

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
