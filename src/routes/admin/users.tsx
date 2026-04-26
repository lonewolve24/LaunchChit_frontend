import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Skeleton } from '../../components/Skeleton'
import { EmptyState } from '../../components/EmptyState'
import { Toast } from '../../components/Toast'
import { AdminPageHeader, AdminTabs, AdminCard, StatusBadge, ActionButton } from '../../admin/AdminTable'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type Role = 'all' | 'maker' | 'admin' | 'suspended'

type User = {
  id: string
  name: string
  username: string
  email: string
  avatar_color: string
  role: 'maker' | 'admin'
  product_count: number
  followers: number
  joined_at: string
  last_active: string
  suspended: boolean
}

type Response = { items: User[]; counts: { all: number; maker: number; admin: number; suspended: number } }

export const Route = createFileRoute('/admin/users')({
  component: AdminUsersPage,
  validateSearch: (s: Record<string, unknown>) => ({
    role: (['all', 'maker', 'admin', 'suspended'].includes(String(s.role)) ? String(s.role) : 'all') as Role,
    q: typeof s.q === 'string' ? s.q : '',
  }),
})

function AdminUsersPage() {
  const { role, q } = Route.useSearch()
  const [data, setData] = useState<Response | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)
  const [query, setQuery] = useState(q)

  function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (role !== 'all' && role !== 'suspended') params.set('role', role)
    if (query) params.set('q', query)
    fetch(`${API}/admin/users?${params.toString()}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: Response | null) => {
        let items = body?.items ?? []
        if (role === 'suspended') items = items.filter((u) => u.suspended)
        setData({ items, counts: body?.counts ?? { all: 0, maker: 0, admin: 0, suspended: 0 } })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [role])
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t) }, [query])

  async function changeRole(id: string, nextRole: 'maker' | 'admin') {
    setBusyId(id)
    const res = await fetch(`${API}/admin/users/${id}/role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ role: nextRole }),
    })
    setBusyId(null)
    if (!res.ok) { setToast({ message: 'Could not change role.', variant: 'error' }); return }
    setToast({ message: `Role updated to ${nextRole}.`, variant: 'success' })
    load()
  }

  async function setSuspended(id: string, suspended: boolean) {
    setBusyId(id)
    const res = await fetch(`${API}/admin/users/${id}/${suspended ? 'suspend' : 'unsuspend'}`, { method: 'POST', credentials: 'include' })
    setBusyId(null)
    if (!res.ok) { setToast({ message: 'Action failed.', variant: 'error' }); return }
    setToast({ message: suspended ? 'User suspended.' : 'User reinstated.', variant: 'success' })
    load()
  }

  function setTab(s: string) {
    window.location.href = `/admin/users?role=${s}${query ? `&q=${encodeURIComponent(query)}` : ''}`
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Users"
        subtitle="All accounts. Promote, demote, suspend or reinstate."
        right={
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, handle…"
            className="text-sm border border-border rounded-button px-3 py-1.5 bg-surface focus:outline-none focus:border-primary w-64"
          />
        }
      />

      <AdminTabs
        tabs={[
          { value: 'all',       label: 'All',       count: data?.counts.all },
          { value: 'maker',     label: 'Makers',    count: data?.counts.maker },
          { value: 'admin',     label: 'Admins',    count: data?.counts.admin },
          { value: 'suspended', label: 'Suspended', count: data?.counts.suspended },
        ]}
        value={role}
        onChange={setTab}
      />

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-card" />)}</div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState heading="Nothing here" body="No users match this view." />
      ) : (
        <AdminCard padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-subtle text-foreground-muted">
                <tr className="text-left">
                  <th className="font-semibold px-5 py-2.5">User</th>
                  <th className="font-semibold px-5 py-2.5">Role</th>
                  <th className="font-semibold px-5 py-2.5">Products</th>
                  <th className="font-semibold px-5 py-2.5">Followers</th>
                  <th className="font-semibold px-5 py-2.5">Last active</th>
                  <th className="font-semibold px-5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((u) => (
                  <tr key={u.id} className="border-t border-border hover:bg-surface-subtle/60">
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: u.avatar_color }}>{u.name[0]}</span>
                        <div className="min-w-0">
                          <a href={`/profile/${u.username}`} className="text-foreground font-medium hover:text-primary block truncate">{u.name}</a>
                          <p className="text-xs text-foreground-muted truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-2.5">
                      <StatusBadge tone={u.role === 'admin' ? 'primary' : 'neutral'}>{u.role}</StatusBadge>
                      {u.suspended && <span className="ml-2"><StatusBadge tone="danger">suspended</StatusBadge></span>}
                    </td>
                    <td className="px-5 py-2.5 text-foreground">{u.product_count}</td>
                    <td className="px-5 py-2.5 text-foreground">{u.followers.toLocaleString()}</td>
                    <td className="px-5 py-2.5 text-foreground-faint whitespace-nowrap">{u.last_active}</td>
                    <td className="px-5 py-2.5 text-right whitespace-nowrap">
                      <div className="inline-flex gap-2">
                        {u.role === 'maker'
                          ? <ActionButton tone="primary" disabled={busyId === u.id} onClick={() => changeRole(u.id, 'admin')}>Make admin</ActionButton>
                          : <ActionButton disabled={busyId === u.id} onClick={() => changeRole(u.id, 'maker')}>Demote</ActionButton>
                        }
                        {u.suspended
                          ? <ActionButton tone="success" disabled={busyId === u.id} onClick={() => setSuspended(u.id, false)}>Reinstate</ActionButton>
                          : <ActionButton tone="danger" disabled={busyId === u.id} onClick={() => setSuspended(u.id, true)}>Suspend</ActionButton>
                        }
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 w-80 z-50">
          <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
        </div>
      )}
    </div>
  )
}
