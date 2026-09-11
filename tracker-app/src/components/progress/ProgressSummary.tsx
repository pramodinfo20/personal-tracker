import { RANGE_DAYS, type RangeKey } from '../../lib/progress'

export interface ProgressSummaryProps {
  totalXP: number
  daysActive: number
  range: RangeKey
  streak: number
}

// Three at-a-glance numbers above the chart: total XP in range, how many of
// those days had any activity, and the current streak (the same streak
// already surfaced on Today — not recomputed here, just displayed).
export function ProgressSummary({ totalXP, daysActive, range, streak }: ProgressSummaryProps) {
  const daysInRange = RANGE_DAYS[range]
  return (
    <div className="grid grid-cols-3 gap-2">
      <SummaryStat label="Total XP" value={totalXP.toLocaleString()} />
      <SummaryStat label="Days Active" value={`${daysActive}/${daysInRange}`} />
      <SummaryStat label="Streak" value={streak > 0 ? `🔥 ${streak}` : '—'} />
    </div>
  )
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-2 px-2 py-2.5 text-center">
      <div className="font-mono text-lg font-bold text-accent">{value}</div>
      <div className="mt-0.5 text-[10px] font-bold text-text-muted uppercase">{label}</div>
    </div>
  )
}
