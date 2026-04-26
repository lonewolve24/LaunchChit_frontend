# TODO

## F04 — Set up Playwright

Steps:
1. Install Playwright: `pnpm create playwright` or `pnpm add -D @playwright/test`
2. Configure `playwright.config.ts`: baseURL `http://localhost:3000`, chromium only for MVP
3. Write a smoke E2E test: visit `/`, expect page to load (status 200)
4. Confirm `pnpm exec playwright test` passes with dev server running
