import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { InlineError } from '../components/InlineError'
import { AuthLayout, AuthHeader } from '../components/AuthLayout'

export const Route = createFileRoute('/signup')({ component: SignupPage })

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type Method = 'email' | 'phone'

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

function passwordStrength(password: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  const label = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'][score]
  return { score: score as 0 | 1 | 2 | 3 | 4, label }
}

export function SignupPage() {
  const [name, setName] = useState('')
  const [method, setMethod] = useState<Method>('email')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agree, setAgree] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function switchMethod(m: Method) {
    setMethod(m)
    setIdentifier('')
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required.'); return }
    const idErr = method === 'email' ? validateEmail(identifier) : validatePhone(identifier)
    if (idErr) { setError(idErr); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (!agree) { setError('You must agree to the Terms and Privacy Policy.'); return }

    setError(null)
    setLoading(true)
    const body = method === 'email'
      ? { name: name.trim(), email: identifier.toLowerCase().trim(), password }
      : { name: name.trim(), phone: identifier.replace(/[\s\-()]/g, ''), password }
    const res = await fetch(`${API}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    })
    setLoading(false)
    if (!res.ok) {
      setError('Could not create your account. Try again.')
      return
    }
    const target = method === 'email' ? identifier.toLowerCase().trim() : identifier.replace(/[\s\-()]/g, '')
    window.location.href = `/verify-otp?method=${method}&target=${encodeURIComponent(target)}`
  }

  const strength = passwordStrength(password)

  return (
    <AuthLayout>
      <AuthHeader />

      <h1 className="text-lg font-bold text-foreground text-center">Create your account</h1>
      <p className="text-sm text-foreground-muted text-center mt-1 mb-6">
        Free forever. Ship something. Get seen.
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
        <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">
          Full name
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Doe"
          className="w-full border border-border rounded-input px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />

        <label htmlFor="identifier" className="block text-sm font-medium text-foreground mt-4 mb-1.5">
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
          className="w-full border border-border rounded-input px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />

        <label htmlFor="password" className="block text-sm font-medium text-foreground mt-4 mb-1.5">
          Password
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
          Confirm password
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

        <label className="mt-4 flex items-start gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded border-border text-primary focus:ring-2 focus:ring-primary/20"
          />
          <span className="text-xs text-foreground-muted leading-relaxed">
            I agree to the{' '}
            <a href="/terms" className="text-primary hover:underline font-medium">Terms of Service</a>{' '}
            and{' '}
            <a href="/privacy" className="text-primary hover:underline font-medium">Privacy Policy</a>.
          </span>
        </label>

        <InlineError message={error} id="signup-error" />

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full bg-accent text-white font-semibold text-sm py-3 rounded-button hover:bg-accent-dark transition-colors disabled:opacity-60 cursor-pointer"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="text-sm text-foreground-muted text-center mt-6">
        Already have an account?{' '}
        <a href="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </a>
      </p>
    </AuthLayout>
  )
}
