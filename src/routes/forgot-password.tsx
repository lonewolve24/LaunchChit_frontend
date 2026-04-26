import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { InlineError } from '../components/InlineError'
import { AuthLayout, AuthHeader } from '../components/AuthLayout'

export const Route = createFileRoute('/forgot-password')({ component: ForgotPasswordPage })

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type Method = 'email' | 'phone'
type Step = 'input' | 'sent'

function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.'
  return null
}

function validatePhone(phone: string): string | null {
  if (!phone.trim()) return 'Phone number is required.'
  const cleaned = phone.replace(/[\s\-()]/g, '')
  if (!/^\+?\d{7,15}$/.test(cleaned)) return 'Enter a valid phone number.'
  return null
}

export function ForgotPasswordPage() {
  const [method, setMethod] = useState<Method>('email')
  const [identifier, setIdentifier] = useState('')
  const [step, setStep] = useState<Step>('input')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function switchMethod(m: Method) {
    setMethod(m)
    setIdentifier('')
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = method === 'email' ? validateEmail(identifier) : validatePhone(identifier)
    if (err) { setError(err); return }
    setError(null)
    setLoading(true)
    const body = method === 'email'
      ? { email: identifier.toLowerCase().trim() }
      : { phone: identifier.replace(/[\s\-()]/g, '') }
    await fetch(`${API}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setLoading(false)
    setStep('sent')
  }

  if (step === 'sent') {
    return (
      <AuthLayout>
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-success" aria-hidden>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-foreground">Check your {method === 'email' ? 'email' : 'phone'}</h1>
          <p className="mt-2 text-sm text-foreground-muted">
            If an account exists for <strong>{identifier}</strong>, we've sent a {method === 'email' ? 'reset link' : 'reset code'}. It expires in 30 minutes.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            {method === 'phone' && (
              <a
                href={`/verify-otp?method=phone&purpose=reset&target=${encodeURIComponent(identifier.replace(/[\s\-()]/g, ''))}`}
                className="w-full bg-accent text-white font-semibold text-sm py-2.5 rounded-button hover:bg-accent-dark transition-colors text-center"
              >
                Enter the code
              </a>
            )}
            <button
              onClick={() => { setStep('input'); setIdentifier('') }}
              className="text-sm text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
            >
              Use a different {method === 'email' ? 'email' : 'phone'}
            </button>
            <a href="/login" className="text-sm text-primary hover:underline font-medium">
              ← Back to sign in
            </a>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <AuthHeader />

      <h1 className="text-lg font-bold text-foreground text-center">Forgot your password?</h1>
      <p className="text-sm text-foreground-muted text-center mt-1 mb-6">
        Enter the {method === 'email' ? 'email' : 'phone number'} on your account and we'll send a reset {method === 'email' ? 'link' : 'code'}.
      </p>

      <div className="flex bg-surface-subtle rounded-button p-1 mb-5 border border-border">
        <button
          type="button"
          onClick={() => switchMethod('email')}
          className={`flex-1 text-sm font-semibold py-2 rounded-button transition-colors cursor-pointer ${
            method === 'email' ? 'bg-surface text-primary shadow-sm' : 'text-foreground-muted hover:text-foreground'
          }`}
        >
          Email
        </button>
        <button
          type="button"
          onClick={() => switchMethod('phone')}
          className={`flex-1 text-sm font-semibold py-2 rounded-button transition-colors cursor-pointer ${
            method === 'phone' ? 'bg-surface text-primary shadow-sm' : 'text-foreground-muted hover:text-foreground'
          }`}
        >
          Phone
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="identifier" className="block text-sm font-medium text-foreground mb-1.5">
          {method === 'email' ? 'Email address' : 'Phone number'}
        </label>
        <input
          id="identifier"
          key={method}
          type={method === 'email' ? 'email' : 'tel'}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder={method === 'email' ? 'you@example.com' : '+220 700 0000'}
          autoComplete={method === 'email' ? 'email' : 'tel'}
          aria-describedby={error ? 'forgot-error' : undefined}
          className="w-full border border-border rounded-input px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
        <InlineError message={error} id="forgot-error" />

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full bg-accent text-white font-semibold text-sm py-3 rounded-button hover:bg-accent-dark transition-colors disabled:opacity-60 cursor-pointer"
        >
          {loading ? 'Sending…' : `Send reset ${method === 'email' ? 'link' : 'code'}`}
        </button>
      </form>

      <p className="text-sm text-foreground-muted text-center mt-6">
        Remembered it?{' '}
        <a href="/login" className="font-semibold text-primary hover:underline">
          Back to sign in
        </a>
      </p>
    </AuthLayout>
  )
}
