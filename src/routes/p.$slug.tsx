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

      <main className="max-w-4xl mx-auto px-4 py-10">
        {loading || !product ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-16 rounded-card" />
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="flex gap-8">
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-4 mb-6">
                {product.logo_url ? (
                  <img src={product.logo_url} alt={product.name} className="w-20 h-20 rounded-card object-cover flex-shrink-0" />
                ) : (
                  <div className="w-20 h-20 rounded-card bg-surface-raised flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
                  <p className="text-foreground-muted mt-1">{product.tagline}</p>
                  <p className="text-xs text-foreground-faint mt-2">by {product.maker.name}</p>
                </div>
              </div>

              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{product.description}</p>
            </div>

            <aside className="flex-shrink-0 flex flex-col items-center gap-4 pt-1">
              <UpvoteButton voteCount={product.vote_count} hasVoted={product.has_voted} onVote={handleVote} size="lg" />
              <a
                href={product.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-primary border border-primary px-4 py-2 rounded-button hover:bg-primary hover:text-white transition-colors"
              >
                Visit website
              </a>
            </aside>
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
