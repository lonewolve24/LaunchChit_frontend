# TODO

## F17 — Auth callback route (`/auth/callback`)

Steps:
1. Write failing tests: renders a loading spinner, redirects to / on success, redirects to /login?error=invalid_token on failure
2. Create `src/routes/auth.callback.tsx` and export `AuthCallbackPage`
3. Pass all tests (green)
