import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { InlineError } from '../components/InlineError'
import { AuthLayout, AuthHeader } from '../components/AuthLayout'

export const Route = createFileRoute('/verify-otp')({
  component: VerifyOtpPage,
  validateSearch: (s: Record<string, unknown>) => ({
    method: (s.method === 'phone' ? 'phone' : 'email') as 'email' | 'phone',
    target: typeof s.target === 'string' ? s.target : '',
    purpose: typeof s.purpose === 'string' ? s.purpose : 'verify',
    next: typeof s.next === 'string' && s.next.startsWith('/') && !s.next.startsWith('//') ? s.next : '/',
  }),
})

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const CODE_LENGTH = 6
const RESEND_SECONDS = 30

function maskTarget(method: 'email' | 'phone', target: string): string {
  if (!target) return 'your account'
  if (method === 'email') {
    const [local, domain] = target.split('@')
    if (!domain) return target
    const masked = local.length <= 2 ? local : `${local[0]}${'•'.repeat(Math.max(1, local.length - 2))}${local.slice(-1)}`
    return `${masked}@${domain}`
  }
  // phone
  const last = target.slice(-3)
  return `${'•'.repeat(Math.max(1, target.length - 3))}${last}`
}

export function VerifyOtpPage() {
  const { method, target, purpose, next } = Route.useSearch()
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''))
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resendIn, setResendIn] = useState(RESEND_SECONDS)
  const inputs = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    inputs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (resendIn <= 0) return
    const id = window.setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000)
    return () => window.clearInterval(id)
  }, [resendIn])

  function setDigit(idx: number, value: string) {
    const cleaned = value.replace(/\D/g, '').slice(-1)
    setDigits((prev) => {
      const next = [...prev]
      next[idx] = cleaned
      return next
    })
    if (cleaned && idx < CODE_LENGTH - 1) {
      inputs.current[idx + 1]?.focus()
    }
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus()
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      e.preventDefault()
      inputs.current[idx - 1]?.focus()
    } else if (e.key === 'ArrowRight' && idx < CODE_LENGTH - 1) {
      e.preventDefault()
      inputs.current[idx + 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH)
    if (!pasted) return
    e.preventDefault()
    const next = Array(CODE_LENGTH).fill('')
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i]
    setDigits(next)
    const focusIdx = Math.min(pasted.length, CODE_LENGTH - 1)
    inputs.current[focusIdx]?.focus()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const code = digits.join('')
    if (code.length !== CODE_LENGTH) { setError(`Enter all ${CODE_LENGTH} digits.`); return }

    setError(null)
    setLoading(true)
    const res = await fetch(`${API}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ method, target, purpose, code }),
    })
    setLoading(false)
    if (!res.ok) {
      setError('That code is incorrect or has expired.')
      setDigits(Array(CODE_LENGTH).fill(''))
      inputs.current[0]?.focus()
      return
    }
    if (purpose === 'reset') {
      const data = await res.json().catch(() => ({}))
      const token = (data && typeof data.token === 'string') ? data.token : ''
      window.location.href = `/reset-password?token=${encodeURIComponent(token)}`
    } else {
      window.location.href = next
    }
  }

  async function handleResend() {
    if (resendIn > 0) return
    setError(null)
    await fetch(`${API}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method, target, purpose }),
    })
    setResendIn(RESEND_SECONDS)
  }

  return (
    <AuthLayout>
      <AuthHeader />

      <h1 className="text-lg font-bold text-foreground text-center">Enter your verification code</h1>
      <p className="text-sm text-foreground-muted text-center mt-1 mb-6">
        We sent a {CODE_LENGTH}-digit code to <strong>{maskTarget(method, target)}</strong>. It expires in 10 minutes.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="flex justify-between gap-2" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el }}
              type="text"
              inputMode="numeric"
              pattern="\d*"
              maxLength={1}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              aria-label={`Digit ${i + 1}`}
              className="w-12 h-14 text-center text-xl font-bold text-foreground border-2 border-border-strong rounded-input bg-surface-subtle focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:bg-surface transition-all"
            />
          ))}
        </div>

        <InlineError message={error} id="otp-error" />

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full bg-accent text-white font-semibold text-sm py-3 rounded-button hover:bg-accent-dark transition-colors disabled:opacity-60 cursor-pointer"
        >
          {loading ? 'Verifying…' : 'Verify code'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-foreground-muted">
        Didn't get it?{' '}
        {resendIn > 0 ? (
          <span className="text-foreground-faint">Resend in {resendIn}s</span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            className="font-semibold text-primary hover:underline cursor-pointer"
          >
            Resend code
          </button>
        )}
      </div>

      <p className="text-sm text-foreground-muted text-center mt-6">
        Wrong {method === 'email' ? 'email' : 'number'}?{' '}
        <a href="/login" className="font-semibold text-primary hover:underline">
          Go back
        </a>
      </p>
    </AuthLayout>
  )
}
