import { StatusChip, type ProductStatus } from '../components/StatusChip'

const PLACEHOLDER_COLOR = '#1E293B'
const cardShadow = '0 1px 4px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)'

export type MakerProduct = {
  id: string
  slug: string
  name: string
  tagline: string
  logo_url: string | null
  vote_count: number
  comments_count?: number
  waitlist_count?: number
  created_at?: string
  status?: ProductStatus
}

function formatLaunchDate(iso?: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-start">
      <span className="text-lg font-bold text-foreground leading-none">{value.toLocaleString()}</span>
      <span className="text-[11px] text-foreground-faint mt-1">{label}</span>
    </div>
  )
}

export function MakerProductCard({ product }: { product: MakerProduct }) {
  return (
    <article
      className="bg-surface rounded-card p-5 flex flex-col gap-4"
      style={{ boxShadow: cardShadow }}
    >
      <header className="flex items-start gap-3">
        {product.logo_url ? (
          <img src={product.logo_url} alt="" className="w-12 h-12 rounded-card object-cover flex-shrink-0" />
        ) : (
          <div
            className="w-12 h-12 rounded-card flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
            style={{ backgroundColor: PLACEHOLDER_COLOR }}
          >
            {product.name[0]}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={`/p/${product.slug}`}
              className="font-bold text-foreground hover:text-primary transition-colors truncate"
            >
              {product.name}
            </a>
            {product.status && <StatusChip status={product.status} />}
          </div>
          <p className="text-sm text-foreground-muted mt-0.5 line-clamp-1">{product.tagline}</p>
          {product.created_at && (
            <p className="text-xs text-foreground-faint mt-1">Launched {formatLaunchDate(product.created_at)}</p>
          )}
        </div>
      </header>

      <div className="grid grid-cols-3 gap-3 py-2 border-y border-border">
        <StatRow label="Upvotes"  value={product.vote_count} />
        <StatRow label="Comments" value={product.comments_count ?? 0} />
        <StatRow label="Waitlist" value={product.waitlist_count ?? 0} />
      </div>

      <div className="flex items-center gap-2">
        <a
          href={`/dashboard/products/${product.slug}/edit`}
          className="flex-1 text-center text-sm font-semibold text-foreground border border-border bg-surface hover:bg-surface-subtle px-3 py-2 rounded-button transition-colors"
        >
          Edit
        </a>
        <a
          href={`/p/${product.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center text-sm font-semibold text-foreground border border-border bg-surface hover:bg-surface-subtle px-3 py-2 rounded-button transition-colors"
        >
          View public
        </a>
        <a
          href={`/dashboard/products/${product.slug}/analytics`}
          className="flex-1 text-center text-sm font-semibold text-foreground border border-border bg-surface hover:bg-surface-subtle px-3 py-2 rounded-button transition-colors"
        >
          Analytics
        </a>
      </div>
    </article>
  )
}
