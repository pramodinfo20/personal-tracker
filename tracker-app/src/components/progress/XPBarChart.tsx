import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatDayLabel, formatMonthLabel, type RangeKey } from '../../lib/progress'

// A common shape for the chart to render regardless of what's bucketed —
// Week/Month pass dailyXPSeries's `{date, xp}` points (mapped to `key`
// by the caller), Year passes monthlyXPSeries's `{month, xp}` buckets.
export interface ChartPoint {
  key: string
  xp: number
}

export interface XPBarChartProps {
  data: ChartPoint[]
  range: RangeKey
}

const tickLabel = (key: string, range: RangeKey): string =>
  range === 'year' ? formatMonthLabel(key) : formatDayLabel(key, range === 'week' ? 'weekday' : 'short')

interface ChartTooltipProps {
  active?: boolean
  payload?: { value: number }[]
  label?: string
  range: RangeKey
}

// Custom tooltip — recharts' default is a light-themed white box, so this
// reuses the app's actual surface/border/shadow tokens instead.
function ChartTooltip({ active, payload, label, range }: ChartTooltipProps) {
  if (!active || !payload?.length || !label) return null
  return (
    <div className="rounded-lg border border-border-strong bg-surface-2 px-3 py-2 shadow-panel">
      <div className="text-[11px] font-bold text-text-secondary">{tickLabel(label, range)}</div>
      <div className="mt-0.5 font-mono text-sm font-bold text-accent">{payload[0].value} XP</div>
    </div>
  )
}

// XP earned over the selected range. Week shows all 7 bars with weekday
// labels; Month thins the x-axis ticks down to ~6 so 30 bars don't collide;
// Year buckets by calendar month (see monthlyXPSeries) so it's ~13 bars
// instead of 365 illegibly-thin ones, relying on the tooltip for exact
// per-bucket values in every range.
export function XPBarChart({ data, range }: XPBarChartProps) {
  const tickInterval = data.length > 10 ? Math.ceil(data.length / 6) - 1 : 0
  // Year's "Mon 'YY" ticks are wider than Week/Month's — the last tick is
  // centered on the last bar, so without extra right margin its second
  // half gets clipped by the card edge.
  const rightMargin = range === 'year' ? 20 : 4

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: rightMargin, left: -20, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--color-border)" />
          <XAxis
            dataKey="key"
            tickFormatter={(v: string) => tickLabel(v, range)}
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
            content={<ChartTooltip range={range} />}
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
