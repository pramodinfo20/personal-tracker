import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatDayLabel, type DailyXP, type RangeKey } from '../../lib/progress'

export interface XPBarChartProps {
  data: DailyXP[]
  range: RangeKey
}

interface ChartTooltipProps {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}

// Custom tooltip — recharts' default is a light-themed white box, so this
// reuses the app's actual surface/border/shadow tokens instead.
function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length || !label) return null
  return (
    <div className="rounded-lg border border-border-strong bg-surface-2 px-3 py-2 shadow-panel">
      <div className="text-[11px] font-bold text-text-secondary">{formatDayLabel(label)}</div>
      <div className="mt-0.5 font-mono text-sm font-bold text-accent">{payload[0].value} XP</div>
    </div>
  )
}

// XP earned per day over the selected range. Week shows all 7 bars with
// weekday labels; Month thins the x-axis ticks down to ~6 so 30 bars don't
// collide, relying on the tooltip for exact per-day values.
export function XPBarChart({ data, range }: XPBarChartProps) {
  const tickStyle = range === 'week' ? 'weekday' : 'short'
  const tickInterval = data.length > 10 ? Math.ceil(data.length / 6) - 1 : 0

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--color-border)" />
          <XAxis
            dataKey="date"
            tickFormatter={(v: string) => formatDayLabel(v, tickStyle)}
            interval={tickInterval}
            tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
            axisLine={{ stroke: 'var(--color-border)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={36}
            allowDecimals={false}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ fill: 'var(--color-surface-hover)' }}
            wrapperStyle={{ outline: 'none' }}
          />
          <Bar
            dataKey="xp"
            radius={[4, 4, 0, 0]}
            fill="var(--color-accent)"
            activeBar={{ fill: 'var(--color-accent-hover)' }}
            maxBarSize={range === 'week' ? 44 : 18}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
