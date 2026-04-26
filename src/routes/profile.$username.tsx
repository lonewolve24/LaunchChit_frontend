import { createFileRoute, useParams } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Header } from '../components/Header'
import { ProductCard } from '../components/ProductCard'
import { PageError } from '../components/PageError'
import { Skeleton } from '../components/Skeleton'
import { Toast } from '../components/Toast'
import { Sparkline } from '../components/Sparkline'
import { KpiTile } from '../components/KpiTile'
import { EditProfileModal, type EditableProfile } from '../components/EditProfileModal'
import { getMe } from '../lib/auth'

export const Route = createFileRoute('/profile/$username')({ component: ProfilePage })

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const cardShadow = '0 1px 4px 0 rgb(0 0 0 / 0.08)'

type Profile = {
  id: string
  username: string
  name: string
  tagline?: string | null
  bio: string
  location?: string | null
  joined_at?: string
  avatar_url: string | null
  cover_color?: string
  website?: string | null
  github?: string | null
  twitter?: string | null
  linkedin?: string | null
  email?: string | null
  phone?: string | null
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

type Tab = 'launches' | 'upvoted' | 'waitlists' | 'analytics' | 'about'

type AnalyticsResponse = {
  period: '30d' | '90d' | '1y'
  totals: { upvotes: number; waitlist: number }
  aggregate_upvotes: Array<{ date: string; value: number }>
  aggregate_waitlist: Array<{ date: string; value: number }>
  products: Array<{
    product_id: string
    product_slug: string
    product_name: string
    total_upvotes: number
    total_waitlist: number
    upvotes_trend: Array<{ date: string; value: number }>
    waitlist_trend: Array<{ date: string; value: number }>
  }>
}

type WaitlistSignup = {
  id: string
  name: string
  email: string
  phone: string | null
  source: 'organic' | 'referral' | 'twitter' | 'newsletter'
  joined_at: string
}

type WaitlistResponse = {
  total: number
  products: Array<{
    product_id: string
    product_slug: string
    product_name: string
    total: number
    signups: WaitlistSignup[]
  }>
}

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
  const [isOwn, setIsOwn] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'30d' | '90d' | '1y'>('30d')
  const [waitlistData, setWaitlistData] = useState<WaitlistResponse | null>(null)
  const [waitlistLoading, setWaitlistLoading] = useState(false)
  const [waitlistProductFilter, setWaitlistProductFilter] = useState<string>('all')
  const [waitlistQuery, setWaitlistQuery] = useState('')

  useEffect(() => {
    fetch(`${API}/profile/${username}`)
      .then((r) => { if (r.status === 404) { setNotFound(true); setLoading(false); return null } return r.json() })
      .then((data) => { if (data) { setProfile(data); setLoading(false) } })
      .catch(() => setLoading(false))
  }, [username])

  // Detect own-profile by comparing the URL slug against the signed-in user.
  useEffect(() => {
    let cancelled = false
    getMe().then((me) => {
      if (cancelled || !me?.name) return
      const meSlug = me.name.toLowerCase().replace(/\s+/g, '-')
      setIsOwn(meSlug === username.toLowerCase())
    })
    return () => { cancelled = true }
  }, [username])

  // Load analytics on demand when the tab is opened or period changes.
  useEffect(() => {
    if (!isOwn || tab !== 'analytics') return
    let cancelled = false
    setAnalyticsLoading(true)
    fetch(`${API}/profile/${username}/analytics?period=${analyticsPeriod}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: AnalyticsResponse | null) => { if (!cancelled) { setAnalytics(data); setAnalyticsLoading(false) } })
      .catch(() => { if (!cancelled) setAnalyticsLoading(false) })
    return () => { cancelled = true }
  }, [isOwn, tab, analyticsPeriod, username])

  // Load waitlist signups on demand for the waitlists tab.
  useEffect(() => {
    if (!isOwn || tab !== 'waitlists') return
    let cancelled = false
    setWaitlistLoading(true)
    fetch(`${API}/profile/${username}/waitlist`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: WaitlistResponse | null) => { if (!cancelled) { setWaitlistData(data); setWaitlistLoading(false) } })
      .catch(() => { if (!cancelled) setWaitlistLoading(false) })
    return () => { cancelled = true }
  }, [isOwn, tab, username])

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

  if (notFound) return <><Header /><PageError status={404} message="That builder does not exist." /></>

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-surface-subtle">
        <Header />
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
  const totalWaitlist = profile.products.reduce((s, p) => s + (p.waitlist_count ?? 0), 0)

  return (
    <div className="min-h-screen bg-surface-subtle">
      <Header />

      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-8">
        {/* Hero card */}
        <div className="bg-surface rounded-card overflow-hidden mb-6" style={{ boxShadow: cardShadow }}>
          {/* Cover band — avatar overlaps it, name sits below on the light card */}
          <div
            className="h-20 relative"
            style={{ background: `linear-gradient(135deg, ${profile.cover_color ?? '#2563EB'} 0%, #1E40AF 100%)` }}
          >
            <div className="absolute -bottom-12 md:-bottom-14 left-6 md:left-8">
              <div
                className="w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center text-white font-bold text-4xl md:text-5xl border-4 border-surface"
                style={{ backgroundColor: profile.cover_color ?? '#2563EB' }}
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
                {isOwn ? (
                  <button
                    onClick={() => setEditOpen(true)}
                    className="text-sm font-semibold px-5 py-2 rounded-button transition-colors border border-border bg-surface text-foreground hover:border-border-strong inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                    </svg>
                    Edit profile
                  </button>
                ) : (
                  <button
                    onClick={() => { setFollowing((f) => !f); setToast({ message: following ? 'Unfollowed.' : 'Following — you\'ll see their new launches.', variant: 'success' }) }}
                    className={`text-sm font-semibold px-5 py-2 rounded-button transition-colors border ${
                      following ? 'bg-primary text-white border-primary' : 'bg-surface text-foreground border-border hover:border-border-strong'
                    }`}
                  >
                    {following ? '✓ Following' : '+ Follow'}
                  </button>
                )}
                {!isOwn && profile.email && (
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
              {isOwn && (
                <div>
                  <span className="text-base font-bold text-foreground">{totalWaitlist.toLocaleString()}</span>
                  <span className="text-sm text-foreground-muted ml-1.5">on waitlists</span>
                </div>
              )}
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
            <div className="flex items-center gap-1 mt-6 border-b border-border -mx-6 md:-mx-8 px-6 md:px-8 overflow-x-auto">
              {((isOwn
                ? ['launches', 'upvoted', 'waitlists', 'analytics', 'about']
                : ['launches', 'upvoted', 'about']) as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2.5 text-sm font-semibold capitalize border-b-2 -mb-[1px] transition-colors whitespace-nowrap cursor-pointer ${
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

            {tab === 'waitlists' && isOwn && (
              <WaitlistPanel
                loading={waitlistLoading}
                data={waitlistData}
                productFilter={waitlistProductFilter}
                onProductFilter={setWaitlistProductFilter}
                query={waitlistQuery}
                onQueryChange={setWaitlistQuery}
                onToast={(message, variant) => setToast({ message, variant })}
              />
            )}

            {tab === 'about' && (
              <div className="bg-surface rounded-card p-6 md:p-8" style={{ boxShadow: cardShadow }}>
                <h2 className="text-base font-bold text-foreground mb-4">About</h2>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{profile.bio}</p>
              </div>
            )}

            {tab === 'analytics' && isOwn && (
              <div className="space-y-4">
                {/* Period toggle */}
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-foreground">Your performance</h2>
                  <div className="inline-flex bg-surface rounded-button p-0.5 border border-border" style={{ boxShadow: cardShadow }}>
                    {(['30d', '90d', '1y'] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setAnalyticsPeriod(p)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-button transition-colors cursor-pointer ${
                          analyticsPeriod === p ? 'bg-surface-subtle text-primary' : 'text-foreground-muted hover:text-foreground'
                        }`}
                      >
                        {p === '1y' ? '1 year' : p}
                      </button>
                    ))}
                  </div>
                </div>

                {analyticsLoading || !analytics ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <Skeleton className="h-24 rounded-card" />
                      <Skeleton className="h-24 rounded-card" />
                    </div>
                    <Skeleton className="h-44 rounded-card" />
                    <Skeleton className="h-44 rounded-card" />
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <KpiTile label="Total upvotes"  value={analytics.totals.upvotes.toLocaleString()}  hint={`across ${analytics.products.length} ${analytics.products.length === 1 ? 'product' : 'products'}`} />
                      <KpiTile label="Total waitlist" value={analytics.totals.waitlist.toLocaleString()} hint={`across ${analytics.products.length} ${analytics.products.length === 1 ? 'product' : 'products'}`} />
                    </div>

                    <div className="bg-surface rounded-card p-5" style={{ boxShadow: cardShadow }}>
                      <p className="text-sm font-bold text-foreground">Upvotes — all products</p>
                      <p className="text-xs text-foreground-faint mt-0.5">Daily totals over the last {analyticsPeriod === '1y' ? 'year' : analyticsPeriod}. Hover for daily counts.</p>
                      <div className="mt-3"><Sparkline data={analytics.aggregate_upvotes} ariaLabel="Aggregate upvotes trend" valueLabel="upvotes" /></div>
                    </div>

                    <div className="bg-surface rounded-card p-5" style={{ boxShadow: cardShadow }}>
                      <p className="text-sm font-bold text-foreground">Waitlist signups — all products</p>
                      <p className="text-xs text-foreground-faint mt-0.5">Daily totals over the last {analyticsPeriod === '1y' ? 'year' : analyticsPeriod}. Hover for daily counts.</p>
                      <div className="mt-3"><Sparkline data={analytics.aggregate_waitlist} ariaLabel="Aggregate waitlist trend" valueLabel="signups" /></div>
                    </div>

                    {/* Per-product breakdown */}
                    <div className="bg-surface rounded-card p-5" style={{ boxShadow: cardShadow }}>
                      <p className="text-sm font-bold text-foreground mb-4">Per-product</p>
                      <ul className="space-y-5">
                        {analytics.products.map((p) => (
                          <li key={p.product_id} className="border-b border-border last:border-0 pb-5 last:pb-0">
                            <div className="flex items-baseline justify-between gap-3 mb-2">
                              <a href={`/p/${p.product_slug}`} className="text-sm font-bold text-foreground hover:text-primary truncate">
                                {p.product_name}
                              </a>
                              <span className="text-xs text-foreground-faint flex-shrink-0">
                                {p.total_upvotes.toLocaleString()} upvotes · {p.total_waitlist.toLocaleString()} waitlist
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <p className="text-[11px] font-bold text-foreground-faint uppercase tracking-wider mb-1">Upvotes</p>
                                <Sparkline data={p.upvotes_trend} ariaLabel={`${p.product_name} upvotes`} valueLabel="upvotes" />
                              </div>
                              <div>
                                <p className="text-[11px] font-bold text-foreground-faint uppercase tracking-wider mb-1">Waitlist</p>
                                <Sparkline data={p.waitlist_trend} ariaLabel={`${p.product_name} waitlist`} valueLabel="signups" />
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
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

      {isOwn && profile && (
        <EditProfileModal
          open={editOpen}
          initial={{
            name: profile.name,
            tagline: profile.tagline ?? '',
            bio: profile.bio,
            location: profile.location ?? '',
            website: profile.website ?? '',
            github: profile.github ?? '',
            twitter: profile.twitter ?? '',
            linkedin: profile.linkedin ?? '',
            email: profile.email ?? '',
            phone: profile.phone ?? '',
          }}
          onClose={() => setEditOpen(false)}
          onSaved={(next: EditableProfile) => {
            setProfile((prev) => prev ? {
              ...prev,
              name: next.name,
              tagline: next.tagline ?? null,
              bio: next.bio,
              location: next.location ?? null,
              website: next.website ?? null,
              github: next.github ?? null,
              twitter: next.twitter ?? null,
              linkedin: next.linkedin ?? null,
              email: next.email ?? null,
              phone: next.phone ?? null,
            } : prev)
            setToast({ message: 'Profile updated.', variant: 'success' })
          }}
        />
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 w-80">
          <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
        </div>
      )}
    </div>
  )
}

type WaitlistPanelProps = {
  loading: boolean
  data: WaitlistResponse | null
  productFilter: string
  onProductFilter: (slug: string) => void
  query: string
  onQueryChange: (q: string) => void
  onToast: (message: string, variant: 'success' | 'error') => void
}

function WaitlistPanel({ loading, data, productFilter, onProductFilter, query, onQueryChange, onToast }: WaitlistPanelProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [hasInit, setHasInit] = useState(false)

  // Initial open state: collapse everything when there are multiple products,
  // auto-expand the first when there's only one. Re-runs after data arrives.
  useEffect(() => {
    if (!data || hasInit) return
    setExpanded(data.products.length === 1 ? new Set([data.products[0].product_id]) : new Set())
    setHasInit(true)
  }, [data, hasInit])

  // When the user filters to a single product, auto-expand it. When they
  // type a search query, expand everything so matches aren't hidden.
  useEffect(() => {
    if (!data) return
    if (query.trim()) {
      setExpanded(new Set(data.products.map((g) => g.product_id)))
      return
    }
    if (productFilter !== 'all') {
      const match = data.products.find((g) => g.product_slug === productFilter)
      if (match) setExpanded(new Set([match.product_id]))
    }
  }, [productFilter, query, data])

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-card" />
        <Skeleton className="h-44 rounded-card" />
      </div>
    )
  }

  if (data.products.length === 0) {
    return (
      <div className="bg-surface rounded-card p-10 text-center" style={{ boxShadow: cardShadow }}>
        <p className="text-base font-bold text-foreground">No waitlist signups yet</p>
        <p className="text-sm text-foreground-muted mt-1">When people join your product waitlists, they'll show up here.</p>
      </div>
    )
  }

  const filteredGroups = (productFilter === 'all'
    ? data.products
    : data.products.filter((g) => g.product_slug === productFilter)
  ).map((g) => {
    const q = query.trim().toLowerCase()
    const signups = q
      ? g.signups.filter((s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || (s.phone ?? '').toLowerCase().includes(q))
      : g.signups
    return { ...g, signups }
  })

  function copyEmails(emails: string[]) {
    if (emails.length === 0) { onToast('No emails to copy.', 'error'); return }
    navigator.clipboard.writeText(emails.join(', '))
      .then(() => onToast(`Copied ${emails.length} ${emails.length === 1 ? 'email' : 'emails'}.`, 'success'))
      .catch(() => onToast('Could not copy.', 'error'))
  }

  function downloadCsv(group: { product_name: string; signups: WaitlistSignup[] }) {
    const header = 'name,email,phone,source,joined_at'
    const rows = group.signups.map((s) =>
      [s.name, s.email, s.phone ?? '', s.source, s.joined_at]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    )
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${group.product_name.toLowerCase().replace(/\s+/g, '-')}-waitlist.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Header / filter bar */}
      <div className="bg-surface rounded-card p-5" style={{ boxShadow: cardShadow }}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-foreground">Waitlist signups</h2>
            <p className="text-xs text-foreground-muted mt-0.5">
              {data.total.toLocaleString()} people across {data.products.length} {data.products.length === 1 ? 'product' : 'products'}.
              Reach out for market research or launch updates.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            <select
              value={productFilter}
              onChange={(e) => onProductFilter(e.target.value)}
              className="text-sm border border-border rounded-button px-3 py-1.5 bg-surface focus:outline-none focus:border-primary"
            >
              <option value="all">All products</option>
              {data.products.map((g) => (
                <option key={g.product_slug} value={g.product_slug}>{g.product_name}</option>
              ))}
            </select>
            <input
              type="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search name or email…"
              className="text-sm border border-border rounded-button px-3 py-1.5 bg-surface focus:outline-none focus:border-primary w-48"
            />
            {data.products.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  const allOpen = expanded.size === data.products.length
                  setExpanded(allOpen ? new Set() : new Set(data.products.map((g) => g.product_id)))
                }}
                className="text-xs font-semibold px-3 py-1.5 rounded-button border border-border bg-surface text-foreground hover:border-border-strong cursor-pointer"
              >
                {expanded.size === data.products.length ? 'Collapse all' : 'Expand all'}
              </button>
            )}
          </div>
        </div>
      </div>

      {filteredGroups.map((group) => {
        const isOpen = expanded.has(group.product_id)
        return (
        <div key={group.product_id} className="bg-surface rounded-card overflow-hidden" style={{ boxShadow: cardShadow }}>
          <header className={`flex items-center justify-between gap-3 px-5 py-3 ${isOpen ? 'border-b border-border' : ''}`}>
            <button
              type="button"
              onClick={() => toggle(group.product_id)}
              aria-expanded={isOpen}
              aria-controls={`waitlist-${group.product_id}`}
              className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer group"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
                className={`flex-shrink-0 text-foreground-faint group-hover:text-foreground transition-transform ${isOpen ? 'rotate-90' : ''}`}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <div className="min-w-0">
                <span className="text-sm font-bold text-foreground group-hover:text-primary truncate block">
                  {group.product_name}
                </span>
                <span className="text-xs text-foreground-faint mt-0.5 block">
                  {group.signups.length.toLocaleString()} {query ? 'matching' : 'shown'} · {group.total.toLocaleString()} total
                </span>
              </div>
            </button>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => copyEmails(group.signups.map((s) => s.email))}
                className="text-xs font-semibold px-3 py-1.5 rounded-button border border-border bg-surface text-foreground hover:border-border-strong cursor-pointer"
              >
                Copy emails
              </button>
              <button
                type="button"
                onClick={() => downloadCsv(group)}
                className="text-xs font-semibold px-3 py-1.5 rounded-button border border-border bg-surface text-foreground hover:border-border-strong cursor-pointer"
              >
                Export CSV
              </button>
            </div>
          </header>

          {isOpen && (
          <div id={`waitlist-${group.product_id}`}>
          {group.signups.length === 0 ? (
            <p className="px-5 py-6 text-sm text-foreground-muted text-center">No matches.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-subtle text-foreground-muted">
                  <tr className="text-left">
                    <th className="font-semibold px-5 py-2.5">Name</th>
                    <th className="font-semibold px-5 py-2.5">Email</th>
                    <th className="font-semibold px-5 py-2.5">Phone</th>
                    <th className="font-semibold px-5 py-2.5">Source</th>
                    <th className="font-semibold px-5 py-2.5">Joined</th>
                    <th className="font-semibold px-5 py-2.5 text-right">Reach out</th>
                  </tr>
                </thead>
                <tbody>
                  {group.signups.map((s) => (
                    <tr key={s.id} className="border-t border-border hover:bg-surface-subtle/60">
                      <td className="px-5 py-2.5 text-foreground font-medium whitespace-nowrap">{s.name}</td>
                      <td className="px-5 py-2.5 text-foreground-muted whitespace-nowrap">
                        <a href={`mailto:${s.email}`} className="hover:text-primary">{s.email}</a>
                      </td>
                      <td className="px-5 py-2.5 text-foreground-muted whitespace-nowrap">
                        {s.phone ? <a href={`tel:${s.phone.replace(/\s+/g, '')}`} className="hover:text-primary">{s.phone}</a> : <span className="text-foreground-faint">—</span>}
                      </td>
                      <td className="px-5 py-2.5 whitespace-nowrap">
                        <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-button bg-surface-subtle text-foreground-muted capitalize border border-border">
                          {s.source}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-foreground-faint whitespace-nowrap">
                        {new Date(s.joined_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-2.5 text-right whitespace-nowrap">
                        <a
                          href={`mailto:${s.email}?subject=${encodeURIComponent(`About ${group.product_name}`)}`}
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          Email
                        </a>
                        {s.phone && (
                          <>
                            <span className="text-foreground-faint mx-2">·</span>
                            <a
                              href={`https://wa.me/${s.phone.replace(/[^\d]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-primary hover:underline"
                            >
                              WhatsApp
                            </a>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </div>
          )}
        </div>
        )
      })}
    </div>
  )
}
