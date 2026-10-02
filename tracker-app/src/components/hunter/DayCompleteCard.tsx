
export interface DayCompleteCardProps {
  streak: number
  /** XP today's quest claims actually paid out — varies with the tiers picked. */
  xpToday: number
  /** Lets the player peek back at (and undo) today's claims instead of losing access to them once this card replaces the quest list. */
  onEditClaims: () => void
}

// Shown instead of the 5 quest cards once every daily quest is claimed —
// a distinct "you're done" moment rather than just 5 green cards.
export function DayCompleteCard({ streak, xpToday, onEditClaims }: DayCompleteCardProps) {
  return (
    <div className="hud-glass hud-glass-strong hud-enter glow-gold rounded-3xl p-5 text-center">
      <div className="hud-icon mx-auto h-16 w-16 text-4xl" aria-hidden="true">
        🎉
      </div>
      <div className="hud-text-glow mt-2 text-2xl font-black">Day Complete!</div>
      <p className="mt-1 text-sm text-text-secondary">
        All 5 quests cleared — +{xpToday} XP earned today.
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
    </div>
  )
}
