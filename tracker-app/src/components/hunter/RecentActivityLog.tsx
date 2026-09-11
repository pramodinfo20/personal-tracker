import type { LogEntry } from '../../lib/hunterState'
import { Card } from '../ui'

export interface RecentActivityLogProps {
  log: LogEntry[]
  limit?: number
}

export function RecentActivityLog({ log, limit = 10 }: RecentActivityLogProps) {
  const entries = log.slice(0, limit)
  return (
    <Card title="Recent Activity" icon="📜">
      {entries.length === 0 ? (
        <p className="py-6 text-center text-sm text-text-muted">
          No activity yet — claim a quest above to begin your hunt.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {entries.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-3 py-2 text-xs">
              <span className="text-text-secondary">{e.label}</span>
              <span className="shrink-0 font-mono font-bold text-accent">
                +{e.xp} XP · {e.stat}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
