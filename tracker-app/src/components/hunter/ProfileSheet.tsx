import { useState, type FormEvent } from 'react'
import type { Hunter } from '../../lib/hunterState'
import { rankForLevel } from '../../lib/leveling'
import { cn } from '../../lib/cn'
import { avatarInitial, formatJoinDate, joinDateFor, profileDetails } from '../../lib/profile'
import { Badge, Button, ScreenBackground, ThemeToggle } from '../ui'
import { DevTestingPanel, type DevActions } from './DevTestingPanel'
import { glowClass, rankTierColor } from './tierMapping'

export interface ProfileSheetProps {
  hunter: Hunter
  onRename: (name: string) => void
  dev: DevActions
  /** Opens the Manage Quests screen (the caller closes this sheet). */
  onManageQuests: () => void
  /** Re-opens the setup flow, prefilled (the caller closes this sheet). */
  onRetakeSetup: () => void
  onClose: () => void
}

// Reserved slots for settings that don't exist yet — rendered disabled so
// the layout has a home for them without pretending they work.
const COMING_SOON = [
  { icon: '🔔', label: 'Notifications' },
  { icon: '☁️', label: 'Account & cloud sync' },
  { icon: '📷', label: 'Profile photo' },
]

// Opened from the header avatar on every screen: a glass bottom sheet over
// the profile backdrop (its own ScreenBackground in 'overlay' layout, in
// place of a dimmed view of the current tab). Tapping the backdrop closes it.
export function ProfileSheet({
  hunter,
  onRename,
  dev,
  onManageQuests,
  onRetakeSetup,
  onClose,
}: ProfileSheetProps) {
  const rank = rankForLevel(hunter.level || 1)
  const joined = joinDateFor(hunter)
  const details = profileDetails(hunter)
  const [name, setName] = useState(hunter.name)
  const trimmed = name.trim()
  const nameChanged = trimmed.length > 0 && trimmed !== hunter.name

  const saveName = (e: FormEvent) => {
    e.preventDefault()
    if (nameChanged) onRename(trimmed)
  }

  return (
    <ScreenBackground screen="profile" layout="overlay" className="z-40">
      <div className="flex h-full items-end justify-center" onClick={onClose}>
        <div
          role="dialog"
          aria-label="Profile"
          className={cn(
            'hud-glass hud-glass-strong max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border-b-0 p-5 pb-8',
            glowClass(rankTierColor(rank.name)),
          )}
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
              className="hud-icon h-16 w-16 text-2xl font-extrabold text-text-primary"
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
          {/* Optional details from setup — display only. */}
          {details.length > 0 && (
            <div className="mt-1 text-xs text-text-secondary">{details.join(' · ')}</div>
          )}

          <button
            type="button"
            onClick={onManageQuests}
            className="hud-inset hud-pressable mt-6 flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-left"
          >
            <span className="flex items-center gap-3">
              <span className="text-lg" aria-hidden="true">
                🗒️
              </span>
              <span>
                <span className="block text-sm font-bold text-text-primary">Manage Quests</span>
                <span className="block text-xs text-text-secondary">
                  Show or hide quests on Today, add your own
                </span>
              </span>
            </span>
            <span className="text-xl text-text-secondary" aria-hidden="true">
              ›
            </span>
          </button>

          <h3 className="mt-6 mb-2 text-xs font-bold tracking-wide text-text-secondary uppercase">
            Settings
          </h3>
          <div className="hud-inset divide-y divide-hairline overflow-hidden rounded-2xl">
            <div className="px-4 py-3">
              <div className="mb-1.5 text-xs font-bold text-text-secondary">🎨 Appearance</div>
              <ThemeToggle />
            </div>
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
                  className="min-w-0 flex-1 rounded-lg border border-border bg-backing/40 px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                />
                <Button type="submit" disabled={!nameChanged} className="shrink-0">
                  Save
                </Button>
              </div>
            </form>
            <button
              type="button"
              onClick={onRetakeSetup}
              className="hud-pressable flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-left"
            >
              <span className="flex items-center gap-3">
                <span className="text-lg" aria-hidden="true">
                  🧭
                </span>
                <span>
                  <span className="block text-sm font-bold text-text-primary">Retake setup</span>
                  <span className="block text-xs text-text-secondary">
                    Update your details and goals
                  </span>
                </span>
              </span>
              <span className="text-xl text-text-secondary" aria-hidden="true">
                ›
              </span>
            </button>
            {COMING_SOON.map((item) => (
              <div
                key={item.label}
                aria-disabled="true"
                className="flex items-center justify-between gap-3 px-4 py-3.5"
              >
                {/* Only the not-yet-built item itself is faded — the badge stays fully legible. */}
                <span className="flex items-center gap-3 text-sm font-bold text-text-primary opacity-60">
                  <span className="text-lg" aria-hidden="true">
                    {item.icon}
                  </span>
                  {item.label}
                </span>
                <span className="shrink-0 rounded-full border border-border bg-backing/50 px-2 py-0.5 text-[10px] font-bold tracking-wide text-text-secondary uppercase">
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
    </ScreenBackground>
  )
}
