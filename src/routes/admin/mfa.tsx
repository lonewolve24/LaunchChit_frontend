import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { clearAdmin } from '../../lib/admin-auth'
import '../../admin/styles/theme.css'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export const Route = createFileRoute('/admin/mfa')({
  component: AdminMfaPage,
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === 'string' ? s.next : '/admin',
  }),
})

function AdminMfaPage() {
  const { next } = Route.useSearch()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (code.replace(/\s/g, '').length !== 6) { setError('Enter the 6-digit code from your authenticator.'); return }
    setError(null)
    setLoading(true)
    const res = await fetch(`${API}/admin/auth/mfa-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ code: code.replace(/\s/g, '') }),
    })
    setLoading(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body?.error ?? 'Invalid code.')
      return
    }
    clearAdmin()
    window.location.href = next || '/admin'
  }

  return (
    <div className="admin-scope min-h-screen bg-surface-subtle flex items-center justify-center p-6">
      <div className="bg-surface rounded-card w-full max-w-md p-8" style={{ boxShadow: '0 12px 32px -8px rgb(0 0 0 / 0.18)' }}>
        <div className="text-center mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Two-factor verification</p>
          <h1 className="text-2xl font-bold text-foreground">Enter your 6-digit code</h1>
          <p className="text-sm text-foreground-muted mt-1">Open your authenticator app and enter the code for LaunchedChit Admin.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9 ]*"
            autoComplete="one-time-code"
            maxLength={7}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^\d ]/g, ''))}
            placeholder="123 456"
            className="w-full text-center font-mono tracking-[0.4em] text-2xl border border-border rounded-input px-3 py-3 focus:outline-none focus:border-primary"
          />
          {error && <p role="alert" className="text-sm text-destructive text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white text-sm font-semibold px-4 py-2.5 rounded-button hover:bg-primary-dark transition-colors disabled:opacity-60"
          >
            {loading ? 'Verifying…' : 'Verify and continue'}
          </button>
        </form>

        <p className="text-xs text-foreground-faint text-center mt-6">
          Mock code: <span className="font-mono">123456</span> · <a href="/admin/login" className="text-primary hover:underline">Use a different account</a>
        </p>
      </div>
    </div>
  )
}
