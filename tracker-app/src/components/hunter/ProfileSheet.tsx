import { useState, type FormEvent } from 'react'
import type { Hunter } from '../../lib/hunterState'
import { rankForLevel } from '../../lib/leveling'
import { avatarInitial, formatJoinDate, joinDateFor } from '../../lib/profile'
import { Badge, Button } from '../ui'
import { rankTierColor } from './tierMapping'

export interface DevActions {
  resetHunter: () => void
  jumpToLevel: (level: number) => void
  clearGateHistory: () => void
}

export interface ProfileSheetProps {
  hunter: Hunter
  onRename: (name: string) => void
  dev: DevActions
  onClose: () => void
}

// Reserved slots for settings that don't exist yet — rendered disabled so
// the layout has a home for them without pretending they work.
const COMING_SOON = [
  { icon: '🔔', label: 'Notifications' },
  { icon: '☁️', label: 'Account & cloud sync' },
  { icon: '📷', label: 'Profile photo' },
]

// Opened from the header avatar on every screen. Same bottom-sheet chrome
// as LogActivitySheet, but taller and scrollable.
export function ProfileSheet({ hunter, onRename, dev, onClose }: ProfileSheetProps) {
  const rank = rankForLevel(hunter.level || 1)
  const joined = joinDateFor(hunter)
  const [name, setName] = useState(hunter.name)
  const [devOpen, setDevOpen] = useState(false)
  const [devLevel, setDevLevel] = useState(String(hunter.level || 1))
  const trimmed = name.trim()
  const nameChanged = trimmed.length > 0 && trimmed !== hunter.name

  const saveName = (e: FormEvent) => {
    e.preventDefault()
    if (nameChanged) onRename(trimmed)
  }

  const resetHunter = () => {
    const ok = window.confirm(
      'Reset hunter to Level 1? This wipes real progress (XP, log, shadows, gates).',
    )
    if (!ok) return
    dev.resetHunter()
    // The reset clears the name, which sends the app back to onboarding —
    // close first so the sheet doesn't reopen on top of the fresh hunter.
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-bg/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="Profile"
        className="max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-b-0 border-border bg-gradient-to-b from-surface to-surface-2 p-5 pb-8 shadow-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border-strong" aria-hidden="true" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-wide text-text-primary uppercase">Profile</h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-2xl leading-none text-text-muted hover:text-text-primary"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-border-strong bg-surface text-2xl font-extrabold text-accent"
            aria-hidden="true"
          >
            {avatarInitial(hunter.name)}
          </div>
          <div className="min-w-0">
            <div className="truncate text-lg font-extrabold text-text-primary">{hunter.name}</div>
            <div className="text-xs font-bold text-text-secondary">Level {hunter.level || 1}</div>
            <Badge tier={rankTierColor(rank.name)} className="mt-1">
              {rank.emoji} {rank.name}
            </Badge>
          </div>
        </div>
        {joined && (
          <div className="mt-3 text-xs text-text-muted">
            {joined.approximate ? 'Active since' : 'Joined'} {formatJoinDate(joined.date)}
          </div>
        )}

        <h3 className="mt-6 mb-2 text-xs font-bold tracking-wide text-text-secondary uppercase">
          Settings
        </h3>
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          <form onSubmit={saveName} className="px-4 py-3">
            <label htmlFor="profile-name" className="mb-1.5 block text-xs font-bold text-text-secondary">
              ✏️ Hunter name
            </label>
            <div className="flex gap-2">
              <input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
                className="min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
              />
              <Button type="submit" disabled={!nameChanged} className="shrink-0">
                Save
              </Button>
            </div>
          </form>
          {COMING_SOON.map((item) => (
            <div
              key={item.label}
              aria-disabled="true"
              className="flex items-center justify-between gap-3 px-4 py-3.5 opacity-60"
            >
              <span className="flex items-center gap-3 text-sm font-bold text-text-primary">
                <span className="text-lg" aria-hidden="true">
                  {item.icon}
                </span>
                {item.label}
              </span>
              <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] font-bold tracking-wide text-text-muted uppercase">
                Coming soon
              </span>
            </div>
          ))}
        </div>

        {/* ── DEV TESTING ONLY — ported from pramod-2026-tracker.html's
            throwaway debug panel. Not part of the real app; delete this
            block (and useHunter's `dev`) when it's no longer needed. ── */}
        <div className="mt-6 rounded-xl border border-dashed border-border-strong px-3 py-2.5">
          <button
            type="button"
            onClick={() => setDevOpen((o) => !o)}
            aria-expanded={devOpen}
            className="flex w-full cursor-pointer items-center gap-1.5 text-left text-[11px] font-bold text-text-muted"
          >
            <span aria-hidden="true">{devOpen ? '▾' : '▸'}</span>
            🛠 Dev Testing — not part of the app
          </button>
          {devOpen && (
            <div className="mt-2.5 flex flex-col gap-2.5 border-t border-dashed border-border-strong pt-2.5">
              <p className="text-[10px] text-text-muted">
                Debug-only controls for testing gates across levels. These write state directly
                and bypass the real XP/quest logic.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={resetHunter}
                  className="cursor-pointer rounded-md border border-dashed border-border-strong px-2.5 py-1.5 text-[10px] font-bold text-text-secondary hover:text-text-primary"
                >
                  Reset Hunter to Level 1
                </button>
                <button
                  type="button"
                  onClick={dev.clearGateHistory}
                  className="cursor-pointer rounded-md border border-dashed border-border-strong px-2.5 py-1.5 text-[10px] font-bold text-text-secondary hover:text-text-primary"
                >
                  Clear Cleared-Gates History
                </button>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="dev-level" className="text-[10px] text-text-secondary">
                  Jump to Level:
                </label>
                <input
                  id="dev-level"
                  type="number"
                  min={1}
                  value={devLevel}
                  onChange={(e) => setDevLevel(e.target.value)}
                  className="w-16 rounded-md border border-dashed border-border-strong bg-surface-2 px-1.5 py-1 text-[11px] text-text-primary"
                />
                <button
                  type="button"
                  onClick={() => dev.jumpToLevel(Number(devLevel))}
                  className="cursor-pointer rounded-md border border-dashed border-border-strong px-2.5 py-1.5 text-[10px] font-bold text-text-secondary hover:text-text-primary"
                >
                  Jump
                </button>
              </div>
              <div className="text-[10px] text-text-muted">
                Current: Level {hunter.level || 1} · {hunter.xp || 0} XP ·{' '}
                {(hunter.clearedGates || []).length} gate(s) cleared
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
