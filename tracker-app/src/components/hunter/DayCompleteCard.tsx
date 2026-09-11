import { totalDailyQuestXP } from '../../lib/quests'
import { Card } from '../ui'

export interface DayCompleteCardProps {
  streak: number
  /** Lets the player peek back at (and undo) today's claims instead of losing access to them once this card replaces the quest list. */
  onEditClaims: () => void
}

// Shown instead of the 5 quest cards once every daily quest is claimed —
// a distinct "you're done" moment rather than just 5 green cards.
export function DayCompleteCard({ streak, onEditClaims }: DayCompleteCardProps) {
  return (
    <Card glow className="text-center">
      <div className="text-4xl" aria-hidden="true">
        🎉
      </div>
      <div className="mt-2 text-xl font-extrabold text-text-primary">Day Complete!</div>
      <p className="mt-1 text-sm text-text-secondary">
        All 5 quests cleared — +{totalDailyQuestXP()} XP earned today.
      </p>
      {streak > 0 && (
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-3 py-1 text-xs font-bold text-warning">
          <span aria-hidden="true">🔥</span>
          {streak} day streak
        </div>
      )}
      <p className="mt-4 text-xs text-text-muted">
        Come back tomorrow for a fresh set — or log something extra below.
      </p>
      <button
        type="button"
        onClick={onEditClaims}
        className="mt-3 cursor-pointer text-xs font-bold text-accent hover:text-accent-hover"
      >
        View/undo today's claims
      </button>
    </Card>
  )
}
