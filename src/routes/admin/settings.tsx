import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Skeleton } from '../../components/Skeleton'
import { Toast } from '../../components/Toast'
import { AdminPageHeader, AdminCard, ActionButton } from '../../admin/AdminTable'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type Settings = {
  site_name: string
  support_email: string
  default_currency: 'GMD' | 'USD'
  signups_open: boolean
  submissions_open: boolean
  comments_require_approval: boolean
  default_session_minutes: number
  admin_session_minutes: number
}

export const Route = createFileRoute('/admin/settings')({ component: AdminSettingsPage })

function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  useEffect(() => {
    fetch(`${API}/admin/settings`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((b: Settings | null) => { setSettings(b); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((s) => s ? { ...s, [key]: value } : s)
  }

  async function save() {
    if (!settings) return
    setSaving(true)
    const res = await fetch(`${API}/admin/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(settings),
    })
    setSaving(false)
    if (!res.ok) { setToast({ message: 'Could not save.', variant: 'error' }); return }
    setToast({ message: 'Settings saved.', variant: 'success' })
  }

  if (loading || !settings) {
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
      <AdminPageHeader title="Platform settings" subtitle="Global toggles. Effects are platform-wide and take effect immediately." />

      <AdminCard>
        <h2 className="text-base font-bold text-foreground mb-4">Site</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Site name" id="site-name" value={settings.site_name} onChange={(v) => set('site_name', v)} />
          <Field label="Support email" id="support-email" value={settings.support_email} onChange={(v) => set('support_email', v)} type="email" />
          <div>
            <label className="text-sm font-medium text-foreground">Default currency</label>
            <select value={settings.default_currency} onChange={(e) => set('default_currency', e.target.value as 'GMD' | 'USD')} className="mt-1 w-full border border-border rounded-input px-3 py-2 text-sm bg-surface focus:outline-none focus:border-primary">
              <option value="GMD">GMD — Gambian dalasi</option>
              <option value="USD">USD — US dollar</option>
            </select>
          </div>
        </div>
      </AdminCard>

      <AdminCard>
        <h2 className="text-base font-bold text-foreground mb-4">Access</h2>
        <div className="divide-y divide-border">
          <Toggle label="Allow new signups" hint="Off pauses /signup. Existing accounts are unaffected." value={settings.signups_open} onChange={(v) => set('signups_open', v)} />
          <Toggle label="Allow new submissions" hint="Off hides the Submit button and the /submit route." value={settings.submissions_open} onChange={(v) => set('submissions_open', v)} />
          <Toggle label="Comments require approval" hint="On routes every new comment through the moderation inbox before going live." value={settings.comments_require_approval} onChange={(v) => set('comments_require_approval', v)} />
        </div>
      </AdminCard>

      <AdminCard>
        <h2 className="text-base font-bold text-foreground mb-4">Sessions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Maker session (minutes)" id="maker-session" type="number" value={String(settings.default_session_minutes)} onChange={(v) => set('default_session_minutes', Number(v) || 0)} />
          <Field label="Admin session (minutes)" id="admin-session" type="number" value={String(settings.admin_session_minutes)} onChange={(v) => set('admin_session_minutes', Number(v) || 0)} hint="Admin sessions are typically shorter for security." />
        </div>
      </AdminCard>

      <div className="flex justify-end">
        <ActionButton tone="primary" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save settings'}</ActionButton>
      </div>

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
  hint?: string
}
function Field({ id, label, value, onChange, type = 'text', hint }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-foreground">{label}</label>
      {hint && <p className="text-xs text-foreground-muted mt-0.5">{hint}</p>}
      <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full border border-border rounded-input px-3 py-2 text-sm focus:outline-none focus:border-primary" />
    </div>
  )
}

function Toggle({ label, hint, value, onChange }: { label: string; hint: string; value: boolean; onChange: (v: boolean) => void }) {
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
