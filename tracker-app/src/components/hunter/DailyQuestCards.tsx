import type { CSSProperties } from 'react'
import { useClaimCelebration } from '../../hooks/useClaimCelebration'
import { cn } from '../../lib/cn'
import { STAT_META } from '../../lib/hunterState'
import { DAILY_QUESTS, type DailyQuest } from '../../lib/quests'

export interface DailyQuestCardsProps {
  completedToday: Record<string, boolean>
  onClaim: (quest: DailyQuest) => void
}

const CLAIM_PULSE_STYLE: CSSProperties = {
  '--pulse-ring': 'rgba(34, 197, 94, 0.5)',
  '--pulse-ring-strong': 'rgba(34, 197, 94, 0.7)',
  '--pulse-glow': 'rgba(34, 197, 94, 0.45)',
  '--pulse-glow-strong': 'rgba(34, 197, 94, 0.85)',
} as CSSProperties

// Each quest is its own big, whole-card tap target — a normal claim happens
// in exactly one tap, no secondary confirmation. A claim also triggers a
// brief floating "+XP" and a glow pulse right on the card that was tapped.
export function DailyQuestCards({ completedToday, onClaim }: DailyQuestCardsProps) {
  const { celebrating, celebrate } = useClaimCelebration<string>()

  const handleClaim = (q: DailyQuest) => {
    onClaim(q)
    celebrate(q.id, q.xp)
  }

  return (
    <div className="flex flex-col gap-3">
      {DAILY_QUESTS.map((q) => {
        const done = !!completedToday?.[q.id]
        const sm = STAT_META.find((s) => s.key === q.stat)
        const isCelebrating = celebrating[q.id] !== undefined
        return (
          <button
            key={q.id}
            type="button"
            disabled={done}
            onClick={() => handleClaim(q)}
            style={isCelebrating ? CLAIM_PULSE_STYLE : undefined}
            className={cn(
              'relative flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-150 active:scale-[0.98]',
              done
                ? 'border-success/40 bg-success/10'
                : 'cursor-pointer border-border bg-gradient-to-b from-surface to-surface-2 shadow-panel hover:border-accent/50 hover:shadow-glow-accent',
              isCelebrating && 'animate-claim-pulse',
            )}
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
              <span
                className={cn(
                  'block font-mono text-lg font-bold',
                  done ? 'text-success' : 'text-accent',
                )}
              >
                {done ? '✓' : `+${q.xp}`}
              </span>
              <span className="block text-[10px] font-bold text-text-muted uppercase">
                {done ? 'Done' : 'Tap to claim'}
              </span>
            </span>
            {isCelebrating && (
              <span
                className="animate-float-up pointer-events-none absolute top-2 right-4 font-mono text-base font-black text-success"
                aria-hidden="true"
              >
                +{celebrating[q.id]} XP
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
