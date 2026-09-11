import { useMemo, useState } from 'react'
import type { Hunter } from '../../lib/hunterState'
import {
  RANGE_DAYS,
  dailyXPSeries,
  daysActiveInRange,
  monthlyXPSeries,
  statBreakdown,
  totalXPInRange,
  type RangeKey,
} from '../../lib/progress'
import { ProgressSummary, RangeSelector, StatBreakdown, XPBarChart, type ChartPoint } from '../progress'
import { Card } from '../ui'

export interface ProgressScreenProps {
  hunter: Hunter
}

// Aggregation + display only — no new tracking. Week/Month/Year totals, the
// XP chart, and days-active all read hunter.dailyXP (uncapped); the stat
// breakdown reads hunter.log (capped at 40 entries) since per-stat XP isn't
// tracked outside it — see lib/progress.ts's top-of-file comment.
export function ProgressScreen({ hunter }: ProgressScreenProps) {
  const [range, setRange] = useState<RangeKey>('week')
  const days = RANGE_DAYS[range]
  // hunter.dailyXP is only briefly undefined — before useHunter's one-time
  // backfill effect runs for a hunter saved before this field existed —
  // but memoize the fallback anyway so it doesn't churn every render.
  const dailyXP = useMemo(() => hunter.dailyXP || {}, [hunter.dailyXP])

  const daily = useMemo(() => dailyXPSeries(dailyXP, days), [dailyXP, days])
  const monthly = useMemo(() => monthlyXPSeries(dailyXP, days), [dailyXP, days])
  const chartData: ChartPoint[] = useMemo(
    () =>
      range === 'year'
        ? monthly.map((m) => ({ key: m.month, xp: m.xp }))
        : daily.map((d) => ({ key: d.date, xp: d.xp })),
    [range, daily, monthly],
  )
  const breakdown = useMemo(() => statBreakdown(hunter.log, days), [hunter.log, days])
  const totalXP = useMemo(() => totalXPInRange(dailyXP, days), [dailyXP, days])
  const daysActive = useMemo(() => daysActiveInRange(dailyXP, days), [dailyXP, days])

  return (
    <div className="min-h-dvh bg-bg px-4 pt-6 pb-28 text-text-primary sm:px-6 sm:pt-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-extrabold text-text-primary">Progress</h1>
          <RangeSelector value={range} onChange={setRange} />
        </div>

        <ProgressSummary
          totalXP={totalXP}
          daysActive={daysActive}
          range={range}
          streak={hunter.streak}
        />

        <Card title="XP Earned" icon="📈">
          <XPBarChart data={chartData} range={range} />
        </Card>

        <Card title="Stat Breakdown" icon="📊">
          <StatBreakdown data={breakdown} />
          {range === 'year' && (
            <p className="mt-3 text-[11px] text-text-muted">
              Based on your most recent activity — per-stat history isn't kept long enough to
              cover a full year.
            </p>
          )}
        </Card>
      </div>
    </div>
  )
}
