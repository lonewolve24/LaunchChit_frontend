type Status = 'live' | 'draft' | 'in-review' | 'removed' | 'scheduled' | 'archived'

const STYLES: Record<Status, { bg: string; text: string; label: string }> = {
  live:        { bg: 'bg-success/15',         text: 'text-success',         label: 'Live' },
  draft:       { bg: 'bg-surface-raised',     text: 'text-foreground-muted', label: 'Draft' },
  'in-review': { bg: 'bg-accent/15',          text: 'text-accent-dark',     label: 'In review' },
  removed:     { bg: 'bg-destructive/15',     text: 'text-destructive',     label: 'Removed' },
  scheduled:   { bg: 'bg-primary-muted',      text: 'text-primary',         label: 'Scheduled' },
  archived:    { bg: 'bg-surface-raised',     text: 'text-foreground-faint', label: 'Archived' },
}

export function StatusChip({ status }: { status: Status }) {
  const s = STYLES[status]
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>
      <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  )
}

export type { Status as ProductStatus }
