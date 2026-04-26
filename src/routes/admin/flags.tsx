import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Skeleton } from '../../components/Skeleton'
import { Toast } from '../../components/Toast'
import { AdminPageHeader, AdminCard, StatusBadge } from '../../admin/AdminTable'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type Flag = {
  id: string
  key: string
  name: string
  description: string
  enabled: boolean
  rollout: number
  updated_at: string
}

export const Route = createFileRoute('/admin/flags')({ component: AdminFlagsPage })

function AdminFlagsPage() {
  const [items, setItems] = useState<Flag[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  function load() {
    setLoading(true)
    fetch(`${API}/admin/flags`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((b: { items: Flag[] } | null) => {
        setItems(b?.items ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  async function update(id: string, patch: Partial<Pick<Flag, 'enabled' | 'rollout'>>) {
    setBusyId(id)
    const res = await fetch(`${API}/admin/flags/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(patch),
    })
    setBusyId(null)
    if (!res.ok) { setToast({ message: 'Could not save flag.', variant: 'error' }); return }
    setItems((prev) => prev ? prev.map((f) => f.id === id ? { ...f, ...patch, updated_at: new Date().toISOString().slice(0, 10) } : f) : prev)
    setToast({ message: 'Flag updated.', variant: 'success' })
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Feature flags" subtitle="Toggle features on or off and ramp rollouts. Changes take effect at the next page load." />

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-card" />)}</div>
      ) : (
        <ul className="space-y-3">
          {items?.map((f) => (
            <li key={f.id}>
              <AdminCard>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-base font-bold text-foreground">{f.name}</h3>
                      <StatusBadge tone="neutral">{f.key}</StatusBadge>
                      <StatusBadge tone={f.enabled ? 'success' : 'neutral'}>{f.enabled ? 'enabled' : 'disabled'}</StatusBadge>
                      <span className="text-xs text-foreground-faint">updated {f.updated_at}</span>
                    </div>
                    <p className="text-sm text-foreground-muted">{f.description}</p>
                    <div className="mt-3 flex items-center gap-3 max-w-md">
                      <label className="text-xs font-semibold text-foreground-muted">Rollout</label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={f.rollout}
                        onChange={(e) => update(f.id, { rollout: Number(e.target.value) })}
                        className="flex-1 accent-primary"
                      />
                      <span className="text-sm font-bold text-foreground w-12 text-right">{f.rollout}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      role="switch"
                      aria-checked={f.enabled}
                      onClick={() => !busyId && update(f.id, { enabled: !f.enabled })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 cursor-pointer ${f.enabled ? 'bg-primary' : 'bg-border'}`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${f.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </span>
                  </div>
                </div>
              </AdminCard>
            </li>
          ))}
        </ul>
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 w-80 z-50">
          <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
        </div>
      )}
    </div>
  )
}
