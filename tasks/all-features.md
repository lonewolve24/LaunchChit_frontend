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
- [x] F12 — Skeleton component
- [x] F13 — InlineError component
- [x] F14 — PageError component (404 / 500)

## Routes
- [x] F15 — Feed route (`/`) — today's launches list
- [x] F16 — Login route (`/login`) — email input + confirmation state
- [x] F17 — Auth callback route (`/auth/callback`) — spinner + redirect
- [x] F18 — Submit route (`/submit`) — auth-gated product form
- [x] F19 — Product detail route (`/p/[slug]`) — SSR

## End-to-End (Playwright)
- [x] F20 — Submit flow: login → submit → redirect to detail page
- [x] F21 — Upvote toggle: vote → count increments → vote again → count decrements
- [x] F22 — Auth redirect: unauthenticated user hitting `/submit` → redirected to `/login`
- [x] F23 — Feed renders products ordered by vote count
- [ ] F24 — Detail page SSR: product name present in raw HTML response
