import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { InlineError } from '../components/InlineError'
import { AuthLayout, AuthHeader } from '../components/AuthLayout'

export const Route = createFileRoute('/reset-password')({
  component: ResetPasswordPage,
  validateSearch: (s: Record<string, unknown>) => ({
    token: typeof s.token === 'string' ? s.token : '',
  }),
})

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

function passwordStrength(password: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  const label = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'][score]
  return { score: score as 0 | 1 | 2 | 3 | 4, label }
}

export function ResetPasswordPage() {
  const { token } = Route.useSearch()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) { setError('This reset link is invalid or has expired.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }

    setError(null)
    setLoading(true)
    const res = await fetch(`${API}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
    setLoading(false)
    if (!res.ok) {
      setError('Could not reset your password. The link may have expired.')
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <AuthLayout>
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-success" aria-hidden>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-foreground">Password updated</h1>
          <p className="mt-2 text-sm text-foreground-muted">
            You can now sign in with your new password.
          </p>
          <a
            href="/login"
            className="mt-6 inline-block w-full bg-accent text-white font-semibold text-sm py-2.5 rounded-button hover:bg-accent-dark transition-colors text-center"
          >
            Sign in
          </a>
        </div>
      </AuthLayout>
    )
  }

  const strength = passwordStrength(password)

  return (
    <AuthLayout>
      <AuthHeader />

      <h1 className="text-lg font-bold text-foreground text-center">Set a new password</h1>
      <p className="text-sm text-foreground-muted text-center mt-1 mb-6">
        Choose something you'll remember. We'll sign you in straight after.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
          New password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            className="w-full border border-border rounded-input px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 px-3 text-foreground-muted hover:text-foreground cursor-pointer"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? '🙈' : '👁'}
          </button>
        </div>

        {password && (
          <div className="mt-2">
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full ${
                    i < strength.score
                      ? strength.score <= 1 ? 'bg-destructive' : strength.score === 2 ? 'bg-accent' : 'bg-success'
                      : 'bg-border'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-foreground-muted mt-1.5">{strength.label}</p>
          </div>
        )}

        <label htmlFor="confirm" className="block text-sm font-medium text-foreground mt-4 mb-1.5">
          Confirm new password
        </label>
        <input
          id="confirm"
          type={showPassword ? 'text' : 'password'}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Re-enter your password"
          autoComplete="new-password"
          className="w-full border border-border rounded-input px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />

        <InlineError message={error} id="reset-error" />

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full bg-accent text-white font-semibold text-sm py-3 rounded-button hover:bg-accent-dark transition-colors disabled:opacity-60 cursor-pointer"
        >
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </AuthLayout>
  )
}
