import type { ReactNode } from 'react'

const cardShadow = '0 1px 4px 0 rgb(0 0 0 / 0.08)'

export type AdminTabSpec = { value: string; label: string; count?: number }

export function AdminPageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <header className="flex items-end justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-foreground-muted mt-1">{subtitle}</p>}
      </div>
      {right}
    </header>
  )
}

export function AdminTabs({ tabs, value, onChange }: { tabs: AdminTabSpec[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-1 border-b border-border overflow-x-auto -mx-1 px-1">
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value)}
          className={`text-sm font-semibold capitalize px-3 py-2 -mb-px border-b-2 transition-colors whitespace-nowrap inline-flex items-center gap-1.5 cursor-pointer ${
            value === t.value ? 'text-primary border-primary' : 'text-foreground-muted border-transparent hover:text-foreground'
          }`}
        >
          {t.label}
          {typeof t.count === 'number' && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${value === t.value ? 'bg-primary/15 text-primary' : 'bg-surface-subtle text-foreground-muted'}`}>
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

export function AdminCard({ children, padded = true }: { children: ReactNode; padded?: boolean }) {
  return (
    <div className={`bg-surface rounded-card overflow-hidden ${padded ? 'p-5' : ''}`} style={{ boxShadow: cardShadow }}>
      {children}
    </div>
  )
}

export function StatusBadge({ tone, children }: { tone: 'neutral' | 'primary' | 'success' | 'warn' | 'danger'; children: ReactNode }) {
  const cls = {
    neutral: 'bg-surface-subtle text-foreground-muted border border-border',
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warn:    'bg-warning/15 text-warning',
    danger:  'bg-destructive/10 text-destructive',
  }[tone]
  return <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cls}`}>{children}</span>
}

export function ActionButton({ tone = 'neutral', children, ...rest }: { tone?: 'neutral' | 'primary' | 'success' | 'danger'; children: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = {
    neutral: 'border border-border bg-surface text-foreground hover:border-border-strong',
    primary: 'border border-primary bg-primary text-white hover:bg-primary-dark',
    success: 'border border-success bg-success text-white hover:opacity-90',
    danger:  'border border-destructive text-destructive hover:bg-destructive hover:text-white',
  }[tone]
  return (
    <button
      type="button"
      {...rest}
      className={`text-xs font-semibold px-3 py-1.5 rounded-button transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${cls} ${rest.className ?? ''}`}
    >
      {children}
    </button>
  )
}
