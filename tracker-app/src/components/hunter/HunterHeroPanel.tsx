import type { Hunter } from '../../lib/hunterState'
import { rankForLevel, xpForLevel } from '../../lib/leveling'
import { cn } from '../../lib/cn'
import { ProgressBar } from '../ui'
import { glowClass, rankTierColor } from './tierMapping'

export interface HunterHeroPanelProps {
  hunter: Hunter
}

// Today's headline status: big level number, the rank name in glowing
// gradient text, and the XP-to-next-level bar (blooming fill + one-shot
// sheen). The whole panel is tinted by the rank's tier (--glow via
// .glow-*), so ranking up visibly changes its color. Display only — reads
// the same hunter fields the slim header does.
export function HunterHeroPanel({ hunter }: HunterHeroPanelProps) {
  const level = hunter.level || 1
  const xp = hunter.xp || 0
  const rank = rankForLevel(level)
  const need = xpForLevel(level)

  return (
    <section
      aria-label="Hunter status"
      className={cn(
        'hud-glass hud-glass-strong hud-enter overflow-hidden rounded-3xl p-5',
        glowClass(rankTierColor(rank.name)),
      )}
    >
      {/* Ambient tier-colored light behind the level number — decoration only. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -left-10 h-48 w-48 rounded-full opacity-40 blur-2xl"
        style={{ background: 'radial-gradient(circle, rgb(var(--glow) / 0.7), transparent 70%)' }}
      />
      <div className="relative flex items-end justify-between gap-4">
        <div>
          <div className="text-[10px] font-bold tracking-[0.25em] text-text-secondary uppercase">
            Level
          </div>
          <div className="hud-text-glow font-mono text-6xl leading-none font-black">{level}</div>
        </div>
        <div className="min-w-0 pb-1 text-right">
          <div className="text-[10px] font-bold tracking-[0.25em] text-text-secondary uppercase">
            Rank
          </div>
          {/* Emoji kept outside the clipped-gradient text: color emoji
              inside background-clip:text can render invisible. */}
          <div className="flex items-center justify-end gap-1.5">
            <span className="text-lg leading-none" aria-hidden="true">
              {rank.emoji}
            </span>
            <span className="hud-text-glow truncate text-xl leading-tight font-black">
              {rank.name}
            </span>
          </div>
        </div>
      </div>

      <div className="relative mt-5">
        <ProgressBar value={xp} max={need} label={null} size="hero" />
        <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-text-secondary">
          <span>
            <span className="font-bold text-text-primary">{xp}</span> / {need} XP
          </span>
          <span>{need - xp} to Lv {level + 1}</span>
        </div>
      </div>
    </section>
  )
}
