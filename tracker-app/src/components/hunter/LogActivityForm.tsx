import { useState } from 'react'
import { useClaimCelebration } from '../../hooks/useClaimCelebration'
import { cn } from '../../lib/cn'
import {
  QUEST_CATEGORIES,
  QUEST_ICONS,
  questCategory,
  type QuestCategoryKey,
  type QuestCategoryPreset,
} from '../../lib/customQuests'
import { STAT_META, type StatKey } from '../../lib/hunterState'
import { DAILY_LOG_CAP, type XPTier } from '../../lib/quests'
import { Card } from '../ui'
import { TierPicker } from './TierPicker'

export interface LogActivityFormProps {
  logCount: number
  onLog: (category: QuestCategoryPreset, tier: XPTier, note: string, stat: StatKey) => void
  /** Fired once the claim-feedback animation finishes — e.g. so a wrapping bottom sheet can auto-close only after the user actually sees the feedback. */
  onAfterLog?: () => void
  /** Skip the Card wrapper — use when embedding inside another container (e.g. a bottom sheet) that already provides its own chrome. */
  bare?: boolean
}

// A one-off log against the same category presets custom quests are built
// from (QUEST_CATEGORIES): pick a category (which prefills the stat, still
// overridable as in QuestForm), then a tier via the shared TierPicker —
// one tap on a tier logs it. The note is optional detail for the label.
export function LogActivityForm({ logCount, onLog, onAfterLog, bare }: LogActivityFormProps) {
  const [categoryKey, setCategoryKey] = useState<QuestCategoryKey>(QUEST_CATEGORIES[0].key)
  const [stat, setStat] = useState<StatKey>(QUEST_CATEGORIES[0].statKey)
  const [note, setNote] = useState('')
  const { celebrating, celebrate } = useClaimCelebration<string>()
  const capReached = logCount >= DAILY_LOG_CAP
  const category = questCategory(categoryKey)

  const pickCategory = (c: QuestCategoryPreset) => {
    setCategoryKey(c.key)
    setStat(c.statKey)
  }

  const submit = (tier: XPTier) => {
    if (capReached) return
    onLog(category, tier, note, stat)
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
          <div className="mb-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Category">
            {QUEST_CATEGORIES.map((c) => {
              const selected = c.key === category.key
              return (
                <button
                  key={c.key}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => pickCategory(c)}
                  className={cn(
                    'cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-colors',
                    selected
                      ? 'border-accent bg-accent-muted text-accent'
                      : 'border-border bg-surface-2 text-text-secondary hover:text-text-primary',
                  )}
                >
                  {QUEST_ICONS[c.iconKey]} {c.label}
                </button>
              )
            })}
          </div>
          <div className="mb-3 flex gap-2">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note (optional) — e.g. 5K run"
              className="min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
            <select
              value={stat}
              onChange={(e) => setStat(e.target.value as StatKey)}
              aria-label="Stat"
              className="shrink-0 rounded-lg border border-border bg-surface-2 px-2 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
            >
              {STAT_META.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.icon} {s.key}
                </option>
              ))}
            </select>
          </div>
          <TierPicker tiers={category.defaultTiers} onPick={submit} celebrating={celebrating} />
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
