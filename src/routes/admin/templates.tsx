import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Skeleton } from '../../components/Skeleton'
import { Toast } from '../../components/Toast'
import { AdminPageHeader, AdminCard, StatusBadge, ActionButton } from '../../admin/AdminTable'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type Template = {
  id: string
  key: string
  name: string
  subject: string
  body: string
  variables: string[]
}

export const Route = createFileRoute('/admin/templates')({ component: AdminTemplatesPage })

function AdminTemplatesPage() {
  const [items, setItems] = useState<Template[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftSubject, setDraftSubject] = useState('')
  const [draftBody, setDraftBody] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  function load() {
    setLoading(true)
    fetch(`${API}/admin/templates`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((b: { items: Template[] } | null) => {
        setItems(b?.items ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  function startEdit(t: Template) {
    setEditingId(t.id)
    setDraftSubject(t.subject)
    setDraftBody(t.body)
  }

  async function save(id: string) {
    setSavingId(id)
    const res = await fetch(`${API}/admin/templates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ subject: draftSubject, body: draftBody }),
    })
    setSavingId(null)
    if (!res.ok) { setToast({ message: 'Could not save.', variant: 'error' }); return }
    setEditingId(null)
    setToast({ message: 'Template saved.', variant: 'success' })
    load()
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Email templates" subtitle="Transactional email copy. Variables are written as {{name}} — they're filled in at send time." />

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-card" />)}</div>
      ) : (
        <ul className="space-y-3">
          {items?.map((t) => {
            const isEditing = editingId === t.id
            return (
              <li key={t.id}>
                <AdminCard>
                  <div className="flex items-baseline justify-between gap-3 flex-wrap mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-foreground">{t.name}</h3>
                      <StatusBadge tone="neutral">{t.key}</StatusBadge>
                      {t.variables.map((v) => <StatusBadge key={v} tone="primary">{`{{${v}}}`}</StatusBadge>)}
                    </div>
                    {!isEditing
                      ? <ActionButton onClick={() => startEdit(t)}>Edit</ActionButton>
                      : (
                        <div className="flex items-center gap-2">
                          <ActionButton onClick={() => setEditingId(null)}>Cancel</ActionButton>
                          <ActionButton tone="primary" disabled={savingId === t.id} onClick={() => save(t.id)}>{savingId === t.id ? 'Saving…' : 'Save'}</ActionButton>
                        </div>
                      )
                    }
                  </div>
                  {isEditing ? (
                    <div className="space-y-2 mt-3">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-foreground-faint">Subject</label>
                        <input type="text" value={draftSubject} onChange={(e) => setDraftSubject(e.target.value)} className="mt-1 w-full border border-border rounded-input px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-foreground-faint">Body</label>
                        <textarea value={draftBody} onChange={(e) => setDraftBody(e.target.value)} rows={6} className="mt-1 w-full border border-border rounded-input px-3 py-2 text-sm focus:outline-none focus:border-primary font-mono resize-y" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground"><span className="text-foreground-faint mr-2">Subject:</span>{t.subject}</p>
                      <pre className="text-xs text-foreground-muted whitespace-pre-wrap font-mono bg-surface-subtle rounded-card p-3 border border-border">{t.body}</pre>
                    </div>
                  )}
                </AdminCard>
              </li>
            )
          })}
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
