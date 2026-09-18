import { useEffect, useState } from 'react'
import type { UndoResult } from '../../hooks/useHunter'
import { useClaimCelebration } from '../../hooks/useClaimCelebration'
import { activeCustomQuests, questIcon, type CustomQuest, type CustomQuestTier } from '../../lib/customQuests'
import { STAT_META } from '../../lib/hunterState'
import { customQuestArt } from '../../lib/questArt'
import { QuestCard } from './QuestCard'

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
// state shows the tier list directly instead of a single tap-to-claim
// button. Visuals live in QuestCard (shared with DailyQuestCards) — this
// component only owns the claim/undo/confirm wiring for custom quests.
export function CustomQuestCards({ quests, completedToday, log, onClaim, onUndo }: CustomQuestCardsProps) {
  const { celebrating, celebrate } = useClaimCelebration<string>()
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

  const handleClaim = (q: CustomQuest, tier: CustomQuestTier) => {
    onClaim(q, tier)
    celebrate(q.id, tier.xp)
  }

  return (
    <div className="flex flex-col gap-3">
      {active.map((q) => {
        const sm = STAT_META.find((s) => s.key === q.statKey)
        const done = !!completedToday?.[q.id]
        const doneEntry = done ? log.find((e) => e.questId === q.id) : undefined
        return (
          <QuestCard
            key={q.id}
            art={customQuestArt(q.category)}
            icon={questIcon(q.iconKey)}
            title={q.name}
            subtitle={`${sm?.icon ?? ''} ${q.statKey} · pick a tier`}
            done={done}
            doneLabel={doneEntry?.label}
            isCelebrating={celebrating[q.id] !== undefined}
            celebratingXp={celebrating[q.id]}
            isConfirmingUndo={confirmingId === q.id}
            blockedReason={blocked?.id === q.id ? blocked.reason : null}
            onUndoStart={() => startUndo(q.id)}
            onUndoCancel={() => setConfirmingId(null)}
            onUndoConfirm={() => confirmUndo(q)}
            claim={{ kind: 'tiers', tiers: q.tiers, onClaim: (tier) => handleClaim(q, tier) }}
          />
        )
      })}
    </div>
  )
}
