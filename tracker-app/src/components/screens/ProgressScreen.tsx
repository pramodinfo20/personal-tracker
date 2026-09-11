import { useMemo, useState } from 'react'
import type { Hunter } from '../../lib/hunterState'
import {
  RANGE_DAYS,
  dailyXPSeries,
  daysActiveInRange,
  statBreakdown,
  totalXPInRange,
  type RangeKey,
} from '../../lib/progress'
import { ProgressSummary, RangeSelector, StatBreakdown, XPBarChart } from '../progress'
import { Card } from '../ui'

export interface ProgressScreenProps {
  hunter: Hunter
}

// Aggregation + display only, over hunter.log — no new tracking. Everything
// here is derived from log entries already written by claimQuest /
// logActivity / completeGateTask elsewhere.
export function ProgressScreen({ hunter }: ProgressScreenProps) {
  const [range, setRange] = useState<RangeKey>('week')
  const days = RANGE_DAYS[range]

  const series = useMemo(() => dailyXPSeries(hunter.log, days), [hunter.log, days])
  const breakdown = useMemo(() => statBreakdown(hunter.log, days), [hunter.log, days])
  const totalXP = useMemo(() => totalXPInRange(hunter.log, days), [hunter.log, days])
  const daysActive = useMemo(() => daysActiveInRange(hunter.log, days), [hunter.log, days])

  return (
    <div className="min-h-dvh bg-bg px-4 pt-6 pb-28 text-text-primary sm:px-6 sm:pt-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
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
          <XPBarChart data={series} range={range} />
        </Card>

        <Card title="Stat Breakdown" icon="📊">
          <StatBreakdown data={breakdown} />
        </Card>
      </div>
    </div>
  )
}
