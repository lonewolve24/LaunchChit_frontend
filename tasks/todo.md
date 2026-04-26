# TODO

## F05 — Set up MSW with all 9 MVP mock handlers

Steps:
1. Install `msw`
2. Create `src/mocks/handlers.ts` with all 9 handlers matching BACKEND_SPEC.md response shapes
3. Create `src/mocks/browser.ts` (browser worker setup)
4. Create `src/mocks/server.ts` (node server for Vitest)
5. Wire MSW into `src/main.tsx` — start worker in development only
6. Update test setup to use MSW server
7. Write a test confirming a mock handler returns the expected shape
