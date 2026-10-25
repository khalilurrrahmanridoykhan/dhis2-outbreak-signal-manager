// Hand-rolled inline SVG rather than a charting library -- a sparkline is
// just a polyline, and pulling in a dependency (plus its weight in the
// bundle) for one shape isn't worth it. See ObservationChart.tsx for the
// same reasoning applied to the larger detail chart.

interface Props {
  values: number[]
  color: string
  width?: number
  height?: number
}

export function Sparkline({ values, color, width = 90, height = 24 }: Props) {
  if (values.length < 2) {
    return <svg width={width} height={height} />
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const stepX = width / (values.length - 1)

  const points = values
    .map((v, i) => {
      const x = i * stepX
      const y = height - ((v - min) / range) * height
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg width={width} height={height} role="img" aria-label="Recent trend">
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
