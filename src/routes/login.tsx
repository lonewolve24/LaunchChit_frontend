import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { InlineError } from '../components/InlineError'
import { clearMe } from '../lib/auth'

function safeNext(raw: unknown): string {
  if (typeof raw !== 'string' || !raw) return '/'
  // Only allow same-origin relative paths — never external URLs (open redirect guard).
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/'
  return raw
}

export const Route = createFileRoute('/login')({
  component: LoginPage,
  validateSearch: (s: Record<string, unknown>) => ({
    next: safeNext(s.next),
    error: typeof s.error === 'string' ? s.error : undefined,
  }),
})

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type Method = 'email' | 'phone'

function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.'
  return null
}

function validatePhone(phone: string): string | null {
  if (!phone.trim()) return 'Phone number is required.'
  // Accept Gambian format (220 prefix optional) or generic +country code
  const cleaned = phone.replace(/[\s\-()]/g, '')
  if (!/^\+?\d{7,15}$/.test(cleaned)) return 'Enter a valid phone number.'
  return null
}

function validatePassword(password: string): string | null {
  if (!password) return 'Password is required.'
  if (password.length < 6) return 'Password must be at least 6 characters.'
  return null
}

function imageFor(slug: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(slug)}/720/480`
}

type SlideProduct = {
  id: string
  slug: string
  name: string
  tagline: string
  vote_count: number
  logo_url: string | null
  maker?: { name: string }
  topics?: { slug: string; name: string }[]
}

function ProductSlideshow() {
  const [products, setProducts] = useState<SlideProduct[]>([])
  const [active, setActive] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetch(`${API}/products/leaderboard?period=yearly&filter=all`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (cancelled || !json) return
        const items: SlideProduct[] = Array.isArray(json) ? json : (json.items ?? [])
        setProducts(items.slice(0, 10))
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (products.length === 0) return
    const id = window.setInterval(() => setActive((i) => (i + 1) % products.length), 4500)
    return () => window.clearInterval(id)
  }, [products.length])

  if (products.length === 0) return null

  const current = products[active]
  const initials = current.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="w-full max-w-xl">
      {/* Marketing title above the slideshow */}
      <h2 className="text-white text-3xl md:text-4xl font-bold leading-tight text-center mb-7 px-4">
        See what builders<br />are shipping right now.
      </h2>

      <div
        className="relative overflow-hidden rounded-card"
        style={{ boxShadow: '0 20px 50px -12px rgb(0 0 0 / 0.5)' }}
      >
        <div className="relative h-80 md:h-96 bg-primary-dark overflow-hidden">
          <img
            key={current.slug}
            src={imageFor(current.slug)}
            alt={current.name}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-black/40 backdrop-blur px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white">
            <svg width="9" height="9" viewBox="0 0 11 9" fill="currentColor" aria-hidden>
              <path d="M5.5 0L11 9H0L5.5 0Z" />
            </svg>
            #{active + 1} · {current.vote_count} upvotes
          </div>

          <div className="absolute bottom-0 inset-x-0 p-6 text-white flex items-end gap-4">
            {current.logo_url ? (
              <img src={current.logo_url} alt="" className="w-16 h-16 rounded-button object-cover flex-shrink-0 ring-2 ring-white/50" />
            ) : (
              <div className="w-16 h-16 rounded-button bg-white text-primary flex items-center justify-center font-bold text-xl flex-shrink-0 ring-2 ring-white/50">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-lg leading-tight truncate">{current.name}</p>
                {current.topics && current.topics[0] && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur px-2 py-0.5 rounded">
                    {current.topics[0].name}
                  </span>
                )}
              </div>
              <p className="text-sm text-white/90 line-clamp-2 mt-1">{current.tagline}</p>
              {current.maker && (
                <p className="text-xs text-white/65 mt-1">by {current.maker.name}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mt-5">
        {products.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            aria-label={`Show product ${i + 1}`}
            className={`h-2 rounded-full transition-all ${i === active ? 'bg-white w-8' : 'bg-white/30 w-2 hover:bg-white/50'}`}
          />
        ))}
      </div>
    </div>
  )
}

function readNextFromLocation(): string {
  if (typeof window === 'undefined') return '/'
  const raw = new URLSearchParams(window.location.search).get('next')
  return safeNext(raw)
}

export function LoginPage() {
  const [method, setMethod] = useState<Method>('email')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function switchMethod(m: Method) {
    setMethod(m)
    setIdentifier('')
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const idErr = method === 'email' ? validateEmail(identifier) : validatePhone(identifier)
    if (idErr) { setError(idErr); return }
    const pwErr = validatePassword(password)
    if (pwErr) { setError(pwErr); return }

    setError(null)
    setLoading(true)
    const body = method === 'email'
      ? { email: identifier.toLowerCase().trim(), password, remember }
      : { phone: identifier.replace(/[\s\-()]/g, ''), password, remember }
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    })
    setLoading(false)
    if (!res.ok) {
      setError('Those credentials did not match. Try again.')
      return
    }
    clearMe()
    window.location.href = readNextFromLocation()
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left: green panel with slideshow (50%) */}
      <div className="hidden md:flex md:w-1/2 bg-primary items-center justify-center px-6 lg:px-12 py-12">
        <ProductSlideshow />
      </div>

      {/* Right: white form panel (50%) */}
      <div className="md:w-1/2 flex-1 bg-surface flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <a href="/" className="block text-center text-primary font-bold text-xl tracking-tight">
            LaunchedChit
          </a>
          <a
            href="/"
            className="mt-2 mb-6 inline-flex items-center justify-center gap-1.5 w-full text-sm font-medium text-foreground-muted hover:text-primary transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to home
          </a>

          <h1 className="text-lg font-bold text-foreground text-center">Sign in to your account</h1>
          <p className="text-sm text-foreground-muted text-center mt-1 mb-6">
            Welcome back — let's get you in.
          </p>

          {/* Method toggle */}
          <div className="flex bg-surface-subtle rounded-button p-1 mb-5 border border-border">
            <button
              type="button"
              onClick={() => switchMethod('email')}
              className={`flex-1 text-sm font-semibold py-2 rounded-button transition-colors ${
                method === 'email' ? 'bg-surface text-primary shadow-sm' : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => switchMethod('phone')}
              className={`flex-1 text-sm font-semibold py-2 rounded-button transition-colors ${
                method === 'phone' ? 'bg-surface text-primary shadow-sm' : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              Phone
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Identifier */}
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
              className="w-full border border-border rounded-input px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />

            {/* Password */}
            <div className="mt-4 flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <a href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                Forgot password?
              </a>
            </div>
            <div className="relative mt-1.5">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                aria-describedby={error ? 'login-error' : undefined}
                className="w-full border border-border rounded-input px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 px-3 text-foreground-muted hover:text-foreground"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            <InlineError message={error} id="login-error" />

            {/* Remember me */}
            <label className="mt-4 flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/20"
              />
              <span className="text-sm text-foreground-muted">Remember me for 30 days</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-5 w-full bg-accent text-white font-semibold text-sm py-3 rounded-button hover:bg-accent-dark transition-colors disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-sm text-foreground-muted text-center mt-6">
            New to LaunchedChit?{' '}
            <a href="/signup" className="font-semibold text-primary hover:underline">
              Create an account
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
