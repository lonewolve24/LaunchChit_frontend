import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/auth/callback')({
  validateSearch: (s: Record<string, unknown>) => ({ token: s.token as string | undefined }),
  component: AuthCallbackPage,
})

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export function AuthCallbackPage() {
  const { token } = useSearch({ from: '/auth/callback' })
  const navigate = useNavigate()

  useEffect(() => {
    if (!token) {
      navigate({ to: '/login', search: { error: 'invalid_token' } })
      return
    }

    fetch(`${API}/auth/callback?token=${encodeURIComponent(token)}`, {
      redirect: 'follow',
      credentials: 'include',
    })
      .then((res) => {
        if (res.ok || res.redirected) {
          navigate({ to: '/' })
        } else {
          navigate({ to: '/login', search: { error: 'invalid_token' } })
        }
      })
      .catch(() => navigate({ to: '/login', search: { error: 'invalid_token' } }))
  }, [token, navigate])

  return (
    <div className="min-h-screen bg-surface-subtle flex flex-col items-center justify-center gap-3">
      <div
        role="status"
        aria-label="Signing you in"
        className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"
      />
      <p className="text-sm text-foreground-muted">Signing you in…</p>
    </div>
  )
}
