import type { Hunter } from '../../lib/hunterState'
import { rankForLevel, xpForLevel } from '../../lib/leveling'
import { ProgressBar } from '../ui'

export interface HunterHeaderProps {
  hunter: Hunter
}

// Slim header for the Today screen — avatar/name/level + a thin XP strip.
// The full Hunter Status detail (stats grid, streak, rank badge) lives on
// the Level Up tab instead.
export function HunterHeader({ hunter }: HunterHeaderProps) {
  const rank = rankForLevel(hunter.level || 1)
  const need = xpForLevel(hunter.level || 1)

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/95 px-4 pt-4 pb-3 backdrop-blur-sm sm:px-6">
      <div className="mx-auto flex max-w-3xl items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-strong bg-surface text-xl"
          aria-hidden="true"
        >
          {rank.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-text-primary">
            {hunter.name || 'Unnamed Hunter'}
          </div>
          <div className="truncate text-[11px] font-bold text-text-secondary">
            Lv {hunter.level || 1} · {rank.name}
          </div>
        </div>
        {hunter.streak > 0 && (
          <div
            className="flex shrink-0 items-center gap-1 rounded-full border border-warning/40 bg-warning/10 px-2 py-1 text-xs font-bold text-warning"
            title={`${hunter.streak} day streak`}
          >
            <span aria-hidden="true">🔥</span>
            {hunter.streak}
          </div>
        )}
        <div className="shrink-0 font-mono text-[11px] text-text-secondary">
          {hunter.xp || 0}/{need}
        </div>
      </div>
      <div className="mx-auto mt-2 max-w-3xl">
        <ProgressBar value={hunter.xp || 0} max={need} label={null} size="thin" />
      </div>
    </header>
  )
}
