import { useEffect, useState, type ReactNode } from 'react'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

function imageFor(slug: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(slug)}/720/480`
}

type SlideProduct = {
  id: string
  slug: string
  name: string
  tagline: string
  vote_count: number
  logo_url: string | null
  maker?: { name: string }
  topics?: { slug: string; name: string }[]
}

function ProductSlideshow() {
  const [products, setProducts] = useState<SlideProduct[]>([])
  const [active, setActive] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetch(`${API}/products/leaderboard?period=yearly&filter=all`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (cancelled || !json) return
        const items: SlideProduct[] = Array.isArray(json) ? json : (json.items ?? [])
        setProducts(items.slice(0, 10))
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (products.length === 0) return
    const id = window.setInterval(() => setActive((i) => (i + 1) % products.length), 4500)
    return () => window.clearInterval(id)
  }, [products.length])

  if (products.length === 0) return null

  const current = products[active]
  const initials = current.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="w-full max-w-xl">
      <h2 className="text-white text-3xl md:text-4xl font-bold leading-tight text-center mb-7 px-4">
        See what builders<br />are shipping right now.
      </h2>

      <div
        className="relative overflow-hidden rounded-card"
        style={{ boxShadow: '0 20px 50px -12px rgb(0 0 0 / 0.5)' }}
      >
        <div className="relative h-80 md:h-96 bg-primary-dark overflow-hidden">
          <img
            key={current.slug}
            src={imageFor(current.slug)}
            alt={current.name}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-black/40 backdrop-blur px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white">
            <svg width="9" height="9" viewBox="0 0 11 9" fill="currentColor" aria-hidden>
              <path d="M5.5 0L11 9H0L5.5 0Z" />
            </svg>
            #{active + 1} · {current.vote_count} upvotes
          </div>

          <div className="absolute bottom-0 inset-x-0 p-6 text-white flex items-end gap-4">
            {current.logo_url ? (
              <img src={current.logo_url} alt="" className="w-16 h-16 rounded-button object-cover flex-shrink-0 ring-2 ring-white/50" />
            ) : (
              <div className="w-16 h-16 rounded-button bg-white text-primary flex items-center justify-center font-bold text-xl flex-shrink-0 ring-2 ring-white/50">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-lg leading-tight truncate">{current.name}</p>
                {current.topics && current.topics[0] && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur px-2 py-0.5 rounded">
                    {current.topics[0].name}
                  </span>
                )}
              </div>
              <p className="text-sm text-white/90 line-clamp-2 mt-1">{current.tagline}</p>
              {current.maker && (
                <p className="text-xs text-white/65 mt-1">by {current.maker.name}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mt-5">
        {products.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            aria-label={`Show product ${i + 1}`}
            className={`h-2 rounded-full transition-all ${i === active ? 'bg-white w-8' : 'bg-white/30 w-2 hover:bg-white/50'}`}
          />
        ))}
      </div>
    </div>
  )
}

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="hidden md:flex md:w-1/2 bg-primary items-center justify-center px-6 lg:px-12 py-12">
        <ProductSlideshow />
      </div>
      <div className="md:w-1/2 flex-1 bg-surface flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}

export function AuthHeader() {
  return (
    <>
      <a href="/" className="block text-center text-primary font-bold text-xl tracking-tight">
        LaunchedChit
      </a>
      <a
        href="/"
        className="mt-2 mb-6 inline-flex items-center justify-center gap-1.5 w-full text-sm font-medium text-foreground-muted hover:text-primary transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back to home
      </a>
    </>
  )
}
