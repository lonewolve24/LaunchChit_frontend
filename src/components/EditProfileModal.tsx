import { useEffect, useState } from 'react'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export type EditableProfile = {
  name: string
  tagline?: string | null
  bio: string
  location?: string | null
  website?: string | null
  github?: string | null
  twitter?: string | null
  linkedin?: string | null
  email?: string | null
  phone?: string | null
}

type Props = {
  open: boolean
  initial: EditableProfile
  onClose: () => void
  onSaved: (next: EditableProfile) => void
}

type ContactKind = 'email' | 'phone'

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}

function isValidPhone(v: string): boolean {
  return /^\+?\d{7,15}$/.test(v.replace(/[\s\-()]/g, ''))
}

function isValidUrlOrEmpty(v: string): boolean {
  if (!v.trim()) return true
  try { new URL(v); return true } catch { return false }
}

export function EditProfileModal({ open, initial, onClose, onSaved }: Props) {
  const [form, setForm] = useState<EditableProfile>(initial)
  const [contactKind, setContactKind] = useState<ContactKind>(initial.phone && !initial.email ? 'phone' : 'email')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(initial)
      setContactKind(initial.phone && !initial.email ? 'phone' : 'email')
      setError(null)
    }
  }, [open, initial])

  // Esc to close + lock body scroll while open
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

  function set<K extends keyof EditableProfile>(key: K, value: EditableProfile[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()

    if (!form.name.trim()) { setError('Name is required.'); return }

    // Contact validation — at least one of email/phone, and valid format
    const contact = (contactKind === 'email' ? form.email : form.phone) ?? ''
    if (contact.trim()) {
      if (contactKind === 'email' && !isValidEmail(contact)) { setError('Enter a valid email address.'); return }
      if (contactKind === 'phone' && !isValidPhone(contact)) { setError('Enter a valid phone number.'); return }
    }

    // URL validation for socials
    for (const [key, label] of [['website','Website'],['github','GitHub'],['linkedin','LinkedIn']] as const) {
      if (!isValidUrlOrEmpty(form[key] ?? '')) { setError(`${label} must be a valid URL.`); return }
    }

    setError(null)
    setSaving(true)
    // Normalise the contact: clear the inactive one so backend has a single source.
    const payload: EditableProfile = {
      ...form,
      email: contactKind === 'email' ? form.email ?? null : null,
      phone: contactKind === 'phone' ? form.phone ?? null : null,
    }
    const res = await fetch(`${API}/profile/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    })
    setSaving(false)
    if (!res.ok) { setError('Could not save changes. Try again.'); return }
    const updated = (await res.json().catch(() => payload)) as EditableProfile
    onSaved(updated)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label="Edit profile"
    >
      <div className="bg-surface rounded-card max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col" style={{ boxShadow: '0 16px 40px -8px rgb(0 0 0 / 0.3)' }}>
        <header className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-bold text-foreground">Edit profile</h2>
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

        <form onSubmit={handleSave} className="overflow-y-auto px-6 py-5 space-y-4">
          <Field id="ep-name" label="Display name" value={form.name} onChange={(v) => set('name', v)} maxLength={60} />
          <Field id="ep-tagline" label="Tagline" optional value={form.tagline ?? ''} onChange={(v) => set('tagline', v)} maxLength={80} hint="e.g. Founder · Product engineer" />
          <Field id="ep-bio" label="About" optional value={form.bio} onChange={(v) => set('bio', v)} maxLength={500} textarea hint="Shown on your profile and the maker info card." />
          <Field id="ep-location" label="Location" optional value={form.location ?? ''} onChange={(v) => set('location', v)} maxLength={60} hint="City, country." />

          {/* Contact */}
          <div>
            <label className="text-sm font-medium text-foreground">Contact</label>
            <p className="text-xs text-foreground-muted mb-2">How followers can reach you. We'll show this on your profile.</p>
            <div className="flex bg-surface-subtle rounded-button p-1 mb-2 border border-border">
              <button
                type="button"
                onClick={() => setContactKind('email')}
                className={`flex-1 text-sm font-semibold py-1.5 rounded-button transition-colors cursor-pointer ${contactKind === 'email' ? 'bg-surface text-primary shadow-sm' : 'text-foreground-muted hover:text-foreground'}`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => setContactKind('phone')}
                className={`flex-1 text-sm font-semibold py-1.5 rounded-button transition-colors cursor-pointer ${contactKind === 'phone' ? 'bg-surface text-primary shadow-sm' : 'text-foreground-muted hover:text-foreground'}`}
              >
                Phone
              </button>
            </div>
            {contactKind === 'email' ? (
              <input
                id="ep-email"
                type="email"
                value={form.email ?? ''}
                onChange={(e) => set('email', e.target.value)}
                placeholder="you@example.com"
                className="w-full border border-border rounded-input px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
              />
            ) : (
              <input
                id="ep-phone"
                type="tel"
                value={form.phone ?? ''}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="+220 700 0000"
                className="w-full border border-border rounded-input px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
              />
            )}
          </div>

          {/* Social links */}
          <div className="pt-2 space-y-3">
            <p className="text-sm font-medium text-foreground">Social links</p>
            <Field id="ep-website" label="Website" optional value={form.website ?? ''} onChange={(v) => set('website', v)} type="url" placeholder="https://..." compact />
            <Field id="ep-github" label="GitHub" optional value={form.github ?? ''} onChange={(v) => set('github', v)} type="url" placeholder="https://github.com/..." compact />
            <Field id="ep-twitter" label="X / Twitter" optional value={form.twitter ?? ''} onChange={(v) => set('twitter', v)} placeholder="@handle" compact />
            <Field id="ep-linkedin" label="LinkedIn" optional value={form.linkedin ?? ''} onChange={(v) => set('linkedin', v)} type="url" placeholder="https://linkedin.com/in/..." compact />
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
            onClick={handleSave}
            disabled={saving}
            className="bg-accent text-white text-sm font-semibold px-4 py-2 rounded-button hover:bg-accent-dark transition-colors disabled:opacity-60 cursor-pointer"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </footer>
      </div>
    </div>
  )
}

type FieldProps = {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  optional?: boolean
  textarea?: boolean
  type?: string
  maxLength?: number
  hint?: string
  placeholder?: string
  compact?: boolean
}

function Field({ id, label, value, onChange, optional, textarea, type = 'text', maxLength, hint, placeholder, compact }: FieldProps) {
  const inputClass = 'w-full border border-border rounded-input px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors'
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-foreground`}>
          {label}{optional && <span className="text-foreground-faint ml-1 font-normal">(optional)</span>}
        </label>
        {maxLength && <span className="text-xs text-foreground-faint">{value.length} / {maxLength}</span>}
      </div>
      {hint && !compact && <p className="text-xs text-foreground-muted mt-0.5 mb-1.5">{hint}</p>}
      {textarea ? (
        <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} maxLength={maxLength} rows={4} className={`${inputClass} mt-1 resize-y`} />
      ) : (
        <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} maxLength={maxLength} placeholder={placeholder} className={`${inputClass} mt-1`} />
      )}
    </div>
  )
}
