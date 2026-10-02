import type { Hunter } from '../../lib/hunterState'
import { rankForLevel, xpForLevel } from '../../lib/leveling'
import { avatarInitial } from '../../lib/profile'
import { cn } from '../../lib/cn'
import { ProgressBar } from '../ui'
import { glowClass, rankTierColor } from './tierMapping'

export interface HunterHeaderProps {
  hunter: Hunter
  onOpenProfile: () => void
  /**
   * Show the level/rank line and thin XP strip. Off on Today, where
   * HunterHeroPanel already shows them large — the header then keeps just
   * the avatar (Profile entry point), name and streak.
   */
  showProgress?: boolean
}

// Slim, persistent app header (rendered above every tab) — a glass bar with
// avatar/name/level + a thin XP strip, tinted by the rank's tier. The
// avatar opens the Profile sheet, so profile and settings are one tap away
// from anywhere. The full Hunter Status detail lives on the Level Up tab.
export function HunterHeader({ hunter, onOpenProfile, showProgress = true }: HunterHeaderProps) {
  const rank = rankForLevel(hunter.level || 1)
  const need = xpForLevel(hunter.level || 1)

  return (
    <header
      className={cn(
        'sticky top-0 z-20 border-b border-[rgb(var(--glow)/0.22)] bg-bg/70 px-4 pt-3 pb-3 sm:px-6',
        // Same capped blur as the hero panel; the header is the only
        // always-composited blurred layer while scrolling.
        '[-webkit-backdrop-filter:blur(var(--hud-blur-strong))] [backdrop-filter:blur(var(--hud-blur-strong))]',
        glowClass(rankTierColor(rank.name)),
      )}
    >
      <div className="mx-auto flex max-w-3xl items-center gap-3">
        {/* Initial-letter placeholder until profile photos exist. */}
        <button
          type="button"
          onClick={onOpenProfile}
          aria-label="Open profile"
          className="hud-icon hud-pressable h-10 w-10 cursor-pointer text-lg font-extrabold text-white"
        >
          {avatarInitial(hunter.name)}
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-text-primary">
            {hunter.name || 'Unnamed Hunter'}
          </div>
          {showProgress && (
            <div className="truncate text-[11px] font-bold text-text-secondary">
              Lv {hunter.level || 1} · {rank.emoji} {rank.name}
            </div>
          )}
        </div>
        {hunter.streak > 0 && (
          <div
            className="flex shrink-0 items-center gap-1 rounded-full border border-warning/40 bg-warning/10 px-2 py-1 text-xs font-bold text-warning shadow-[0_0_12px_-2px_rgb(245_158_11/0.5)]"
            title={`${hunter.streak} day streak`}
          >
            <span aria-hidden="true">🔥</span>
            {hunter.streak}
          </div>
        )}
        {showProgress && (
          <div className="shrink-0 font-mono text-[11px] text-text-secondary">
            {hunter.xp || 0}/{need}
          </div>
        )}
      </div>
      {showProgress && (
        <div className="mx-auto mt-2 max-w-3xl">
          <ProgressBar value={hunter.xp || 0} max={need} label={null} size="thin" />
        </div>
      )}
    </header>
  )
}
