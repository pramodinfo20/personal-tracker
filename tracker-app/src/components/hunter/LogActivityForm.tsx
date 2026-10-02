import { useState } from 'react'
import { useClaimCelebration } from '../../hooks/useClaimCelebration'
import { cn } from '../../lib/cn'
import { STAT_META } from '../../lib/hunterState'
import { DAILY_LOG_CAP, LOG_CATEGORIES, type LogCategory, type XPTier } from '../../lib/quests'
import { Card } from '../ui'
import { TierPicker } from './TierPicker'

export interface LogActivityFormProps {
  logCount: number
  onLog: (category: LogCategory, tier: XPTier, note: string) => void
  /** Fired once the claim-feedback animation finishes — e.g. so a wrapping bottom sheet can auto-close only after the user actually sees the feedback. */
  onAfterLog?: () => void
  /** Skip the Card wrapper — use when embedding inside another container (e.g. a bottom sheet) that already provides its own chrome. */
  bare?: boolean
}

// Category first (which decides the stat), then a duration/amount tier via
// the same TierPicker daily quests use — one tap on a tier logs it. The
// note is optional detail appended to the entry's label.
export function LogActivityForm({ logCount, onLog, onAfterLog, bare }: LogActivityFormProps) {
  const [categoryId, setCategoryId] = useState<string>(LOG_CATEGORIES[0].id)
  const [note, setNote] = useState('')
  const { celebrating, celebrate } = useClaimCelebration<string>()
  const capReached = logCount >= DAILY_LOG_CAP
  const category = LOG_CATEGORIES.find((c) => c.id === categoryId) ?? LOG_CATEGORIES[0]
  const stat = STAT_META.find((s) => s.key === category.stat)

  const submit = (tier: XPTier) => {
    if (capReached) return
    onLog(category, tier, note)
    celebrate(tier.label, tier.xp, onAfterLog)
    setNote('')
  }

  const body = (
    <>
      {!bare && (
        <p className="mb-3 text-xs text-text-secondary">
          Quick-log anything extra — pick what it was, then how much.
        </p>
      )}
      {capReached ? (
        <div className="rounded-lg border border-dashed border-border px-3 py-2 text-center text-xs text-text-muted">
          You've logged your {DAILY_LOG_CAP} activities for today.
        </div>
      ) : (
        <>
          <div className="mb-3 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Category">
            {LOG_CATEGORIES.map((c) => {
              const selected = c.id === category.id
              return (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setCategoryId(c.id)}
                  className={cn(
                    'flex cursor-pointer flex-col items-center gap-0.5 rounded-lg border px-1 py-2 text-[11px] font-bold transition-colors',
                    selected
                      ? 'border-accent bg-accent-muted text-text-primary'
                      : 'border-border bg-surface-2 text-text-secondary hover:border-accent/50',
                  )}
                >
                  <span className="text-lg leading-none" aria-hidden="true">
                    {c.icon}
                  </span>
                  <span className="truncate">{c.label}</span>
                </button>
              )
            })}
          </div>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional) — e.g. 5K run, Dune ch. 3"
            className="mb-3 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
          <div className="mb-2 text-[11px] font-bold text-text-secondary">
            {category.icon} {category.label} · {stat?.icon} {category.stat}
          </div>
          <TierPicker tiers={category.tiers} onPick={submit} celebrating={celebrating} />
        </>
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
