import { useEffect, useState, type CSSProperties } from 'react'
import type { UndoResult } from '../../hooks/useHunter'
import { useClaimCelebration } from '../../hooks/useClaimCelebration'
import { cn } from '../../lib/cn'
import { STAT_META } from '../../lib/hunterState'
import { DAILY_QUESTS, type DailyQuest } from '../../lib/quests'

export interface DailyQuestCardsProps {
  completedToday: Record<string, boolean>
  onClaim: (quest: DailyQuest) => void
  onUndo: (quest: DailyQuest) => UndoResult
}

const CLAIM_PULSE_STYLE: CSSProperties = {
  '--pulse-ring': 'rgba(34, 197, 94, 0.5)',
  '--pulse-ring-strong': 'rgba(34, 197, 94, 0.7)',
  '--pulse-glow': 'rgba(34, 197, 94, 0.45)',
  '--pulse-glow-strong': 'rgba(34, 197, 94, 0.85)',
} as CSSProperties

// A confirm/message bubble auto-dismisses after this long if left untouched.
const AUTO_DISMISS_MS = 5000

// Each quest is its own big, whole-card tap target — a normal claim happens
// in exactly one tap, no secondary confirmation. A claim also triggers a
// brief floating "+XP" and a glow pulse right on the card that was tapped.
// A claimed-today card offers a small "Undo" — itself gated behind a
// lightweight inline confirm (a mistake-proofing feature skipping its own
// mistake-proofing would be ironic), not a full modal.
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
        const done = !!completedToday?.[q.id]
        const sm = STAT_META.find((s) => s.key === q.stat)
        const isCelebrating = celebrating[q.id] !== undefined
        const isConfirming = confirmingId === q.id
        const blockedReason = blocked?.id === q.id ? blocked.reason : null

        if (!done) {
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => handleClaim(q)}
              className="relative flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-border bg-gradient-to-b from-surface to-surface-2 p-4 text-left shadow-panel transition-all duration-150 active:scale-[0.98] hover:border-accent/50 hover:shadow-glow-accent"
            >
              <span className="text-3xl" aria-hidden="true">
                {q.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-text-primary">{q.label}</span>
                <span className="mt-0.5 block truncate text-xs text-text-secondary">
                  {q.hint} · {sm?.icon} {q.stat}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block font-mono text-lg font-bold text-accent">+{q.xp}</span>
                <span className="block text-[10px] font-bold text-text-muted uppercase">
                  Tap to claim
                </span>
              </span>
            </button>
          )
        }

        return (
          <div
            key={q.id}
            style={isCelebrating ? CLAIM_PULSE_STYLE : undefined}
            className={cn(
              'relative flex w-full items-center gap-3 rounded-2xl border border-success/40 bg-success/10 p-4 text-left transition-all duration-150',
              isCelebrating && 'animate-claim-pulse',
            )}
          >
            <span className="text-3xl" aria-hidden="true">
              {q.icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-text-primary">{q.label}</span>
              {blockedReason ? (
                <span className="mt-0.5 block text-xs font-bold text-warning">{blockedReason}</span>
              ) : (
                <span className="mt-0.5 block truncate text-xs text-text-secondary">
                  {q.hint} · {sm?.icon} {q.stat}
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
            {isCelebrating && (
              <span
                className="animate-float-up pointer-events-none absolute top-2 right-4 font-mono text-base font-black text-success"
                aria-hidden="true"
              >
                +{celebrating[q.id]} XP
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
