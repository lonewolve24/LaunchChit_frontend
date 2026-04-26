import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Skeleton } from '../../components/Skeleton'
import { EmptyState } from '../../components/EmptyState'
import { AdminPageHeader, AdminCard } from '../../admin/AdminTable'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type Maker = {
  id: string
  name: string
  username: string
  email: string
  avatar_color: string
  product_count: number
  followers: number
  joined_at: string
  last_active: string
  suspended: boolean
}

export const Route = createFileRoute('/admin/makers')({ component: AdminMakersPage })

function AdminMakersPage() {
  const [items, setItems] = useState<Maker[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/admin/users?role=maker`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: { items: Maker[] } | null) => {
        setItems((body?.items ?? []).filter((m) => !m.suspended).sort((a, b) => b.product_count - a.product_count))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Makers" subtitle="Active makers ranked by ship count. Quick view — full controls live on Users." />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-card" />)}
        </div>
      ) : !items || items.length === 0 ? (
        <EmptyState heading="No makers yet" body="When people start shipping, they'll show up here." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((m) => (
            <AdminCard key={m.id}>
              <div className="flex items-center gap-3">
                <a href={`/profile/${m.username}`}>
                  <span className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold" style={{ backgroundColor: m.avatar_color }}>{m.name[0]}</span>
                </a>
                <div className="min-w-0 flex-1">
                  <a href={`/profile/${m.username}`} className="text-sm font-bold text-foreground hover:text-primary truncate block">{m.name}</a>
                  <p className="text-xs text-foreground-muted truncate">@{m.username}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 pt-3 border-t border-border text-center">
                <div>
                  <p className="text-base font-bold text-foreground">{m.product_count}</p>
                  <p className="text-[10px] text-foreground-faint uppercase tracking-wider">Products</p>
                </div>
                <div>
                  <p className="text-base font-bold text-foreground">{m.followers.toLocaleString()}</p>
                  <p className="text-[10px] text-foreground-faint uppercase tracking-wider">Followers</p>
                </div>
                <div>
                  <p className="text-base font-bold text-foreground">{m.last_active.split(' ')[0]}</p>
                  <p className="text-[10px] text-foreground-faint uppercase tracking-wider">Last seen</p>
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  )
}
