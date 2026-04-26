import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Skeleton } from '../../components/Skeleton'
import { EmptyState } from '../../components/EmptyState'
import { AdminPageHeader, AdminCard, StatusBadge } from '../../admin/AdminTable'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type SystemNotification = {
  id: string
  kind: 'incident' | 'spike' | 'release' | 'security'
  title: string
  body: string
  ago: string
}

const TONES: Record<SystemNotification['kind'], 'danger' | 'primary' | 'success' | 'warn'> = {
  incident: 'danger',
  spike:    'primary',
  release:  'success',
  security: 'warn',
}

export const Route = createFileRoute('/admin/notifications')({ component: AdminNotificationsPage })

function AdminNotificationsPage() {
  const [items, setItems] = useState<SystemNotification[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/admin/notifications/feed`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((b: { items: SystemNotification[] } | null) => {
        setItems(b?.items ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <AdminPageHeader title="System notifications" subtitle="Operational events visible to admins: incidents, traffic spikes, deploys, and security flags." />

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-card" />)}</div>
      ) : !items || items.length === 0 ? (
        <EmptyState heading="All quiet" body="Nothing happening that admins need to know about." />
      ) : (
        <ul className="space-y-3">
          {items.map((n) => (
            <li key={n.id}>
              <AdminCard>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <StatusBadge tone={TONES[n.kind]}>{n.kind}</StatusBadge>
                      <h3 className="text-sm font-bold text-foreground">{n.title}</h3>
                    </div>
                    <p className="text-sm text-foreground-muted leading-relaxed">{n.body}</p>
                  </div>
                  <span className="text-xs text-foreground-faint flex-shrink-0">{n.ago}</span>
                </div>
              </AdminCard>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
