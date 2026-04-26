type Props = {
  label: string
  value: string | number
  delta?: number
  deltaUnit?: string
  hint?: string
}

const cardShadow = '0 1px 4px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)'

export function KpiTile({ label, value, delta, deltaUnit = '', hint }: Props) {
  const showDelta = typeof delta === 'number'
  const positive = (delta ?? 0) >= 0

  return (
    <div className="bg-surface rounded-card p-5" style={{ boxShadow: cardShadow }}>
      <p className="text-xs font-bold text-foreground-faint uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-bold text-foreground mt-2 leading-none">{value}</p>
      {showDelta && (
        <p className={`text-xs font-semibold mt-2 inline-flex items-center gap-1 ${
          delta === 0 ? 'text-foreground-muted' : positive ? 'text-success' : 'text-destructive'
        }`}>
          <span aria-hidden>{delta === 0 ? '·' : positive ? '↑' : '↓'}</span>
          {Math.abs(delta!)}{deltaUnit}
          {hint && <span className="text-foreground-faint font-normal ml-1">{hint}</span>}
        </p>
      )}
      {!showDelta && hint && (
        <p className="text-xs text-foreground-muted mt-2">{hint}</p>
      )}
    </div>
  )
}
