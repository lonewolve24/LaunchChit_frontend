# TODO

## F03 — Set up Vitest + Testing Library

Steps:
1. Install: `vitest`, `@vitest/ui`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`
2. Add vitest config to `vite.config.ts` (environment: jsdom, setupFiles)
3. Create `src/test/setup.ts` — import `@testing-library/jest-dom`
4. Write a smoke test for the root route to confirm the test runner works
5. Confirm `pnpm test` passes
