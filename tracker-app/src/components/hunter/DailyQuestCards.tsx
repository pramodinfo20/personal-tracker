import { cn } from '../../lib/cn'
import { STAT_META } from '../../lib/hunterState'
import { DAILY_QUESTS, type DailyQuest } from '../../lib/quests'

export interface DailyQuestCardsProps {
  completedToday: Record<string, boolean>
  onClaim: (quest: DailyQuest) => void
}

// Each quest is its own big, whole-card tap target — a normal claim happens
// in exactly one tap, no secondary confirmation.
export function DailyQuestCards({ completedToday, onClaim }: DailyQuestCardsProps) {
  return (
    <div className="flex flex-col gap-3">
      {DAILY_QUESTS.map((q) => {
        const done = !!completedToday?.[q.id]
        const sm = STAT_META.find((s) => s.key === q.stat)
        return (
          <button
            key={q.id}
            type="button"
            disabled={done}
            onClick={() => onClaim(q)}
            className={cn(
              'flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-150 active:scale-[0.98]',
              done
                ? 'border-success/40 bg-success/10'
                : 'cursor-pointer border-border bg-gradient-to-b from-surface to-surface-2 shadow-panel hover:border-accent/50 hover:shadow-glow-accent',
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
          </button>
        )
      })}
    </div>
  )
}
