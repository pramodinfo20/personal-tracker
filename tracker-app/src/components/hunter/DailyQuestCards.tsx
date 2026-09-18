import { useEffect, useState } from 'react'
import type { UndoResult } from '../../hooks/useHunter'
import { useClaimCelebration } from '../../hooks/useClaimCelebration'
import { STAT_META } from '../../lib/hunterState'
import { dailyQuestArt } from '../../lib/questArt'
import { DAILY_QUESTS, type DailyQuest } from '../../lib/quests'
import { QuestCard } from './QuestCard'

export interface DailyQuestCardsProps {
  completedToday: Record<string, boolean>
  onClaim: (quest: DailyQuest) => void
  onUndo: (quest: DailyQuest) => UndoResult
}

// A confirm/message bubble auto-dismisses after this long if left untouched.
const AUTO_DISMISS_MS = 5000

// Each quest is its own big, whole-card tap target — a normal claim happens
// in exactly one tap, no secondary confirmation. A claim also triggers a
// brief floating "+XP" and a glow pulse right on the card that was tapped.
// A claimed-today card offers a small "Undo" — itself gated behind a
// lightweight inline confirm (a mistake-proofing feature skipping its own
// mistake-proofing would be ironic), not a full modal. Visuals live in
// QuestCard (shared with CustomQuestCards) — this component only owns the
// claim/undo/celebration wiring for the fixed DAILY_QUESTS.
export function DailyQuestCards({ completedToday, onClaim, onUndo }: DailyQuestCardsProps) {
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

  const handleClaim = (q: DailyQuest) => {
    onClaim(q)
    celebrate(q.id, q.xp)
  }

  const startUndo = (id: string) => {
    setBlocked(null)
    setConfirmingId(id)
  }

  const confirmUndo = (q: DailyQuest) => {
    setConfirmingId(null)
    const result = onUndo(q)
    if (!result.ok) {
      setBlocked({ id: q.id, reason: result.reason ?? "Couldn't undo that." })
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {DAILY_QUESTS.map((q) => {
        const sm = STAT_META.find((s) => s.key === q.stat)
        return (
          <QuestCard
            key={q.id}
            art={dailyQuestArt(q.id)}
            icon={q.icon}
            title={q.label}
            subtitle={`${q.hint} · ${sm?.icon ?? ''} ${q.stat}`}
            done={!!completedToday?.[q.id]}
            isCelebrating={celebrating[q.id] !== undefined}
            celebratingXp={celebrating[q.id]}
            isConfirmingUndo={confirmingId === q.id}
            blockedReason={blocked?.id === q.id ? blocked.reason : null}
            onUndoStart={() => startUndo(q.id)}
            onUndoCancel={() => setConfirmingId(null)}
            onUndoConfirm={() => confirmUndo(q)}
            claim={{ kind: 'single', xp: q.xp, onClaim: () => handleClaim(q) }}
          />
        )
      })}
    </div>
  )
}
