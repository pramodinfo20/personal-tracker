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
  textAnchor?: 'start' | 'middle' | 'end' | 'inherit'
  payload?: { value: string }
  data: StatRadarPoint[]
}

// Each axis label shows the stat key plus its current value underneath, in
// the same muted label color / font the XP chart's axes use.
function AxisTick({ x = 0, y = 0, textAnchor = 'middle', payload, data }: AxisTickProps) {
  const point = data.find((d) => d.stat === payload?.value)
  const cx = Number(x)
  const cy = Number(y)
  return (
    <text x={cx} y={cy} textAnchor={textAnchor} fontSize={11} fontWeight={700}>
      <tspan x={cx} dy="-0.2em" fill="var(--color-text-muted)">
        {payload?.value}
      </tspan>
      <tspan x={cx} dy="1.2em" fill="var(--color-text-secondary)" fontFamily="var(--font-mono)">
        {point?.value ?? 0}
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
      className="h-64 w-full"
      role="img"
      aria-label={`Stat balance: ${data.map((d) => `${d.stat} ${d.value}`).join(', ')}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="70%" margin={{ top: 12, right: 24, bottom: 12, left: 24 }}>
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
  )
}
