import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { InlineError } from '../components/InlineError'

export const Route = createFileRoute('/login')({ component: LoginPage })

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type Step = 'input' | 'sent'

function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.'
  return null
}

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [step, setStep] = useState<Step>('input')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validateEmail(email)
    if (err) { setError(err); return }
    setError(null)
    setLoading(true)
    await fetch(`${API}/auth/magic-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.toLowerCase().trim() }),
    })
    setLoading(false)
    setStep('sent')
  }

  if (step === 'sent') {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center px-4">
        <div className="bg-surface rounded-card shadow-xl p-8 w-full max-w-sm text-center">
          <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-success" aria-hidden>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-foreground">Check your email</h1>
          <p className="mt-2 text-sm text-foreground-muted">
            We sent a magic link to <strong>{email}</strong>
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={handleSubmit as unknown as React.MouseEventHandler}
              className="w-full bg-accent text-white font-semibold text-sm py-2.5 rounded-button hover:bg-accent-dark transition-colors"
            >
              Resend link
            </button>
            <button
              onClick={() => { setStep('input'); setEmail('') }}
              className="text-sm text-foreground-muted hover:text-foreground transition-colors"
            >
              Use a different email
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-4">
      <div className="bg-surface rounded-card shadow-xl p-8 w-full max-w-sm">
        <a href="/" className="block text-center text-primary font-bold text-xl mb-8 tracking-tight">
          LaunchedChit
        </a>
        <h1 className="text-lg font-bold text-foreground text-center">Sign in to your account</h1>
        <p className="text-sm text-foreground-muted text-center mt-1 mb-7">
          We'll send you a magic link — no password needed
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-describedby={error ? 'email-error' : undefined}
            className="w-full border border-border rounded-input px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          <InlineError message={error} id="email-error" />

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full bg-accent text-white font-semibold text-sm py-3 rounded-button hover:bg-accent-dark transition-colors disabled:opacity-60"
          >
            {loading ? 'Sending…' : 'Send magic link'}
          </button>
        </form>
      </div>
    </div>
  )
}
