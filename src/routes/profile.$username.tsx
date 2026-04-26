import { createFileRoute, useParams } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Header } from '../components/Header'
import { ProductCard } from '../components/ProductCard'
import { PageError } from '../components/PageError'
import { Skeleton } from '../components/Skeleton'
import { Toast } from '../components/Toast'

export const Route = createFileRoute('/profile/$username')({ component: ProfilePage })

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type Profile = {
  id: string
  username: string
  name: string
  bio: string
  avatar_url: string | null
  website: string
  products: Array<{
    id: string
    slug: string
    name: string
    tagline: string
    logo_url: string | null
    vote_count: number
    has_voted: boolean
    maker: { name: string }
  }>
}

export function ProfilePage() {
  const { username } = useParams({ from: '/profile/$username' })
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  useEffect(() => {
    fetch(`${API}/profile/${username}`)
      .then((r) => { if (r.status === 404) { setNotFound(true); setLoading(false); return null } return r.json() })
      .then((data) => { if (data) { setProfile(data); setLoading(false) } })
      .catch(() => setLoading(false))
  }, [username])

  async function handleVote(id: string) {
    if (!profile) return
    const product = profile.products.find((p) => p.id === id)
    if (!product) return
    const method = product.has_voted ? 'DELETE' : 'POST'
    const res = await fetch(`${API}/products/${id}/vote`, { method, credentials: 'include' })
    if (res.status === 401) { window.location.href = '/login'; return }
    if (res.ok) {
      const { vote_count } = await res.json()
      setProfile((prev) => prev ? { ...prev, products: prev.products.map((p) => p.id === id ? { ...p, vote_count, has_voted: !p.has_voted } : p) } : prev)
    } else {
      setToast({ message: 'Could not register vote.', variant: 'error' })
    }
  }

  if (notFound) return <><Header user={null} /><PageError status={404} message="That builder does not exist." /></>

  return (
    <div className="min-h-screen bg-surface-subtle">
      <Header user={null} />

      <main className="max-w-4xl mx-auto px-6 lg:px-10 py-10">
        {loading || !profile ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
        ) : (
          <>
            {/* Profile header */}
            <div
              className="bg-surface rounded-card p-8 mb-8 flex items-start gap-6"
              style={{ boxShadow: '0 1px 4px 0 rgb(0 0 0 / 0.08)' }}
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-3xl flex-shrink-0"
                style={{ backgroundColor: '#1B4332' }}
              >
                {profile.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-foreground">{profile.name}</h1>
                <p className="text-foreground-muted mt-1">{profile.bio}</p>
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline mt-2 inline-block"
                  >
                    {profile.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
            </div>

            {/* Products */}
            <h2 className="text-xl font-bold text-foreground mb-4">
              Launches <span className="text-foreground-faint font-normal text-base">({profile.products.length})</span>
            </h2>
            <div className="space-y-4">
              {profile.products.map((p) => (
                <ProductCard key={p.id} product={p} onVote={handleVote} />
              ))}
            </div>
          </>
        )}
      </main>

      {toast && (
        <div className="fixed bottom-4 right-4 w-80">
          <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
        </div>
      )}
    </div>
  )
}
