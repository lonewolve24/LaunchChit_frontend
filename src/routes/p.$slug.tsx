import { createFileRoute, useParams } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Header } from '../components/Header'
import { UpvoteButton } from '../components/UpvoteButton'
import { Skeleton } from '../components/Skeleton'
import { PageError } from '../components/PageError'
import { Toast } from '../components/Toast'

export const Route = createFileRoute('/p/$slug')({ component: ProductDetailPage })

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const PLACEHOLDER_COLORS = ['#1B4332', '#7C5CBF', '#2563EB', '#DC4A22', '#0891B2', '#B45309', '#065F46']
function placeholderColor(name: string): string {
  const idx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % PLACEHOLDER_COLORS.length
  return PLACEHOLDER_COLORS[idx]
}

const cardShadow = '0 1px 4px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)'

const COLLECTIONS_KEY = 'launchedchit:collections'
function readCollections(): string[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(COLLECTIONS_KEY) ?? '[]') } catch { return [] }
}
function writeCollections(slugs: string[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(slugs))
}

type Topic = { slug: string; name: string }
type Maker = { id: string; name: string; avatar_url: string | null; bio?: string }
type TeamMember = { name: string; role: string; avatar_color: string; bio: string }
type BuiltWith = { name: string; description: string; icon_color: string }
type Comment = {
  id: string
  author: { name: string; role?: string }
  body: string
  created_at: string
  upvotes: number
  replies: Array<{ id: string; author: { name: string; role?: string }; body: string; created_at: string; upvotes: number }>
}
type Review = {
  id: string
  author: { name: string }
  rating: number
  headline: string
  body: string
  created_at: string
  helpful: number
}
type SimilarProduct = { id: string; slug: string; name: string; tagline: string; vote_count: number }

type Product = {
  id: string
  slug: string
  name: string
  tagline: string
  description: string
  website_url: string
  logo_url: string | null
  vote_count: number
  has_voted: boolean
  maker: Maker
  topics?: Topic[]
  pricing?: string
  platforms?: string[]
  launch_date?: string
  day_rank?: number
  gallery?: Array<{ color: string; label: string }>
  similar_products?: SimilarProduct[]
  stats?: { followers: number; reviews: number }
  comments?: Comment[]
  team?: TeamMember[]
  built_with?: BuiltWith[]
  ratings?: { average: number; total: number; breakdown: Record<string, number> }
  reviews?: Review[]
}

type Tab = 'overview' | 'comments' | 'reviews' | 'team' | 'similar'

