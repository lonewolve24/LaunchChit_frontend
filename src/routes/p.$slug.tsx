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
                  <p className="text-xs text-foreground-faint mt-2">by {product.maker.name}</p>
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
