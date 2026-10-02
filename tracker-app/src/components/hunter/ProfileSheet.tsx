import { useState, type FormEvent } from 'react'
import type { Hunter } from '../../lib/hunterState'
import { rankForLevel } from '../../lib/leveling'
import { avatarInitial, formatJoinDate, joinDateFor } from '../../lib/profile'
import { Badge, Button } from '../ui'
import { DevTestingPanel, type DevActions } from './DevTestingPanel'
import { rankTierColor } from './tierMapping'

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
  const trimmed = name.trim()
  const nameChanged = trimmed.length > 0 && trimmed !== hunter.name

  const saveName = (e: FormEvent) => {
    e.preventDefault()
    if (nameChanged) onRename(trimmed)
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

        {/* Dev Testing is compiled out of production builds entirely —
            import.meta.env.DEV is a build-time constant, so Vite drops this
            branch (and DevTestingPanel with it) from `vite build` output. */}
        {import.meta.env.DEV && <DevTestingPanel hunter={hunter} dev={dev} onClose={onClose} />}
      </div>
    </div>
  )
}
