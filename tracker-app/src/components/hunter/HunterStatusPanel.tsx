import { STAT_META, type Hunter, type StatKey } from '../../lib/hunterState'
import { rankForLevel, xpForLevel } from '../../lib/leveling'
import { Badge, Card, ProgressBar } from '../ui'
import { rankTierColor } from './tierMapping'

export interface HunterStatusPanelProps {
  hunter: Hunter
  onAllocateStat: (key: StatKey) => void
  onRename: (name: string) => void
}

export function HunterStatusPanel({ hunter, onAllocateStat, onRename }: HunterStatusPanelProps) {
  const rank = rankForLevel(hunter.level || 1)
  const need = xpForLevel(hunter.level || 1)
  const statPoints = hunter.statPoints || 0

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
        {STAT_META.map((s) => (
          <div key={s.key} className="rounded-xl border border-border bg-surface-2 px-3 py-2">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-bold text-text-secondary">
                {s.icon} {s.label}
              </span>
              {statPoints > 0 && (
                <button
                  type="button"
                  onClick={() => onAllocateStat(s.key)}
                  className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded border border-accent/50 bg-accent-muted text-xs text-accent hover:bg-accent/20"
                  aria-label={`Allocate a stat point to ${s.label}`}
                >
                  +
                </button>
              )}
            </div>
            <div className="mt-1 font-mono text-xl font-bold" style={{ color: s.color }}>
              {hunter.stats?.[s.key] ?? 10}
            </div>
          </div>
        ))}
      </div>
      {statPoints > 0 && (
        <div className="mt-3 text-xs font-bold text-warning">
          ✨ {statPoints} stat point{statPoints > 1 ? 's' : ''} to allocate
        </div>
      )}
    </Card>
  )
}