export function ProductDetailPage() {
  const { slug } = useParams({ from: '/p/$slug' })
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)
  const [tab, setTab] = useState<Tab>('overview')
  const [galleryIdx, setGalleryIdx] = useState(0)
  const [newComment, setNewComment] = useState('')
  const [inCollection, setInCollection] = useState(false)
  const [following, setFollowing] = useState(false)

  useEffect(() => {
    fetch(`${API}/products/${slug}`, { credentials: 'include' })
      .then((r) => { if (r.status === 404) { setNotFound(true); setLoading(false); return null } return r.json() })
      .then((data) => { if (data) { setProduct(data); setLoading(false) } })
      .catch(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    setInCollection(readCollections().includes(slug))
  }, [slug])

  function toggleCollection() {
    const list = readCollections()
    if (list.includes(slug)) {
      writeCollections(list.filter((s) => s !== slug))
      setInCollection(false)
      setToast({ message: 'Removed from your collection.', variant: 'success' })
    } else {
      writeCollections([...list, slug])
      setInCollection(true)
      setToast({ message: 'Added to your collection.', variant: 'success' })
    }
  }

  async function handleVote() {
    if (!product) return
    const method = product.has_voted ? 'DELETE' : 'POST'
    const res = await fetch(`${API}/products/${product.id}/vote`, { method, credentials: 'include' })
    if (res.status === 401) { window.location.href = '/login'; return }
    if (res.ok) {
      const { vote_count } = await res.json()
      setProduct((p) => p ? { ...p, vote_count, has_voted: !p.has_voted } : p)
    } else {
      setToast({ message: 'Could not register vote.', variant: 'error' })
    }
  }

  function nextSlide() {
    if (!product?.gallery) return
    setGalleryIdx((i) => (i + 1) % product.gallery!.length)
  }
  function prevSlide() {
    if (!product?.gallery) return
    setGalleryIdx((i) => (i - 1 + product.gallery!.length) % product.gallery!.length)
  }

  if (notFound) return <><Header user={null} /><PageError status={404} message="That product does not exist." /></>

  if (loading || !product) {
    return (
      <div className="min-h-screen bg-surface-subtle">
        <Header user={null} />
        <main className="max-w-7xl mx-auto px-6 lg:px-10 py-10 space-y-4">
          <Skeleton className="h-32 w-full rounded-card" />
          <Skeleton className="h-72 w-full rounded-card" />
        </main>
      </div>
    )
  }

  const makerSlug = product.maker.name.toLowerCase().replace(/\s+/g, '-')
  const launchDate = product.launch_date ? new Date(product.launch_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
  const tabs: Array<{ key: Tab; label: string; count?: number }> = [
    { key: 'overview', label: 'Overview' },
    { key: 'comments', label: 'Comments', count: product.comments?.length },
    { key: 'reviews', label: 'Reviews', count: product.reviews?.length },
    { key: 'team', label: 'Team & Stack' },
    { key: 'similar', label: 'Similar' },
  ]

  return (
    <div className="min-h-screen bg-surface-subtle">
      <Header user={null} />

      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-5 text-sm">
          <a href="/" className="text-foreground-faint hover:text-foreground transition-colors">Home</a>
          <span className="text-foreground-faint">›</span>
          <span className="text-foreground-muted">{product.name}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* MAIN COLUMN */}
          <div className="flex-1 min-w-0">

            {/* Header card */}
            <div className="bg-surface rounded-card p-6 md:p-8" style={{ boxShadow: cardShadow }}>
              <div className="flex flex-col sm:flex-row gap-6">
                {product.logo_url ? (
                  <img src={product.logo_url} alt={product.name} className="w-24 h-24 rounded-card object-cover flex-shrink-0" />
                ) : (
                  <div
                    className="w-24 h-24 rounded-card flex items-center justify-center flex-shrink-0 text-white font-bold text-4xl"
                    style={{ backgroundColor: placeholderColor(product.name) }}
                  >
                    {product.name[0]}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">{product.name}</h1>
                  <p className="text-foreground-muted mt-1.5 text-base">{product.tagline}</p>

                  <div className="flex items-center gap-4 mt-3 text-xs flex-wrap">
                    <a href={`/profile/${makerSlug}`} className="text-foreground-faint hover:text-foreground transition-colors">
                      by <span className="font-medium">{product.maker.name}</span>
                    </a>
                    {product.stats && (
                      <>
                        <span className="text-foreground-faint">·</span>
                        <span className="text-foreground-faint">{product.stats.followers.toLocaleString()} followers</span>
                        <span className="text-foreground-faint">·</span>
                        {product.ratings && (
                          <span className="text-foreground-faint flex items-center gap-1">
                            <span className="text-accent">★</span>
                            <span className="font-semibold text-foreground">{product.ratings.average.toFixed(1)}</span>
                            <span>({product.ratings.total} reviews)</span>
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {product.topics && product.topics.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mt-4">
                      {product.topics.map((topic) => (
                        <a
                          key={topic.slug}
                          href={`/topics/${topic.slug}`}
                          className="text-xs font-medium text-foreground-muted bg-surface-subtle hover:bg-primary hover:text-white px-2.5 py-1 rounded-full border border-border transition-colors"
                        >
                          {topic.name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex sm:flex-col items-stretch sm:items-end gap-2 flex-shrink-0">
                  <a
                    href={product.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-accent text-white text-sm font-semibold px-5 py-2.5 rounded-button hover:bg-accent-dark transition-colors text-center whitespace-nowrap flex items-center gap-2 justify-center"
                  >
                    Visit website
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M7 17 17 7" /><path d="M7 7h10v10" /></svg>
                  </a>
                  <div className="flex sm:flex-col gap-2">
                    <button
                      onClick={() => { setFollowing((f) => !f); setToast({ message: following ? 'Unfollowed.' : 'Following — you\'ll get update notifications.', variant: 'success' }) }}
                      className={`text-sm font-semibold px-4 py-2.5 rounded-button transition-colors whitespace-nowrap border ${
                        following ? 'bg-primary text-white border-primary' : 'bg-surface text-foreground border-border hover:border-border-strong'
                      }`}
                    >
                      {following ? '✓ Following' : '+ Follow'}
                    </button>
                    <button
                      onClick={toggleCollection}
                      className={`text-sm font-semibold px-4 py-2.5 rounded-button transition-colors whitespace-nowrap border flex items-center gap-1.5 justify-center ${
                        inCollection ? 'bg-accent/10 text-accent border-accent' : 'bg-surface text-foreground border-border hover:border-border-strong'
                      }`}
                      aria-pressed={inCollection}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill={inCollection ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                      </svg>
                      {inCollection ? 'Saved' : 'Collect'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 mt-7 border-b border-border -mx-6 md:-mx-8 px-6 md:px-8 overflow-x-auto">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-[1px] transition-colors whitespace-nowrap ${
                      tab === t.key ? 'border-primary text-primary' : 'border-transparent text-foreground-muted hover:text-foreground'
                    }`}
                  >
                    {t.label}{t.count !== undefined ? ` (${t.count})` : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            {tab === 'overview' && (
              <>
                {/* SLIDESHOW */}
                {product.gallery && product.gallery.length > 0 && (
                  <div className="bg-surface rounded-card p-6 mt-5" style={{ boxShadow: cardShadow }}>
                    <div className="relative">
                      <div
                        className="aspect-[16/9] rounded-card flex items-center justify-center text-white text-3xl font-bold transition-all duration-300"
                        style={{ backgroundColor: product.gallery[galleryIdx].color }}
                      >
                        {product.gallery[galleryIdx].label}
                      </div>

                      {/* Prev/Next */}
                      <button
                        onClick={prevSlide}
                        aria-label="Previous slide"
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-surface flex items-center justify-center text-foreground hover:scale-110 transition-transform"
                        style={{ boxShadow: '0 2px 8px rgb(0 0 0 / 0.15)' }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                      </button>
                      <button
                        onClick={nextSlide}
                        aria-label="Next slide"
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-surface flex items-center justify-center text-foreground hover:scale-110 transition-transform"
                        style={{ boxShadow: '0 2px 8px rgb(0 0 0 / 0.15)' }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                      </button>

                      {/* Slide counter */}
                      <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur">
                        {galleryIdx + 1} / {product.gallery.length}
                      </div>
                    </div>

                    {/* Thumbnails */}
                    <div className="flex gap-2 mt-3 overflow-x-auto">
                      {product.gallery.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setGalleryIdx(i)}
                          aria-label={`Go to slide ${i + 1}`}
                          className={`flex-shrink-0 w-24 aspect-video rounded-button text-white text-[10px] font-semibold flex items-center justify-center transition-all ${
                            galleryIdx === i ? 'ring-2 ring-primary ring-offset-2' : 'opacity-60 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: img.color }}
                        >
                          {img.label}
                        </button>
                      ))}
                    </div>

                    {/* Indicator dots */}
                    <div className="flex justify-center gap-1.5 mt-4">
                      {product.gallery.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setGalleryIdx(i)}
                          aria-label={`Go to slide ${i + 1}`}
                          className={`h-1.5 rounded-full transition-all ${
                            galleryIdx === i ? 'w-6 bg-primary' : 'w-1.5 bg-border hover:bg-foreground-faint'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="bg-surface rounded-card p-6 md:p-8 mt-5" style={{ boxShadow: cardShadow }}>
                  <h2 className="text-base font-bold text-foreground mb-4">About {product.name}</h2>
                  <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">{product.description}</div>
                </div>

                {/* Specs */}
                <div className="bg-surface rounded-card p-6 md:p-8 mt-5" style={{ boxShadow: cardShadow }}>
                  <h2 className="text-base font-bold text-foreground mb-4">Product details</h2>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                    <div>
                      <dt className="text-xs font-semibold text-foreground-faint uppercase tracking-wider mb-1">Pricing</dt>
                      <dd className="text-foreground">{product.pricing}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-foreground-faint uppercase tracking-wider mb-1">Available on</dt>
                      <dd className="text-foreground">{product.platforms?.join(' · ')}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-foreground-faint uppercase tracking-wider mb-1">Launched</dt>
                      <dd className="text-foreground">{launchDate}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-foreground-faint uppercase tracking-wider mb-1">Website</dt>
                      <dd>
                        <a href={product.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {product.website_url.replace(/^https?:\/\//, '')}
                        </a>
                      </dd>
                    </div>
                  </dl>
                </div>
              </>
            )}

            {tab === 'comments' && (
              <div className="bg-surface rounded-card p-6 md:p-8 mt-5" style={{ boxShadow: cardShadow }}>
                <h2 className="text-base font-bold text-foreground mb-4">Discussion</h2>

                <div className="bg-surface-subtle rounded-card p-4 mb-6">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="What do you think? Share your feedback…"
                    rows={3}
                    className="w-full bg-transparent text-sm text-foreground placeholder-foreground-faint resize-none outline-none"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => { setNewComment(''); setToast({ message: 'Sign in to post a comment.', variant: 'success' }) }}
                      className="bg-primary text-white text-sm font-semibold px-4 py-1.5 rounded-button hover:bg-primary-dark transition-colors disabled:opacity-50"
                      disabled={!newComment.trim()}
                    >
                      Post comment
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {product.comments?.map((c) => <CommentBlock key={c.id} comment={c} />)}
                </div>
              </div>
            )}

            {tab === 'reviews' && product.ratings && (
              <div className="bg-surface rounded-card p-6 md:p-8 mt-5" style={{ boxShadow: cardShadow }}>
                <h2 className="text-base font-bold text-foreground mb-5">Reviews</h2>

                {/* Rating breakdown */}
                <div className="flex flex-col md:flex-row gap-8 mb-8 pb-8 border-b border-border">
                  <div className="text-center md:text-left">
                    <div className="text-5xl font-bold text-foreground">{product.ratings.average.toFixed(1)}</div>
                    <div className="flex justify-center md:justify-start gap-0.5 mt-2 text-accent text-lg">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s}>{s <= Math.round(product.ratings!.average) ? '★' : '☆'}</span>
                      ))}
                    </div>
                    <p className="text-xs text-foreground-muted mt-1">Based on {product.ratings.total} reviews</p>
                  </div>

                  <div className="flex-1 space-y-1.5">
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const count = product.ratings!.breakdown[stars] ?? 0
                      const pct = (count / product.ratings!.total) * 100
                      return (
                        <div key={stars} className="flex items-center gap-3 text-sm">
                          <span className="text-foreground-muted w-3">{stars}</span>
                          <span className="text-accent">★</span>
                          <div className="flex-1 h-2 bg-surface-raised rounded-full overflow-hidden">
                            <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-foreground-faint w-8 text-right">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Write a review CTA */}
                <div className="bg-surface-subtle rounded-card p-5 mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-foreground">Used {product.name}?</p>
                    <p className="text-xs text-foreground-muted mt-0.5">Share your honest experience with the community.</p>
                  </div>
                  <button
                    onClick={() => setToast({ message: 'Sign in to leave a review.', variant: 'success' })}
                    className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-button hover:bg-primary-dark transition-colors flex-shrink-0"
                  >
                    Write a review
                  </button>
                </div>

                {/* Review list */}
                <div className="space-y-5">
                  {product.reviews?.map((r) => (
                    <div key={r.id} className="border-b border-border last:border-0 pb-5 last:pb-0">
                      <div className="flex items-start gap-3 mb-2">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                          style={{ backgroundColor: '#7C5CBF' }}
                        >
                          {r.author.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground">{r.author.name}</p>
                          <div className="flex items-center gap-2 text-xs text-foreground-faint mt-0.5">
                            <span className="text-accent">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                            <span>·</span>
                            <span>{r.created_at}</span>
                          </div>
                        </div>
                      </div>
                      <h3 className="text-sm font-bold text-foreground mb-1">{r.headline}</h3>
                      <p className="text-sm text-foreground leading-relaxed">{r.body}</p>
                      <button className="text-xs text-foreground-muted hover:text-foreground transition-colors mt-2">
                        👍 Helpful ({r.helpful})
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'team' && (
              <>
                {/* Team */}
                {product.team && (
                  <div className="bg-surface rounded-card p-6 md:p-8 mt-5" style={{ boxShadow: cardShadow }}>
                    <h2 className="text-base font-bold text-foreground mb-5">Launch Team</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {product.team.map((member) => (
                        <div key={member.name} className="flex items-start gap-3">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0"
                            style={{ backgroundColor: member.avatar_color }}
                          >
                            {member.name[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-bold text-foreground">{member.name}</p>
                              <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Maker
                              </span>
                            </div>
                            <p className="text-xs text-foreground-muted mt-0.5">{member.role}</p>
                            <p className="text-xs text-foreground-faint mt-1.5">{member.bio}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Built With */}
                {product.built_with && (
                  <div className="bg-surface rounded-card p-6 md:p-8 mt-5" style={{ boxShadow: cardShadow }}>
                    <h2 className="text-base font-bold text-foreground mb-5">Built With</h2>
                    <p className="text-sm text-foreground-muted mb-5">The tools and services powering {product.name}.</p>
                    <div className="space-y-4">
                      {product.built_with.map((tech) => (
                        <div key={tech.name} className="flex items-start gap-4 p-4 rounded-card bg-surface-subtle">
                          <div
                            className="w-11 h-11 rounded-card flex items-center justify-center text-white font-bold text-base flex-shrink-0"
                            style={{ backgroundColor: tech.icon_color }}
                          >
                            {tech.name[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-foreground">{tech.name}</p>
                            <p className="text-xs text-foreground-muted mt-1 leading-relaxed">{tech.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {tab === 'similar' && (
              <div className="bg-surface rounded-card p-6 md:p-8 mt-5" style={{ boxShadow: cardShadow }}>
                <h2 className="text-base font-bold text-foreground mb-4">Similar products</h2>
                {product.similar_products && product.similar_products.length > 0 ? (
                  <div className="space-y-3">
                    {product.similar_products.map((p) => (
                      <a
                        key={p.id}
                        href={`/p/${p.slug}`}
                        className="flex items-center gap-4 p-3 rounded-card hover:bg-surface-subtle transition-colors"
                      >
                        <div
                          className="w-12 h-12 rounded-card flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
                          style={{ backgroundColor: placeholderColor(p.name) }}
                        >
                          {p.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-foreground">{p.name}</p>
                          <p className="text-sm text-foreground-muted truncate">{p.tagline}</p>
                        </div>
                        <span className="text-sm font-semibold text-foreground-muted flex-shrink-0">▲ {p.vote_count}</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-foreground-muted">No similar products yet.</p>
                )}
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <aside className="lg:w-80 flex-shrink-0 space-y-5">
            {/* Day Rank + Upvote */}
            <div className="bg-surface rounded-card p-6" style={{ boxShadow: cardShadow }}>
              {product.day_rank && (
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                  <div>
                    <p className="text-xs text-foreground-faint uppercase tracking-wider font-semibold">Day Rank</p>
                    <p className="text-3xl font-bold text-primary mt-1">#{product.day_rank}</p>
                  </div>
                  <p className="text-xs text-foreground-muted text-right">Today's<br />Launches</p>
                </div>
              )}
              <div className="flex items-center justify-center">
                <UpvoteButton voteCount={product.vote_count} hasVoted={product.has_voted} onVote={handleVote} size="lg" />
              </div>
              <p className="text-xs text-center text-foreground-muted mt-3">
                {product.has_voted ? 'Thanks for upvoting!' : 'Help this launch climb the leaderboard.'}
              </p>

              <div className="mt-4 pt-4 border-t border-border space-y-2">
                <button
                  onClick={toggleCollection}
                  className={`w-full text-sm font-semibold py-2 rounded-button transition-colors flex items-center justify-center gap-2 border ${
                    inCollection ? 'bg-accent/10 text-accent border-accent' : 'bg-surface text-foreground border-border hover:border-border-strong'
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={inCollection ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                  </svg>
                  {inCollection ? 'In your collection' : 'Add to collection'}
                </button>
                <a
                  href="/collections"
                  className="block text-center text-xs text-primary hover:underline font-medium"
                >
                  View your collection →
                </a>
              </div>
            </div>

            {/* Maker block */}
            <div className="bg-surface rounded-card p-6" style={{ boxShadow: cardShadow }}>
              <p className="text-xs text-foreground-faint uppercase tracking-wider font-semibold mb-3">Maker</p>
              <a href={`/profile/${makerSlug}`} className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0"
                  style={{ backgroundColor: '#1B4332' }}
                >
                  {product.maker.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-foreground hover:text-primary transition-colors">{product.maker.name}</p>
                  <p className="text-xs text-foreground-muted">View profile →</p>
                </div>
              </a>
              {product.maker.bio && (
                <p className="text-xs text-foreground-muted leading-relaxed mt-4">{product.maker.bio}</p>
              )}
              {product.team && product.team.length > 1 && (
                <button
                  onClick={() => setTab('team')}
                  className="text-xs text-primary hover:underline font-medium mt-3"
                >
                  See all {product.team.length} team members →
                </button>
              )}
            </div>

            {/* Built With (sidebar mini) */}
            {product.built_with && (
              <div className="bg-surface rounded-card p-6" style={{ boxShadow: cardShadow }}>
                <p className="text-xs text-foreground-faint uppercase tracking-wider font-semibold mb-3">Built With</p>
                <div className="flex flex-wrap gap-2">
                  {product.built_with.map((tech) => (
                    <button
                      key={tech.name}
                      onClick={() => setTab('team')}
                      className="flex items-center gap-1.5 text-xs font-semibold text-foreground bg-surface-subtle hover:bg-surface-raised border border-border px-2.5 py-1.5 rounded-button transition-colors"
                    >
                      <span
                        className="w-4 h-4 rounded-sm flex items-center justify-center text-white text-[9px] font-bold"
                        style={{ backgroundColor: tech.icon_color }}
                      >
                        {tech.name[0]}
                      </span>
                      {tech.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Share */}
            <div className="bg-surface rounded-card p-6" style={{ boxShadow: cardShadow }}>
              <p className="text-xs text-foreground-faint uppercase tracking-wider font-semibold mb-3">Share</p>
              <div className="flex gap-2">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${product.name} — ${product.tagline}`)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold text-foreground border border-border px-3 py-2 rounded-button hover:border-border-strong transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.741l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25z" /></svg>
                  X
                </a>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`${product.name}: ${typeof window !== 'undefined' ? window.location.href : ''}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold text-foreground border border-border px-3 py-2 rounded-button hover:border-border-strong transition-colors"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487 2.683 1.158 3.222 1.027 3.834.97.61-.057 1.967-.804 2.245-1.58.273-.776.273-1.443.198-1.58z" /></svg>
                  WhatsApp
                </a>
                <button
                  onClick={() => { navigator.clipboard.writeText(window.location.href); setToast({ message: 'Link copied!', variant: 'success' }) }}
                  className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold text-foreground border border-border px-3 py-2 rounded-button hover:border-border-strong transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                  Copy
                </button>
              </div>
            </div>

            {/* Similar products */}
            {product.similar_products && product.similar_products.length > 0 && (
              <div className="bg-surface rounded-card p-6" style={{ boxShadow: cardShadow }}>
                <p className="text-xs text-foreground-faint uppercase tracking-wider font-semibold mb-4">Similar Products</p>
                <div className="space-y-3">
                  {product.similar_products.slice(0, 4).map((p) => (
                    <a key={p.id} href={`/p/${p.slug}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                      <div
                        className="w-9 h-9 rounded-card flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ backgroundColor: placeholderColor(p.name) }}
                      >
                        {p.name[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-foreground truncate">{p.name}</p>
                        <p className="text-xs text-foreground-muted truncate">{p.tagline}</p>
                      </div>
                      <span className="text-xs font-semibold text-foreground-faint flex-shrink-0">▲{p.vote_count}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Report */}
            <button
              className="w-full text-xs text-foreground-faint hover:text-foreground-muted transition-colors py-2"
              onClick={() => setToast({ message: 'Thanks. Our moderators will take a look.', variant: 'success' })}
            >
              ⚐ Report this product
            </button>
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

function CommentBlock({ comment }: { comment: Comment }) {
  return (
    <div className="flex gap-3">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
        style={{ backgroundColor: '#1B4332' }}
      >
        {comment.author.name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-sm font-bold text-foreground">{comment.author.name}</span>
          {comment.author.role === 'Maker' && (
            <span className="text-[10px] font-bold text-white bg-primary px-2 py-0.5 rounded-full uppercase tracking-wider">Maker</span>
          )}
          <span className="text-xs text-foreground-faint">· {comment.created_at}</span>
        </div>
        <p className="text-sm text-foreground leading-relaxed">{comment.body}</p>
        <div className="flex items-center gap-4 mt-2 text-xs text-foreground-muted">
          <button className="hover:text-foreground transition-colors flex items-center gap-1">
            ▲ Upvote ({comment.upvotes})
          </button>
          <button className="hover:text-foreground transition-colors">Reply</button>
        </div>

        {comment.replies.length > 0 && (
          <div className="mt-4 pl-3 space-y-4 border-l-2 border-border">
            {comment.replies.map((r) => (
              <div key={r.id} className="flex gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                  style={{ backgroundColor: '#7C5CBF' }}
                >
                  {r.author.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-bold text-foreground">{r.author.name}</span>
                    {r.author.role === 'Maker' && (
                      <span className="text-[10px] font-bold text-white bg-primary px-2 py-0.5 rounded-full uppercase tracking-wider">Maker</span>
                    )}
                    <span className="text-xs text-foreground-faint">· {r.created_at}</span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{r.body}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-foreground-muted">
                    <button className="hover:text-foreground transition-colors">▲ Upvote ({r.upvotes})</button>
                    <button className="hover:text-foreground transition-colors">Reply</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
