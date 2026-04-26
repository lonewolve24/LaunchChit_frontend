/*
  Single source of truth for the current user.
  ----------------------------------------------
  Used by both the maker /dashboard guard and (later) the admin /admin guard,
  so two surfaces never double-fetch /me on the same navigation.

  Contract:
  - getMe() — module-memoized fetch. Concurrent callers share one in-flight
    promise. Resolved value is cached until clearMe() is called.
  - clearMe() — invalidate the cache. MUST be called from the sign-out flow
    BEFORE redirecting, or stale user data will load on the next page.
  - The cached promise is null on success-with-no-user (401) too, so
    re-evaluating after a logout works correctly.
*/

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export type Role = 'user' | 'maker' | 'admin'

export type Me = {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  role?: Role
}

let inflight: Promise<Me | null> | null = null

export function getMe(): Promise<Me | null> {
  if (!inflight) {
    inflight = fetch(`${API}/me`, { credentials: 'include' })
      .then((r) => (r.ok ? (r.json() as Promise<Me>) : null))
      .catch(() => null)
  }
  return inflight
}

export function clearMe(): void {
  inflight = null
}
