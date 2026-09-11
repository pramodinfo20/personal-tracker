import type { StatBreakdownEntry } from '../../lib/progress'
import { Badge } from '../ui'

export interface StatBreakdownProps {
  data: StatBreakdownEntry[]
}

// Simple horizontal bars, one per stat, sorted by XP earned in range —
// reuses each stat's existing identity color from STAT_META (the same
// colors used everywhere else in the app for STR/VIT/INT/PER/AGI), with
// the icon + stat label directly on the bar so identity never depends on
// color alone.
export function StatBreakdown({ data }: StatBreakdownProps) {
  const sorted = [...data].sort((a, b) => b.xp - a.xp)
  const max = Math.max(1, ...sorted.map((s) => s.xp))
  const topStat = sorted[0] && sorted[0].xp > 0 ? sorted[0].stat : null

  return (
    <div className="flex flex-col gap-2.5">
      {sorted.map((s) => (
        <div key={s.stat} className="flex items-center gap-2.5">
          <span className="w-6 shrink-0 text-center text-base" aria-hidden="true">
            {s.icon}
          </span>
          <span className="w-8 shrink-0 text-xs font-bold text-text-secondary">{s.stat}</span>
          <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(s.xp / max) * 100}%`, backgroundColor: s.color }}
            />
          </div>
          <span className="w-10 shrink-0 text-right font-mono text-xs font-bold text-text-primary">
            {s.xp}
          </span>
          {s.stat === topStat ? (
            <Badge tier="gold" className="shrink-0 px-1.5 py-0 text-[9px]">
              Top
            </Badge>
          ) : (
            <span className="w-[34px] shrink-0" aria-hidden="true" />
          )}
        </div>
      ))}
    </div>
  )
}
