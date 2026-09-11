import { cn } from '../../lib/cn'
import { STAT_META, type Hunter } from '../../lib/hunterState'
import { rankForLevel, xpForLevel } from '../../lib/leveling'
import { Badge, Card, ProgressBar } from '../ui'
import { rankTierColor, statMilestoneTier } from './tierMapping'

export interface HunterStatusPanelProps {
  hunter: Hunter
  onRename: (name: string) => void
}

export function HunterStatusPanel({ hunter, onRename }: HunterStatusPanelProps) {
  const rank = rankForLevel(hunter.level || 1)
  const need = xpForLevel(hunter.level || 1)

  const rename = () => {
    const name = window.prompt('Hunter name:', hunter.name || '')
    if (name !== null) onRename(name)
  }

  return (
    <Card glow>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-bold tracking-[0.2em] text-accent uppercase">
            Hunter Status Window
          </div>
          <div className="mt-1 text-2xl font-extrabold text-text-primary">
            {hunter.name || 'Unnamed Hunter'}
          </div>
          <Badge tier={rankTierColor(rank.name)} className="mt-2">
            {rank.emoji} {rank.name}
          </Badge>
          <button
            type="button"
            onClick={rename}
            className="mt-2 block cursor-pointer text-xs text-accent hover:text-accent-hover"
          >
            ✏️ rename
          </button>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold tracking-wide text-accent uppercase">Level</div>
          <div className="font-mono text-5xl leading-none font-black text-accent drop-shadow-[0_0_20px_rgba(47,143,255,0.6)]">
            {hunter.level || 1}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-1 text-xs font-bold text-accent uppercase">EXP</div>
        <ProgressBar value={hunter.xp || 0} max={need} />
        {hunter.streak > 0 && (
          <div className="mt-2 text-xs font-bold text-warning">🔥 {hunter.streak} day streak</div>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {STAT_META.map((s) => {
          const value = hunter.stats?.[s.key] ?? 10
          const milestoneTier = statMilestoneTier(value)
          const isFocus = hunter.focusStat === s.key
          return (
            <div
              key={s.key}
              className={cn(
                'rounded-xl border px-3 py-2',
                isFocus ? 'border-accent/60 bg-accent-muted' : 'border-border bg-surface-2',
              )}
            >
              <div className="flex items-center gap-1 text-[11px] font-bold text-text-secondary">
                <span>
                  {s.icon} {s.label}
                </span>
                {isFocus && (
                  <span className="text-accent" title="Your onboarding focus" aria-label="Focus stat">
                    ✦
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="font-mono text-xl font-bold" style={{ color: s.color }}>
                  {value}
                </span>
                {milestoneTier && (
                  <Badge
                    tier={milestoneTier}
                    className="px-1.5 py-0 text-[9px] leading-4"
                    title={`${s.label} milestone reached`}
                  >
                    ★
                  </Badge>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
