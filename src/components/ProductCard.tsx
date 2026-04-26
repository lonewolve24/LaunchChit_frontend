type Product = {
  id: string
  slug: string
  name: string
  tagline: string
  logo_url: string | null
  vote_count: number
  has_voted: boolean
  maker: { name: string }
}

type Props = {
  product: Product
  onVote: (id: string) => void
}

export function ProductCard({ product, onVote }: Props) {
  return (
    <div className="bg-surface border border-border rounded-card px-4 py-3 flex gap-4 items-start hover:border-border-strong transition-colors">
      <button
        onClick={() => onVote(product.id)}
        aria-label="Upvote"
        aria-pressed={product.has_voted}
        className={`flex flex-col items-center gap-0.5 min-w-[40px] pt-1 rounded-button border px-2 py-1.5 transition-colors ${
          product.has_voted
            ? 'border-accent bg-accent/10 text-accent'
            : 'border-border text-foreground-muted hover:border-accent hover:text-accent'
        }`}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
          <path d="M6 1L11 8H1L6 1Z" />
        </svg>
        <span className="text-xs font-bold leading-none">{product.vote_count}</span>
      </button>

      <div className="flex gap-3 items-start flex-1 min-w-0">
        {product.logo_url ? (
          <img
            src={product.logo_url}
            alt={product.name}
            className="w-12 h-12 rounded-card object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-card bg-surface-raised flex-shrink-0" />
        )}

        <div className="min-w-0">
          <a
            href={`/p/${product.slug}`}
            className="font-semibold text-foreground hover:text-primary transition-colors"
          >
            {product.name}
          </a>
          <p className="text-sm text-foreground-muted truncate">{product.tagline}</p>
          <p className="text-xs text-foreground-faint mt-1">by {product.maker.name}</p>
        </div>
      </div>
    </div>
  )
}
