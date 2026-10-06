import { useMemo } from 'react'
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts'
import type { StatKey } from '../../lib/hunterState'
import { statRadarData, statRadarDomainMax, type StatRadarPoint } from '../../lib/progress'

export interface StatBalanceChartProps {
  stats: Partial<Record<StatKey, number>> | undefined
}

interface AxisTickProps {
  x?: number | string
  y?: number | string
  cy?: number | string
  textAnchor?: 'start' | 'middle' | 'end' | 'inherit'
  payload?: { value: string }
  data: StatRadarPoint[]
}

const LABEL_NUDGE = 10

// Keep the radar labels short at phone widths; exact values sit in the
// compact legend below, where they can't overlap the chart.
function AxisTick({ x = 0, y = 0, cy = 0, textAnchor = 'middle', payload, data }: AxisTickProps) {
  const tx = Number(x)
  const ty = Number(y) + (Number(y) < Number(cy) ? -LABEL_NUDGE : LABEL_NUDGE)
  const point = data.find((d) => d.stat === payload?.value)
  return (
    <text x={tx} y={ty} textAnchor={textAnchor} fontSize={10} fontWeight={800}>
      <title>
        {payload?.value} {point?.value ?? 0}
      </title>
      <tspan fill="var(--color-text-muted)">
        {payload?.value}
      </tspan>
    </text>
  )
}

// Current stats on 5 axes (STR/AGI/INT/PER/VIT). The radial axis scales to
// the hunter's highest stat (+20% headroom, floored — see
// statRadarDomainMax), so the shape reads as relative balance at any level
// and a brand-new or all-zero hunter still gets a real chart.
export function StatBalanceChart({ stats }: StatBalanceChartProps) {
  const data = useMemo(() => statRadarData(stats), [stats])
  const domainMax = statRadarDomainMax(data)

  return (
    <div
      className="w-full"
      role="img"
      aria-label={`Stat balance: ${data.map((d) => `${d.stat} ${d.value}`).join(', ')}`}
    >
      <div className="h-60 w-full sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="63%" margin={{ top: 22, right: 30, bottom: 20, left: 30 }}>
            <PolarGrid stroke="var(--color-border-strong)" />
            <PolarAngleAxis dataKey="stat" tick={<AxisTick data={data} />} />
            <PolarRadiusAxis domain={[0, domainMax]} tick={false} axisLine={false} tickCount={5} />
            <Radar
              dataKey="value"
              stroke="var(--color-accent-hover)"
              strokeWidth={2}
              fill="var(--color-accent)"
              fillOpacity={0.32}
              dot={{ r: 3, fill: 'var(--color-accent-hover)', strokeWidth: 0 }}
              isAnimationActive
              style={{ filter: 'drop-shadow(0 0 6px rgb(var(--rgb-accent) / 0.55))' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <dl className="mt-1 grid grid-cols-5 gap-1 text-center text-[10px]">
        {data.map((point) => (
          <div key={point.stat} className="rounded-lg bg-track/70 px-1.5 py-1">
            <dt className="font-bold text-text-muted">{point.stat}</dt>
            <dd className="font-mono font-bold text-text-primary">{point.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
