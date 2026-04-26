import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { clearAdmin } from '../../lib/admin-auth'
import '../../admin/styles/theme.css'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export const Route = createFileRoute('/admin/mfa-enroll')({
  component: AdminMfaEnrollPage,
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === 'string' ? s.next : '/admin',
  }),
})

function AdminMfaEnrollPage() {
  const { next } = Route.useSearch()
  const [secret, setSecret] = useState<string | null>(null)
  const [otpauth, setOtpauth] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [bootstrapping, setBootstrapping] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`${API}/admin/auth/enroll-start`, { method: 'POST', credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: { secret: string; otpauth_url: string } | null) => {
        if (!body || cancelled) return
        setSecret(body.secret)
        setOtpauth(body.otpauth_url)
        setBootstrapping(false)
      })
      .catch(() => { if (!cancelled) setBootstrapping(false) })
    return () => { cancelled = true }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (code.replace(/\s/g, '').length !== 6) { setError('Enter the 6-digit code from your authenticator.'); return }
    setError(null)
    setLoading(true)
    const res = await fetch(`${API}/admin/auth/enroll-finish`, {
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

  async function copySecret() {
    if (!secret) return
    try {
      await navigator.clipboard.writeText(secret)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* ignore */ }
  }

  // QR placeholder using a public render endpoint would normally go here.
  // Mock-only: render the otpauth URL as text so testers can paste it
  // into a QR generator or directly into their authenticator app.
  return (
    <div className="admin-scope min-h-screen bg-surface-subtle flex items-center justify-center p-6">
      <div className="bg-surface rounded-card w-full max-w-lg p-8" style={{ boxShadow: '0 12px 32px -8px rgb(0 0 0 / 0.18)' }}>
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Set up two-factor</p>
          <h1 className="text-2xl font-bold text-foreground">Enrol an authenticator</h1>
          <p className="text-sm text-foreground-muted mt-1">Admin accounts require a TOTP code on every sign-in. Use 1Password, Authy, Google Authenticator, etc.</p>
        </div>

        {bootstrapping ? (
          <p className="text-sm text-foreground-muted">Generating your secret…</p>
        ) : (
          <>
            <ol className="space-y-4 mb-6 text-sm text-foreground">
              <li>
                <p className="font-bold">1. Add an account in your authenticator</p>
                <p className="text-foreground-muted text-xs mt-0.5">Either scan the QR (if your camera is to hand) or paste the setup key below.</p>
                <div className="mt-2 p-3 rounded-card bg-surface-subtle border border-border">
                  <p className="text-[11px] uppercase tracking-wider font-bold text-foreground-faint mb-1">Setup key</p>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-sm font-mono text-foreground break-all">{secret}</code>
                    <button type="button" onClick={copySecret} className="text-xs font-semibold text-primary hover:underline whitespace-nowrap">
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  {otpauth && (
                    <details className="mt-2">
                      <summary className="text-xs text-foreground-muted cursor-pointer">Show otpauth:// URL</summary>
                      <code className="block mt-1.5 text-xs text-foreground-muted break-all font-mono">{otpauth}</code>
                    </details>
                  )}
                </div>
              </li>
              <li>
                <p className="font-bold">2. Enter the 6-digit code your app shows</p>
                <form onSubmit={handleSubmit} className="mt-2 space-y-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={7}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/[^\d ]/g, ''))}
                    placeholder="123 456"
                    className="w-full text-center font-mono tracking-[0.4em] text-xl border border-border rounded-input px-3 py-3 focus:outline-none focus:border-primary"
                  />
                  {error && <p role="alert" className="text-sm text-destructive text-center">{error}</p>}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-white text-sm font-semibold px-4 py-2.5 rounded-button hover:bg-primary-dark transition-colors disabled:opacity-60"
                  >
                    {loading ? 'Verifying…' : 'Finish enrollment'}
                  </button>
                </form>
              </li>
            </ol>
            <p className="text-xs text-foreground-faint text-center">
              Mock code: <span className="font-mono">123456</span>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
