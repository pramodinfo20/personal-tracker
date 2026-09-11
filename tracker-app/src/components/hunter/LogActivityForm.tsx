import { useState } from 'react'
import { STAT_META, type StatKey } from '../../lib/hunterState'
import { DAILY_LOG_CAP, LOG_XP_TIERS, type LogXPTier } from '../../lib/quests'
import { Button, Card } from '../ui'

export interface LogActivityFormProps {
  logCount: number
  onLog: (tier: LogXPTier, label: string, stat: StatKey) => void
}

export function LogActivityForm({ logCount, onLog }: LogActivityFormProps) {
  const [label, setLabel] = useState('')
  const [stat, setStat] = useState<StatKey>('STR')
  const capReached = logCount >= DAILY_LOG_CAP
  const canSubmit = label.trim().length > 0 && !capReached

  const submit = (tier: LogXPTier) => {
    if (!canSubmit) return
    onLog(tier, label, stat)
    setLabel('')
  }

  return (
    <Card title="Log an Activity" icon="📝">
      <p className="mb-3 text-xs text-text-secondary">
        Quick-log anything — a run, a job app, a workout — at the end of your day.
      </p>
      <div className="mb-3 flex flex-wrap gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. 5K run, applied to 3 jobs..."
          className="min-w-[160px] flex-[2_1_160px] rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
        />
        <select
          value={stat}
          onChange={(e) => setStat(e.target.value as StatKey)}
          className="flex-[1_1_110px] rounded-lg border border-border bg-surface-2 px-2 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
        >
          {STAT_META.map((s) => (
            <option key={s.key} value={s.key}>
              {s.icon} {s.label}
            </option>
          ))}
        </select>
      </div>
      {capReached ? (
        <div className="rounded-lg border border-dashed border-border px-3 py-2 text-center text-xs text-text-muted">
          You've logged your {DAILY_LOG_CAP} activities for today.
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {LOG_XP_TIERS.map((tier) => (
            <Button
              key={tier.key}
              variant="primary"
              disabled={!canSubmit}
              onClick={() => submit(tier)}
              className="flex-[1_1_100px]"
            >
              {tier.label} +{tier.xp}
            </Button>
          ))}
        </div>
      )}
      <div className="mt-2 text-[10px] text-text-muted">
        {logCount}/{DAILY_LOG_CAP} logged today
      </div>
    </Card>
  )
}
