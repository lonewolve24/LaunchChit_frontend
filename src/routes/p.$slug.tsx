import { createFileRoute, useParams } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Header } from '../components/Header'
import { UpvoteButton } from '../components/UpvoteButton'
import { Skeleton } from '../components/Skeleton'
import { PageError } from '../components/PageError'
import { Toast } from '../components/Toast'

export const Route = createFileRoute('/p/$slug')({ component: ProductDetailPage })

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

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
  maker: { id: string; name: string; avatar_url: string | null }
  topics?: Array<{ slug: string; name: string }>
}

export function ProductDetailPage() {
  const { slug } = useParams({ from: '/p/$slug' })
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  useEffect(() => {
    fetch(`${API}/products/${slug}`, { credentials: 'include' })
      .then((r) => { if (r.status === 404) { setNotFound(true); setLoading(false); return null } return r.json() })
      .then((data) => { if (data) { setProduct(data); setLoading(false) } })
      .catch(() => setLoading(false))
  }, [slug])

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

  if (notFound) return <><Header user={null} /><PageError status={404} message="That product does not exist." /></>

  return (
    <div className="min-h-screen bg-surface-subtle">
      <Header user={null} />

      <main className="max-w-4xl mx-auto px-6 lg:px-10 py-10">
        {loading || !product ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-16 rounded-card" />
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="bg-surface rounded-card p-8" style={{ boxShadow: '0 1px 4px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)' }}>
            <div className="flex items-start justify-between gap-6 mb-8">
              <div className="flex items-start gap-5">
                {product.logo_url ? (
                  <img src={product.logo_url} alt={product.name} className="w-20 h-20 rounded-card object-cover flex-shrink-0 shadow-sm" />
                ) : (
                  <div className="w-20 h-20 rounded-card flex-shrink-0 bg-primary flex items-center justify-center shadow-sm">
                    <span className="text-white font-bold text-3xl">{product.name[0]}</span>
                  </div>
                )}
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
                  <p className="text-foreground-muted mt-1 text-[15px]">{product.tagline}</p>
                  <p className="text-xs text-foreground-faint mt-2">
                    by{' '}
                    <a
                      href={`/profile/${product.maker.name.toLowerCase().replace(/\s+/g, '-')}`}
                      className="hover:text-primary transition-colors"
                    >
                      {product.maker.name}
                    </a>
                  </p>
                  {product.topics && product.topics.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mt-3">
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
              </div>

              <div className="flex flex-col items-center gap-3 flex-shrink-0">
                <UpvoteButton voteCount={product.vote_count} hasVoted={product.has_voted} onVote={handleVote} size="lg" />
                <a
                  href={product.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-primary border-2 border-primary px-5 py-2 rounded-button hover:bg-primary hover:text-white transition-colors whitespace-nowrap"
                >
                  Visit website
                </a>
                <div className="flex gap-2 mt-1">
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${product.name} — ${product.tagline}`)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 flex items-center justify-center rounded-full border border-border text-foreground-muted hover:text-foreground hover:border-border-strong transition-colors"
                    title="Share on X"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.741l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" /></svg>
                  </a>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`${product.name}: ${typeof window !== 'undefined' ? window.location.href : ''}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 flex items-center justify-center rounded-full border border-border text-foreground-muted hover:text-foreground hover:border-border-strong transition-colors"
                    title="Share on WhatsApp"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                  </a>
                  <button
                    onClick={() => { navigator.clipboard.writeText(window.location.href); setToast({ message: 'Link copied!', variant: 'success' }) }}
                    className="w-8 h-8 flex items-center justify-center rounded-full border border-border text-foreground-muted hover:text-foreground hover:border-border-strong transition-colors"
                    title="Copy link"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                  </button>
                </div>
              </div>
            </div>

            <hr className="border-border mb-6" />
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{product.description}</p>
          </div>
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
