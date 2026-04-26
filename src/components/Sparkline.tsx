type Point = { date: string; value: number }

type Props = {
  data: Point[]
  width?: number
  height?: number
  strokeWidth?: number
  ariaLabel?: string
}

/*
  Tiny no-dependency SVG sparkline. Normalises values into the viewbox so
  it scales cleanly via CSS. Renders nothing when given < 2 points.
*/
export function Sparkline({
  data,
  width = 600,
  height = 120,
  strokeWidth = 2,
  ariaLabel = 'Trend chart',
}: Props) {
  if (!data || data.length < 2) {
    return (
      <div
        role="img"
        aria-label="Not enough data"
        className="flex items-center justify-center h-[120px] text-xs text-foreground-faint"
      >
        Not enough data yet.
      </div>
    )
  }

  const values = data.map((d) => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const padX = 2
  const padY = 6
  const innerW = width - padX * 2
  const innerH = height - padY * 2

  const points = data.map((d, i) => {
    const x = padX + (i / (data.length - 1)) * innerW
    const y = padY + innerH - ((d.value - min) / range) * innerH
    return { x, y }
  })

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${(padY + innerH).toFixed(2)} L ${points[0].x.toFixed(2)} ${(padY + innerH).toFixed(2)} Z`

  const last = points[points.length - 1]

  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="w-full h-[120px] block"
    >
      <path d={areaPath} fill="currentColor" className="text-primary-muted" opacity={0.5} />
      <path d={linePath} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className="text-primary" />
      <circle cx={last.x} cy={last.y} r={3.5} className="fill-primary" />
      <circle cx={last.x} cy={last.y} r={6} className="fill-primary" opacity={0.25} />
    </svg>
  )
}
