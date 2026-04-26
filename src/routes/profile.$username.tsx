import { createFileRoute, useParams } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Header } from '../components/Header'
import { ProductCard } from '../components/ProductCard'
import { PageError } from '../components/PageError'
import { Skeleton } from '../components/Skeleton'
import { Toast } from '../components/Toast'

export const Route = createFileRoute('/profile/$username')({ component: ProfilePage })

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const cardShadow = '0 1px 4px 0 rgb(0 0 0 / 0.08)'

type Profile = {
  id: string
  username: string
  name: string
  tagline?: string
  bio: string
  location?: string
  joined_at?: string
  avatar_url: string | null
  cover_color?: string
  website?: string | null
  github?: string | null
  twitter?: string | null
  linkedin?: string | null
  email?: string | null
  followers?: number
  following?: number
  total_upvotes?: number
  products: Array<{
    id: string
    slug: string
    name: string
    tagline: string
    logo_url: string | null
    vote_count: number
    has_voted: boolean
    maker: { name: string }
    topics?: Array<{ slug: string; name: string }>
    platforms?: Array<'web' | 'mobile' | 'desktop'>
    comments_count?: number
    waitlist_count?: number
    created_at?: string
  }>
}

type Tab = 'launches' | 'upvoted' | 'about'

function formatJoined(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

export function ProfilePage() {
  const { username } = useParams({ from: '/profile/$username' })
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [tab, setTab] = useState<Tab>('launches')
  const [following, setFollowing] = useState(false)
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

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-surface-subtle">
        <Header user={null} />
        <main className="max-w-5xl mx-auto px-6 lg:px-10 py-10 space-y-4">
          <Skeleton className="h-48 w-full rounded-card" />
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-96" />
        </main>
      </div>
    )
  }

  const totalProducts = profile.products.length
  const totalUpvotes = profile.total_upvotes ?? profile.products.reduce((s, p) => s + p.vote_count, 0)

  return (
    <div className="min-h-screen bg-surface-subtle">
      <Header user={null} />

      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-8">
        {/* Hero card */}
        <div className="bg-surface rounded-card overflow-hidden mb-6" style={{ boxShadow: cardShadow }}>
          {/* Cover band — avatar overlaps it, name sits below on the light card */}
          <div
            className="h-32 md:h-40 relative"
            style={{ background: `linear-gradient(135deg, ${profile.cover_color ?? '#1B4332'} 0%, #0F2D20 100%)` }}
          >
            <div className="absolute -bottom-12 md:-bottom-14 left-6 md:left-8">
              <div
                className="w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center text-white font-bold text-4xl md:text-5xl border-4 border-surface"
                style={{ backgroundColor: profile.cover_color ?? '#1B4332' }}
              >
                {profile.name[0]}
              </div>
            </div>
          </div>

          <div className="px-6 md:px-8 pt-16 md:pt-20 pb-6 md:pb-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">{profile.name}</h1>
                <p className="text-sm text-foreground-muted mt-0.5">@{profile.username}</p>
                {profile.tagline && <p className="text-sm text-foreground-muted mt-1">{profile.tagline}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => { setFollowing((f) => !f); setToast({ message: following ? 'Unfollowed.' : 'Following — you\'ll see their new launches.', variant: 'success' }) }}
                  className={`text-sm font-semibold px-5 py-2 rounded-button transition-colors border ${
                    following ? 'bg-primary text-white border-primary' : 'bg-surface text-foreground border-border hover:border-border-strong'
                  }`}
                >
                  {following ? '✓ Following' : '+ Follow'}
                </button>
                {profile.email && (
                  <a
                    href={`mailto:${profile.email}`}
                    className="text-sm font-semibold px-4 py-2 rounded-button transition-colors border border-border bg-surface text-foreground hover:border-border-strong"
                  >
                    Contact
                  </a>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-6 mt-5 flex-wrap">
              <div>
                <span className="text-base font-bold text-foreground">{totalProducts}</span>
                <span className="text-sm text-foreground-muted ml-1.5">launches</span>
              </div>
              <div>
                <span className="text-base font-bold text-foreground">{totalUpvotes}</span>
                <span className="text-sm text-foreground-muted ml-1.5">upvotes earned</span>
              </div>
              {profile.followers !== undefined && (
                <div>
                  <span className="text-base font-bold text-foreground">{profile.followers}</span>
                  <span className="text-sm text-foreground-muted ml-1.5">followers</span>
                </div>
              )}
              {profile.following !== undefined && (
                <div>
                  <span className="text-base font-bold text-foreground">{profile.following}</span>
                  <span className="text-sm text-foreground-muted ml-1.5">following</span>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 mt-6 border-b border-border -mx-6 md:-mx-8 px-6 md:px-8">
              {(['launches', 'upvoted', 'about'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2.5 text-sm font-semibold capitalize border-b-2 -mb-[1px] transition-colors ${
                    tab === t ? 'border-primary text-primary' : 'border-transparent text-foreground-muted hover:text-foreground'
                  }`}
                >
                  {t === 'launches' ? `Launches (${totalProducts})` : t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-4">
            {tab === 'launches' && (
              profile.products.length === 0 ? (
                <div className="bg-surface rounded-card p-10 text-center" style={{ boxShadow: cardShadow }}>
                  <p className="text-base font-bold text-foreground">No launches yet</p>
                  <p className="text-sm text-foreground-muted mt-1">When {profile.name} ships, it'll show up here.</p>
                </div>
              ) : (
                profile.products.map((p) => <ProductCard key={p.id} product={p} onVote={handleVote} />)
              )
            )}

            {tab === 'upvoted' && (
              <div className="bg-surface rounded-card p-10 text-center" style={{ boxShadow: cardShadow }}>
                <p className="text-base font-bold text-foreground">Upvoted launches</p>
                <p className="text-sm text-foreground-muted mt-1">Public upvote history coming soon.</p>
              </div>
            )}

            {tab === 'about' && (
              <div className="bg-surface rounded-card p-6 md:p-8" style={{ boxShadow: cardShadow }}>
                <h2 className="text-base font-bold text-foreground mb-4">About</h2>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{profile.bio}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            {/* Bio */}
            <div className="bg-surface rounded-card p-5" style={{ boxShadow: cardShadow }}>
              <p className="text-xs text-foreground-faint uppercase tracking-wider font-semibold mb-3">Bio</p>
              <p className="text-sm text-foreground leading-relaxed">{profile.bio}</p>
            </div>

            {/* Info */}
            <div className="bg-surface rounded-card p-5 space-y-3" style={{ boxShadow: cardShadow }}>
              <p className="text-xs text-foreground-faint uppercase tracking-wider font-semibold mb-1">Info</p>
              {profile.location && (
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground-faint flex-shrink-0" aria-hidden>
                    <path d="M20 10c0 7-8 13-8 13s-8-6-8-13a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  {profile.location}
                </div>
              )}
              {profile.joined_at && (
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground-faint flex-shrink-0" aria-hidden>
                    <rect width="18" height="18" x="3" y="4" rx="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
                  </svg>
                  Joined {formatJoined(profile.joined_at)}
                </div>
              )}
            </div>

            {/* Links */}
            {(profile.website || profile.github || profile.twitter || profile.linkedin) && (
              <div className="bg-surface rounded-card p-5" style={{ boxShadow: cardShadow }}>
                <p className="text-xs text-foreground-faint uppercase tracking-wider font-semibold mb-3">Links</p>
                <div className="space-y-2">
                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 text-sm text-foreground hover:text-primary transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground-faint flex-shrink-0" aria-hidden>
                        <circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                      {profile.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                  {profile.github && (
                    <a
                      href={profile.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 text-sm text-foreground hover:text-primary transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-foreground-faint flex-shrink-0" aria-hidden>
                        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                      </svg>
                      {profile.github.replace(/^https?:\/\/(www\.)?/, '')}
                    </a>
                  )}
                  {profile.twitter && (
                    <a
                      href={profile.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 text-sm text-foreground hover:text-primary transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-foreground-faint flex-shrink-0" aria-hidden>
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.741l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25z" />
                      </svg>
                      {profile.twitter.replace(/^https?:\/\/(www\.)?/, '').replace('twitter.com/', '@')}
                    </a>
                  )}
                  {profile.linkedin && (
                    <a
                      href={profile.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 text-sm text-foreground hover:text-primary transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-foreground-faint flex-shrink-0" aria-hidden>
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                      {profile.linkedin.replace(/^https?:\/\/(www\.)?/, '')}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Promo */}
            <div className="bg-primary rounded-card p-5">
              <p className="text-sm font-bold text-white">Like what {profile.name} builds?</p>
              <p className="text-xs text-white/70 mt-1 leading-relaxed">Follow them to get notified the next time they ship something.</p>
            </div>
          </aside>
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
