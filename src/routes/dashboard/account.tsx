import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Skeleton } from '../../components/Skeleton'
import { Toast } from '../../components/Toast'
import { clearMe } from '../../lib/auth'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const cardShadow = '0 1px 4px 0 rgb(0 0 0 / 0.08)'

export const Route = createFileRoute('/dashboard/account')({ component: AccountPage })

type Prefs = {
  notify_comments: boolean
  notify_upvotes: boolean
  notify_waitlist: boolean
  notify_followers: boolean
  notify_mentions: boolean
  weekly_digest: boolean
  product_announcements: boolean
}

type Account = {
  name: string
  email: string
  handle: string
  created_at: string
  preferences: Prefs
}

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}

function AccountPage() {
  const navigate = useNavigate()

  const [account, setAccount] = useState<Account | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [prefs, setPrefs] = useState<Prefs | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  // Danger zone state
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`${API}/me/account`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Account | null) => {
        if (!data || cancelled) return
        setAccount(data)
        setName(data.name)
        setEmail(data.email)
        setPrefs(data.preferences)
        setLoading(false)
      })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  async function saveProfile() {
    if (!name.trim()) { setError('Name is required.'); return }
    if (!isValidEmail(email)) { setError('Enter a valid email address.'); return }
    setError(null)
    setSaving(true)
    const res = await fetch(`${API}/me/account`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name: name.trim(), email: email.trim() }),
    })
    setSaving(false)
    if (!res.ok) { setToast({ message: 'Could not save changes.', variant: 'error' }); return }
    clearMe()
    setToast({ message: 'Profile updated.', variant: 'success' })
  }

  async function setPref(key: keyof Prefs, value: boolean) {
    if (!prefs) return
    const next = { ...prefs, [key]: value }
    setPrefs(next)
    const res = await fetch(`${API}/me/account`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ preferences: { [key]: value } }),
    })
    if (!res.ok) {
      setPrefs(prefs) // revert
      setToast({ message: 'Could not save preference.', variant: 'error' })
    }
  }

  async function deleteAccount() {
    setDeleting(true)
    const res = await fetch(`${API}/me/account/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ confirm: confirmText }),
    })
    setDeleting(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setToast({ message: body?.error ?? 'Delete failed.', variant: 'error' })
      return
    }
    clearMe()
    navigate({ to: '/' })
  }

  if (loading || !account || !prefs) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-64 rounded-card" />
        <Skeleton className="h-64 rounded-card" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Account</h1>
        <p className="text-foreground-muted mt-1">Your personal info, notifications, and account controls.</p>
      </header>

      {/* Profile */}
      <section className="bg-surface rounded-card p-6 space-y-4" style={{ boxShadow: cardShadow }}>
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-bold text-foreground">Profile</h2>
          <a href={`/profile/${account.handle}`} className="text-xs text-primary hover:underline font-semibold">View public profile →</a>
        </div>
        <Field label="Display name" id="name" value={name} onChange={setName} maxLength={60} />
        <Field label="Email" id="email" type="email" value={email} onChange={setEmail} hint="Used for sign-in and notifications. Never shown publicly." />
        <div className="flex items-center justify-between text-xs text-foreground-faint pt-1">
          <span>Handle: <span className="font-mono text-foreground-muted">@{account.handle}</span></span>
          <span>Joined {new Date(account.created_at + 'T00:00:00').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</span>
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end pt-1">
          <button type="button" onClick={saveProfile} disabled={saving} className="bg-accent text-white text-sm font-semibold px-4 py-2 rounded-button hover:bg-accent-dark transition-colors disabled:opacity-60 cursor-pointer">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </section>

      {/* Notifications */}
      <section className="bg-surface rounded-card p-6 space-y-4" style={{ boxShadow: cardShadow }}>
        <div>
          <h2 className="text-base font-bold text-foreground">Notifications</h2>
          <p className="text-xs text-foreground-muted mt-0.5">Choose what shows up in your in-app inbox and email digests.</p>
        </div>
        <div className="divide-y divide-border">
          <PrefRow label="Comments on your products" hint="When someone leaves a comment on a product you ship." value={prefs.notify_comments} onChange={(v) => setPref('notify_comments', v)} />
          <PrefRow label="Upvotes" hint="When your product picks up upvotes (batched once an hour)." value={prefs.notify_upvotes} onChange={(v) => setPref('notify_upvotes', v)} />
          <PrefRow label="Waitlist signups" hint="When someone joins a waitlist for one of your products." value={prefs.notify_waitlist} onChange={(v) => setPref('notify_waitlist', v)} />
          <PrefRow label="New followers" hint="When someone starts following you." value={prefs.notify_followers} onChange={(v) => setPref('notify_followers', v)} />
          <PrefRow label="Mentions" hint="When someone @-mentions you in a thread, comment, or request." value={prefs.notify_mentions} onChange={(v) => setPref('notify_mentions', v)} />
          <PrefRow label="Weekly digest" hint="Friday morning summary of what happened this week." value={prefs.weekly_digest} onChange={(v) => setPref('weekly_digest', v)} />
          <PrefRow label="LaunchedChit announcements" hint="New features, calls for makers, occasional events." value={prefs.product_announcements} onChange={(v) => setPref('product_announcements', v)} />
        </div>
      </section>

      {/* Danger zone */}
      <section className="bg-surface rounded-card p-6 space-y-3 border border-destructive/30" style={{ boxShadow: cardShadow }}>
        <h2 className="text-base font-bold text-destructive">Danger zone</h2>
        <p className="text-sm text-foreground-muted">
          Deleting your account removes your profile, your products, your waitlists, and your comment history. This cannot be undone.
        </p>
        {!deleteOpen ? (
          <button type="button" onClick={() => setDeleteOpen(true)} className="text-sm font-semibold px-4 py-2 rounded-button border border-destructive text-destructive hover:bg-destructive hover:text-white transition-colors cursor-pointer">
            Delete my account
          </button>
        ) : (
          <div className="space-y-3 mt-2">
            <p className="text-sm text-foreground">Type <span className="font-mono font-bold">{account.name}</span> to confirm.</p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full border border-border rounded-input px-3 py-2 text-sm focus:outline-none focus:border-destructive"
              placeholder={account.name}
            />
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => { setDeleteOpen(false); setConfirmText('') }} className="text-sm font-semibold px-4 py-2 rounded-button text-foreground-muted hover:text-foreground cursor-pointer">
                Cancel
              </button>
              <button
                type="button"
                onClick={deleteAccount}
                disabled={deleting || confirmText !== account.name}
                className="bg-destructive text-white text-sm font-semibold px-4 py-2 rounded-button hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {deleting ? 'Deleting…' : 'Delete account permanently'}
              </button>
            </div>
          </div>
        )}
      </section>

      {toast && (
        <div className="fixed bottom-4 right-4 w-80 z-50">
          <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
        </div>
      )}
    </div>
  )
}

type FieldProps = {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  maxLength?: number
  hint?: string
}
function Field({ id, label, value, onChange, type = 'text', maxLength, hint }: FieldProps) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-medium text-foreground">{label}</label>
        {maxLength && <span className="text-xs text-foreground-faint">{value.length} / {maxLength}</span>}
      </div>
      {hint && <p className="text-xs text-foreground-muted mt-0.5 mb-1">{hint}</p>}
      <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} maxLength={maxLength} className="w-full border border-border rounded-input px-3 py-2 text-sm focus:outline-none focus:border-primary mt-1" />
    </div>
  )
}

function PrefRow({ label, hint, value, onChange }: { label: string; hint: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start justify-between gap-4 py-3 cursor-pointer">
      <div className="min-w-0">
        <span className="text-sm font-medium text-foreground block">{label}</span>
        <span className="text-xs text-foreground-muted">{hint}</span>
      </div>
      <span
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 cursor-pointer ${value ? 'bg-primary' : 'bg-border'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </span>
    </label>
  )
}
