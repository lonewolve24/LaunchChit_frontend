import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Skeleton } from '../../components/Skeleton'
import { EmptyState } from '../../components/EmptyState'
import { Toast } from '../../components/Toast'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const cardShadow = '0 1px 4px 0 rgb(0 0 0 / 0.08)'

type Direction = 'followers' | 'following'

type Follower = {
  username: string
  name: string
  bio: string
  avatar_color: string
  product_count: number
  is_following: boolean
  followed_at: string
}

type Response = { items: Follower[]; counts: { followers: number; following: number } }

export const Route = createFileRoute('/dashboard/followers')({
  component: FollowersPage,
  validateSearch: (s: Record<string, unknown>) => ({
    direction: (s.direction === 'following' ? 'following' : 'followers') as Direction,
  }),
})

function FollowersPage() {
  const { direction } = Route.useSearch()
  const [data, setData] = useState<Response | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`${API}/me/followers?direction=${direction}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: Response | null) => {
        if (cancelled) return
        setData(body ?? { items: [], counts: { followers: 0, following: 0 } })
        setLoading(false)
      })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [direction])

  async function toggleFollow(username: string, currentlyFollowing: boolean) {
    const res = await fetch(`${API}/me/followers/${username}/follow`, {
      method: currentlyFollowing ? 'DELETE' : 'POST',
      credentials: 'include',
    })
    if (!res.ok) { setToast({ message: 'Could not update follow.', variant: 'error' }); return }
    setData((prev) => prev ? {
      items: prev.items.map((f) => f.username === username ? { ...f, is_following: !currentlyFollowing } : f),
      counts: prev.counts,
    } : prev)
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Followers</h1>
        <p className="text-foreground-muted mt-1">People who get notified when you ship something new.</p>
      </header>

      <div className="flex items-center gap-1 border-b border-border">
        {(['followers', 'following'] as Direction[]).map((d) => (
          <Link
            key={d}
            to="/dashboard/followers"
            search={{ direction: d }}
            className={`text-sm font-semibold capitalize px-3 py-2 -mb-px border-b-2 transition-colors inline-flex items-center gap-1.5 ${
              direction === d ? 'text-primary border-primary' : 'text-foreground-muted border-transparent hover:text-foreground'
            }`}
          >
            {d}
            {data && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${direction === d ? 'bg-primary/15 text-primary' : 'bg-surface-subtle text-foreground-muted'}`}>
                {data.counts[d]}
              </span>
            )}
          </Link>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-card" />)}
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          heading={direction === 'followers' ? 'No followers yet' : "You're not following anyone"}
          body={direction === 'followers'
            ? 'Ship a great product and they\'ll come.'
            : 'Follow other Gambian makers to get notified when they ship.'}
        />
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.items.map((f) => (
            <li key={f.username} className="bg-surface rounded-card p-4 flex items-start gap-3" style={{ boxShadow: cardShadow }}>
              <a href={`/profile/${f.username}`} className="flex-shrink-0">
                <span className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold" style={{ backgroundColor: f.avatar_color }}>{f.name[0]}</span>
              </a>
              <div className="flex-1 min-w-0">
                <a href={`/profile/${f.username}`} className="text-sm font-bold text-foreground hover:text-primary truncate block">{f.name}</a>
                <p className="text-xs text-foreground-muted truncate">{f.bio}</p>
                <p className="text-xs text-foreground-faint mt-1">
                  {f.product_count} {f.product_count === 1 ? 'product' : 'products'} · {direction === 'followers' ? 'followed you' : 'you followed'} {f.followed_at}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleFollow(f.username, f.is_following)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-button transition-colors flex-shrink-0 cursor-pointer border ${
                  f.is_following
                    ? 'border-border bg-surface text-foreground hover:border-destructive hover:text-destructive'
                    : 'border-primary bg-primary text-white hover:bg-primary-dark'
                }`}
              >
                {f.is_following ? 'Following' : '＋ Follow'}
              </button>
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
