import { useMemo, useState } from 'react'
import type { Hunter } from '../../lib/hunterState'
import {
  RANGE_DAYS,
  dailyXPSeries,
  currentStreak,
  daysActiveInRange,
  monthlyXPSeries,
  statBreakdown,
  totalXPInRange,
  unattributedXPInRange,
  type RangeKey,
} from '../../lib/progress'
import {
  ProgressSummary,
  RangeSelector,
  StatBalanceChart,
  StatBreakdown,
  XPBarChart,
  type ChartPoint,
} from '../progress'
import { Card, ScreenBackground } from '../ui'

export interface ProgressScreenProps {
  hunter: Hunter
}

// Aggregation + display only. Week/Month/Year totals, the XP chart and
// days-active read hunter.dailyXP; the stat breakdown reads
// hunter.dailyStatXP — both uncapped, so every range is complete. The only
// gap possible is per-stat detail from before dailyStatXP existed; when the
// selected range includes any, the card says exactly how much.
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
  // Only briefly undefined, before useHunter's one-time backfill runs.
  const dailyStatXP = useMemo(() => hunter.dailyStatXP || {}, [hunter.dailyStatXP])
  const breakdown = useMemo(() => statBreakdown(dailyStatXP, days), [dailyStatXP, days])
  const unattributed = useMemo(
    () => unattributedXPInRange(dailyXP, dailyStatXP, days),
    [dailyXP, dailyStatXP, days],
  )
  const totalXP = useMemo(() => totalXPInRange(dailyXP, days), [dailyXP, days])
  const daysActive = useMemo(() => daysActiveInRange(dailyXP, days), [dailyXP, days])
  const streak = useMemo(() => currentStreak(dailyXP), [dailyXP])

  return (
    // Generic art; its built-in dim (screenBackgroundProps) keeps the
    // burst's bright center calm behind the XP chart.
    <ScreenBackground
      screen="generic"
      className="px-4 pt-6 pb-28 text-text-primary sm:px-6 sm:pt-10"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-extrabold text-text-primary">Progress</h1>
          <RangeSelector value={range} onChange={setRange} />
        </div>

        <ProgressSummary
          totalXP={totalXP}
          daysActive={daysActive}
          range={range}
          streak={streak}
        />

        <Card title="XP Earned" icon="📈">
          <XPBarChart data={chartData} range={range} />
        </Card>

        {/* Current stats, not range-dependent — the Range selector doesn't affect it. */}
        <Card title="Stat Balance" icon="🕸️">
          <p className="-mt-2 mb-1 text-xs text-text-secondary">Your strengths at a glance.</p>
          <StatBalanceChart stats={hunter.stats} />
        </Card>

        <Card title="Stat Breakdown" icon="📊">
          <StatBreakdown data={breakdown} />
          {unattributed > 0 && (
            <p className="mt-3 text-[11px] text-text-muted">
              {unattributed} XP in this range was earned before per-stat history was kept, so it
              isn't split by stat here. Everything since is complete.
            </p>
          )}
        </Card>
      </div>
    </ScreenBackground>
  )
}
