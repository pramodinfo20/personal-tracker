import { useState, type CSSProperties } from 'react'
import { useClaimCelebration } from '../../hooks/useClaimCelebration'
import { cn } from '../../lib/cn'
import { STAT_META, type StatKey } from '../../lib/hunterState'
import { DAILY_LOG_CAP, LOG_XP_TIERS, type LogXPTier } from '../../lib/quests'
import { Button, Card } from '../ui'

export interface LogActivityFormProps {
  logCount: number
  onLog: (tier: LogXPTier, label: string, stat: StatKey) => void
  /** Fired once the claim-feedback animation finishes — e.g. so a wrapping bottom sheet can auto-close only after the user actually sees the feedback. */
  onAfterLog?: () => void
  /** Skip the Card wrapper — use when embedding inside another container (e.g. a bottom sheet) that already provides its own chrome. */
  bare?: boolean
}

const CLAIM_PULSE_STYLE: CSSProperties = {
  '--pulse-ring': 'rgba(255, 255, 255, 0.5)',
  '--pulse-ring-strong': 'rgba(255, 255, 255, 0.7)',
  '--pulse-glow': 'rgba(47, 143, 255, 0.5)',
  '--pulse-glow-strong': 'rgba(47, 143, 255, 0.9)',
} as CSSProperties

export function LogActivityForm({ logCount, onLog, onAfterLog, bare }: LogActivityFormProps) {
  const [label, setLabel] = useState('')
  const [stat, setStat] = useState<StatKey>('STR')
  const { celebrating, celebrate } = useClaimCelebration<string>()
  const capReached = logCount >= DAILY_LOG_CAP
  const canSubmit = label.trim().length > 0 && !capReached

  const submit = (tier: LogXPTier) => {
    if (!canSubmit) return
    onLog(tier, label, stat)
    celebrate(tier.key, tier.xp, onAfterLog)
    setLabel('')
  }

  const body = (
    <>
      {!bare && (
        <p className="mb-3 text-xs text-text-secondary">
          Quick-log anything — a run, a job app, a workout — at the end of your day.
        </p>
      )}
      <div className="mb-3 flex flex-wrap gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. 5K run, applied to 3 jobs..."
          autoFocus={bare}
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
          {LOG_XP_TIERS.map((tier) => {
            const isCelebrating = celebrating[tier.key] !== undefined
            return (
              <Button
                key={tier.key}
                variant="primary"
                disabled={!canSubmit}
                onClick={() => submit(tier)}
                style={isCelebrating ? CLAIM_PULSE_STYLE : undefined}
                className={cn('relative flex-[1_1_100px]', isCelebrating && 'animate-claim-pulse')}
              >
                {tier.label} +{tier.xp}
                {isCelebrating && (
                  <span
                    className="animate-float-up pointer-events-none absolute -top-2 right-2 font-mono text-sm font-black text-white"
                    aria-hidden="true"
                  >
                    +{celebrating[tier.key]} XP
                  </span>
                )}
              </Button>
            )
          })}
        </div>
      )}
      <div className="mt-2 text-[10px] text-text-muted">
        {logCount}/{DAILY_LOG_CAP} logged today
      </div>
    </>
  )

  if (bare) return body

  return (
    <Card title="Log an Activity" icon="📝">
      {body}
    </Card>
  )
}
