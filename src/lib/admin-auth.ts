/*
  Admin session helper. Mirrors the maker getMe() pattern in src/lib/auth.ts
  but talks to the admin scope (/admin/me). Memoised across components so
  a layout + sidebar + topbar all share one round-trip per render.
*/

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export type AdminUser = {
  id: string
  email: string
  name: string
  role: 'admin' | 'super-admin'
  mfa_enrolled: boolean
}

let cache: Promise<AdminUser | null> | null = null

export function getAdmin(): Promise<AdminUser | null> {
  if (cache) return cache
  cache = fetch(`${API}/admin/me`, { credentials: 'include' })
    .then(async (r) => (r.ok ? ((await r.json()) as AdminUser) : null))
    .catch(() => null)
  return cache
}

export function clearAdmin() {
  cache = null
}
