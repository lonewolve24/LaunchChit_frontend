# LaunchedChit Frontend — All Features

## Infrastructure
- [x] F01 — Scaffold TanStack Start project with pnpm
- [x] F02 — Configure Tailwind with semantic CSS variable system and brand tokens
- [x] F03 — Set up Vitest + Testing Library
- [x] F04 — Set up Playwright
- [x] F05 — Set up MSW with all 9 MVP mock handlers

## Shared Components
- [x] F06 — Header component
- [x] F07 — Avatar component
- [x] F08 — ProductCard component
- [x] F09 — UpvoteButton component (sm + lg variants)
- [x] F10 — EmptyState component
- [x] F11 — Toast component
- [ ] F12 — Skeleton component
- [ ] F13 — InlineError component
- [ ] F14 — PageError component (404 / 500)

## Routes
- [ ] F15 — Feed route (`/`) — today's launches list
- [ ] F16 — Login route (`/login`) — email input + confirmation state
- [ ] F17 — Auth callback route (`/auth/callback`) — spinner + redirect
- [ ] F18 — Submit route (`/submit`) — auth-gated product form
- [ ] F19 — Product detail route (`/p/[slug]`) — SSR

## End-to-End (Playwright)
- [ ] F20 — Submit flow: login → submit → redirect to detail page
- [ ] F21 — Upvote toggle: vote → count increments → vote again → count decrements
- [ ] F22 — Auth redirect: unauthenticated user hitting `/submit` → redirected to `/login`
- [ ] F23 — Feed renders products ordered by vote count
- [ ] F24 — Detail page SSR: product name present in raw HTML response
