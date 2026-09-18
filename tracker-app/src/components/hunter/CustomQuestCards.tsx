import { useEffect, useState } from 'react'
import type { UndoResult } from '../../hooks/useHunter'
import { activeCustomQuests, questIcon, type CustomQuest, type CustomQuestTier } from '../../lib/customQuests'
import { STAT_META } from '../../lib/hunterState'
import { Button } from '../ui'

export interface CustomQuestCardsProps {
  quests: CustomQuest[]
  completedToday: Record<string, boolean>
  log: { questId?: string; label: string }[]
  onClaim: (quest: CustomQuest, tier: CustomQuestTier) => void
  onUndo: (quest: CustomQuest) => UndoResult
}

const AUTO_DISMISS_MS = 5000

// User-defined quests, alongside the fixed DAILY_QUESTS on the Today
// screen. The one structural difference from DailyQuestCards: since a
// custom quest's xp depends on which tier the user picks, its "not done"
// state shows the tier list directly (mirroring LogActivityForm's tier
// buttons) instead of a single tap-to-claim button. Deliberately plain —
// visual redesign of quest cards is a later phase, not this one.
export function CustomQuestCards({ quests, completedToday, log, onClaim, onUndo }: CustomQuestCardsProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [blocked, setBlocked] = useState<{ id: string; reason: string } | null>(null)

  useEffect(() => {
    if (!confirmingId) return
    const t = setTimeout(() => setConfirmingId(null), AUTO_DISMISS_MS)
    return () => clearTimeout(t)
  }, [confirmingId])

  useEffect(() => {
    if (!blocked) return
    const t = setTimeout(() => setBlocked(null), AUTO_DISMISS_MS)
    return () => clearTimeout(t)
  }, [blocked])

  const active = activeCustomQuests(quests)
  if (active.length === 0) return null

  const startUndo = (id: string) => {
    setBlocked(null)
    setConfirmingId(id)
  }

  const confirmUndo = (q: CustomQuest) => {
    setConfirmingId(null)
    const result = onUndo(q)
    if (!result.ok) {
      setBlocked({ id: q.id, reason: result.reason ?? "Couldn't undo that." })
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {active.map((q) => {
        const done = !!completedToday?.[q.id]
        const sm = STAT_META.find((s) => s.key === q.statKey)
        const isConfirming = confirmingId === q.id
        const blockedReason = blocked?.id === q.id ? blocked.reason : null
        const doneEntry = done ? log.find((e) => e.questId === q.id) : undefined

        if (!done) {
          return (
            <div
              key={q.id}
              className="rounded-2xl border border-border bg-gradient-to-b from-surface to-surface-2 p-4 shadow-panel"
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="text-3xl" aria-hidden="true">
                  {questIcon(q.iconKey)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-text-primary">{q.name}</span>
                  <span className="mt-0.5 block truncate text-xs text-text-secondary">
                    {sm?.icon} {q.statKey} · pick a tier
                  </span>
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {q.tiers.map((tier, i) => (
                  <Button
                    key={`${tier.label}-${i}`}
                    variant="primary"
                    onClick={() => onClaim(q, tier)}
                    className="flex-[1_1_100px]"
                  >
                    {tier.label} +{tier.xp}
                  </Button>
                ))}
              </div>
            </div>
          )
        }

        return (
          <div
            key={q.id}
            className="relative flex w-full items-center gap-3 rounded-2xl border border-success/40 bg-success/10 p-4 text-left"
          >
            <span className="text-3xl" aria-hidden="true">
              {questIcon(q.iconKey)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-text-primary">{q.name}</span>
              {blockedReason ? (
                <span className="mt-0.5 block text-xs font-bold text-warning">{blockedReason}</span>
              ) : (
                <span className="mt-0.5 block truncate text-xs text-text-secondary">
                  {doneEntry ? doneEntry.label : `${sm?.icon} ${q.statKey}`}
                </span>
              )}
            </span>
            <span className="shrink-0 text-right">
              {isConfirming ? (
                <span className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setConfirmingId(null)}
                    className="cursor-pointer rounded-md px-1.5 py-1 text-[10px] font-bold text-text-muted hover:text-text-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => confirmUndo(q)}
                    className="cursor-pointer rounded-md border border-warning/50 bg-warning/10 px-2 py-1 text-[10px] font-bold text-warning hover:bg-warning/20"
                  >
                    Yes, undo
                  </button>
                </span>
              ) : (
                <>
                  <span className="block font-mono text-lg font-bold text-success">✓</span>
                  <button
                    type="button"
                    onClick={() => startUndo(q.id)}
                    className="cursor-pointer text-[10px] font-bold text-text-muted uppercase hover:text-warning"
                  >
                    Undo
                  </button>
                </>
              )}
            </span>
          </div>
        )
      })}
    </div>
  )
}
