import type { ObservationSummary } from '../lib/outbreakApi'
import i18n from '../i18n'

interface Props {
  observations: ObservationSummary[]
  /** The alert's own period -- drawn as a highlighted point + vertical
   * marker, so "why did this alarm" is visible directly on the series'
   * own history, not just as a lone score/threshold pair. */
  highlightWeekStart: string
  threshold?: number
  color: string
}

const WIDTH = 640
const HEIGHT = 180
const PADDING = { top: 16, right: 16, bottom: 28, left: 40 }

export function ObservationChart({ observations, highlightWeekStart, threshold, color }: Props) {
  if (observations.length < 2) {
    return <p style={{ color: '#6e7a89', fontSize: 13 }}>{i18n.t('Not enough observations to chart yet.')}</p>
  }

  const sorted = [...observations].sort((a, b) => a.weekStart.localeCompare(b.weekStart))
  const values = sorted.map((o) => Number(o.value))
  const dataMax = Math.max(...values, threshold ?? -Infinity)
  const dataMin = Math.min(...values, 0)
  const range = dataMax - dataMin || 1

  const plotWidth = WIDTH - PADDING.left - PADDING.right
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom
  const stepX = plotWidth / (sorted.length - 1)

  const x = (i: number) => PADDING.left + i * stepX
  const y = (v: number) => PADDING.top + plotHeight - ((v - dataMin) / range) * plotHeight

  const points = sorted.map((o, i) => `${x(i).toFixed(1)},${y(Number(o.value)).toFixed(1)}`).join(' ')
  const highlightIndex = sorted.findIndex((o) => o.weekStart === highlightWeekStart)

  return (
    <svg width={WIDTH} height={HEIGHT} role="img" aria-label={i18n.t('Weekly observations over time')}>
      {threshold !== undefined && (
        <line
          x1={PADDING.left}
          x2={WIDTH - PADDING.right}
          y1={y(threshold)}
          y2={y(threshold)}
          stroke="#c22a2a"
          strokeDasharray="4 3"
          strokeWidth={1}
        />
      )}

      <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

      {highlightIndex >= 0 && (
        <>
          <line
            x1={x(highlightIndex)}
            x2={x(highlightIndex)}
            y1={PADDING.top}
            y2={HEIGHT - PADDING.bottom}
            stroke={color}
            strokeDasharray="2 2"
            strokeWidth={1}
          />
          <circle cx={x(highlightIndex)} cy={y(values[highlightIndex])} r={4} fill={color} />
        </>
      )}

      <text x={PADDING.left} y={HEIGHT - 8} fontSize={11} fill="#6e7a89">
        {sorted[0]?.weekStart}
      </text>
      <text x={WIDTH - PADDING.right} y={HEIGHT - 8} fontSize={11} fill="#6e7a89" textAnchor="end">
        {sorted[sorted.length - 1]?.weekStart}
      </text>
      <text x={PADDING.left - 6} y={PADDING.top + 4} fontSize={11} fill="#6e7a89" textAnchor="end">
        {dataMax.toFixed(1)}
      </text>
      <text x={PADDING.left - 6} y={HEIGHT - PADDING.bottom} fontSize={11} fill="#6e7a89" textAnchor="end">
        {dataMin.toFixed(1)}
      </text>
    </svg>
  )
}
