import { useRef, useState } from 'react'

type Point = { date: string; value: number }

type Props = {
  data: Point[]
  width?: number
  height?: number
  strokeWidth?: number
  ariaLabel?: string
  valueLabel?: string
}

function formatTooltipDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

/*
  Tiny no-dependency SVG sparkline with hover tooltip. Normalises values
  into the viewbox so it scales cleanly via CSS. Renders nothing when
  given < 2 points.
*/
export function Sparkline({
  data,
  width = 600,
  height = 120,
  strokeWidth = 2,
  ariaLabel = 'Trend chart',
  valueLabel = 'value',
}: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

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

  function pointerToIdx(clientX: number) {
    const svg = svgRef.current
    if (!svg) return null
    const rect = svg.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const x = padX + ratio * innerW
    let nearest = 0
    let bestDist = Infinity
    for (let i = 0; i < points.length; i++) {
      const d = Math.abs(points[i].x - x)
      if (d < bestDist) { bestDist = d; nearest = i }
    }
    return nearest
  }

  const hover = hoverIdx != null ? points[hoverIdx] : null
  const hoverData = hoverIdx != null ? data[hoverIdx] : null

  // Tooltip placement (clamped to chart bounds, in viewbox units)
  const tooltipW = 130
  const tooltipH = 38
  let tooltipX = hover ? hover.x - tooltipW / 2 : 0
  if (hover) {
    tooltipX = Math.max(padX, Math.min(width - padX - tooltipW, tooltipX))
  }
  const tooltipAbove = hover ? hover.y > tooltipH + 10 : true
  const tooltipY = hover ? (tooltipAbove ? hover.y - tooltipH - 8 : hover.y + 10) : 0

  return (
    <svg
      ref={svgRef}
      role="img"
      aria-label={ariaLabel}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="w-full h-[120px] block cursor-crosshair"
      onPointerMove={(e) => {
        const idx = pointerToIdx(e.clientX)
        if (idx != null) setHoverIdx(idx)
      }}
      onPointerLeave={() => setHoverIdx(null)}
    >
      <path d={areaPath} fill="currentColor" className="text-primary-muted" opacity={0.5} />
      <path d={linePath} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className="text-primary" />

      {!hover && (
        <>
          <circle cx={last.x} cy={last.y} r={3.5} className="fill-primary" />
          <circle cx={last.x} cy={last.y} r={6} className="fill-primary" opacity={0.25} />
        </>
      )}

      {hover && hoverData && (
        <g pointerEvents="none">
          <line x1={hover.x} x2={hover.x} y1={padY} y2={padY + innerH} stroke="currentColor" strokeWidth={1} className="text-primary" opacity={0.35} strokeDasharray="3 3" />
          <circle cx={hover.x} cy={hover.y} r={4.5} className="fill-primary" />
          <circle cx={hover.x} cy={hover.y} r={7.5} className="fill-primary" opacity={0.25} />
          <g transform={`translate(${tooltipX}, ${tooltipY})`}>
            <rect width={tooltipW} height={tooltipH} rx={6} ry={6} className="fill-foreground" opacity={0.92} />
            <text x={8} y={15} className="fill-white" fontSize={10} fontWeight={600}>
              {formatTooltipDate(hoverData.date)}
            </text>
            <text x={8} y={30} className="fill-white" fontSize={11} fontWeight={700}>
              {hoverData.value.toLocaleString()} {valueLabel}
            </text>
          </g>
        </g>
      )}
    </svg>
  )
}
