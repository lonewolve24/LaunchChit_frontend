import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { clearAdmin } from '../../lib/admin-auth'
import '../../admin/styles/theme.css'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export const Route = createFileRoute('/admin/login')({
  component: AdminLoginPage,
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === 'string' ? s.next : '/admin',
  }),
})

function AdminLoginPage() {
  const { next } = Route.useSearch()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) { setError('Email and password are required.'); return }
    setError(null)
    setLoading(true)
    const res = await fetch(`${API}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email: email.trim(), password }),
    })
    setLoading(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body?.error ?? 'Invalid credentials.')
      return
    }
    const body = await res.json().catch(() => ({})) as { requires_mfa?: boolean; requires_enrollment?: boolean }
    clearAdmin()
    if (body.requires_enrollment) {
      navigate({ to: '/admin/mfa-enroll', search: { next } })
    } else {
      navigate({ to: '/admin/mfa', search: { next } })
    }
  }

  return (
    <div className="admin-scope min-h-screen bg-surface-subtle flex items-center justify-center p-6">
      <div className="bg-surface rounded-card w-full max-w-md p-8" style={{ boxShadow: '0 12px 32px -8px rgb(0 0 0 / 0.18)' }}>
        <div className="text-center mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">LaunchedChit Admin</p>
          <h1 className="text-2xl font-bold text-foreground">Sign in</h1>
          <p className="text-sm text-foreground-muted mt-1">Restricted to authorised staff.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-foreground">Work email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
              className="mt-1 w-full border border-border rounded-input px-3 py-2 text-sm focus:outline-none focus:border-primary"
              placeholder="admin@launchedchit.gm"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="mt-1 w-full border border-border rounded-input px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>

          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white text-sm font-semibold px-4 py-2.5 rounded-button hover:bg-primary-dark transition-colors disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Continue'}
          </button>
        </form>

        <p className="text-xs text-foreground-faint text-center mt-6">
          Mock credentials: <span className="font-mono">admin@launchedchit.gm</span> / <span className="font-mono">admin</span>
        </p>
      </div>
    </div>
  )
}
