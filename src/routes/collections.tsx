import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Header } from '../components/Header'
import { ProductCard } from '../components/ProductCard'
import { EmptyState } from '../components/EmptyState'
import { SkeletonCard } from '../components/Skeleton'
import { Toast } from '../components/Toast'

export const Route = createFileRoute('/collections')({ component: CollectionsPage })

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const COLLECTIONS_KEY = 'launchedchit:collections'

type Product = {
  id: string
  slug: string
  name: string
  tagline: string
  logo_url: string | null
  vote_count: number
  has_voted: boolean
  maker: { name: string }
  topics?: Array<{ slug: string; name: string }>
}

function readCollections(): string[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(COLLECTIONS_KEY) ?? '[]') } catch { return [] }
}

function writeCollections(slugs: string[]) {
  localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(slugs))
}

export function CollectionsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [savedSlugs, setSavedSlugs] = useState<string[]>([])
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  useEffect(() => {
    const slugs = readCollections()
    setSavedSlugs(slugs)
    if (slugs.length === 0) { setLoading(false); return }
    Promise.all(
      slugs.map((slug) =>
        fetch(`${API}/products/${slug}`).then((r) => (r.ok ? r.json() : null))
      )
    ).then((results) => {
      setProducts(results.filter(Boolean) as Product[])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  function removeFromCollection(slug: string) {
    const updated = savedSlugs.filter((s) => s !== slug)
    setSavedSlugs(updated)
    writeCollections(updated)
    setProducts((prev) => prev.filter((p) => p.slug !== slug))
    setToast({ message: 'Removed from your collection.', variant: 'success' })
  }

  return (
    <div className="min-h-screen bg-surface-subtle">
      <Header user={null} />

      <main className="max-w-4xl mx-auto px-6 lg:px-10 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Your Collection</h1>
          <p className="text-foreground-muted mt-1">
            {products.length === 0 ? 'Save products you want to come back to.' : `${products.length} ${products.length === 1 ? 'product' : 'products'} saved`}
          </p>
        </div>

        {loading ? (
          <SkeletonCard count={3} />
        ) : products.length === 0 ? (
          <EmptyState
            heading="Nothing saved yet"
            body="Tap the bookmark icon on any product to save it here for later."
            cta={{ label: 'Browse today\'s launches', onClick: () => { window.location.href = '/' } }}
          />
        ) : (
          <div className="space-y-4">
            {products.map((p) => (
              <div key={p.id} className="relative group">
                <ProductCard product={p} />
                <button
                  onClick={() => removeFromCollection(p.slug)}
                  className="absolute top-4 right-4 text-xs font-semibold text-foreground-faint hover:text-destructive bg-surface border border-border px-3 py-1.5 rounded-button opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Remove
                </button>
              </div>
            ))}
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
