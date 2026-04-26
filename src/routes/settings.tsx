import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Header } from '../components/Header'
import { InlineError } from '../components/InlineError'
import { Toast } from '../components/Toast'

export const Route = createFileRoute('/settings')({ component: SettingsPage })

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type Me = { id: string; name: string | null; email: string }

export function SettingsPage() {
  const [authChecked, setAuthChecked] = useState(false)
  const [user, setUser] = useState<Me | null>(null)
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  useEffect(() => {
    fetch(`${API}/me`, { credentials: 'include' }).then((r) => {
      if (r.status === 401) { window.location.href = '/login?next=/settings'; return }
      return r.json()
    }).then((data) => {
      if (data) { setUser(data); setName(data.name ?? ''); setAuthChecked(true) }
    }).catch(() => setAuthChecked(true))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setNameError('Display name is required.'); return }
    setNameError(null)
    setSaving(true)
    const res = await fetch(`${API}/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name: name.trim() }),
    })
    setSaving(false)
    if (res.ok || res.status === 204) {
      setToast({ message: 'Settings saved.', variant: 'success' })
    } else {
      setToast({ message: 'Could not save settings. Try again.', variant: 'error' })
    }
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-surface-subtle flex items-center justify-center">
        <span role="status" className="text-sm text-foreground-muted">Loading…</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-subtle">
      <Header user={user} />

      <main className="max-w-2xl mx-auto px-6 lg:px-10 py-10">
        <h1 className="text-3xl font-bold text-foreground mb-8">Settings</h1>

        <div className="bg-surface rounded-card p-8 space-y-8" style={{ boxShadow: '0 1px 4px 0 rgb(0 0 0 / 0.08)' }}>
          <form onSubmit={handleSave} noValidate>
            <h2 className="text-base font-bold text-foreground mb-5">Profile</h2>

            <div className="space-y-5">
              <div>
                <label htmlFor="display-name" className="block text-sm font-medium text-foreground mb-1.5">
                  Display name
                </label>
                <input
                  id="display-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full border border-border rounded-input px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-primary transition-all"
                  style={{ focusRingColor: 'rgba(27,67,50,0.2)' }}
                />
                <InlineError message={nameError} id="display-name-error" />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email address</label>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={user?.email ?? ''}
                    disabled
                    className="flex-1 border border-border rounded-input px-3 py-2.5 text-sm bg-surface-subtle text-foreground-muted cursor-not-allowed"
                  />
                  <span className="text-xs text-foreground-faint bg-surface-raised px-2 py-1.5 rounded-button border border-border">Read-only</span>
                </div>
                <p className="text-xs text-foreground-faint mt-1.5">Email changes are not supported in v1.</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-6 bg-primary text-white font-semibold text-sm px-6 py-2.5 rounded-button hover:bg-primary-dark transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </form>

          <hr className="border-border" />

          <div>
            <h2 className="text-base font-bold text-foreground mb-1">Danger zone</h2>
            <p className="text-sm text-foreground-muted mb-4">Permanently delete your account and all associated data.</p>
            <button
              disabled
              className="text-sm font-semibold text-destructive border border-destructive px-4 py-2 rounded-button opacity-40 cursor-not-allowed"
            >
              Delete account
            </button>
          </div>
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-4 right-4 w-80">
          <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
        </div>
      )}
    </div>
  )
}
