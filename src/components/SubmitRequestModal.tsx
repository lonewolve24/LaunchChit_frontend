import { useEffect, useState } from 'react'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export type NewRequest = {
  id: string
  title: string
  body: string
  requester: { name: string }
  upvotes: number
  responses: number
  status: 'open' | 'in-progress' | 'shipped'
  created_at: string
}

type Props = {
  open: boolean
  onClose: () => void
  onCreated: (request: NewRequest) => void
}

const TITLE_MAX = 100
const BODY_MAX = 600
const AUDIENCE_MAX = 120

function isValidEmailOrEmpty(v: string): boolean {
  if (!v.trim()) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}

function isValidPhoneOrEmpty(v: string): boolean {
  if (!v.trim()) return true
  return /^\+?\d{7,15}$/.test(v.replace(/[\s\-()]/g, ''))
}

export function SubmitRequestModal({ open, onClose, onCreated }: Props) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [audience, setAudience] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phones, setPhones] = useState<string[]>([''])
  const [wouldPay, setWouldPay] = useState(false)
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<'GMD' | 'USD'>('GMD')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setTitle(''); setBody(''); setAudience(''); setName(''); setEmail('')
      setPhones([''])
      setWouldPay(false); setAmount(''); setCurrency('GMD')
      setError(null); setSubmitting(false)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Give the request a short title.'); return }
    if (title.trim().length < 8) { setError('Title is too short — describe what you need.'); return }
    if (!body.trim()) { setError('Tell makers what the product should do and why.'); return }
    if (body.trim().length < 30) { setError('Add a bit more detail in the description (at least 30 characters).'); return }
    if (!name.trim()) { setError('Add your name so makers know who is asking.'); return }
    if (!isValidEmailOrEmpty(email)) { setError('Enter a valid email or leave it blank.'); return }
    for (let i = 0; i < phones.length; i++) {
      if (!isValidPhoneOrEmpty(phones[i])) { setError(`Phone ${i + 1} is not a valid number.`); return }
    }
    if (wouldPay && !amount.trim()) { setError('Enter an amount you would pay (or untick the box).'); return }
    if (wouldPay && !/^\d+(\.\d+)?$/.test(amount.trim())) { setError('Amount must be a number.'); return }

    setError(null)
    setSubmitting(true)
    const res = await fetch(`${API}/community/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        title: title.trim(),
        body: body.trim(),
        audience: audience.trim() || null,
        requester_name: name.trim(),
        requester_email: email.trim() || null,
        requester_phones: phones.map((p) => p.trim()).filter(Boolean),
        would_pay: wouldPay,
        pay_amount: wouldPay ? Number(amount) : null,
        pay_currency: wouldPay ? currency : null,
      }),
    })
    setSubmitting(false)
    if (!res.ok) { setError('Could not submit. Try again.'); return }
    const created = (await res.json()) as NewRequest
    onCreated(created)
    onClose()
  }

  const titleRemaining = TITLE_MAX - title.length
  const bodyRemaining = BODY_MAX - body.length

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label="Submit a product request"
    >
      <div className="bg-surface rounded-card max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col" style={{ boxShadow: '0 16px 40px -8px rgb(0 0 0 / 0.3)' }}>
        <header className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-bold text-foreground">Request a product</h2>
            <p className="text-xs text-foreground-muted mt-0.5">Tell Gambian makers what you wish existed.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-foreground-faint hover:text-foreground p-1 -m-1 cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </header>

        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor="req-title" className="text-sm font-medium text-foreground">What do you wish existed?</label>
              <span className={`text-xs ${titleRemaining < 0 ? 'text-destructive' : 'text-foreground-faint'}`}>{title.length} / {TITLE_MAX}</span>
            </div>
            <input
              id="req-title"
              type="text"
              value={title}
              maxLength={TITLE_MAX}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. A WhatsApp scheduler for osusu groups"
              className="mt-1 w-full border border-border rounded-input px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor="req-body" className="text-sm font-medium text-foreground">Describe the problem</label>
              <span className={`text-xs ${bodyRemaining < 0 ? 'text-destructive' : 'text-foreground-faint'}`}>{body.length} / {BODY_MAX}</span>
            </div>
            <p className="text-xs text-foreground-muted mt-0.5 mb-1">What's broken today? What should the product do?</p>
            <textarea
              id="req-body"
              value={body}
              maxLength={BODY_MAX}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              placeholder="We run an osusu group of 200 people. Weekly updates take hours…"
              className="w-full border border-border rounded-input px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors resize-y"
            />
          </div>

          <div>
            <label htmlFor="req-audience" className="text-sm font-medium text-foreground">Who would use this? <span className="text-foreground-faint font-normal">(optional)</span></label>
            <input
              id="req-audience"
              type="text"
              value={audience}
              maxLength={AUDIENCE_MAX}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g. Osusu organisers, small shops, schools…"
              className="mt-1 w-full border border-border rounded-input px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="rounded-card border border-border p-3 bg-surface-subtle">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={wouldPay}
                onChange={(e) => setWouldPay(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-sm font-medium text-foreground">I would pay for this</span>
            </label>
            <p className="text-xs text-foreground-muted mt-1 ml-6">Putting a number on it makes makers far more likely to build it.</p>
            {wouldPay && (
              <div className="flex items-center gap-2 mt-2 ml-6">
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="500"
                  className="w-28 border border-border rounded-input px-3 py-1.5 text-sm focus:outline-none focus:border-primary transition-colors bg-surface"
                />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as 'GMD' | 'USD')}
                  className="border border-border rounded-input px-2 py-1.5 text-sm focus:outline-none focus:border-primary bg-surface"
                >
                  <option value="GMD">GMD</option>
                  <option value="USD">USD</option>
                </select>
                <span className="text-xs text-foreground-muted">/ month</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
            <div>
              <label htmlFor="req-name" className="text-sm font-medium text-foreground">Your name</label>
              <input
                id="req-name"
                type="text"
                value={name}
                maxLength={60}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aminata Touray"
                className="mt-1 w-full border border-border rounded-input px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label htmlFor="req-email" className="text-sm font-medium text-foreground">Email <span className="text-foreground-faint font-normal">(optional)</span></label>
              <input
                id="req-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 w-full border border-border rounded-input px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
          <p className="text-xs text-foreground-muted -mt-1">If you add an email, we'll ping you when a maker picks this up.</p>

          <div>
            <div className="flex items-baseline justify-between">
              <label className="text-sm font-medium text-foreground">Phone <span className="text-foreground-faint font-normal">(optional)</span></label>
              {phones.length < 2 && (
                <button
                  type="button"
                  onClick={() => setPhones((p) => [...p, ''])}
                  className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  + Add second number
                </button>
              )}
            </div>
            <p className="text-xs text-foreground-muted mt-0.5 mb-1.5">Makers can reach you over WhatsApp or a call. Add a second number if you carry two SIMs.</p>
            <div className="space-y-2">
              {phones.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="tel"
                    value={p}
                    onChange={(e) => setPhones((prev) => prev.map((v, idx) => idx === i ? e.target.value : v))}
                    placeholder={i === 0 ? '+220 700 0000' : '+220 300 0000'}
                    className="flex-1 border border-border rounded-input px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                  {phones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setPhones((prev) => prev.filter((_, idx) => idx !== i))}
                      aria-label={`Remove phone ${i + 1}`}
                      className="text-foreground-faint hover:text-destructive p-1.5 cursor-pointer"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">{error}</p>
          )}
        </form>

        <footer className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-surface-subtle">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-semibold px-4 py-2 rounded-button text-foreground-muted hover:text-foreground cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-accent text-white text-sm font-semibold px-4 py-2 rounded-button hover:bg-accent-dark transition-colors disabled:opacity-60 cursor-pointer"
          >
            {submitting ? 'Posting…' : 'Post request'}
          </button>
        </footer>
      </div>
    </div>
  )
}
